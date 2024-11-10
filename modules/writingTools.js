import ollama from 'ollama'

const messages = [];

(async function(){
    await ollama.create({model: 'FoxWritingTools', modelfile: `
    FROM llama3.1
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