import { z } from 'zod';
import { tool } from 'ai';
import { getVideoId, getWebpageContent } from '../server.js';
import Innertube from 'youtubei.js';

/**
 * Tool for getting webpage context when the user refers to web content
 */
export const getWebpageContentTool = {
    description: `Use this tool ONLY when the user is specifically asking about browser/webpage content. This gives you access to their current browser tab content.

TRIGGER PHRASES (use tool immediately when you see these AND they relate to browser/web content):
- "this page" or "this webpage" or "this website" 
- "summarize this page/site/website"
- "what does this page say"
- "explain this website"
- "analyze this webpage"
- "tell me about this site"
- References to browser, webpage, website, site, page in current or previous messages

DO NOT TRIGGER for:
- General screen questions (use screen analysis instead)
- "what am I looking at" without webpage context
- "what's on my screen" 
- Questions about desktop applications or non-browser content

The user has browser integration - you can access their current webpage without needing a URL. 
Only use this tool when the context clearly indicates they're asking about webpage/browser content.

Example: User says "summarize this webpage" → immediately call getWebpageContent with reason "to gain context of the current webpage to help the user"`,
    parameters: z.object({
        reason: z.string().describe('Why you need access to the webpage content to better assist the user'),
    }),
    execute: async ({ reason }) => {
        console.log(`[TOOL] Webpage context requested: ${reason}`);
        console.log("Accessing webpage for context");
        const response = await getWebpageContent();
        console.log(response)
        if (response.status != "OK"){
            return `Error: Unable to retrieve webpage context. Please try again later. Error: ${response.error}`;
        } else {
        return `I now have context of the webpage the user is viewing:
Webpage URL: ${response.tabUrl}
WEBPAGE CONTENT:

${response.content}

END OF WEBPAGE CONTENT

Please now process this content according to the user's request (${reason}).`;
        }
    }
};

export const getTranscriptTool = tool({
    description: `Use this tool to get the transcript of a YouTube video when the user specifically requests it. This tool extracts the full transcript/captions from YouTube videos for analysis, summarization, or reference.

TRIGGER PHRASES (use tool immediately when you see these AND they relate to YouTube videos):
- "transcript of this video"
- "what does this video say"
- "summarize this YouTube video"
- "get the transcript"
- "video transcript"
- "what's in this video"
- "analyze this video content"
- "extract text from video"
- References to YouTube video content, captions, or transcript

WHEN TO USE:
- User asks for video transcript while viewing a YouTube page
- User wants to analyze or summarize video content
- User needs text version of video for accessibility
- User asks about video content without watching

HOW IT WORKS:
- If user is on a YouTube page, automatically detects video ID
- Can also work with manually provided YouTube video urls
- Extracts official captions/transcript when available
- Returns full text content for processing

Example: User says "get the transcript of this video" while on YouTube → immediately call with reason "to extract video transcript for user analysis"`,
    parameters: z.object({
        reason: z.string().describe('Why you need access the youtube video to better assist the user'),
        videoURL: z.string().optional().describe('YouTube video URL if applicable')
    }),
    execute: async ({ reason, videoURL:pVideoURL }) => {
        var videoId;
        console.log(`[TOOL] Youtube transcript requested: ${reason}`);
        try { 
            const yt = await Innertube.create({ generate_session_locally: true });
            if (!pVideoURL) {
                console.log("No video URL provided, requesting from extension");
                const response = await getVideoId();
                console.log(response)
                if (response.status != "OK"){
                    return `Error: Unable to retrieve videoId. Please try again later. Error: ${response.error}`;
                } else {
                    videoId = response.videoId;
                }
            } else {
                const url = new URL(pVideoURL);
                if (url.hostname !== 'www.youtube.com' && url.hostname !== 'youtube.com' && url.hostname !== 'youtu.be') {
                    return `Error: Invalid YouTube URL provided. Please provide a valid YouTube video URL.`;
                }
                videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
                if (!videoId) {
                    return `Error: Invalid YouTube URL provided. Please provide a valid YouTube video URL.`;
                }
            }
            console.log(`Using video ID: ${videoId}`);
            const info = await yt.getInfo(videoId);
            try {
                const defaultTranscriptInfo = await info.getTranscript();
                var words = ""
                defaultTranscriptInfo.transcript.content.body.initial_segments.map((segment) => {
                    words += `${segment.snippet.text} `
                });
                return `I now have the transcript of the YouTube video with ID ${videoId}:
                    ${words}
                Please now process this content according to the user's request (${reason}).`;
            } catch (error) {
                console.error('[ERROR](API) Error in getting video transcript:', error);
                return `Error: Unable to retrieve video transcript. Please try again later. Error: ${error.message}`;
            }
        } catch (error) {
            console.error('[ERROR](API) Error in getting video info:', error);
            return `Error: Unable to retrieve video information. Please try again later. Error: ${error.message}`;
        }
    }
})

/**
 * Collection of all web-related tools
 */
export const webTools = {
    getWebpageContent: tool(getWebpageContentTool),
    getTranscript: tool(getTranscriptTool)
};
