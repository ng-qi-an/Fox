# 🦊 Waves

**An AI-powered personal assistant for your desktop**

Waves is a powerful desktop application that brings AI assistance directly to your workflow. With system-wide writing tools, intelligent chat capabilities, and seamless integration with your daily tasks, Waves helps you write better, think clearer, and work more efficiently.

## ✨ Features

### 🔧 Writing Tools
- 🪄 **Smart Text Enhancement**: Instantly improve any selected text with AI-powered rewriting
- **Multiple Tone Options**: Professional, friendly, concise - adapt your writing to any context
- 📃 **Content Organization**: Convert text to bullet points, ordered lists, or summaries
- **Custom Prompts**: Create personalized writing assistance with custom instructions
- 💻 **System-wide Integration**: Works with any application - just select text and activate

### 💬 Intelligent Chat
- 👋 **AI-Powered Conversations**: Engage with advanced AI models for assistance, brainstorming, and problem-solving
- **Tool Integration**: Access powerful tools like web search, YouTube transcripts, and screen context.
- 📁 **File Attachments**: Upload and discuss documents (coming soon) and images
- **Contextual Assistance**: Get help with code, writing, research, and creative tasks 

### ⚡ Quick Access
- 🌍 **Global Hotkeys**: `F8` for chat, `Shift+F8` when selecting text for writing tools
- **System Tray**: Always accessible from your system tray
- 🚗 **Auto-start**: Launches with your system for instant availability
- **Cross-platform**: Works on Windows and macOS
- ☁️ **Auto update**: Updates on launch to get the latest features!

## 🌐 Browser Extension

Waves also includes a companion **browser extension** that extends AI assistance to your **web browsing experience**. 

[Download here](https://github.com/ng-qi-an/Waves-Extension)

The browser extension provides:
- Web content **summarization**
- Research tools integration
- Seamless connection to your Waves desktop app

**⚠️ Must be installed for browser and youtube transcript to work!**


## 🚀 Getting started

### Prebuilt Installers
1. Download the latest setup file from [Github Releases](https://github.com/ng-qi-an/Waves/releases)
2. Run the setup

### Build it yourself
#### Prerequisites
- Node.js 18+ installed on your system
- An AI api key

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ng-qi-an/Waves.git
   cd Waves
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

1. Launch Waves and complete the initial setup wizard
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



## 🛠️ Built With

Waves is built using modern web technologies wrapped in a desktop application:

- **Frontend**: [Next.js](https://nextjs.org/) with React 19 and TypeScript
- **Desktop Framework**: [Electron](https://electronjs.org/) for cross-platform compatibility
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom components
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/) with Google Gemini models
- **State Management**: Electron Store for persistent configuration
- **UI Components**: Shadcn UI primitives with custom styling


## 🙏 Acknowledgments

- Built with the powerful [Vercel AI SDK](https://sdk.vercel.ai/)
- UI components from [ShadcnUI](https://radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Help from Github Copilot
    - Tidied much of the code up 🧹
    - Helped design certain parts of the UI (Setup and Settings) 🎨
    - Refactored some of the code into **components** 
    - General debugging 🐛

---

**Made with ❤️ by [Qi An](https://github.com/ng-qi-an)**

