import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserDatabase } from '../lib/UserDatabaseContext';
import { saveUserSettings, testConnection, initUserDatabase, getUserSupabaseClient, USER_DATABASE_SQL } from '../lib/supabase';
import { Settings, CheckCircle2, XCircle, Loader2, Database, Copy, ExternalLink, ArrowRight } from 'lucide-react';

type SetupStep = 'input' | 'testing' | 'create_tables' | 'done';

export default function SetupPage() {
    const navigate = useNavigate();
    const { settings, refreshSettings } = useUserDatabase();

    const [url, setUrl] = useState(settings?.supabase_url || '');
    const [anonKey, setAnonKey] = useState(settings?.supabase_anon_key || '');
    const [step, setStep] = useState<SetupStep>('input');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleTest = async () => {
        if (!url.trim() || !anonKey.trim()) {
            setError('請填入 Supabase URL 和 Anon Key');
            return;
        }

        // 確保 URL 格式正確
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = `https://${cleanUrl}`;
        }
        if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }

        setLoading(true);
        setError('');
        setStep('testing');

        try {
            const result = await testConnection(cleanUrl, anonKey.trim());
            if (!result.ok) {
                setError(`連線失敗：${result.error}`);
                setStep('input');
                setLoading(false);
                return;
            }

            // 檢查資料表是否存在
            const client = getUserSupabaseClient(cleanUrl, anonKey.trim());
            const initResult = await initUserDatabase(client);

            if (!initResult.ok && initResult.error === 'NEED_CREATE_TABLES') {
                setStep('create_tables');
                setUrl(cleanUrl);
                setLoading(false);
                return;
            }

            if (!initResult.ok) {
                setError(`資料庫檢查失敗：${initResult.error}`);
                setStep('input');
                setLoading(false);
                return;
            }

            // 連線成功且表存在，儲存設定
            await saveUserSettings(cleanUrl, anonKey.trim());
            await refreshSettings();
            setStep('done');
        } catch (err: any) {
            setError(err.message || '設定失敗');
            setStep('input');
        } finally {
            setLoading(false);
        }
    };

    const handleTablesCreated = async () => {
        setLoading(true);
        setError('');

        try {
            const client = getUserSupabaseClient(url, anonKey.trim());
            const result = await initUserDatabase(client);

            if (!result.ok) {
                setError('資料表尚未建立，請確認已在 Supabase SQL Editor 中執行上方的 SQL 腳本。');
                setLoading(false);
                return;
            }

            await saveUserSettings(url, anonKey.trim());
            await refreshSettings();
            setStep('done');
        } catch (err: any) {
            setError(err.message || '驗證失敗');
        } finally {
            setLoading(false);
        }
    };

    const copySQL = () => {
        navigator.clipboard.writeText(USER_DATABASE_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (step === 'done') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="glass-card p-10 text-center max-w-md animate-slide-up">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 size={32} className="text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">設定完成！</h2>
                    <p className="text-surface-400 mb-6">
                        你的 Supabase 資料庫已連接成功，現在可以開始使用筆記功能了。
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-primary justify-center w-full py-3 text-base"
                    >
                        開始使用 <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl shadow-primary-500/25 mb-5">
                        <Settings size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent mb-2">
                        設定你的資料庫
                    </h1>
                    <p className="text-surface-400 text-sm max-w-md mx-auto">
                        每位使用者需要自己的 Supabase 專案來存放筆記資料。<br />
                        免費方案即可使用，無需信用卡。
                    </p>
                </div>

                {step === 'create_tables' ? (
                    /* Step: Create Tables */
                    <div className="glass-card p-8">
                        <div className="flex items-center gap-3 mb-5">
                            <Database size={20} className="text-amber-400" />
                            <h2 className="text-xl font-bold text-white">建立資料表</h2>
                        </div>
                        <p className="text-surface-400 text-sm mb-4">
                            連線成功！但資料表尚未建立。請在你的 Supabase 專案中執行以下 SQL：
                        </p>

                        <div className="relative">
                            <pre className="p-4 rounded-xl bg-surface-950/80 border border-surface-700/30 text-sm text-surface-300 overflow-x-auto max-h-64 font-mono leading-relaxed">
                                {USER_DATABASE_SQL}
                            </pre>
                            <button
                                onClick={copySQL}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-400 hover:text-white transition-all"
                                title="複製 SQL"
                            >
                                {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm text-primary-300">
                            <p className="font-medium mb-1">📌 如何執行：</p>
                            <ol className="list-decimal list-inside space-y-1 text-surface-400">
                                <li>到你的 Supabase Dashboard</li>
                                <li>點選左側的 <strong className="text-primary-300">SQL Editor</strong></li>
                                <li>貼上以上 SQL 並點 <strong className="text-primary-300">Run</strong></li>
                            </ol>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end mt-6">
                            <button onClick={() => { setStep('input'); setError(''); }} className="btn-secondary">
                                返回修改
                            </button>
                            <button
                                onClick={handleTablesCreated}
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /> 驗證中...</>
                                ) : (
                                    <>我已執行 SQL <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Step: Input Credentials */
                    <div className="glass-card p-8">
                        {/* Tutorial section */}
                        <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-700/30 mb-6">
                            <h3 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
                                <Database size={14} className="text-primary-400" />
                                如何建立免費 Supabase 專案？
                            </h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-surface-400">
                                <li>
                                    到 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">
                                        supabase.com <ExternalLink size={12} />
                                    </a> 註冊免費帳號
                                </li>
                                <li>建立新的專案（Project）</li>
                                <li>到 <strong className="text-surface-200">Project Settings → API</strong></li>
                                <li>複製 <strong className="text-surface-200">Project URL</strong> 和 <strong className="text-surface-200">anon public key</strong></li>
                            </ol>
                        </div>

                        {/* Input fields */}
                        <div className="flex flex-col gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                                    Supabase URL
                                </label>
                                <input
                                    id="supabase-url-input"
                                    type="url"
                                    placeholder="https://abcdefg.supabase.co"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    className="input-field"
                                    style={{ paddingLeft: '1rem' }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                                    Anon Public Key
                                </label>
                                <input
                                    id="supabase-key-input"
                                    type="password"
                                    placeholder="eyJhbGciOiJIUzI1NiIs..."
                                    value={anonKey}
                                    onChange={e => setAnonKey(e.target.value)}
                                    className="input-field"
                                    style={{ paddingLeft: '1rem' }}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                                <XCircle size={16} className="shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleTest}
                            disabled={loading || !url.trim() || !anonKey.trim()}
                            className="btn-primary w-full justify-center py-3 text-base"
                            id="test-connection-btn"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> 連線測試中...</>
                            ) : (
                                <>連線測試並儲存 <ArrowRight size={18} /></>
                            )}
                        </button>

                        {settings && (
                            <p className="text-center text-xs text-surface-500 mt-4">
                                目前已有設定，重新填寫會覆蓋舊的設定。
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
