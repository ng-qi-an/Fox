import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { PenTool, MessageCircle, Sparkles } from 'lucide-react';
import ProviderManager, { type Provider, availableProviders } from '@/components/ProviderManager';
import ModelSelector, { type ModelOption, availableModels } from '@/components/ModelSelector';

interface ConfigState {
  writingTools: {
    enabled: boolean;
    provider: string;
    model: string;
  };
  chat: {
    enabled: boolean;
    provider: string;
    model: string;
  };
  providers: Provider[];
}

export default function Setup() {
  const [config, setConfig] = useState<ConfigState>({
    writingTools: {
      enabled: true,
      provider: '',
      model: ''
    },
    chat: {
      enabled: true,
      provider: '',
      model: ''
    },
    providers: []
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    'Welcome',
    'Providers',
    'Writing Tools',
    'Chat Settings',
    'Complete',
  ];

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newConfig;
    });
  };

  const hasValidProvider = () => {
    return config.providers.some(provider => 
      provider.apiKey && provider.apiKey.trim() !== ''
    );
  };

  const getConfiguredProviders = () => {
    return config.providers.filter(provider => 
      provider.apiKey && provider.apiKey.trim() !== ''
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Providers step
        return hasValidProvider();
      case 2: // Writing Tools step
        return !config.writingTools.enabled || 
               (config.writingTools.provider && config.writingTools.model);
      case 3: // Chat Settings step
        return !config.chat.enabled || 
               (config.chat.provider && config.chat.model);
      case 4: // Complete step
        return hasValidProvider();
      default:
        return true;
    }
  };

  const getDefaultModel = (providerId: string) => {
    const models = availableModels[providerId] || [];
    const defaultModel = models.find(m => m.default);
    return defaultModel ? defaultModel.id : (models[0]?.id || '');
  };

  // Auto-select first provider and default model when providers change
  useEffect(() => {
    const configuredProviders = getConfiguredProviders();
    if (configuredProviders.length > 0) {
      const firstProvider = configuredProviders[0];
      
      // Update writing tools if not set
      if (!config.writingTools.provider && config.writingTools.enabled) {
        const defaultModel = getDefaultModel(firstProvider.id);
        updateConfig('writingTools.provider', firstProvider.id);
        if (defaultModel) {
          updateConfig('writingTools.model', defaultModel);
        }
      }
      
      // Update chat if not set
      if (!config.chat.provider && config.chat.enabled) {
        const defaultModel = getDefaultModel(firstProvider.id);
        updateConfig('chat.provider', firstProvider.id);
        if (defaultModel) {
          updateConfig('chat.model', defaultModel);
        }
      }
    }
  }, [config.providers.length]); // Only depend on the length, not the entire array

  const handleProvidersChange = useCallback((newProviders: Provider[]) => {
    updateConfig('providers', newProviders);
  }, []);

  useEffect(()=>{
    document.getElementById('stepContent')?.scrollTo({ top: 0 });
  }, [currentStep])

  return (
    <div className="h-screen bg-transparent w-screen flex flex-col items-center p-4">
      {/* Progress Bar */}
      <div className="mb-4 w-full max-w-md">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-amber-400 text-black'
                    : 'bg-white/20 text-foreground/50'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStep ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-foreground/70 text-center">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        </div>
      </div>

      {/* Step Content */}
      <div id="stepContent" className="mb-4 h-full overflow-auto w-full max-w-2xl px-2 pt-4">
        {currentStep === 0 && (
          <div className="text-center flex flex-col h-full items-center justify-center">
            <img src={'/icon.png'} className="w-24 h-24 mx-auto mb-4 rounded-md"/>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Waves</h1>
            <p className="text-base text-foreground/80 max-w-sm mx-auto mb-6">
              Your intelligent AI assistant for writing and chat. Let's get you set up quickly.
            </p>
            <div className="flex gap-3 max-w-sm w-full mx-auto">
              <div className="bg-white/10 backdrop-blur-sm p-3 flex-1 flex items-center gap-3 rounded-lg border border-white/20">
                <PenTool className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <h3 className="font-medium text-foreground text-sm">Writing Tools</h3>
                  <p className="text-xs text-foreground/70">AI assistance</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 flex-1 flex items-center gap-3 rounded-lg border border-white/20">
                <MessageCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <h3 className="font-medium text-foreground text-sm">Smart Chat</h3>
                  <p className="text-xs text-foreground/70">Conversations</p>
                </div>
              </div>
            </div>
          </div>
        )}

          {currentStep === 1 && (
            <ProviderManager
              configuredProviders={config.providers}
              onProvidersChange={handleProvidersChange}
              showDeleteButton={true}
            />
          )}        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Writing Tools</h2>
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="writingToolsEnabled"
                  checked={config.writingTools.enabled}
                  onChange={(e) => updateConfig('writingTools.enabled', e.target.checked)}
                  className="h-4 w-4 text-amber-400 focus:ring-amber-400 border-white/20 rounded bg-white/10"
                />
                <label htmlFor="writingToolsEnabled" className="ml-3 text-sm font-medium text-foreground/90">
                  Enable Writing Tools
                </label>
              </div>

              {config.writingTools.enabled && getConfiguredProviders().length > 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground/90 mb-3">
                      Provider
                    </label>
                    <div className="space-y-3">
                      {getConfiguredProviders().map(provider => (
                        <div 
                          key={provider.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            config.writingTools.provider === provider.id 
                              ? 'border-amber-400 bg-amber-400/10' 
                              : 'border-white/20 hover:border-white/30'
                          }`}
                          onClick={() => {
                            updateConfig('writingTools.provider', provider.id);
                            const defaultModel = getDefaultModel(provider.id);
                            if (defaultModel) {
                              updateConfig('writingTools.model', defaultModel);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <provider.image className="w-8 h-8 text-foreground" />
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{provider.name}</h4>
                              <p className="text-sm text-foreground/70">{provider.description}</p>
                            </div>
                            {config.writingTools.provider === provider.id && (
                              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-black" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {config.writingTools.provider && (
                    <ModelSelector
                      selectedProvider={config.writingTools.provider}
                      selectedModel={config.writingTools.model}
                      onModelChange={(modelId) => updateConfig('writingTools.model', modelId)}
                    />
                  )}
                </div>
              )}

              {config.writingTools.enabled && getConfiguredProviders().length === 0 && (
                <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No providers configured</h3>
                  <p className="text-sm text-foreground/70">Please go back and configure at least one provider.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-6">Chat Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="chatEnabled"
                  checked={config.chat.enabled}
                  onChange={(e) => updateConfig('chat.enabled', e.target.checked)}
                  className="h-4 w-4 text-amber-400 focus:ring-amber-400 border-white/20 rounded bg-white/10"
                />
                <label htmlFor="chatEnabled" className="ml-3 text-sm font-medium text-foreground/90">
                  Enable Chat
                </label>
              </div>

              {config.chat.enabled && getConfiguredProviders().length > 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground/90 mb-3">
                      Provider
                    </label>
                    <div className="space-y-3">
                      {getConfiguredProviders().map(provider => (
                        <div 
                          key={provider.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            config.chat.provider === provider.id 
                              ? 'border-amber-400 bg-amber-400/10' 
                              : 'border-white/20 hover:border-white/30'
                          }`}
                          onClick={() => {
                            updateConfig('chat.provider', provider.id);
                            const defaultModel = getDefaultModel(provider.id);
                            if (defaultModel) {
                              updateConfig('chat.model', defaultModel);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <provider.image className="w-8 h-8 text-foreground" />
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{provider.name}</h4>
                              <p className="text-sm text-foreground/70">{provider.description}</p>
                            </div>
                            {config.chat.provider === provider.id && (
                              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-black" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {config.chat.provider && (
                    <ModelSelector
                      selectedProvider={config.chat.provider}
                      selectedModel={config.chat.model}
                      onModelChange={(modelId) => updateConfig('chat.model', modelId)}
                    />
                  )}
                </div>
              )}

              {config.chat.enabled && getConfiguredProviders().length === 0 && (
                <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No providers configured</h3>
                  <p className="text-sm text-foreground/70">Please go back and configure at least one provider.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-400/20 rounded-full flex items-center justify-center border border-amber-400/30">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Setup Complete!</h2>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg max-w-md mx-auto border border-white/20">
              <h3 className="font-semibold text-foreground mb-3">Configuration Summary:</h3>
              <div className="text-sm text-foreground/70 space-y-2">
                <div className="flex justify-between">
                  <span>Providers:</span>
                  <span>{getConfiguredProviders().length} configured</span>
                </div>
                <div className="flex justify-between">
                  <span>Writing Tools:</span>
                  <span>{config.writingTools.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chat:</span>
                  <span>{config.chat.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                {config.writingTools.enabled && (
                  <div className="flex justify-between">
                    <span>Writing Model:</span>
                    <span className="text-xs">{config.writingTools.model || 'Not set'}</span>
                  </div>
                )}
                {config.chat.enabled && (
                  <div className="flex justify-between">
                    <span>Chat Model:</span>
                    <span className="text-xs">{config.chat.model || 'Not set'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between w-full max-w-2xl px-2 pb-2">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0 || isLoading}
          className="px-6 py-3 text-foreground/70 bg-white/10 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/20"
        >
          Back
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceed()}
            className="px-6 py-3 bg-amber-400 text-black rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => {
              setIsLoading(true);
              // Convert providers array to the format expected by saveConfig
              const configToSave = {
                ...config,
                providers: config.providers.reduce((acc, provider) => {
                  acc[provider.id] = { apiKey: provider.apiKey };
                  return acc;
                }, {} as Record<string, { apiKey: string }>)
              };
              window.electronAPI.send("saveConfig", configToSave);
            }}
            disabled={!canProceed() || isLoading}
            className="px-6 py-3 bg-amber-400 text-black rounded-lg hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
