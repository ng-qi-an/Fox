import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyC8vzwI1_QgYA_wsqNDHlpD5yycXm9Xo3o"
});
const response = streamText({
  model: google('gemini-2.5-flash', {
    useSearchGrounding: true,
    dynamicRetrievalConfig: {
      mode: 'MODE_DYNAMIC',
      dynamicThreshold: 0.8,
    },
  }),
  prompt: "Tell me about abraham lincoln",
});

for await (const chunk of response.textStream) {
  console.log(chunk);
}
console.log(await response.sources)