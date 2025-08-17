import { Server } from "socket.io";
import { createServer } from "http";
import express from 'express';
import { exit } from 'process';
import cors from 'cors';
import multer from 'multer';


const webApp = express()
webApp.use(cors({ origin: "*" }))

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(), // Store files in memory
    limits: {
        files: 10 // Max 10 files
    }
});

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
        res.json({ "status": "OK", message: `Is ready?: ${global.getActivePromptWindow()}` });
    });

    webApp.get("/connect", function(req, res) {
        if (global.getActivePromptWindow()) {
            res.json({ "status": "OK", message: `Connected to prompt window!` });
        } else {
            res.json({ "status": "ERROR", error: "NO_ACTIVE"});
        }
    });

    webApp.post("/uploadToPrompt", upload.array('files'), function(req, res) {
        if (global.getActivePromptWindow()) {
            // Handle file upload - files are now available in req.files
            console.log('Uploaded files:', req.files);
            console.log('Number of files:', req.files ? req.files.length : 0);
            
            if (!req.files || req.files.length === 0) {
                return res.json({ "status": "ERROR", error: "No files uploaded" });
            }
            
            // Process the files and send as ArrayBuffer-compatible data
            const fileData = req.files.map(file => ({
                name: file.originalname,
                type: file.mimetype,
                size: file.size,
                lastModified: Date.now(),
                // Send buffer as Uint8Array which can be easily converted to ArrayBuffer
                arrayBuffer: Array.from(file.buffer)
            }));
            
            global.getActivePromptWindow().webContents.send("uploadFiles", fileData);
            res.json({ "status": "OK", message: `${req.files.length} file(s) uploaded to prompt window!` });
        } else {
            res.json({ "status": "ERROR", error: "NO_ACTIVE"});
        }
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
