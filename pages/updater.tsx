import { useEffect, useState } from "react"

export default function Updater(){
    const [downloaded, setDownloaded] = useState(false)
    const [progress, setProgress] = useState(0)
    useEffect(()=>{
        window.electronAPI.send("getDownloadStatus")
        window.electronAPI.on("downloadComplete", ()=>{
            setDownloaded(true)
            setTimeout(()=>{
                window.electronAPI.send("readyInstall")
            }, 700)
        })
        window.electronAPI.on("downloadProgress", (event, progress) => {
            setProgress(progress.precent)
        })
    }, [])
    return <div className="w-screen h-screen flex flex-col items-center justify-center">
        <img src='/icon.png' className="h-[100px] w-[100px]"/>
        <h1 className="text-2xl font-bold">Updating..</h1>
        {downloaded ? <p className="mt-4">Installing app</p> : <p className="mt-4">Downloading app {progress}%</p>}
    </div>
}