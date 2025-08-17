import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, streamText } from 'ai';
import { BrowserWindow, desktopCapturer, ipcMain } from 'electron';
import { webTools } from './webTools.js';
import Store from 'electron-store';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { getAllTabs, getWebpageContent } from '../server.js';
import { getLocalIP } from "../utils/ip.js";

export async function chat(app, prompt, messages, tools, contexts) {
    const store = new Store()
    var model;
    if (store.get("chat.provider") == "google") {
        model = createGoogleGenerativeAI({
            apiKey: store.get("providers.google.apiKey")
        });
    } else if (store.get("chat.provider") == "openai") {
        model = createOpenAI({
            apiKey: store.get("providers.openai.apiKey"),
            compatibility: 'strict', // strict mode, enable when using the OpenAI API
        }).responses
    }
    // [SCREEN TOOL] If user uses the screen too, add the base64 screenshot to the prompt
    var newMessages = [...messages];
    if (tools.includes("screen")){
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1280, height: 720 }
        });
        // Get the primary screen source
        const primarySource = sources[0];
        if (primarySource) {
            // Convert to base64
            const screenshotBase64 = primarySource.thumbnail.toPNG().toString('base64');
            prompt['content'].push({type: 'image', image: screenshotBase64});
        }
    }
    // [AUTOCONTEXT] Compiles the open tabs for model to infer auto context
    var tabs = [];
    try {
        const tabsResponse = await getAllTabs();
        if (!tabsResponse || tabsResponse.status != "OK") {
            throw Error(`Failed to get all tabs: ${tabsResponse.error}`);
        }
        tabs = tabsResponse.tabs;
    } catch (error) {
        console.log('[ERROR](API) Error in getting all tabs:', error);
    }

    // Fetching context manually if user requests
    if (contexts && contexts.length > 0) {
        console.log("Context:", contexts.map(c => c.name))
        const response =  await getWebpageContent(contexts);
        if (response.status != "OK") {
            throw Error(`All contexts failed to load: ${response.error}`);
        } else if (response.results && response.results.length > 0) {
            console.log("Webpage content loaded: ", response.results.length, "pages");
            for (const page of response.results) {
                if (page.success){
                    newMessages.push({
                        role: "system",
                        content: JSON.stringify({
                            description: `This is webpage context for "${page.name}". Use this as a reference to answer the user's questions.`,
                            name: page.name,
                            url: page.url,
                            content: page.content
                        })
                    });
                }
            }
        }
        console.log(newMessages)
    }
    newMessages.push(prompt);

    // Adds on prompt if using screen tools
    let systemPrompt = "Your name is Waves, and you are a friendly AI assistant. Provide concise but helpful responses to user queries. Highlight important keywords in bold. ";

    if (tools.includes("screen")) {
        systemPrompt += " You have been provided with a screenshot of the user's screen and can see what they're currently viewing on their display. Use this visual context to better assist them.";
    }

    systemPrompt += `\n#User's tabs\n${tabs.filter(tab => !tab.unavailable).map((tab)=> `======\nTab ID: ${tab.id}\nTab Title: ${tab.name}\nTab URL: ${tab.url}`).join('\n')}`;
    console.log("final system prompt: ", systemPrompt)
    // Adds on search tools if depending on provider implementation
    const modelOptions = {}
    const webToolsZ = webTools(newMessages, tabs);
    if (store.get("chat.provider") == "google"){
        if (tools.includes("search")){
            modelOptions.useSearchGrounding = tools.includes('search');
            modelOptions.dynamicRetrievalConfig = {
                mode: 'MODE_DYNAMIC',
                dynamicThreshold: 0.8,
            }   
        }
    } else if (store.get("chat.provider") == "openai"){
        if (tools.includes("search")){
            webToolsZ.web_search_preview = openai.tools.webSearchPreview()
        }
    }
    
    const response = streamText({
        model: model(
            store.get("chat.model"), {
                ...modelOptions
            }
        ), 
        system: systemPrompt, 
        messages: newMessages,
        tools: {
            ...webToolsZ,
            // ...screenTools,
        },
        toolChoice: (store.get("chat.provider") === "openai" && tools.includes("search")) ? { type: 'tool', toolName: 'web_search_preview' } : "auto",
        toolCallStreaming: true,
        maxSteps: 5, // allow up to 5 steps
        onError: (error) => {
            console.error('[ERROR](API) Error in chat response:', error);
        }
    });
    
    return {newMessages, response: response, streamed: true};
}

export function initialiseChatIPC(app) {
    console.log(`[STATUS](CHAT) Initialised`);

    ipcMain.on("getAllTabs", async(event, data)=>{
        console.log("[INFO](API) All Tabs Request Received")
        try {
            const response = await getAllTabs()
            if (response.status != "OK"){
                return event.reply("getAllTabs", {"status": "ERROR", "error": response.error});
            }
            event.reply("getAllTabs", {"status": "OK", "tabs": response.tabs});
        }
        catch (error) {
            console.error('[ERROR](API) Error in getting all tabs:', error);
            return event.reply("getAllTabs", {"status": "ERROR", "error": error.message});
        }
    });

    ipcMain.on("getIp", async(event)=>{
        event.reply("getIp", {ip: getLocalIP()})
    })

    ipcMain.on("getChatResponse", async(event, data)=>{
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        console.log('[CHAT RESPONSE] Generating response for prompt:', data.prompt);
        var newMessages = [];
        var responseWithData;
        // const uid = uuidv4();
        try {
            responseWithData = await chat(app, data.prompt, data.messages, data.tools, data.contexts)
            var messageContent = ""
            var autoContextResult = [];
            for await (const part of responseWithData.response.fullStream) {
                if (part.type == "text-delta"){
                    messageContent += part.textDelta
                    event.reply("getChatResponse", {'response': messageContent, "status": 'generating'});
                } else if (part.type == "tool-call") {
                    console.log(`[TOOL USED] ${part.toolName} called with:`, part.args);
                } else if (part.type == "tool-result") {
                    if (part.toolName == "autoContext" && part.result) {
                        // append tool as sytem message befor euser message
                        try {
                            console.log(JSON.parse(part.result));

                            autoContextResult.push({id: part.toolCallId, results: JSON.parse(part.result)})
                        } catch (error) {
                            console.log("something went wrong with autocontext tool")
                        }
                    }
                }
            }
            const messages = (await responseWithData.response.response).messages
            // remove tool result from here
            newMessages = [...responseWithData.newMessages, ...messages];
            
            // Check if autoContext was used
            if (autoContextResult.length > 0) {
                console.log('✅ [AUTO-CONTEXT] Tool was used during this conversation', autoContextResult);
                autoContextResult.map((context)=> {
                    // Insert each context result as individual system messages before the user message
                    for (const page of context.results) {
                        newMessages.splice(newMessages.findLastIndex(message => message.role === "user"), 0, {
                            role: "system",
                            content: JSON.stringify({
                                description: `This is webpage context for "${page.name}". Use this as a reference to answer the user's questions.`,
                                name: page.name,
                                url: page.url,
                                content: page.content
                            })
                        });
                    }
                });
                newMessages = newMessages.filter(message => message.role != "tool" && !autoContextResult.find((context)=> context.id == message.id))
                console.log("Auto-context added to messages:", newMessages);
                newMessages = newMessages.filter(message => {
                    if (message.role === "assistant" && typeof message.content[0] === 'object') {
                        return !(message.content[0].type == "tool-call" && message.content[0].toolName == "autoContext");
                    }
                    return true;
                });
                console.log("Auto-context added to messages:", newMessages);
                for (const message of newMessages) {
                    try {
                        const subMessage = {...message}
                        console.log(subMessage)
                    } catch (error) {
                        console.error("Failed to parse system message content:", error);
                    }
                }
            }
        } catch (error) {
            console.log('[ERROR](API) Error in chat response:', error);
            return win.webContents.send("getChatResponse", {"status": 'error', "error": error.message});
        }
        var sources;
        if (data.tools.includes("search")){
            sources = await responseWithData.response.sources
        }
        
        console.log('[CHAT RESPONSE] Response generated successfully:', messageContent);
        win.webContents.send("getChatResponse", {"status": 'completed', "responseID": newMessages[newMessages.length -1].id, "sources": sources, "newMessages": newMessages});
    });
}