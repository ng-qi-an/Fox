import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PenTool, MessageCircle, Sparkles } from 'lucide-react';

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
  providers: {
    google: {
      apiKey: string;
    };
  };
}

export default function Setup() {
  const [config, setConfig] = useState<ConfigState>({
    writingTools: {
      enabled: true,
      provider: 'google',
      model: 'gemini-2.5-flash',
    },
    chat: {
      enabled: true,
      provider: 'google',
      model: 'gemini-2.5-flash',
    },
    providers: {
      google: {
        apiKey: '',
      },
    },
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);


  const providerOptions = [
    { value: 'google', label: 'Google Gemini' },
  ];

  const modelOptions = {
    google: [
      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    ],
  };

  const steps = [
    'Welcome',
    'API Key',
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.providers.google.apiKey.trim() !== '';
      case 4:
        return config.providers.google.apiKey.trim() !== '';
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      <div className="max-w-2xl w-full p-4 px-6 pb-2">
        {/* Progress Bar */}
        <div className="mb-8">
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
        <div className="mb-8 min-h-[300px]">
          {currentStep ==  0 ?
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to Fox</h1>
              <p className="text-base text-foreground/80 max-w-sm mx-auto mb-6">
                Your intelligent AI assistant for writing and chat. Let's get you set up quickly.
              </p>
              <div className="flex gap-3 max-w-sm mx-auto">
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
          : currentStep == 1 ?
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">API Configuration</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-2">
                    Google API Key
                  </label>
                  <input
                    type="password"
                    value={config.providers.google.apiKey}
                    onChange={(e) => updateConfig('providers.google.apiKey', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-foreground placeholder-foreground/50 backdrop-blur-sm"
                    placeholder="Enter your Google API key"
                  />
                  <p className="text-sm text-foreground/70 mt-2">
                    You can get your API key from the{' '}
                    <a 
                      href="https://makersuite.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>
              </div>
            </div>
            : currentStep == 2 ?
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Writing Tools</h2>
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

                {config.writingTools.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground/90 mb-2">
                        Provider
                      </label>
                      <select
                        value={config.writingTools.provider}
                        onChange={(e) => updateConfig('writingTools.provider', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-foreground backdrop-blur-sm"
                      >
                        {providerOptions.map(option => (
                          <option key={option.value} value={option.value} className="bg-black text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/90 mb-2">
                        Model
                      </label>
                      <select
                        value={config.writingTools.model}
                        onChange={(e) => updateConfig('writingTools.model', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-foreground backdrop-blur-sm"
                      >
                        {modelOptions[config.writingTools.provider as keyof typeof modelOptions]?.map(option => (
                          <option key={option.value} value={option.value} className="bg-black text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          : currentStep == 3 ?
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Chat Settings</h2>
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

                {config.chat.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground/90 mb-2">
                        Provider
                      </label>
                      <select
                        value={config.chat.provider}
                        onChange={(e) => updateConfig('chat.provider', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-foreground backdrop-blur-sm"
                      >
                        {providerOptions.map(option => (
                          <option key={option.value} value={option.value} className="bg-black text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground/90 mb-2">
                        Model
                      </label>
                      <select
                        value={config.chat.model}
                        onChange={(e) => updateConfig('chat.model', e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-foreground backdrop-blur-sm"
                      >
                        {modelOptions[config.chat.provider as keyof typeof modelOptions]?.map(option => (
                          <option key={option.value} value={option.value} className="bg-black text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          : currentStep == 4 &&
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-amber-400/20 rounded-full flex items-center justify-center border border-amber-400/30">
                <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Setup Complete!</h2>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg max-w-md mx-auto border border-white/20">
                <h3 className="font-semibold text-foreground mb-2">Configuration Summary:</h3>
                <div className="text-sm text-foreground/70 space-y-1">
                  <div>Writing Tools: {config.writingTools.enabled ? 'Enabled' : 'Disabled'}</div>
                  <div>Chat: {config.chat.enabled ? 'Enabled' : 'Disabled'}</div>
                  <div>API Key: {config.providers.google.apiKey ? 'Configured' : 'Not set'}</div>
                </div>
              </div>
            </div>
        }
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
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
              onClick={()=>{
                setIsLoading(true);
                window.electronAPI.send("saveConfig", config);
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
    </div>
  );
}
