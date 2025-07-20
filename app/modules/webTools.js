import { z } from 'zod';
import { tool } from 'ai';
import { getVideoId, getWebpageContent } from '../server.js';
import Innertube from 'youtubei.js';

/**
 * Tool for getting webpage context when the user refers to web content
 */
export const getWebpageContentTool = {
    description: `Access browser tab content when user asks about webpage content.

WHEN TO USE:
- User mentions: "this page/webpage/website", "summarize this page", "what does this page say"
- References to browser/webpage content in current or previous messages

DON'T USE FOR:
- General screen questions (use screen analysis instead)
- Non-browser content or desktop applications

Browser integration allows direct webpage access without URLs.
Use when user clearly requests webpage/browser content analysis.`,
    parameters: z.object({
        reason: z.string().describe('Why webpage content access is needed'),
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
    description: `Tool for extracting YouTube video transcripts.

WHEN TO USE: When user specifically requests video transcript/content analysis from:
- Current YouTube page they're viewing
- Mentions like "transcript", "what's in this video", "summarize video", etc.

CAPABILITIES:
- Automatically detects video ID from current page
- Returns full transcript text for analysis

DO NOT use for general video questions unrelated to transcript content.`,
    parameters: z.object({
        reason: z.string().describe('Why transcript access is needed'),
        // videoURL: z.string().optional().describe('Optional YouTube URL')
    }),
    execute: async ({ reason }) => {
        var videoId;
        console.log(`[TOOL] Youtube transcript requested: ${reason}`);
        try { 
            const yt = await Innertube.create({ generate_session_locally: true });
            // if (!pVideoURL) {
                console.log("No video URL provided, requesting from extension");
                const response = await getVideoId();
                console.log(response)
                if (response.status != "OK"){
                    return `Error: Unable to retrieve videoId. Please try again later. Error: ${response.error}`;
                } else {
                    videoId = response.videoId;
                }
            // } else {
            //     const url = new URL(pVideoURL);
            //     if (url.hostname !== 'www.youtube.com' && url.hostname !== 'youtube.com' && url.hostname !== 'youtu.be') {
            //         return `Error: Invalid YouTube URL provided. Please provide a valid YouTube video URL.`;
            //     }
            //     videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
            //     if (!videoId) {
            //         return `Error: Invalid YouTube URL provided. Please provide a valid YouTube video URL.`;
            //     }
            // }
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
