# 🦊 Fox

**An AI-powered personal assistant for your desktop**

Fox is a powerful desktop application that brings AI assistance directly to your workflow. With system-wide writing tools, intelligent chat capabilities, and seamless integration with your daily tasks, Fox helps you write better, think clearer, and work more efficiently.

## ✨ Features

### 🔧 Writing Tools
- **Smart Text Enhancement**: Instantly improve any selected text with AI-powered rewriting
- **Multiple Tone Options**: Professional, friendly, concise - adapt your writing to any context
- **Content Organization**: Convert text to bullet points, ordered lists, or summaries
- **Custom Prompts**: Create personalized writing assistance with custom instructions
- **System-wide Integration**: Works with any application - just select text and activate

### 💬 Intelligent Chat
- **AI-Powered Conversations**: Engage with advanced AI models for assistance, brainstorming, and problem-solving
- **Tool Integration**: Access powerful tools like web search, YouTube transcripts, and more _(Requires [fox extension](/#Features))_
- **File Attachments**: Upload and discuss documents (coming soon) and images
- **Contextual Assistance**: Get help with code, writing, research, and creative tasks

### ⚡ Quick Access
- **Global Hotkeys**: `F8` for chat, `Shift+F8` for writing tools
- **System Tray**: Always accessible from your system tray
- **Auto-start**: Launches with your system for instant availability
- **Cross-platform**: Works on Windows and macOS

## 🛠️ Built With

Fox is built using modern web technologies wrapped in a desktop application:

- **Frontend**: [Next.js](https://nextjs.org/) with React 19 and TypeScript
- **Desktop Framework**: [Electron](https://electronjs.org/) for cross-platform compatibility
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom components
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/) with Google Gemini models
- **State Management**: Electron Store for persistent configuration
- **UI Components**: Shadcn UI primitives with custom styling

## 🚀 Getting started

### Prebuilt Installers
1. Download the latest setup file from [Github Releases]()
2. Run the setup

### Build it yourself
#### Prerequisites
- Node.js 18+ installed on your system
- An AI api key

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ng-qi-an/Fox.git
   cd Fox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development environment**
   ```bash
   npm run dev
   ```
   This will start both the Next.js development server and Electron simultaneously.


### 🚢 Building for Production

To create a distributable version:

```bash
npm run build
```

This will create platform-specific installers in the `dist` folder.


## 🧑‍💻 First Time Setup

1. Launch Fox and complete the initial setup wizard
2. Enter your Google AI API key
3. Configure your preferred AI models for chat and writing tools
4. Customize hotkeys and preferences as needed




## 🔒 Privacy & Security

- All API keys are stored locally and encrypted
- No data is collected or transmitted to third parties
- AI processing happens through your own API credentials
- Selected text is only sent to AI providers when explicitly requested

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the powerful [Vercel AI SDK](https://sdk.vercel.ai/)
- UI components from [Radix UI](https://radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [Google Gemini](https://deepmind.google/technologies/gemini/) AI models

---

**Made with ❤️ by [Qi An](https://github.com/ng-qi-an)**

*Fox - Your AI companion for a more productive workflow*