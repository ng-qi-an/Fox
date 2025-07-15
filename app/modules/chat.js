import { getConfig } from './getConfig.js';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { BrowserWindow, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { webTools } from './webTools.js';

export async function chat(app, prompt, messages) {
    const config = await getConfig(app)
    const google = createGoogleGenerativeAI({
        apiKey: config['PROVIDERS']['google']['API_KEY']
    });

    var newMessages = [...messages];
    newMessages.push(prompt);
    
    const response = streamText({
        model: google(
            config['MODELS']['CHAT']['MODEL'], {
                // useSearchGrounding: true,
                // dynamicRetrievalConfig: {
                //     mode: 'MODE_DYNAMIC',
                //     dynamicThreshold: 0.8,
                // }
            }
        ), 
        system: "Your name is Fox, and you are a friendly AI assistant.", 
        messages: newMessages,
        tools: {
            ...webTools,
        },
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
        // const uid = uuidv4();
        try {
            const responseWithData = await chat(app, data.prompt, data.messages)
            var messageContent = ""
            for await (const part of responseWithData.response.textStream) {
                messageContent += part
                win.webContents.send("getChatResponse", {'response': messageContent, "status": 'generating'});
            }
            // newMessages = [...responseWithData.newMessages];
            // newMessages.push({"role": "assistant", "content": messageContent, "sources": await responseWithData.response.sources});
            const messages = (await responseWithData.response.response).messages
            for (const message of messages) {
                console.log(message)
            }
            newMessages = [...responseWithData.newMessages, ...messages];
        } catch (error) {
            console.error('[ERROR](API) Error in chat response:', error);
            return win.webContents.send("getChatResponse", {"status": 'error', "error": error.message});
        }
        win.webContents.send("getChatResponse", {"status": 'completed', "response": messageContent, "newMessages": newMessages});
    });
}