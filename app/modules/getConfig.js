import { readFile } from 'original-fs';

export async function getConfig(app){
    return await new Promise(function(resolve, reject) {
        readFile(`${app.isPackaged ? process.resourcesPath + "/" : ""}config.json`, function(err, data) { 
            if (err) reject(err);
            resolve(JSON.parse(data));
        });
    });
}