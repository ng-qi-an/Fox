import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import SettingsLayout from "./layout";
import ProviderManager, { availableProviders } from "@/components/ProviderManager";
import type { Provider } from "@/components/ProviderManager";

export default function SettingsPage(){
    const router = useRouter();
    const [providers, setProviders] = useState<Provider[]>([]);

    useEffect(() => {
        loadProviderConfig();
    }, []);

    const loadProviderConfig = async () => {
        try {
            if (window.electronAPI?.send) {
                window.electronAPI.send('getProviderConfig');
                
                window.electronAPI.on('getProviderConfig', (event, data) => {
                    if (data.status === 'OK') {
                        const providerConfigs = data.providers || {};
                        
                        const loadedProviders = availableProviders
                            .filter(provider => providerConfigs && providerConfigs[provider.id])
                            .map(provider => ({
                                ...provider,
                                apiKey: providerConfigs[provider.id].apiKey || ''
                            }));
                        setProviders(loadedProviders);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load provider config:', error);
        }
    };

    const handleProvidersChange = useCallback((newProviders: Provider[]) => {
        setProviders(newProviders);
    }, []);

    return (
        <SettingsLayout>
            <ProviderManager
                configuredProviders={providers}
                onProvidersChange={handleProvidersChange}
                showDeleteButton={true}
            />
        </SettingsLayout>
    );
}