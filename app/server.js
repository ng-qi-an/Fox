import { Server } from "socket.io";
import { createServer } from "http";
import express from 'express';
import { writingTools } from './modules/writingTools.js';
import { exit } from 'process';
import { chat } from './modules/chat.js';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const webApp = express()
webApp.use(cors({ origin: "*" }))

export const httpServer = createServer(webApp);

const io = new Server(httpServer, { cors: {origin: '*' } });

var resolvePage = null

export function getWebpageContent(){
    io.emit("getPageContent", {})
    return new Promise((resolve, reject) => {
        console.log("[INFO](API) Requesting webpage content")
        resolvePage = resolve;
    });
}

export function startServer(app){
    httpServer.on('error', function (e) {
        if (e.code == "EADDRINUSE") {
            console.error('[ERROR](API) Port 7323 is already in use');
            exit(1)
        } else {
            console.error('[ERROR](API) Unknown error:', e);
            exit(1)
        }
    });
  
    webApp.get('/', function(req, res) {
        res.json({ message: 'Hello World'});     
    });

    
    io.on("connection", (socket) => {
        console.log("[INFO](API) Client Connected")
        socket.on("getPageContent", async (data) => {
            console.log("[INFO](API) Page content request received")
            try {
                resolvePage(data)
            } catch (error) {
                console.error('[ERROR](API) Error in getting webpage content:', error);
            }
        });

        socket.on("getWritingTools", async (data) => {  
            try {
                const response = await writingTools(app, data.prompt)
                for await (const part of response.textStream) {
                    socket.emit("getWritingTools", {'response': part, "status": 'generating'});
                }
            } catch (error) {
                console.error('[ERROR](API) Error in writing tools:', error);
                return socket.emit("getWritingTools", {"status": 'error', "error": error.message});
            }
            socket.emit("getWritingTools", {"status": 'completed'});
        });
        socket.on("getChatResponse", async(data)=>{
            console.log('generating')
            var newMessages = [];
            const uid = uuidv4();
            try {
                const responseWithData = await chat(app, data.prompt, data.messages)
                var messageContent = ""
                if (responseWithData.streamed){
                    for await (const part of responseWithData.response.textStream) {
                        messageContent += part
                        socket.emit("getChatResponse", {'uid': uid, 'response': messageContent, "status": 'generating'});
                    }
                } else {
                    messageContent = responseWithData.response
                }
                newMessages = [...responseWithData.newMessages];
                newMessages.push({"role": "assistant", "content": messageContent})
            } catch (error) {
                console.error('[ERROR](API) Error in chat response:', error);
                return socket.emit("getChatResponse", {"status": 'error', "error": error.message});
            }
            socket.emit("getChatResponse", {"status": 'completed', 'uid': uid, "response": messageContent, "newMessages": newMessages});
        });
    });
    io.on("disconnect", (socket) => {
        console.log("[INFO](API) Client Disconnected")
    });

    httpServer.listen(7323, ()=>{
        console.log('[STATUS](API) Running on 7323, http://localhost:7323');
    });
}
