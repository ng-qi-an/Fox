import { Server } from "socket.io";
import { createServer } from "http";
import express from 'express';
import { exit } from 'process';
import cors from 'cors';

const webApp = express()
webApp.use(cors({ origin: "*" }))

export const httpServer = createServer(webApp);

const io = new Server(httpServer, { cors: {origin: '*' } });

var resolvePage = null
var resolveAllTabs = null
var resolveVideo = null

export function getWebpageContent(pages=[]){
    io.emit("getPageContent", {pages})
    return new Promise((resolve, reject) => {
        console.log("[INFO](API) Requesting webpage content")
        resolvePage = resolve;
    });
}

export function getVideoId(){
    io.emit("getVideoId", {})
    return new Promise((resolve, reject) => {
        console.log("[INFO](API) Requesting video ID")
        resolveVideo = resolve;
    });
}

export function getAllTabs(){
    io.emit("getAllTabs", {})
    return new Promise((resolve, reject) => {
        console.log("[INFO](API) Requesting all tabs")
        resolveAllTabs = resolve;
    });
}

export function startServer(app, activePromptWindow){
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
        res.json({ message: `Is ready?: ${global.getActivePromptWindow()}` });     
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
        socket.on("getVideoId", async (data) => {
            console.log("[INFO](API) Video ID request received")
            try {
                resolveVideo(data)
            } catch (error) {
                console.error('[ERROR](API) Error in getting video ID:', error);
            }
        });
        socket.on("getAllTabs", async (data) => {
            console.log("[INFO](API) All tabs response received")
            try {
                resolveAllTabs(data)
            } catch (error) {
                console.error('[ERROR](API) Error in getting all tabs:', error);
            }
        });
    });
    io.on("disconnect", (socket) => {
        console.log("[INFO](API) Client Disconnected")
    });

    httpServer.listen(7323, ()=>{
        console.log('[STATUS](API) Running on 7323, http://localhost:7323');
    });
}
