import { Briefcase, Filter, List, ListOrdered, Palette, PencilRuler, RotateCw, ScanText, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

export default function WritingTools() {
    const [selectedContent, setSelectedContent] = useState("");
    const [content, setContent] = useState("");
    const [generating, setGenerating] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<null | keyof typeof prompts>(null);
    const [customPrompt, setCustomPrompt] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    
    const prompts = {
        "summarize": "Summarize the following text concisely. Ensure that the result is shorter than the text allowing the user to easily understand the text in a glance. This is the text: {{text}}",
        "friendly": "Rewrite the following text in a **friendly** tone. Make appropriate line breaks. This is the text: {{text}}",
        "professional": "Rewrite the following text in a **professional** tone. Make appropriate line breaks. This is the text: {{text}}",
        "concise": "Rewrite the following text in a **concise** tone. Make appropriate line breaks. This is the text: {{text}}",
        "bulletpoints": "Extract only the most important key points from the following text. Format the points into an extremely concise unordered list. You are not to add any headers and only reply with the formatted bullet points. This is the text: {{text}}",
        "list": "Organise the following text into an ordered list with step numbers at the front, with each step on a new line. You may format the points for emphasis. You are not to add any headers and only reply with the formatted list. This is the text: {{text}}",
        "custom": "Rewrite the following text according to these instructions: \"{{custom}}\" \nMake appropriate line breaks. This is the text: {{text}}"
    }

    function generateResponse(prompt: keyof typeof prompts, customContent?: string) {
        window.electronAPI.send("setAlwaysOnTop", true)
        setSelectedPrompt(prompt)
        setGenerating(true);
        const newPrompt = prompts[prompt].replace("{{text}}", selectedContent)
            .replace("{{custom}}", prompt === "custom" ? customContent! : "");
        console.log("[WRITINGTOOLS] Sending prompt...", newPrompt)
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
        window.addEventListener("keydown", (event) => {
            if (event.key == "Escape") {
                console.log("Closing writing tools window")
                window.electronAPI.send("closeWindow", "writingTools");
            } else if (event.key.match(/^[A-Za-z0-9]+$/g)) {
                console.log("matching")
                if (inputRef.current) {
                    (inputRef.current as HTMLInputElement).focus();
                }
            }
        });
    }, [])
    return <div className="draggable">
    {!selectedPrompt ? 
        <div id="overview" className="h-full">
            <div className="main p-[10px] w-full flex flex-col h-max">
                <form className="w-full" onSubmit={(e)=>{
                    e.preventDefault();
                    generateResponse("custom", customPrompt);

                }}>
                    <input ref={inputRef} value={customPrompt} autoFocus onChange={(e)=> setCustomPrompt(e.target.value)} placeholder="Describe your change" className="placeholder:text-foreground/50 no-drag px-4 py-2 rounded-lg text-[14px] mb-2 bg-foreground/10 outline-none border-none text-center w-full"/>
                </form>
                <div className="flex gap-2">
                    <button onClick={()=> generateResponse("summarize")} className="tileButton large"><ScanText className="opacity-[0.8] w-[20px] h-[20px] mb-[2px]" strokeWidth={'2px'}/>Summarize</button>
                    <button className="tileButton large"><Palette className="opacity-[0.8] w-[20px] h-[20px] mb-[2px]" strokeWidth={'2px'}/>Rewrite</button>
                </div>
                <div className="flex flex-col w-full mt-2">
                    <button onClick={()=> generateResponse("friendly")} className="tileButton transparent"><Smile className="mr-[7px] w-[17px] opacity-90" strokeWidth={'2px'}/>Friendly</button>
                    <button onClick={()=> generateResponse("professional")} className="tileButton transparent"><Briefcase className="mr-[7px] w-[17px] opacity-90" strokeWidth={'2px'}/>Professional</button>
                    <button onClick={()=> generateResponse("concise")} className="tileButton transparent"><Filter className="mr-[7px] w-[17px] opacity-90"strokeWidth={'2px'}/>Concise</button>
                </div>
                <div className="w-full h-[1px] bg-foreground opacity-25 mt-[2.5px]"></div>
                <div className="flex flex-col w-full mt-[2.5px]">
                    <button onClick={()=> generateResponse("bulletpoints")} className="tileButton transparent"><List className="mr-[7px] w-[17px] opacity-90" strokeWidth={'2px'}/>Points</button>
                    <button onClick={()=> generateResponse("list")} className="tileButton transparent" ><ListOrdered className="mr-[7px] w-[17px] opacity-90" strokeWidth={'2px'}/>List</button>
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
                        <button onClick={()=> {setContent(""); setSelectedPrompt(null)}} className="w-full max-w-[25px] h-[25px] flex items-center justify-center p-0 rounded-lg hover:bg-foreground/20 bg-foreground/10" style={{padding: '0px !important'}}><RotateCw className="w-[12px]"/></button>
                        <button onClick={()=> {navigator.clipboard.writeText(content); window.electronAPI.send("closeWindow")}} className="tileButton w-full max-w-max ml-[5px] h-[25px] flex items-center text-[14px]">Copy to Clipboard</button>
                    </div>
                </div>}
            </div>
        </div>
    }
    </div>
}