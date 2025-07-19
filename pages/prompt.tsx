import Message from "@/components/Message";
import ToolsDrawer from "@/components/ToolsDrawer";
import { Cross, Minus, PaperclipIcon, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { file, set } from "zod/v4";

export default function Prompt(){
    const [messages, setMessages] = useState<Record<string, any>[]>([]);
    const [completed, setCompleted] = useState(true);
    const [promptInput, setPromptInput] = useState("");
    const [showAllSources, setShowAllSources] = useState("");
    const [platform, setPlatform] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [openToolsDrawer, setOpenToolsDrawer] = useState(false);
    const [sources, setSources] = useState<Record<string, Record<string, string>[]>>({});
    const inputRef = useRef(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(()=>{
        window.electronAPI.send("getPlatform");
        window.electronAPI.on("getChatResponse", (event, data) => {
            if (data.status == 'completed'){
                setMessages(data.newMessages)
                if (data.sources) {
                    console.log(data.responseID, data.sources)
                    const newSources = {...sources};
                    newSources[data.responseID] = data.sources;
                    setSources(newSources);
                }
                setCompleted(true);
            } else if (data.status == 'generating') {
                const copyMessages = [...messages];
                copyMessages[copyMessages.length - 1].content = data.response
                setMessages(copyMessages)
                window.electronAPI.send("setAlwaysOnTop", true)
            }
        });
        window.electronAPI.on("getPlatform", (event, platform) => {
            console.log("[FOX PROMPT] Platform detected:", platform);
            setPlatform(platform);
        });
        return ()=>{
            window.electronAPI.removeAllListeners("getChatResponse");
            window.electronAPI.removeAllListeners("getPlatform");
        }
    }, [])
    useEffect(()=>{
        window.onkeydown = (event) => {
            if (event.key == "Escape") {
                if (openToolsDrawer) {
                    setOpenToolsDrawer(false);
                    return;
                }else if (messages.length < 3) {
                    window.electronAPI.send("closeWindow", "prompt");
                } else {
                    window.electronAPI.send("minimiseWindow")
                }
            } else if (event.key.match(/^[A-Za-z0-9]+$/g) && !event.ctrlKey && !event.metaKey && !event.altKey) {
                if (inputRef.current) {
                    (inputRef.current as HTMLInputElement).focus();
                }
            } 
        };
        return ()=>{
            window.onkeydown = null; // Clean up the event listener
        }
    }, [messages, openToolsDrawer])
    async function sendChatMessage(){
        console.log(platform)
        if ((promptInput.trim() === "" && !selectedFile) || !completed) {
            console.log("[FOX PROMPT] No input provided, not sending message.");
            return;
        }
        if (messages.length < 1 && platform && platform == "win32"){
            window.electronAPI.send("moveWindow", {y: -(500 - (selectedFile ? 115 : 64))});
        }
        
        // Handle file processing - convert base64 to data URL if it's an image
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
        
        // Smooth scroll to bottom after message is sent
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 0);
        
        // Expand the chat window
        window.electronAPI.send("getChatResponse", {prompt: {role: "user", content: messageContent}, messages: messages, image: fileContent, tools: selectedTools});
        if (messages.length < 1){
            window.electronAPI.send("resizeWindow", {height: 500});
            window.electronAPI.send("setAlwaysOnTop", true);
        }
        ((inputRef.current!) as HTMLDivElement).textContent = "";
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setPromptInput("");
        setSelectedFile(null);
        setCompleted(false);
    }
    function handleAddFile(file: File | null, messages: Record<string, any>[], platform: string | null) {
        setSelectedFile(file);
        if (messages.length < 1){
            window.electronAPI.send("resizeWindow", {height: 110});
            if (platform && platform == "win32") {
                console.log("[FOX PROMPT] Moving window for file input");
                window.electronAPI.send("moveWindow", {y: -(110-64)});
            }
        }
    }

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
            <div id="chat" ref={chatContainerRef} className="py-2 px-4 overflow-auto no-drag flex flex-col gap-3 h-full">
                {messages.map((message, index) => {
                    return <Message key={message.id || index} message={message} last={index == messages.length - 1} sources={sources} index={index} />
                })}
            </div>
        </>}
        <form id="promptForm" className={`h-max no-drag pl-3 px-4 flex flex-col bottom-0 left-0 w-full ${messages.length > 0 ? 'border-t border-foreground/10' : ''}`} onSubmit={async (e)=>{
                e.preventDefault();
                await sendChatMessage();
            }}>
            {selectedFile && <div className="flex items-center w-full overflow-x-auto pt-2">
                <div className="px-4 py-2 bg-foreground/5">
                    <div className="text-xs text-foreground/70 flex items-center justify-between rounded-lg">
                        <span className="no-wrap overflow-hidden ellipsis w-max">📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        <button 
                            type="button"
                            onClick={() => {
                                if (messages.length < 1){
                                    window.electronAPI.send("resizeWindow", {height: 64});
                                    if (platform && platform == "win32") {
                                        window.electronAPI.send("moveWindow", {y: 110-64});
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
            <div className="w-full items-center flex">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                        window.electronAPI.send("noBlur", false)
                        handleAddFile(e.target.files?.[0] || null, messages, platform);
                        fileInputRef.current!.value = ""
                    }}
                    className="hidden"
                    accept="image/png,image/jpeg"
                />
                <ToolsDrawer setOpenToolsDrawer={setOpenToolsDrawer} openToolsDrawer={openToolsDrawer} selectedTools={selectedTools} setSelectedTools={setSelectedTools} fileInputRef={fileInputRef} />
                {promptInput == "" && !openToolsDrawer && <p className="opacity-50 absolute left-13">{selectedTools.includes('search') ? "Ask the web for anything" : selectedTools.includes('screen') ? "Ask anything about your screen" : "Ask anything"}</p>}
                <div ref={inputRef} id="prompt" contentEditable="plaintext-only" onClick={()=> setOpenToolsDrawer(false)} onInput={(e)=> {
                    const text = (e.target as HTMLDivElement).innerText
                    var setTool = false;
                    if (text){
                        if (text.startsWith("/off")){
                            setSelectedTools([]);
                            setTool = true;
                        } else if (text.startsWith("/se")){
                            setSelectedTools(['search']);
                            setTool = true;
                        } else if (text.startsWith("/sc")){
                            setSelectedTools(['screen']);
                            setTool = true;
                        }
                    }
                    if (setTool && text.startsWith("/")){
                        (e.target as HTMLDivElement).innerText = ""
                        setPromptInput("");
                    } else {
                        setPromptInput(text || "")
                    }
                }} onKeyDown={async(e)=> {
                    if(e.key == "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        await sendChatMessage();
                    } 
                }} onPaste={(e)=>{
                    const data = e.clipboardData;
                    if (data.files && data.files.length > 0) {
                        e.preventDefault();
                        const file = data.files[0];
                        if (file.type == 'image/png' || file.type == 'image/jpeg') {
                            handleAddFile(file, messages, platform);
                        }
                    }
                }} className={`outline-none border-none placeholder:text-foreground/50 w-full py-5 pl-10 ${openToolsDrawer && 'opacity-0'}`} autoFocus></div>
            </div>
        </form>  
    </div>
}