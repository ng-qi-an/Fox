import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai';
import { BrowserWindow, ipcMain } from 'electron';
import Store from 'electron-store';

export async function writingTools(app, prompt){
    const store = new Store();
    const google = createGoogleGenerativeAI({
        apiKey: store.get("providers.google.apiKey")
    });
    return streamText({model: google(store.get('writingTools.model')), prompt: prompt, system: "Your name is Fox, and you are an assistant that help users to rewrite in multiple moods, summarize text, or break text down into bullet points and create lists. You can also help users to write essays, articles, or stories by providing suggestions, ideas, or examples. You can also help users to write code by providing code snippets, examples, or explanations. You are not to use any form of markdown formatting unless otherwise stated in the prompt. You must only reply with the corrected text, not greeting the user or forming any interaction."});
}

export async function initialiseWritingToolsIPC(app) {
    ipcMain.on("getWritingTools", async(event, data)=>{
        console.log("[INFO](API) Writing Tools Request Received")
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        try {
            const response = await writingTools(app, data.prompt)
            for await (const part of response.textStream) {
            win.webContents.send("getWritingTools", {'response': part, "status": 'generating'});
            }
        } catch (error) {
            console.error('[ERROR](API) Error in writing tools:', error);
            return win.webContents.send("getWritingTools", {"status": 'error', "error": error.message});
        }
        win.webContents.send("getWritingTools", {"status": 'completed'});
    })
}

console.log(`[STATUS](WRITINGTOOLS) Initialised`)