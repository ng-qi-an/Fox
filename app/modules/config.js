import { readFile } from 'original-fs';
import Store from 'electron-store';
import { ipcMain } from 'electron';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
export async function getConfig(app){
    return await new Promise(function(resolve, reject) {
        readFile(`${app.isPackaged ? process.resourcesPath + "/" : ""}config.json`, function(err, data) { 
            if (err) reject(err);
            resolve(JSON.parse(data));
        });
    });
}

export async function validateConfig(app){
    const store = new Store();
    if (!store.get("version")){
        store.set({
            writingTools: {
                enabled: true,
                provider: "google",
                model: "gemini-2.5-flash",
            },
            chat: {
                enabled: true,
                provider: "google",
                model: "gemini-2.5-flash",
            },
            providers: {
                google: {
                    apiKey: "",
                }
            }
        })
        return "SETUP"
    }
    return "OK";
}

// Initialize provider configuration IPC handlers
export function initialiseConfigIPC(app) {
    const store = new Store();

    // Get provider configurations
    ipcMain.on('getProviderConfig', (event) => {
        const webContents = event.sender
        try {
            const providers = store.get('providers', {});
            console.log('[INFO](API) Provider configurations loaded:', providers);
            return webContents.send('getProviderConfig', {"status": "OK", "providers": providers});
        } catch (error) {
            console.error('Failed to get provider configs:', error);
            return webContents.send('getProviderConfig', {"status": "ERROR", "error": error.message});
        }
    });

    // Save provider configuration
    ipcMain.on('saveProviderConfig', async(event, { providerId, config }) => {
        const webContents = event.sender
        try {
            console.log(`[INFO](API) Saving provider config for ${providerId}:`, config);
            const providers = store.get('providers', {});
            var model;
            switch (providerId) {
                case 'google':
                    model = createGoogleGenerativeAI({apiKey: config.apiKey})('gemini-1.5-flash');
                    break;
                case 'openai':
                    model = createOpenAI({apiKey: config.apiKey})('gpt-4.1-nano');
                    break;
                default:
                    throw new Error('Unsupported provider');
            }
            try { 
                await generateText({
                    model,
                    prompt: 'Hi',
                    maxTokens: 1, // Minimal usage
                });
            } catch (error) {
                console.error(`[ERROR](API) Invalid API key for ${providerId}:`, error);
                return webContents.send('saveProviderConfig', { status: "INVALID_KEY", providerId: providerId });
            }

            providers[providerId] = config;
            store.set('providers', providers);
            console.log(`Saved provider config for ${providerId}:`, config);
            webContents.send('saveProviderConfig', { status: "OK", providerId: providerId, config: config });
            return;
        } catch (error) {
            console.error('Failed to save provider config:', error);
            webContents.send('saveProviderConfig', { status: "ERROR", error: error.message });
        }
    });

    // Remove provider configuration
    ipcMain.on('removeProviderConfig', (event, providerId) => {
        const webContents = event.sender
        try {
            const providers = store.get('providers', {});
            delete providers[providerId];
            store.set('providers', providers);
            console.log(`Removed provider config for ${providerId}`);
            webContents.send('removeProviderConfig', { status: "OK", providerId: providerId });
        } catch (error) {
            console.error('Failed to remove provider config:', error);
            webContents.send('removeProviderConfig', { status: "ERROR", error: error.message });
        }
    });

    // Get chat settings
    ipcMain.on('getChatSettings', (event) => {
        try {
            const chatSettings = store.get('chat', {
                enabled: true,
                provider: 'google',
                model: 'gemini-2.5-flash'
            });
            event.reply('getChatSettings', chatSettings);
        } catch (error) {
            console.error('Failed to get chat settings:', error);
            event.reply('getChatSettings', null);
        }
    });

    // Save chat settings
    ipcMain.on('saveChatSettings', (event, settings) => {
        console.log('hello')
        try {
            store.set('chat', settings);
            console.log('Saved chat settings:', settings);
            event.reply('saveChatSettings', { status: "OK", settings: settings });
        } catch (error) {
            console.error('Failed to save chat settings:', error);
            event.reply('saveChatSettings', { status: "ERROR", error: error.message });
        }
    });
}

