import Editor from "@/components/Editor";
import Message from "@/components/Message";
import { type Context } from "@/components/ContextSuggestions";
import { AtSign, FileText, ImageIcon, LaptopMinimal, Minus, Paperclip, PaperclipIcon, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
export default function Prompt(){
    const [messages, setMessages] = useState<Record<string, any>[]>([]);
    const [completed, setCompleted] = useState(true);
    const [promptInput, setPromptInput] = useState("");
    const [platform, setPlatform] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [openToolsDrawer, setOpenToolsDrawer] = useState(false);
    const [sources, setSources] = useState<Record<string, Record<string, string>[]>>({});
    const [selectedContexts, setSelectedContexts] = useState<Context[]>([]);
    const [multipleLines, setMultipleLines] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null!);

    useEffect(()=>{
        window.electronAPI.send("getPlatform");
        window.electronAPI.on("getPlatform", (event, platform) => {
            console.log("[PROMPT] Platform detected:", platform);
            setPlatform(platform);
        });
        return ()=>{
            window.electronAPI.removeAllListeners("getPlatform");
        }
    }, [])

    useEffect(()=>{
        window.onkeydown = (event) => {
            if (event.key == "Escape") {
                if (openToolsDrawer) {
                    setOpenToolsDrawer(false);
                    return;
                } else if (messages.length < 3) {
                    window.electronAPI.send("closeWindow", "prompt");
                } else {
                    window.electronAPI.send("minimiseWindow")
                }
            } else if (event.key.match(/^[A-Za-z0-9/]+$/g) && !event.ctrlKey && !event.metaKey && !event.altKey) {
                if (editorRef.current && !editorRef.current.isFocused) {
                    editorRef.current.commands.focus('end');
                    if (event.key.length === 1) {
                        editorRef.current.commands.insertContent(event.key);
                    }
                }
            } 
        };
        
        window.electronAPI.on("getChatResponse", (event, data) => {
            if (data.status == 'completed'){
                console.log("[PROMPT] Chat response received:", data);
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
                copyMessages[copyMessages.length - 1].content[0].text = data.response;
                setMessages(copyMessages)
                window.electronAPI.send("setAlwaysOnTop", true)
            }
        });
        return ()=>{
            window.onkeydown = null; // Clean up the event listener
            window.electronAPI.removeAllListeners("getChatResponse");
        }
    }, [messages, openToolsDrawer, sources])

    const sendChatMessage = useCallback(async(content: string) => {
        console.log(platform)
        if ((content.trim() === "" && selectedFiles.length === 0) || !completed) {
            console.log("[PROMPT] No input provided, not sending message.");
            return;
        }
        let fileContents = [];
        if (selectedFiles.length > 0) {
            selectedFiles.forEach(file => {
                console.log("[PROMPT] File selected:", file.name, file.type, file.size);
            });
        }
        
        // Create message content with text and optional image
        const messageContent: Array<{type: string, text?: string, image?: string | URL, mimeType?: string, filename?: string, data?: any}> = [];
        if (content.trim()) {
            messageContent.push({ type: 'text', text: content });
        }
        if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
                if (file.type.startsWith('image/')) {
                    try {
                        const content = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        })
                        fileContents.push(content);
                        messageContent.push({ type: 'image', image: content as string });
                        console.log("[PROMPT] Image converted to base64");
                    } catch (error) {
                        console.error("[PROMPT] Error converting image:", error);
                    }
                } else if (file.type.startsWith('text/') ||file.type == "application/json" || file.type == "application/pdf" || file.type == "application/manifest+json") {
                    try {
                        const content = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsArrayBuffer(file);
                        })
                        fileContents.push(content);
                        messageContent.push({type: "file", mimeType: file.type, filename: file.name, data: content})
                        console.log("[PROMPT] File content read");
                    } catch (error) {
                        console.error("[PROMPT] Error reading file:", error);
                    }
                }
            }
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
        window.electronAPI.send("getChatResponse", {
            prompt: {role: "user", content: messageContent}, 
            messages: messages, 
            tools: selectedTools,
            contexts: selectedContexts
        });
        console.log(messages.length)
        if (messages.length < 1){
            //window.electronAPI.send("resizeWindow", {height: 500});
            window.electronAPI.send("setAlwaysOnTop", true);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setPromptInput("");
        setSelectedFiles([]);
        setSelectedContexts([]);
        setCompleted(false);
    }, [platform, selectedFiles, completed, messages, selectedTools, selectedContexts])

    const handleAddFile = useCallback((file: File | null) => {
        if (!file) return;
        setSelectedFiles((x)=> [...x, file]);
        if (messages.length < 1){
            if (platform && platform == "win32") {
                console.log("[PROMPT] Moving window for file input");
            }
        }
    }, [messages.length, platform])

    useEffect(()=>{
        if (promptInput.length > 0){
            if (editorContainerRef.current?.getBoundingClientRect().height > 24) {
                setMultipleLines(true);
            }
        } else {
            setMultipleLines(false);
        }
    }, [promptInput, multipleLines])

    return <div className="flex flex-col h-screen overflow-hidden">
        <div className="flex-1"/>
        <motion.div initial={{y: 64, scale: 1, opacity: 0}} animate={{y: -7, scale: 1, opacity: 1}}  transition={{type: "spring", bounce: 0.17, visualDuration: 0.15}} className={`${messages.length > 0 ? "bg-background border rounded-lg" : "fixed"} flex flex-col draggable max-h-screen overflow-hidden w-full bottom-0`} style={{minHeight: selectedFiles.length > 0 ? "112px" : "66px", height: messages.length > 0 ? "calc(100vh - 7px)" : "max-content"}}>
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
                        return <Message key={message.id || index} message={message} last={index == messages.length - 1} messages={messages} sources={sources} index={index} />
                    })}
                </div>
            </>
            }
            <div className="flex-1"/>
            <form id="promptForm" className={`h-max no-drag flex flex-col bottom-0 left-0 w-full ${messages.length > 0 ? 'border-t border-foreground/10' : ''}`} onSubmit={async (e)=>{
                    // e.preventDefault();
                    // await sendChatMessage();
                }}>
                {(selectedContexts.length > 0 || selectedFiles.length > 0) && (
                    <div className={`flex items-center w-full overflow-x-auto no-scrollbar ${messages.length > 0 ? 'pt-2 px-2' : 'py-1.5'} gap-2`}>
                        {selectedFiles.map((file, index) => (
                            <motion.div key={index} initial={{y: 10, opacity: 0}} animate={{y: 0, opacity: 1}} className={`flex items-center gap-2 px-2 py-1.5 ${messages.length > 0 ? 'bg-neutral-800/50' : "bg-background border"} rounded-lg w-max`}>
                                {/* <img src={context.favicon} alt={`${context.name} favicon`} className="w-5 h-5 rounded-sm" /> */}
                                <div className="flex items-center min-w-7 h-7 rounded-sm bg-neutral-800 justify-center">
                                    {file.type.startsWith("image") ? <ImageIcon className="text-foreground/70 w-5 h-5" /> : file.type.startsWith("text") ? <FileText className="text-foreground/70 w-4 h-4" /> : <Paperclip className="text-foreground/70 w-4 h-4" />}
                                </div>
                                <div className="flex flex-col w-full max-w-[150px]">
                                    <span className="text-sm font-medium text-foreground/80 w-full truncate">{file.name}</span>
                                    <span className="text-xs text-foreground/70 w-full truncate">{(file.size / 1024).toFixed(1)}KB</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setSelectedFiles((x) => x.filter((f) => f !== file))
                                        fileInputRef.current!.value = "";
                                    }}
                                    className="text-foreground/40 hover:text-foreground/80 ml-2"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                        </motion.div>))}
                        {selectedContexts.map((context) => {
                            return (
                                <motion.div initial={{y: 10, opacity: 0}} animate={{y: 0, opacity: 1}} key={context.id} className={`flex items-center gap-2 px-2 py-1.5 ${messages.length > 0 ? 'bg-neutral-800/50' : "bg-background border"} rounded-lg w-max`}>
                                    <div className="flex items-center min-w-7 min-h-7 rounded-sm bg-neutral-800 justify-center">
                                        <img src={context.favicon} alt={`${context.name} favicon`} className="w-5 h-5 rounded-sm" />
                                    </div>
                                    <div className="flex flex-col w-full max-w-[150px]">
                                        <span className="text-sm font-medium text-foreground/80 w-full truncate">{context.name}</span>
                                        <span className="text-xs text-foreground/70 w-full truncate">{context.url}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setSelectedContexts(selectedContexts.filter(ctx => ctx.id !== context.id));
                                        }}
                                        className="text-foreground/40 hover:text-foreground/80 ml-2"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
                <div className={`w-full flex border px-3 ${multipleLines ? "flex-col-reverse pt-4 pb-4" : "items-center py-4"} ${messages.length < 1 ? "bg-background rounded-lg" : 'border-transparent'}`}>
                    <div className={`flex items-center mr-2`}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => {
                                window.electronAPI.send("noBlur", false)
                                handleAddFile(e.target.files?.[0] || null);
                                fileInputRef.current!.value = ""
                            }}
                            className="hidden"
                            accept="image/png,image/jpeg,image/gif,image/webp,text/*,application/pdf,application/json,application/manifest+json"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className={`h-[30px] min-w-[30px] flex items-center justify-center rounded-full hover:bg-foreground/10 ${selectedTools.length > 0 ? 'text-yellow-500' : "text-foreground"} transition-all duration-300`}
                                >
                                    <Plus className={`w-[18px] h-[18px] transition-all duration-300`} strokeWidth={'2px'}/>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[150px]" onCloseAutoFocus={(e)=> e.preventDefault()}>
                                
                                <DropdownMenuCheckboxItem
                                    checked={selectedTools.includes("search")}
                                    onCheckedChange={(checked)=> checked ? setSelectedTools(["search"]) : setSelectedTools([])}
                                >
                                    <Search/>
                                    Search
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={selectedTools.includes("screen")}
                                    onCheckedChange={(checked)=> checked ? setSelectedTools(["screen"]) : setSelectedTools([])}
                                >
                                    <LaptopMinimal/>
                                    Screen
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem onClick={()=>{
                                    editorRef.current?.commands.focus('end');
                                    editorRef.current?.commands.insertContent("@");
                                }}><AtSign/>Add context</DropdownMenuItem>
                                <DropdownMenuItem onClick={()=>{
                                    setOpenToolsDrawer(false);
                                    window.electronAPI.send("noBlur", true)
                                    setTimeout(() => {
                                        fileInputRef.current?.click()
                                    }, 100)
                                }}><Paperclip/>Add file</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {promptInput == "" && !openToolsDrawer && <p className="opacity-50 absolute left-13">{selectedTools.includes('search') ? "Ask the web for anything" : selectedTools.includes('screen') ? "Ask anything about your screen" : "Ask anything • Use @ for context"}</p>}
                    </div>
                    {platform && <Editor 
                        content={promptInput} 
                        setContent={(content) => {
                            console.log("Height: ", editorContainerRef.current?.getBoundingClientRect().height)
                            setPromptInput(content)
                        }} 
                        multipleLines={multipleLines}
                        editorContainerRef={editorContainerRef}
                        openToolsDrawer={openToolsDrawer} 
                        onSubmit={sendChatMessage} 
                        handleAddFile={handleAddFile}
                        selectedContexts={selectedContexts}
                        setSelectedContexts={setSelectedContexts}
                        onEditorReady={(editor) => {
                            editorRef.current = editor;
                        }}
                    />}
                </div>
            </form>  
        </motion.div>
    </div>
}