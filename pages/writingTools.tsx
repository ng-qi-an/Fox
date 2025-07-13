import { Briefcase, Filter, List, ListOrdered, PencilRuler, RotateCw, ScanText, Smile } from "lucide-react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

export default function WritingTools() {
    const [selectedContent, setSelectedContent] = useState("");
    const [content, setContent] = useState("");
    const [generating, setGenerating] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<null | keyof typeof prompts>(null);
    
    const prompts = {
        "summarize": "Summarize the following text concisely. Ensure that the result is shorter than the text allowing the user to easily understand the text in a glance. This is the text: {{text}}",
        "friendly": "Rewrite the following text in a **friendly** tone. Make appropriate line breaks. This is the text: {{text}}",
        "professional": "Rewrite the following text in a **professional** tone. Make appropriate line breaks. This is the text: {{text}}",
        "concise": "Rewrite the following text in a **concise** tone. Make appropriate line breaks. This is the text: {{text}}",
        "bulletpoints": "Extract only the main points from the following text and break them down into bullet points, with each point on a new line. You may format the points to highlight the main points. You are not to add any headers and only reply with the formatted bullet points. This is the text: {{text}}",
        "list": "Organise the following text into an ordered list with step numbers at the front, with each step on a new line. You may format the points to highlight the main points. You are not to add any headers and only reply with the formatted list. This is the text: {{text}}"
    }

    function generateResponse(prompt: keyof typeof prompts) {
        window.electronAPI.send("setAlwaysOnTop", true)
        setSelectedPrompt(prompt)
        setGenerating(true);
        const newPrompt = prompts[prompt].replace("{{text}}", selectedContent)
        console.log("[FOX WRITINGTOOLS] Sending prompt...", newPrompt)
        // socket.emit("getWritingTools", {prompt: newPrompt})
        window.electronAPI.send("getWritingTools", {prompt: newPrompt})
    }
    useEffect(()=>{
        window.electronAPI.send("getSelection")
        window.electronAPI.on("getSelection", (event, selection: string) => {
            setSelectedContent(selection)
        })
        window.electronAPI.on("getWritingTools", (event, data: {response: string, status: string, error?:string}) => {
            if (data.status == 'generating') {
                setContent((old)=> old += data.response)
            } else if (data.status == "completed"){
                setGenerating(false);
                window.electronAPI.send("setAlwaysOnTop", false)
            }
        })
    }, [])
    return <div className="draggable">
    {!selectedPrompt ? 
        <div id="overview">
            <div className="main p-[10px]">
                <div className="flex gap-[8px]">
                    <button onClick={()=> generateResponse("summarize")} className="tileButton large"><ScanText className="mb-[3px] opacity-50"/>Summarize</button>
                    <button className="tileButton large"><PencilRuler className="mb-[3px] opacity-50"/>Rewrite</button>
                </div>
                <div className="flex flex-col w-full mt-[10px]">
                    <button onClick={()=> generateResponse("friendly")} className="tileButton transparent"><Smile className="mr-[7px] w-[17px] opacity-90"/>Friendly</button>
                    <button onClick={()=> generateResponse("professional")} className="tileButton transparent" ><Briefcase className="mr-[7px] w-[17px] opacity-90"/>Professional</button>
                    <button onClick={()=> generateResponse("concise")} className="tileButton transparent"><Filter className="mr-[7px] w-[17px] opacity-90"/>Concise</button>
                </div>
                <div className="w-full h-[1px] bg-foreground opacity-25 mt-[2.5px]"></div>
                <div className="flex flex-col w-full mt-[2.5px]">
                    <button onClick={()=> generateResponse("bulletpoints")} className="tileButton transparent"><List className="mr-[7px] w-[17px] opacity-90"/>Points</button>
                    <button onClick={()=> generateResponse("list")} className="tileButton transparent" ><ListOrdered className="mr-[7px] w-[17px] opacity-90"/>List</button>
                </div>
            </div>
        </div>
        :
        <div id="results">
            <div className="main p-[10px]">
                <div id="writingToolsResult" className="h-full overflow-auto no-drag">
                    <Markdown>{content}</Markdown>
                </div>
                <div className="flex-1"></div>
                {!generating && <div id="writingToolsActions">
                    <div className="flex w-full items-center justify-center mt-[10px]">
                        <button onClick={()=> {setContent(""); setSelectedPrompt(null)}} className="tileButton w-[22px] h-[22px] p-[3px]"><RotateCw className="w-[12px]"/></button>
                        <button onClick={()=> {navigator.clipboard.writeText(content); window.electronAPI.send("closeWindow")}} className="tileButton min-w-max ml-[5px] text-[12px]">Copy to Clipboard</button>
                    </div>
                </div>}
            </div>
        </div>
    }
    </div>
}