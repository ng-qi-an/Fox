import { Cross, Minus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

export default function Prompt(){
    const [messages, setMessages] = useState<Record<string, any>[]>([]);
    const [promptInput, setPromptInput] = useState("");
    const [showAllSources, setShowAllSources] = useState("");
    const [platform, setPlatform] = useState("");
    const inputRef = useRef(null);
    useEffect(()=>{
        window.electronAPI.send("getPlatform");
        window.electronAPI.on("getChatResponse", (event, data) => {
            if (data.status == 'completed'){
                setMessages(data.newMessages)
            } else if (data.status == 'generating') {
                const lastMessage = {...messages[messages.length - 1]}
                lastMessage.content = data.response
                setMessages((old) => [...old.slice(0, -1), lastMessage])
                window.electronAPI.send("setAlwaysOnTop", true)
            }
        });
        window.electronAPI.on("getPlatform", (event, platform) => {
            console.log("[FOX PROMPT] Platform detected:", platform);
            setPlatform(platform);
        });
        window.addEventListener("keydown", (event) => {
            if (event.key.match(/^[A-Za-z0-9]+$/g) && !event.ctrlKey && !event.metaKey && !event.altKey) {
                if (inputRef.current) {
                    (inputRef.current as HTMLInputElement).focus();
                }
            }
        });

    }, [])
    useEffect(()=>{
        window.onblur = ()=>{
            if (messages.length < 1){
                window.electronAPI.send("closeWindow", "prompt");
            }
        }
        return ()=>{
            window.onblur = null; // Clean up the event listener
        }
    }, [messages])
    return <div className="main draggable flex flex-col">
        {messages.length > 0 && 
        <>
            <div className="flex items-center w-full min-h-[35px] px-4 border-b border-foreground/10 gap-3">
                <p className="text-sm">New Chat</p>
                <div className="flex-1"/>
                <button className="text-foreground/50 hover:text-foreground" onClick={() => {
                    window.electronAPI.send("minimiseWindow");
                }}><Minus className="w-[18px] h-[18px]" strokeWidth={'3px'}/></button>
                <button className="text-foreground/50 hover:text-foreground" onClick={() => {
                    window.electronAPI.send("closeWindow", "prompt");
                }}><X className="w-[18px] h-[18px]" strokeWidth={'3px'}/></button>
            </div>
            <div id="chat" style={{maxHeight: "calc(100% - 98px)"}} className="py-2 px-4 overflow-auto no-drag flex flex-col gap-3">
                {messages.map((message, index) => {
                    const isUser = message.role === "user";
                    const uid = message.uid || index; // Use index as fallback UID
                    return isUser ? <div key={uid} className="ml-auto rounded-lg px-4 py-2 w-max max-w-[80%] bg-foreground/10">
                        <p>{message.content}</p>
                    </div>
                    : <div key={uid} className="message-content mb-2 w-full max-w-[95%] pl-4">
                        <Markdown>{message.content}</Markdown>
                        {message.sources && message.sources.length > 0 && <div className="flex items-center flex-wrap gap-x-2">
                            {message.sources.map((source:Record<string, string>, indx:number) => {
                                if (showAllSources == uid || indx < 3) {
                                    return <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-foreground/50 hover:text-foreground underline">{source.title}</a>
                                }
                            })}
                            {(message.sources && message.sources.length > 4 && showAllSources != uid) ? 
                                <button className="text-xs text-foreground/50 hover:text-foreground underline" onClick={() => setShowAllSources(uid)}>+{message.sources.length - 3}</button>
                            : 
                                <button className="text-xs text-foreground/50 hover:text-foreground underline" onClick={() => setShowAllSources("")}>Show less</button>
                            }
                        </div>}
                    </div>
                })}
            </div>
        </>}
        <form id="promptForm" className={`h-[63px] no-drag pl-3 px-4 flex items-center fixed bottom-0 left-0 w-full ${messages.length > 0 ? 'border-t border-foreground/10' : ''}`} onSubmit={(e)=>{
            e.preventDefault();
            console.log(platform)
            if (messages.length < 1 && platform && platform == "win32"){
                window.electronAPI.send("moveWindow", {y: -(500 - 64)});
            }
            setMessages((old) => [...old, {role: "user", content: promptInput}, {role: "assistant", content: ""}]);
            window.electronAPI.send("getChatResponse", {prompt: promptInput, messages: messages})
            window.electronAPI.send("resizeWindow", {height: 500});
            window.electronAPI.send("setAlwaysOnTop", true)
            setPromptInput("");
        }}>
            <button className="min-h-[30px] min-w-[30px] hover:bg-foreground/10 flex items-center justify-center mr-2 rounded-full" type="button"><Plus className="w-[18px] h-[18px]" strokeWidth={'2px'}/></button>
            <input ref={inputRef} id="prompt" value={promptInput} onChange={(e)=> setPromptInput(e.target.value)} placeholder="Ask anything" className="outline-none border-none placeholder:text-foreground/50 w-full h-[63px]" autoFocus></input>
        </form>  
    </div>
}