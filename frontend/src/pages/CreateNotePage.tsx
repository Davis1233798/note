import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserDatabase } from '../lib/UserDatabaseContext';
import { createNote } from '../lib/supabase';
import { ArrowLeft, Save, HelpCircle } from 'lucide-react';

export default function CreateNotePage() {
    const navigate = useNavigate();
    const { status, userClient, userId } = useUserDatabase();

    // Form state
    const [title, setTitle] = useState('');
    const [question, setQuestion] = useState('');
    const [standardAnswer, setStandardAnswer] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (status === 'needs_setup') {
            navigate('/setup');
        }
    }, [status, navigate]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !question.trim() || !userClient || !userId) return;

        setCreating(true);
        try {
            await createNote(
                userClient,
                title.trim(),
                question.trim(),
                standardAnswer.trim(),
                userId
            );
            navigate('/');
        } catch (err) {
            console.error('Failed to create note:', err);
            alert('建立失敗，請稍後再試。');
        } finally {
            setCreating(false);
        }
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center text-surface-400">載入中...</div>;
    }

    return (
        <div className="w-full px-6 lg:px-10 py-8 animate-fade-in">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-surface-400 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                返回總表
            </button>

            <div className="glass-card p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6 border-b border-surface-700/30 pb-4">
                    <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
                        <HelpCircle size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">建立 SQL 題目</h1>
                        <p className="text-surface-400 text-sm">設定題目內容與標準答案，供日後練習使用</p>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="flex flex-col gap-6">
                    {/* 標題欄位 */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-surface-300 mb-2">
                            題目標題 <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            placeholder="例如：基礎 SELECT 查詢練習"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="input-field text-lg"
                            required
                        />
                    </div>

                    {/* 題目內容 */}
                    <div>
                        <label htmlFor="question" className="block text-sm font-medium text-surface-300 mb-2">
                            題目描述 (SQL 題目內容) <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            id="question"
                            placeholder="請在此輸入詳細的題目說明..."
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            className="input-field font-mono text-sm leading-relaxed"
                            rows={6}
                            required
                        />
                    </div>

                    {/* 標準答案 */}
                    <div>
                        <label htmlFor="standardAnswer" className="block text-sm font-medium text-surface-300 mb-2">
                            SQL 標準答案 <span className="text-surface-500 text-xs font-normal">(選填，供參考與檢討使用)</span>
                        </label>
                        <textarea
                            id="standardAnswer"
                            placeholder="SELECT * FROM table WHERE..."
                            value={standardAnswer}
                            onChange={e => setStandardAnswer(e.target.value)}
                            className="input-field font-mono text-sm text-emerald-400/90 bg-surface-900/50 border-emerald-500/20 focus:border-emerald-500/50"
                            rows={4}
                        />
                    </div>

                    {/* 按鈕區 */}
                    <div className="flex gap-4 pt-4 border-t border-surface-700/30 mt-2">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="btn-secondary flex-1 justify-center"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="btn-primary flex-1 justify-center"
                        >
                            <Save size={18} />
                            {creating ? '建立中...' : '建立題目'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
