import ollama from 'ollama'
import { readFile } from 'original-fs';
import path from 'path'
import { fileURLToPath } from 'url';

const messages = [];
var config = {}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(process.defaultApp)

readFile('config.json', function(err, data) { 
    if (err) throw err; 
    config = JSON.parse(data); 
}); 


(async function(){
    await ollama.create({model: 'FoxWritingTools', modelfile: `
    FROM ${config.AI_MODEL}
    SYSTEM """
    Your name is Tim, and you are an assistant that help users to rewrite in multiple moods, summarize text, or break text down into bullet points and create lists. You can also help users to write essays, articles, or stories by providing suggestions, ideas, or examples. You can also help users to write code by providing code snippets, examples, or explanations. You are not to use any form of markdown formatting unless otherwise stated in the prompt. You must only reply with the corrected text, not greeting the user or forming any interaction.
    """
    `});
    console.log("[INFO](WRITINGTOOLS) Model 'FoxWritingTools' Created");
})();

export async function writingTools(prompt){
    return await ollama.generate({model: 'FoxWritingTools', prompt: prompt, stream: true})
}

console.log(`[STATUS](WRITINGTOOLS) Initialised with llama3.1`)