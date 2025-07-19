import { Plus } from "lucide-react";

export default function ToolsDrawer({openToolsDrawer, setOpenToolsDrawer, selectedTools, setSelectedTools, fileInputRef}:{openToolsDrawer: boolean, setOpenToolsDrawer: (open: boolean) => void, selectedTools: string[], setSelectedTools: (tools: string[]) => void, fileInputRef: React.RefObject<HTMLInputElement | null>}) {
    return <div className={`absolute z-30 rounded-full left-2 px-1 pr-4.5 ${openToolsDrawer ? 'bg-foreground/10 w-[261px] h-[45px] ' : 'bg-transparent w-[30px]  h-[50px]'} transition-all duration-400 flex items-center gap-3`}>
        <button
            type="button"
            onClick={() => {
                setOpenToolsDrawer(!openToolsDrawer);
            }}
            className={`h-[30px] min-w-[30px] flex items-center justify-center rounded-full ${openToolsDrawer ? 'hover:bg-transparent rotate-45 text-foreground' : `hover:bg-foreground/10 ${selectedTools.length > 0 ? 'text-yellow-500' : "text-foreground"}`} transition-all duration-300`}
        >
            <Plus className={`${openToolsDrawer ? "w-[22px] h-[22px]" : 'w-[18px] h-[18px]'} transition-all duration-300`} strokeWidth={'2px'}/>
        </button>
        {openToolsDrawer && <>
            <button
                type="button"
                onClick={() => {
                    setOpenToolsDrawer(false);
                    window.electronAPI.send("noBlur", true)
                    setTimeout(() => {
                        fileInputRef.current?.click()
                    }, 100)
                }}
                className={`flex items-center ml-[-7px] min-w-max justify-center text-sm hover:text-foreground text-foreground/80 transition-all`}
            >
                <p>Add photo</p>
            </button>
            <div className="h-[50%] min-w-[1px] bg-foreground/10 mx-0.5"></div>
            <button
                type="button"
                onClick={() => {
                    if (selectedTools.includes("search")) {
                        setSelectedTools([]);
                    } else {
                        setSelectedTools(['search']);
                    }
                }}
                className={`flex items-center min-w-max justify-center text-sm ${selectedTools.includes("search") ? 'text-yellow-400' : 'text-foreground/80 hover:text-foreground'} transition-all`}
            >
                <p>Search</p>
            </button>
            <div className="h-[30%] min-w-[1px] bg-foreground/10"></div>
            <button
                type="button"
                onClick={() => {
                    if (selectedTools.includes("screen")) {
                        setSelectedTools([]);
                    } else {
                        setSelectedTools(['screen']);
                    }
                }}
                className={`flex items-center min-w-max justify-center text-sm ${selectedTools.includes("screen") ? 'text-yellow-400' : 'text-foreground/80 hover:text-foreground'} transition-all`}
            >
                <p>Screen</p>
            </button>
        </>}
    </div>
}