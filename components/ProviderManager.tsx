import { Plus, Eye, EyeOff, ExternalLink, Check, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiGooglegemini, SiOpenai } from "@icons-pack/react-simple-icons";

export interface Provider {
  id: string;
  name: string;
  description: string;
  image: any;
  apiKeyLabel: string;
  docUrl: string;
  enabled: boolean;
  apiKey: string;
}

export const availableProviders: Provider[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Google\'s advanced AI models for chat and writing assistance',
    image: SiGooglegemini,
    apiKeyLabel: 'Google API Key',
    docUrl: 'https://makersuite.google.com/app/apikey',
    enabled: true,
    apiKey: ''
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for powerful language understanding and generation',
    image: SiOpenai,
    apiKeyLabel: 'OpenAI API Key',
    docUrl: 'https://platform.openai.com/api-keys',
    enabled: true,
    apiKey: ''
  }
];

interface ProviderManagerProps {
  configuredProviders: Provider[];
  onProvidersChange: (providers: Provider[]) => void;
  showDeleteButton?: boolean;
  className?: string;
}

export default function ProviderManager({ 
  configuredProviders, 
  onProvidersChange,
  showDeleteButton = true,
  className = ""
}: ProviderManagerProps) {
  const [providers, setProviders] = useState<Provider[]>(configuredProviders);
  const [showModal, setShowModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error' | 'invalid_key'>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  
  const mounted = useRef(true);
  const previousProvidersRef = useRef<Provider[]>(configuredProviders);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setProviders(configuredProviders);
    previousProvidersRef.current = configuredProviders;
  }, [configuredProviders]);

  // Memoized callback to prevent recreation on every render
  const notifyProvidersChange = useCallback((newProviders: Provider[]) => {
    if (mounted.current && onProvidersChange) {
      // Only notify if providers actually changed
      const providersChanged = JSON.stringify(newProviders) !== JSON.stringify(previousProvidersRef.current);
      if (providersChanged) {
        previousProvidersRef.current = newProviders;
        onProvidersChange(newProviders);
      }
    }
  }, [onProvidersChange]);

  // Notify parent of changes
  useEffect(() => {
    notifyProvidersChange(providers);
  }, [providers, notifyProvidersChange]);

  // Listen for API key validation responses
  useEffect(() => {
    const handleSaveProviderConfig = (event: any, data: any) => {
      if (!mounted.current) return;
      
      if (data.status === 'OK') {
        setEditingProvider(null);
        setProviders(prev => prev.map(p => 
          p.id === data.providerId ? { ...p, ...data.config } : p
        ));
        setSaveStatus(prev => ({ ...prev, [data.providerId]: 'saved' }));
        setTestingProvider(null);
        setTimeout(() => {
          if (mounted.current) {
            setSaveStatus(prev => ({ ...prev, [data.providerId]: 'idle' }));
          }
        }, 2000);
      } else if (data.status === "INVALID_KEY") {
        setSaveStatus(prev => ({ ...prev, [data.providerId]: 'invalid_key' }));
        setTestingProvider(null);
      } else {
        setSaveStatus(prev => ({ ...prev, [data.providerId]: 'error' }));
        setTestingProvider(null);
      }
    };

    if (window.electronAPI?.on) {
      window.electronAPI.on("saveProviderConfig", handleSaveProviderConfig);
    }

    return () => {
        window.electronAPI.removeAllListeners("saveProviderConfig");
    };
  }, []);

  const saveProviderConfig = async (providerId: string, config: Partial<Provider>) => {
    console.log(`Saving config for provider ${providerId}:`, config);
    setSaveStatus(prev => ({ ...prev, [providerId]: 'saving' }));
    setTestingProvider(providerId);
    
    try {
      if (window.electronAPI?.send && config.apiKey !== undefined) {
        window.electronAPI.send('saveProviderConfig', { 
          providerId, 
          config: { apiKey: config.apiKey } 
        });
      }
    } catch (error) {
      console.error('Failed to save provider config:', error);
      setSaveStatus(prev => ({ ...prev, [providerId]: 'error' }));
      setTestingProvider(null);
    }
  };

  const getAvailableProviders = (): Provider[] => {
    const addedProviderIds = providers.map(p => p.id);
    return availableProviders.filter((p: Provider) => !addedProviderIds.includes(p.id));
  };

  const isProviderReady = (provider: Provider) => {
    return provider.apiKey && saveStatus[provider.id] !== 'invalid_key';
  };

  const hasAnyReadyProvider = () => {
    return providers.some(provider => isProviderReady(provider));
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">AI Providers</h2>
            <p className="text-sm text-foreground/70">Configure your AI provider API keys</p>
          </div>
          {getAvailableProviders().length > 0 && (
            <Button onClick={() => setShowModal(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Provider
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex gap-2 items-center">
                    <provider.image className="w-6 h-6 text-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">{provider.name}</h3>
                  </div>
                  <p className="text-sm text-foreground/70 mt-1">{provider.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {saveStatus[provider.id] === 'saved' ? 
                    <div className="flex items-center text-green-400 text-sm">
                      <Check className="w-4 h-4 mr-1" />
                      Saved
                    </div>
                  : saveStatus[provider.id] === 'error' &&
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Error
                    </div>
                  }
                  {showDeleteButton && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(provider.id)}
                      className="text-foreground/50 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-2">
                    {provider.apiKeyLabel}
                  </label>
                  
                  {editingProvider === provider.id ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          type={showApiKey[provider.id] ? 'text' : 'password'}
                          value={tempApiKey}
                          onChange={(e) => setTempApiKey(e.target.value)}
                          placeholder={`Enter your ${provider.apiKeyLabel.toLowerCase()}`}
                          className="pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowApiKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground h-6 w-6"
                        >
                          {showApiKey[provider.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          onClick={async () => {
                            await saveProviderConfig(provider.id, { apiKey: tempApiKey });
                            setTempApiKey('');
                          }}
                          disabled={saveStatus[provider.id] === 'saving' || !tempApiKey.trim()}
                        >
                          {saveStatus[provider.id] === 'saving' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            'Test & Save'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingProvider(null);
                            setTempApiKey('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      {saveStatus[provider.id] === 'invalid_key' && (
                        <p className="text-sm text-red-400">
                          Invalid API key. Please check your key and try again.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 relative">
                        <Input
                          type={showApiKey[provider.id] ? 'text' : 'password'}
                          value={provider.apiKey}
                          readOnly
                          placeholder={provider.apiKey ? '' : 'Not configured'}
                          className="font-mono text-sm pr-12 cursor-default bg-white/5 border-white/10"
                        />
                        {provider.apiKey && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowApiKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground h-6 w-6"
                          >
                            {showApiKey[provider.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const foundProvider = providers.find(p => p.id === provider.id);
                          if (foundProvider) {
                            setTempApiKey(foundProvider.apiKey);
                            setEditingProvider(provider.id);
                          }
                        }}
                      >
                        {provider.apiKey ? 'Edit' : 'Add'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <Button
                    variant="link"
                    asChild
                    className="h-auto p-0"
                  >
                    <a
                      href={provider.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm"
                    >
                      Get API Key
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      testingProvider === provider.id ? 
                        "bg-amber-400 animate-pulse"
                      : saveStatus[provider.id] === "invalid_key" ? 
                        "bg-red-400"
                      : isProviderReady(provider)
                        ? 'bg-green-400' 
                        : 'bg-amber-400'
                    }`} />
                    <span className="text-xs text-foreground/60">
                      {testingProvider === provider.id ? 
                        "Testing..."
                      : saveStatus[provider.id] === "invalid_key" ? 
                        "Invalid API Key"
                      : isProviderReady(provider)
                        ? 'Ready' 
                        : 'API key required'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {providers.length === 0 && (
            <div className="text-center py-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No providers added</h3>
              <p className="text-sm text-foreground/70 mb-4">Add an AI provider to get started</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Provider
              </Button>
            </div>
          )}
        </div>

        {providers.length > 0 && !hasAnyReadyProvider() && (
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-foreground">Setup Required</h4>
                <p className="text-xs text-foreground/70 mt-1">
                  Please configure at least one provider with a valid API key to continue.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle>Add Provider</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {getAvailableProviders().map((provider: Provider) => (
              <div
                key={provider.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => {
                  const newProvider = { ...provider };
                  setProviders(prev => {
                    const newProviders = [...prev, newProvider];
                    return newProviders;
                  });
                  setShowModal(false);
                  // Automatically start editing the API key for the new provider
                  setTimeout(() => {
                    if (mounted.current) {
                      setTempApiKey(newProvider.apiKey);
                      setEditingProvider(newProvider.id);
                    }
                  }, 100);
                }}
              >
                <div className="flex items-center space-x-3">
                  <provider.image className="min-w-8 min-h-8 text-foreground" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{provider.name}</h3>
                    <p className="text-sm text-foreground/70">{provider.description}</p>
                  </div>
                  <Plus className="w-5 h-5 text-foreground/50" />
                </div>
              </div>
            ))}
            
            {getAvailableProviders().length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">All providers added!</h3>
                <p className="text-sm text-foreground/70">You've added all available providers to your configuration.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="w-full max-w-md">
          <div className="text-center">
            <DialogHeader className="mb-6">
              <DialogTitle>Remove Provider</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{' '}
                <span className="font-semibold text-foreground">
                  {providers.find(p => p.id === confirmDelete)?.name}
                </span>
                ? This will delete the provider and its API key from your configuration.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  const updatedProviders = providers.filter(p => p.id !== confirmDelete);
                  setProviders(updatedProviders);
                  setConfirmDelete(null);
                  // Also remove from electron store
                  if (window.electronAPI?.send) {
                    window.electronAPI.send('removeProviderConfig', confirmDelete);
                  }
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
