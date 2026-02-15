import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { getUserSettings, getUserSupabaseClient, type UserSettings } from './supabase';

type DatabaseStatus = 'loading' | 'needs_setup' | 'connected' | 'error';

interface UserDatabaseContextType {
    status: DatabaseStatus;
    userClient: SupabaseClient | null;
    settings: UserSettings | null;
    error: string | null;
    userId: string | null;
    refreshSettings: () => Promise<void>;
}

const UserDatabaseContext = createContext<UserDatabaseContextType>({
    status: 'loading',
    userClient: null,
    settings: null,
    error: null,
    userId: null,
    refreshSettings: async () => { },
});

export function useUserDatabase() {
    return useContext(UserDatabaseContext);
}

export function UserDatabaseProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [status, setStatus] = useState<DatabaseStatus>('loading');
    const [userClient, setUserClient] = useState<SupabaseClient | null>(null);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = async () => {
        if (!user) {
            setStatus('loading');
            setUserClient(null);
            setSettings(null);
            return;
        }

        try {
            setStatus('loading');
            setError(null);
            const userSettings = await getUserSettings();

            if (!userSettings) {
                setStatus('needs_setup');
                return;
            }

            setSettings(userSettings);
            const client = getUserSupabaseClient(
                userSettings.supabase_url,
                userSettings.supabase_anon_key
            );
            setUserClient(client);
            setStatus('connected');
        } catch (err: any) {
            console.error('Failed to load user settings:', err);
            setError(err.message || '載入設定失敗');
            setStatus('error');
        }
    };

    useEffect(() => {
        loadSettings();
    }, [user]);

    return (
        <UserDatabaseContext.Provider
            value={{
                status,
                userClient,
                settings,
                error,
                userId: user?.id || null,
                refreshSettings: loadSettings,
            }}
        >
            {children}
        </UserDatabaseContext.Provider>
    );
}
