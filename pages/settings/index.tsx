import { Cog, Home, Minus, Settings, Settings2, X } from "lucide-react";
import { useRouter } from "next/router";
import SettingsLayout from "./layout";

export default function SettingsPage(){
    const router = useRouter()
    return <SettingsLayout>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage the application settings</p>
        <p>None yet 😛</p>
    </SettingsLayout>
}