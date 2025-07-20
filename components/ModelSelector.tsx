import { Check } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  tags: string[];
  default?: boolean;
}

// Available models by provider
export const availableModels: Record<string, ModelOption[]> = {
  google: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable model for complex discussions with reasoning', tags: ["Smartest", "Reasoning-only"] },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Well-rounded and capable for most discussions', default: true, tags: ["Reasoning"] },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and efficient for simple tasks', tags: [] },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-lite', description: 'Balanced speed and capability', tags: ["Fastest", "Cost-effective"] }
  ],
  openai: [
    { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Flagship GPT model for complex discussions and problem-solving', tags: ["Smartest"] },
    { id: 'o3', name: 'o3', description: 'Latest reasoning model for complex discussions', tags: ["Reasoning-only"] },
    { id: 'o4-mini', name: 'o4-mini', description: 'Cost-effective reasoning model with high-speed', tags: ["Reasoning-only"] },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Fast and efficient for most conversations', default: true, tags: ["Fastest", "Cost-effective"] },
  ]
};

interface ModelSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

export default function ModelSelector({ 
  selectedProvider, 
  selectedModel, 
  onModelChange, 
  className = ""
}: ModelSelectorProps) {
  const selectedProviderModels = selectedProvider ? availableModels[selectedProvider] || [] : [];

  if (!selectedProvider || selectedProviderModels.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Model Selection</h3>
      <div className="space-y-3">
        {selectedProviderModels.map((model: ModelOption) => (
          <div 
            key={model.id}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedModel === model.id 
                ? 'border-amber-400 bg-amber-400/10' 
                : 'border-white/20 hover:border-white/30'
            }`}
            onClick={() => onModelChange(model.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{model.name}</h4>
                  {model.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-amber-400/20 text-amber-400 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-foreground/70">{model.description}</p>
              </div>
              {selectedModel === model.id && (
                <Check className="w-5 h-5 text-amber-400 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
