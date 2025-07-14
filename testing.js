import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

import { z } from 'zod';
import { generateText, tool } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyC8vzwI1_QgYA_wsqNDHlpD5yycXm9Xo3o"
});

const getWebpageContentTool = {
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
        
        // TODO: Integrate with browser to get actual webpage content
        // Return raw content that needs to be processed by the AI
        return `Here is the raw webpage content for you to process and respond to the user's request:

WEBPAGE CONTENT:
Title: AI in Modern Technology - A Comprehensive Guide
URL: https://example.com/ai-guide

This comprehensive article explores the fascinating world of artificial intelligence and its rapidly expanding applications in modern technology. The piece begins with an introduction to machine learning fundamentals, explaining how neural networks process data to recognize patterns and make predictions.

The article delves into several key areas:

Natural Language Processing (NLP): Discusses how AI systems understand and generate human language, including applications in chatbots, translation services, and content generation. It explains transformer architectures and attention mechanisms that power modern language models.

Computer Vision: Covers how AI interprets visual information, from simple image classification to complex scene understanding. Applications include autonomous vehicles, medical imaging analysis, and augmented reality systems.

Machine Learning Algorithms: Provides an overview of supervised, unsupervised, and reinforcement learning approaches. It includes practical examples of each method and discusses when to use different algorithms.

Ethics and Future Considerations: The article concludes with a thoughtful discussion about AI ethics, bias in machine learning models, and the importance of responsible AI development. It also speculates about future developments in artificial general intelligence.

The article is well-structured with clear headings, includes several technical diagrams, and provides code examples in Python for implementing basic machine learning models. It's approximately 3,500 words and appears to be targeted at both technical professionals and interested general readers.

END OF WEBPAGE CONTENT

Please now process this content according to the user's request (${reason}).`;
    }
};

const response = streamText({
  model: google("gemini-2.5-flash"),
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
    getWebpageContentTool: tool(getWebpageContentTool),
  },
  maxSteps: 5, // allow up to 5 steps
  prompt: 'Summarise the webpage',
});

for await (const part of response.textStream) {
  console.log(part);
}
