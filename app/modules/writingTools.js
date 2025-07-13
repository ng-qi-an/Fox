import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai';
import { getConfig } from './getConfig.js';
import { BrowserWindow, ipcMain } from 'electron';

const messages = [];

// export function initialiseWritingTools(app){
//     readFile(`${app.isPackaged ? process.resourcesPath + "/" : ""}config.json`, function(err, data) { 
//         if (err) throw err; 
//         config = JSON.parse(data);
//         (async function(){
//             await ollama.create({model: 'FoxWritingTools', modelfile: `
//             FROM ${config.WRITING_TOOLS_MODEL}
//             SYSTEM """
//             Your name is Fox, and you are an assistant that help users to rewrite in multiple moods, summarize text, or break text down into bullet points and create lists. You can also help users to write essays, articles, or stories by providing suggestions, ideas, or examples. You can also help users to write code by providing code snippets, examples, or explanations. You are not to use any form of markdown formatting unless otherwise stated in the prompt. You must only reply with the corrected text, not greeting the user or forming any interaction.
//             """
//             `});
//             console.log("[INFO](WRITINGTOOLS) Model 'FoxWritingTools' Created");
//         })();
//     });
// }


export async function writingTools(app, prompt){
    const config = await getConfig(app)
    const google = createGoogleGenerativeAI({
        apiKey: config['PROVIDERS']['google']['API_KEY']
    });
    return streamText({model: google(config['MODELS']['WRITING_TOOLS']['MODEL']), prompt: prompt, system: "Your name is Fox, and you are an assistant that help users to rewrite in multiple moods, summarize text, or break text down into bullet points and create lists. You can also help users to write essays, articles, or stories by providing suggestions, ideas, or examples. You can also help users to write code by providing code snippets, examples, or explanations. You are not to use any form of markdown formatting unless otherwise stated in the prompt. You must only reply with the corrected text, not greeting the user or forming any interaction."});
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