import { getSelection } from 'node-selection';
import { Server } from "socket.io";
import { createServer } from "http";
import express from 'express';
import { writingTools } from './modules/writingTools.js';

const webApp = express()
export const httpServer = createServer(webApp);

const io = new Server(httpServer, { /* options */ });

export function startServer(app){
    webApp.get('/', function(req, res) {
        res.json({ message: 'Hello World'});
        // setTimeout(async()=>{
        //     try {
        //         const selection = await getSelection();
        //         console.log('current selection:', selection);
        //     } catch (error) {
        //         console.error('error', error);
        //     }
        // }, 3000)        
    });
    
    io.on("connection", (socket) => {
        console.log("[INFO](API) Client Connected")
        socket.on("getWritingTools", async (data) => {  
            const response = await writingTools(data.prompt)
            for await (const part of response) {
                console.log('generating the thing')
                socket.emit("getWritingTools", {'response': part.response, "status": 'generating'});
            }
            socket.emit("getWritingTools", {"status": 'completed'});
        });
    });

    
    httpServer.listen(7323, ()=>{
        console.log('[STATUS](API) Running on 7323, http://localhost:7323');
    });    
}
