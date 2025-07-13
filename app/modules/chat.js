import { getConfig } from './getConfig.js';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { BrowserWindow, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export async function chat(app, prompt, messages) {
    const config = await getConfig(app)
    const google = createGoogleGenerativeAI({
        apiKey: config['PROVIDERS']['google']['API_KEY']
    });

    var newMessages = [...messages];
    newMessages.push({ role: 'user', content: prompt });
    const response = streamText({model: google(
        config['MODELS']['WRITING_TOOLS']['MODEL'], {
            useSearchGrounding: true,
            dynamicRetrievalConfig: {
                mode: 'MODE_DYNAMIC',
                dynamicThreshold: 0.8,
            }
        }), system: "Your name is Fox, and you are a friendly AI assistant. ", messages: newMessages})
    return {newMessages, response: response, streamed: true};
}

export function initialiseChatIPC(app) {
    console.log(`[STATUS](CHAT) Initialised`);

    ipcMain.on("getChatResponse", async(event, data)=>{
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        console.log('generating')
        var newMessages = [];
        const uid = uuidv4();
        try {
            const responseWithData = await chat(app, data.prompt, data.messages)
            var messageContent = ""
            for await (const part of responseWithData.response.textStream) {
                messageContent += part
                win.webContents.send("getChatResponse", {'uid': uid, 'response': messageContent, "status": 'generating'});
            }
            newMessages = [...responseWithData.newMessages];
            newMessages.push({"role": "assistant", "content": messageContent, "sources": await responseWithData.response.sources});
        } catch (error) {
            console.error('[ERROR](API) Error in chat response:', error);
            return win.webContents.send("getChatResponse", {"status": 'error', "error": error.message});
        }
        win.webContents.send("getChatResponse", {"status": 'completed', 'uid': uid, "response": messageContent, "newMessages": newMessages});
    });
}