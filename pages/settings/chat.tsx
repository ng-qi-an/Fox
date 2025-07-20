import { Cog, Home, Minus, Settings, Settings2, X, Check, AlertCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import SettingsLayout from "./layout";
import { availableProviders } from "@/components/ProviderManager";
import { Button } from "@/components/ui/button";
import ModelSelector, { availableModels } from "@/components/ModelSelector";
import type { Provider } from "@/components/ProviderManager";
import type { ModelOption } from "@/components/ModelSelector";

interface ChatSettings {
  enabled: boolean;
  provider: string;
  model: string;
}

export default function SettingsPage(){
    const router = useRouter();
    const [chatSettings, setChatSettings] = useState<ChatSettings>({
        enabled: true,
        provider: 'google',
        model: 'gemini-2.5-flash'
    });
    const [configuredProviders, setConfiguredProviders] = useState<Provider[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Available providers that match the providers page

    useEffect(() => {
        loadChatSettings();
        loadConfiguredProviders();
    }, []);

    const loadChatSettings = async () => {
        try {
            if (window.electronAPI?.send) {
                window.electronAPI.send('getChatSettings');

                window.electronAPI.on('getChatSettings', (event, settings) => {
                    if (settings) {
                        setChatSettings(settings);
                    }
                });
                window.electronAPI.on('saveChatSettings', (event, response) => {
                    if (response.status === "OK") {
                        setSaveStatus('saved');
                        setTimeout(() => {
                            setSaveStatus('idle');
                        }, 2000);
                    } else if (response.status === "ERROR") {
                        console.error('Failed to save chat settings:', response.error);
                        setSaveStatus('error');
                        setTimeout(() => {
                            setSaveStatus('idle');
                        }, 3000);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load chat settings:', error);
        }
    };

    const loadConfiguredProviders = async () => {
        try {
            if (window.electronAPI?.send) {
                window.electronAPI.send('getProviderConfig');
                
                window.electronAPI.on('getProviderConfig', (event, data) => {
                    if (data.status == "OK"){
                        const providerConfig = data.providers || {};
                        console.log('Provider config:', providerConfig);
                        // Filter available providers to only show those with API keys
                        const configured = availableProviders.filter(provider =>
                            providerConfig && providerConfig[provider.id] && providerConfig[provider.id].apiKey
                        );
                        setConfiguredProviders(configured);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load configured providers:', error);
        }
    };


    const updateChatSettings = (updates: Partial<ChatSettings>) => {
        setSaveStatus('saving');
        window.electronAPI.send('saveChatSettings', { ...chatSettings, ...updates });
        setChatSettings(prev => ({ ...prev, ...updates }));
    };

    return <SettingsLayout>
        <div className="">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Chat Settings</h1>
                    <p className="text-sm text-foreground/70">Configure your AI chat preferences</p>
                </div>
                <div className="flex items-center space-x-3">
                    {saveStatus === 'saved' && (
                        <div className="flex items-center text-green-400 text-sm">
                            <Check className="w-4 h-4 mr-1" />
                            Saved
                        </div>
                    )}
                    {saveStatus === 'error' && (
                        <div className="flex items-center text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Error
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Enable/Disable */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Enable Chat</h3>
                        <p className="text-sm text-foreground/70">Turn chat functionality on or off</p>
                    </div>
                    <button
                        onClick={() => updateChatSettings({ enabled: !chatSettings.enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            chatSettings.enabled ? 'bg-amber-600' : 'bg-white/20'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                chatSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Provider Selection */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg mt-6 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">AI Provider</h3>
                
                {configuredProviders.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">🔧</div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">No providers configured</h4>
                        <p className="text-sm text-foreground/70 mb-4">You need to set up at least one AI provider before you can use chat.</p>
                        <Button onClick={() => router.push('/settings/providers')}>
                            Configure Providers
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {configuredProviders.map(provider => (
                            <div 
                                key={provider.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                    chatSettings.provider === provider.id 
                                        ? 'border-amber-400 bg-amber-400/10' 
                                        : 'border-white/20 hover:border-white/30'
                                }`}
                                onClick={() => {
                                    updateChatSettings({ 
                                        provider: provider.id,
                                        model: availableModels[provider.id]?.find((x)=> x.default)?.id || ''
                                    });
                                }}
                            >
                                <div className="flex items-center space-x-3">
                                    <provider.image className="w-8 h-8 text-foreground" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-foreground">{provider.name}</h4>
                                        <p className="text-sm text-foreground/70">{provider.description}</p>
                                    </div>
                                    {chatSettings.provider === provider.id && (
                                        <Check className="w-5 h-5 text-amber-400" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Model Selection */}
            {chatSettings.provider && (
                <ModelSelector
                    selectedProvider={chatSettings.provider}
                    selectedModel={chatSettings.model}
                    onModelChange={(modelId) => updateChatSettings({ model: modelId })}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 mt-6 rounded-lg p-6"
                />
            )}

            {/* Info Card */}
            <div className="bg-amber-400/10 mt-4 border border-amber-400/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium text-foreground">Chat Configuration</h4>
                        <p className="text-xs text-foreground/70 mt-1">
                            Your chat settings determine which AI provider and model will be used for conversations. Make sure you have configured at least one provider with a valid API key.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </SettingsLayout>
}