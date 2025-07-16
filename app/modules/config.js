import { readFile } from 'original-fs';
import Store from 'electron-store';
export async function getConfig(app){
    return await new Promise(function(resolve, reject) {
        readFile(`${app.isPackaged ? process.resourcesPath + "/" : ""}config.json`, function(err, data) { 
            if (err) reject(err);
            resolve(JSON.parse(data));
        });
    });
}

export async function validateConfig(app){
    const store = new Store();
    if (!store.get("version")){
        store.set({
            writingTools: {
                enabled: true,
                provider: "google",
                model: "gemini-2.5-flash",
            },
            chat: {
                enabled: true,
                provider: "google",
                model: "gemini-2.5-flash",
            },
            providers: {
                google: {
                    apiKey: "",
                }
            }
        })
        return "SETUP"
    }
    return "OK";
}