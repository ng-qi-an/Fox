import { z } from 'zod';
import { tool } from 'ai';
import { getWebpageContent } from '../server.js';

/**
 * Simple test tool to verify tool invocation is working
 */
export const testTool = {
    description: 'A simple test tool. Use this when the user says "test tool" or "hello tool".',
    parameters: z.object({
        message: z.string().describe('A test message')
    }),
    execute: async ({ message }) => {
        console.log(`[TEST TOOL] Called with message: ${message}`);
        return `Test tool executed successfully with message: ${message}`;
    }
};

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
        reason: z.string().describe('Why you need access to the webpage content to better assist the user')
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

/**
 * Collection of all web-related tools
 */
export const webTools = {
    testTool: tool(testTool),
    getWebpageContent: tool(getWebpageContentTool)
};
