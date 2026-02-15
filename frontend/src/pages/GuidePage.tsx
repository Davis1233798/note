import { useState } from 'react';
import { Link } from 'react-router-dom';
import { USER_DATABASE_SQL } from '../lib/supabase';
import { Database, Copy, CheckCircle2, ExternalLink, ArrowRight, BookOpen, Settings } from 'lucide-react';

export default function GuidePage() {
    const [copied, setCopied] = useState(false);

    const copySQL = () => {
        navigator.clipboard.writeText(USER_DATABASE_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-6 lg:px-10 py-12 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl shadow-primary-500/25 mb-5">
                    <BookOpen size={28} className="text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent mb-3">
                    安裝與設定教學
                </h1>
                <p className="text-surface-400 text-lg max-w-2xl mx-auto">
                    跟著以下步驟，在 5 分鐘內建立屬於你的免費雲端資料庫。
                </p>
            </div>

            <div className="space-y-12">
                {/* Step 1 */}
                <section className="relative pl-8 border-l-2 border-surface-700/50">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-surface-900 border-2 border-primary-500 flex items-center justify-center text-primary-400 font-bold">1</div>
                    <h2 className="text-2xl font-bold text-white mb-4">建立 Supabase 專案</h2>
                    <div className="glass-card p-6">
                        <ol className="list-decimal list-inside space-y-3 text-surface-300">
                            <li>前往 <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">supabase.com <ExternalLink size={14} /></a> 並註冊帳號。</li>
                            <li>點擊 <strong>"New Project"</strong> 按鈕。</li>
                            <li>填寫專案名稱（例如：<code>SQL Note</code>）與資料庫密碼。</li>
                            <li>選擇離你最近的 Region（例如：<code>Tokyo</code> 或 <code>Singapore</code>）。</li>
                            <li>點擊 <strong>"Create new project"</strong> 並等待幾分鐘直到專案建立完成。</li>
                        </ol>
                    </div>
                </section>

                {/* Step 2 */}
                <section className="relative pl-8 border-l-2 border-surface-700/50">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-surface-900 border-2 border-primary-500 flex items-center justify-center text-primary-400 font-bold">2</div>
                    <h2 className="text-2xl font-bold text-white mb-4">取得連線資訊</h2>
                    <div className="glass-card p-6">
                        <p className="text-surface-400 mb-4">你需要這兩項資訊來連結此 App：</p>
                        <ul className="space-y-3 text-surface-300 mb-4">
                            <li className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded bg-surface-800 text-xs text-surface-400 font-mono">URL</span>
                                <span>Project URL</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded bg-surface-800 text-xs text-surface-400 font-mono">KEY</span>
                                <span>anon public key</span>
                            </li>
                        </ul>
                        <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-700/30 text-sm text-surface-400">
                            位置：Dashboard 左下角 <Settings size={14} className="inline mx-1" /> <strong>Project Settings</strong> &gt; <strong>API</strong>
                        </div>
                    </div>
                </section>

                {/* Step 3 */}
                <section className="relative pl-8 border-l-2 border-surface-700/50">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-surface-900 border-2 border-primary-500 flex items-center justify-center text-primary-400 font-bold">3</div>
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-2xl font-bold text-white">建立資料表</h2>
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">重要步驟</span>
                    </div>

                    <div className="glass-card p-6">
                        <p className="text-surface-400 mb-4">
                            前往 Dashboard 左側的 <strong className="text-white"><Database size={14} className="inline mx-1" /> SQL Editor</strong>，點擊 <strong>New Query</strong>，貼上並執行以下程式碼：
                        </p>

                        <div className="relative mb-4">
                            <pre className="p-4 rounded-xl bg-surface-950/80 border border-surface-700/30 text-sm text-surface-300 overflow-x-auto max-h-80 font-mono leading-relaxed custom-scrollbar">
                                {USER_DATABASE_SQL}
                            </pre>
                            <button
                                onClick={copySQL}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-surface-800/80 hover:bg-surface-700 text-surface-400 hover:text-white transition-all backdrop-blur-sm"
                                title="複製 SQL"
                            >
                                {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                        <p className="text-sm text-surface-500">
                            執行成功後，應該會看到 "Success" 或 "No rows returned" 的訊息。
                        </p>
                    </div>
                </section>

                {/* Step 4 */}
                <section className="relative pl-8 border-l-2 border-transparent">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-surface-900 border-2 border-primary-500 flex items-center justify-center text-primary-400 font-bold">4</div>
                    <h2 className="text-2xl font-bold text-white mb-4">完成連結</h2>
                    <div className="glass-card p-8 text-center">
                        <p className="text-surface-300 mb-6">
                            萬事俱備！現在將剛才取得的 URL 和 Key 填入設定頁面即可。
                        </p>
                        <Link to="/setup" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg">
                            前往設定頁面 <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
