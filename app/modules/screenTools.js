import { z } from 'zod';
import { tool, generateText } from 'ai';
import { screen, desktopCapturer } from 'electron';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getConfig } from './config.js';

/**
 * Create screen context tool with app context
 */
export function createScreenTools(app) {
    const takeScreenshotTool = {
        description: `Use this tool to gain visual context of what's currently on the user's screen. This gives you awareness of their current display to better understand their questions and provide relevant assistance.

TRIGGER PHRASES (use tool immediately when you see these):
- "What's this on my screen?"
- "What am I looking at?"
- "Help me out here"
- "What is this"
- "Can you see what I'm seeing?"
- "Analyze my screen"
- "What's happening on my screen?"
- "What's on my display?"
- "Can you see my screen?"
- "What's visible on my monitor?"
- "Help me understand this"

This tool provides you with visual context of the user's current display so you can better assist them with what they're seeing.
DO NOT confuse this with webpage content - use this for general display context and understanding.`,
        parameters: z.object({
            reason: z.string().describe('Why you need to see the user\'s screen to better assist them')
        }),
        execute: async ({ reason }) => {
            console.log(`[TOOL] Screen context requested for AI assistance: ${reason}`);
            
            try {
                // Get the primary display
                const primaryDisplay = screen.getPrimaryDisplay();
                const { width, height } = primaryDisplay.bounds;
                
                // Capture the screen using desktopCapturer
                const sources = await desktopCapturer.getSources({
                    types: ['screen'],
                    thumbnailSize: { width: 1280, height: 720 }
                });
                
                // Get the primary screen source
                const primarySource = sources[0];
                if (!primarySource) {
                    throw new Error('No screen source available');
                }
                
                // Convert to base64
                const screenshotBase64 = primarySource.thumbnail.toPNG().toString('base64');
                
                console.log(`[TOOL] Screen captured for AI context: ${width}x${height} pixels`);
                
                // Return the base64 image directly for the chat system to analyze
                // This is much faster than doing separate AI analysis here
                return `SCREEN_CAPTURE_BASE64:${screenshotBase64}`;
                
            } catch (error) {
                console.error('[ERROR] Screen context analysis failed:', error);
                return `Error: Unable to gain screen context. Please try again later. Error: ${error.message}`;
            }
        }
    };

    return {
        analyzeScreen: tool(takeScreenshotTool)
    };
}

/**
 * Collection of all screen-related tools (legacy export for compatibility)
 */
export const screenTools = {
    // This will be replaced by createScreenTools in the chat module
};
