import { Cross, Minus, PaperclipIcon, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

export default function Prompt(){
    const [messages, setMessages] = useState<Record<string, any>[]>([]);
    const [promptInput, setPromptInput] = useState("");
    const [showAllSources, setShowAllSources] = useState("");
    const [platform, setPlatform] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
    async function sendChatMessage(){
        console.log(platform)
        if (messages.length < 1 && platform && platform == "win32"){
            window.electronAPI.send("moveWindow", {y: -(500 - (selectedFile ? 115 : 64))});
        }
        
        // Handle file processing - convert image to base64
        let fileContent = null;
        if (selectedFile) {
            console.log("[FOX PROMPT] File selected:", selectedFile.name, selectedFile.type, selectedFile.size);
            
            if (selectedFile.type.startsWith('image/')) {
                try {
                    fileContent = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(selectedFile);
                    });
                    console.log("[FOX PROMPT] Image converted to base64");
                } catch (error) {
                    console.error("[FOX PROMPT] Error converting image:", error);
                }
            }
        }
        
        // Create message content with text and optional image
        const messageContent: Array<{type: string, text?: string, image?: string | URL}> = [];
        if (promptInput.trim()) {
            messageContent.push({ type: 'text', text: promptInput });
        }
        if (fileContent) {
            messageContent.push({ type: 'image', image: fileContent as string, });
        }
        
        setMessages((old) => [...old, {role: "user", content: messageContent}, {role: "assistant", content: [{type: "text", text: ""}]}]);
        window.electronAPI.send("getChatResponse", {prompt: {role: "user", content: messageContent}, messages: messages, image: fileContent})
        window.electronAPI.send("resizeWindow", {height: 500});
        window.electronAPI.send("setAlwaysOnTop", true)
        inputRef.current!.textContent = ""; // Clear input after sending
        setPromptInput("");
        setSelectedFile(null); // Clear file after sending
    }
    // useEffect(()=>{
    //     window.onblur = ()=>{
    //         if (messages.length < 1){
    //             window.electronAPI.send("closeWindow", "prompt");
    //         }
    //     }
    //     return ()=>{
    //         window.onblur = null; // Clean up the event listener
    //     }
    // }, [messages])
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
            <div id="chat" className="py-2 px-4 overflow-auto no-drag flex flex-col gap-3 h-full">
                {messages.map((message, index) => {
                    const isUser = message.role === "user";
                    const uid = message.id || index; // Use index as fallback UID
                    return (message.role == 'assistant' || message.role == 'user') && (
                    message.content[0].type == 'tool-call' ?
                        <div key={uid} className="message-content w-full max-w-[95%] pl-4 text-sm opacity-80 mb-[-12px]">
                            <p className="text-sm text-foreground/50">Used {message.content[0].toolName}</p>
                        </div>
                    :  isUser ? <div key={uid} className="ml-auto rounded-lg px-4 py-2 w-max max-w-[80%] bg-foreground/10">
                        {message.content.map((content: any, contentIndex: number) => (
                            <div key={contentIndex}>
                                {content.type === 'text' && <Markdown>{content.text.replace(/\n/g, "\n\n")}</Markdown>}
                                {content.type === 'image' && (
                                    <img 
                                        src={content.image} 
                                        alt="Uploaded image" 
                                        className="max-w-full h-auto rounded-lg mt-2" 
                                        style={{maxHeight: '200px'}}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    : <div key={uid} className="message-content mb-2 w-full max-w-[95%] pl-4">
                        <Markdown>{message.content[0].text}</Markdown>
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
                    </div>)
                })}
            </div>
        </>}
        
        
        <form id="promptForm" className={`h-max no-drag pl-3 px-4 flex flex-col bottom-0 left-0 w-full ${messages.length > 0 ? 'border-t border-foreground/10' : ''}`} onSubmit={async (e)=>{
                e.preventDefault();
                await sendChatMessage();
            }}>
            {selectedFile && <div className="flex items-center w-full overflow-x-auto py-2">
                <div className="px-4 py-2 bg-foreground/5">
                    <div className="text-xs text-foreground/70 flex items-center justify-between rounded-lg">
                        <span className="no-wrap overflow-hidden ellipsis w-max">📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        <button 
                            type="button"
                            onClick={() => {
                                if (messages.length < 1){
                                    window.electronAPI.send("resizeWindow", {height: 64});
                                    if (platform && platform == "win32") {
                                        window.electronAPI.send("moveWindow", {y: 115-64});
                                    }
                                }
                                setSelectedFile(null)
                                fileInputRef.current!.value = ""; // Clear the file input
                            }}
                            className="text-foreground/50 hover:text-foreground ml-2"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>}
            <div className="w-full items-center flex ">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                        window.electronAPI.send("noBlur", false)
                        if (e.target.files && e.target.files.length > 0 && messages.length < 1) {
                            window.electronAPI.send("resizeWindow", {height: 115});
                            if (platform && platform == "win32") {
                                window.electronAPI.send("moveWindow", {y: -(115-64)});
                            }
                        }
                        setSelectedFile(e.target.files?.[0] || null)
                    }}
                    className="hidden"
                    accept="image/*"
                />
                <button
                    type="button"
                    onClick={() => {
                        window.electronAPI.send("noBlur", true)
                        setTimeout(() => {
                            fileInputRef.current?.click()
                        }, 100)
                    }}
                    className={`min-h-[30px] max-h-[63px] min-w-[30px] hover:bg-foreground/10 flex items-center justify-center mr-2 rounded-full absolute`}
                    title={selectedFile ? `Selected: ${selectedFile.name}` : "Attach file"}
                >
                    <Plus className="w-[18px] h-[18px]" strokeWidth={'2px'}/>
                </button>
                {promptInput == "" && <p className="opacity-50 absolute left-13">Ask anything</p>}
                <div ref={inputRef} id="prompt" contentEditable onInput={(e)=> {console.log(e.target.innerText); setPromptInput((e.target as HTMLDivElement).innerText || "")}} onKeyDown={async(e)=> {
                    if(e.key == "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        await sendChatMessage();
                    } 
                }} className="outline-none border-none placeholder:text-foreground/50 w-full py-5 pl-10" autoFocus></div>
            </div>
        </form>  
    </div>
}