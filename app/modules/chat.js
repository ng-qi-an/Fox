import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { BrowserWindow, desktopCapturer, ipcMain } from 'electron';
import { webTools } from './webTools.js';
import Store from 'electron-store';
import { createOpenAI, openai } from '@ai-sdk/openai';

export async function chat(app, prompt, messages, tools) {
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
    newMessages.push(prompt);
    
    // Create screen tools with app context
    // const screenTools = createScreenTools(app);
    
    // Dynamic system prompt based on available tools
    let systemPrompt = "Your name is Fox, and you are a friendly AI assistant. Provide concise but helpful responses to user queries. Highlight important keywords in bold. ";
    if (tools.includes("screen")) {
        systemPrompt += " You have been provided with a screenshot of the user's screen and can see what they're currently viewing on their display. Use this visual context to better assist them.";
    }
    const modelOptions = {}
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
            webTools.web_search_preview = openai.tools.webSearchPreview()
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
            ...webTools,
            // ...screenTools,
        },
        toolChoice: (store.get("chat.provider") === "openai" && tools.includes("search")) ? { type: 'tool', toolName: 'web_search_preview' } : "auto",
        toolCallStreaming: true,
        maxSteps: 5, // allow up to 5 steps
    });
    
    return {newMessages, response: response, streamed: true};
}

export function initialiseChatIPC(app) {
    console.log(`[STATUS](CHAT) Initialised`);

    ipcMain.on("getChatResponse", async(event, data)=>{
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        console.log('generating')
        var newMessages = [];
        var responseWithData;
        // const uid = uuidv4();
        try {
            responseWithData = await chat(app, data.prompt, data.messages, data.tools)
            var messageContent = ""
            for await (const part of responseWithData.response.fullStream) {
                console.log(part)
                if (part.type == "text-delta"){
                    messageContent += part.textDelta
                    event.reply("getChatResponse", {'response': messageContent, "status": 'generating'});
                }
            }
            // newMessages = [...responseWithData.newMessages];
            // newMessages.push({"role": "assistant", "content": messageContent, "sources": await responseWithData.response.sources});
            const messages = (await responseWithData.response.response).messages
            // for (const message of messages) {
            //     console.log(message)
            // }
            newMessages = [...responseWithData.newMessages, ...messages];
        } catch (error) {
            console.error('[ERROR](API) Error in chat response:', error);
            return win.webContents.send("getChatResponse", {"status": 'error', "error": error.message});
        }
        var sources;
        if (data.tools.includes("search")){
            sources = await responseWithData.response.sources
        }
        win.webContents.send("getChatResponse", {"status": 'completed', "responseID": newMessages[newMessages.length -1].id, "sources": sources, "newMessages": newMessages});
    });
}