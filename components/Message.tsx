import { useState } from "react";
import Markdown from "react-markdown";

export default function Message({message, last, sources, index}:{message: Record<string, any>, sources: Record<string, any>, last: boolean, index: number}) {
    const isUser = message.role === "user";
    const uid = message.id || index; // Use index as fallback UID
    const [showAllSources, setShowAllSources] = useState(false);

    return (message.role == 'assistant' || message.role == 'user') && (
    message.content[0].type == 'tool-call' ?
        <div className="message-content w-full max-w-[95%] pl-4 text-sm opacity-80 mb-[-12px]">
            <p className="text-sm text-foreground/50">Used {message.content[0].toolName}</p>
        </div>
    :  isUser ? <div className="ml-auto rounded-lg px-4 py-2 w-max max-w-[80%] bg-foreground/10">
        {message.content.map((content: any, contentIndex: number) => {
            if (content.image){
                var imagesrc = "";
                if (content.image.startsWith('data:') || content.image.startsWith('http')){
                    imagesrc = content.image;
                } else {
                    const blob = new Blob([Buffer.from(content.image, 'base64')], { type: 'image/png' });
                    const objectUrl = URL.createObjectURL(blob);
                    imagesrc = objectUrl;
                }
            }

            return <div key={contentIndex}>
                {content.type === 'text' && <Markdown>{content.text.replace(/\n/g, "\n\n")}</Markdown>}
                {content.type === 'image' && (
                    <img 
                        src={imagesrc!}
                        alt="Uploaded image" 
                        className="max-w-full h-auto rounded-lg mt-2" 
                        style={{maxHeight: '200px'}}
                    />
                )}
            </div>
        })}
    </div>
    : <div key={uid} id={uid} className="message-content pb-2 w-full max-w-[95%] pl-4" style={{minHeight: last ? 'calc(100vh - 180px)' : 'max-content'}}>
        {!message.content[0].text ?
            <div className="h-3 w-3 rounded-full bg-foreground animate-pulse"></div>
        : <>
            <Markdown>{message.content[0].text}</Markdown>
                {sources[uid] && sources[uid].length > 0 && <div className="flex items-center flex-wrap gap-x-2">
                    {sources[uid].map((source:Record<string, string>, indx:number) => {
                        if (showAllSources == uid || indx < 3) {
                            return <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-foreground/50 hover:text-foreground underline">{source.title}</a>
                        }
                    })}
                    {sources[uid].length > 4 && (showAllSources != uid ? 
                        <button className="text-xs text-foreground/50 hover:text-foreground underline" onClick={() => setShowAllSources(true)}>+{sources[uid].length - 3}</button>
                    : 
                        <button className="text-xs text-foreground/50 hover:text-foreground underline" onClick={() => setShowAllSources(false)}>Show less</button>
                    )}
                </div>}
            </>
        }
    </div>)
}