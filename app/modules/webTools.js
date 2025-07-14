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
 * Tool for getting webpage content when the user asks about web pages
 */
export const getWebpageContentTool = {
    description: `Use this tool whenever a user refers to web content they are currently viewing. 

TRIGGER PHRASES (use tool immediately when you see these):
- "this page" 
- "what am I looking at"
- "summarize this"
- "what is this about"
- "explain this content"
- "is this suitable"
- "what does this say"
- "tell me about this"

The user has browser integration - you can access their current webpage without needing a URL. 
DO NOT ask for URLs or links. Just use this tool.

Example: User says "summarize this page" → immediately call getWebpageContent with reason "to summarize the current webpage the user is viewing"`,
    parameters: z.object({
        reason: z.string().describe('Detailed reason why you are accessing the webpage content, including what the user asked for')
    }),
    execute: async ({ reason }) => {
        console.log(`[TOOL] Webpage content requested: ${reason}`);
        console.log("Asked for page");
        const response = await getWebpageContent();
        console.log(response)
        if (response.status != "OK"){
            return `Error: Unable to retrieve webpage content. Please try again later. Error: ${response.error}`;
        } else {
        return `Here is the raw webpage content for you to process and respond to the user's request:
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
