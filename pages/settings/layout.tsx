import { Bot, Home, MessageCircle, Minus, PenLine, X } from "lucide-react";
import { useRouter } from "next/router";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const routes = {
        general: {
            label: "General",
            icon: Home,
            path: "/settings"
        },
        provider: {
            label: "Providers",
            icon: Bot,
            path: "/settings/providers"
        },
        chat: {
            label: "Chat",
            icon: MessageCircle,
            path: "/settings/chat"
        },
        writingTools: {
            label: "Writing Tools",
            icon: PenLine,
            path: "/settings/writing-tools"
        }
    }
    return <div className="main">
        <div className="flex items-center w-full min-h-[40px] pl-5 px-4 gap-3 draggable">
            <p className="text-sm">Settings</p>
            <div className="flex-1"/>
            <button className="text-foreground/50 hover:text-foreground" onClick={() => {
                window.electronAPI.send("minimiseWindow");
            }}><Minus className="w-[18px] h-[18px]" strokeWidth={'3px'}/></button>
            <button className="text-foreground/50 hover:text-foreground" onClick={() => {
                window.electronAPI.send("closeWindow", "prompt");
            }}><X className="w-[18px] h-[18px]" strokeWidth={'3px'}/></button>
        </div>
        <div className="flex w-screen" style={{ height: 'calc(100vh - 40px)' }}>
            <div className="w-[300px] p-2 h-full">
                <div className="flex flex-col gap-1 no-drag">
                    {Object.entries(routes).map(([key, route], index) => {
                        return <button key={index} onClick={()=> router.push(route.path)} className={`w-full text-left pr-4 pl-1.5 py-2 rounded-lg text-sm flex items-center cursor-pointer font-medium ${router.pathname == route.path ? 'bg-foreground/5' : 'hover:bg-foreground/5'} text-foreground`}>
                            {router.pathname == route.path ? <div className="h-4 rounded-full bg-amber-500 w-1 mr-2"/> : <div className="h-4 rounded-full bg-transparent w-1 mr-2"/>}
                            <route.icon width={20} height={20} strokeWidth={2.5} className="mr-3 text-foreground/80"/>
                            {route.label}
                        </button>
                    })}
                </div>
            </div>
            <div className="ml-2 h-full w-full overflow-auto px-6 py-2">
                {children}
            </div>
        </div>
    </div>
}