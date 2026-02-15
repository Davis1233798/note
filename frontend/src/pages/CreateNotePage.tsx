import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserDatabase } from '../lib/UserDatabaseContext';
import { createNote, createAttempt } from '../lib/supabase';
import { ArrowLeft, Save, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function CreateNotePage() {
    const navigate = useNavigate();
    const { status, userClient, userId } = useUserDatabase();

    // Note fields
    const [title, setTitle] = useState('');
    const [question, setQuestion] = useState('');
    const [standardAnswer, setStandardAnswer] = useState('');
    const [keyPoints, setKeyPoints] = useState('');

    // First attempt fields
    const [attemptAnswer, setAttemptAnswer] = useState('');
    const [isCorrect, setIsCorrect] = useState(true);
    const [errorContent, setErrorContent] = useState('');

    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (status === 'needs_setup') {
            navigate('/setup');
        }
    }, [status, navigate]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !question.trim() || !userClient || !userId) return;

        // Validate attempt fields if filled (optional? or required?)
        // Let's make attempt answer required as it's "First Attempt"
        if (!attemptAnswer.trim()) {
            alert('請填寫你的第一次回答');
            return;
        }

        setCreating(true);
        try {
            // 1. Create Note
            const newNote = await createNote(
                userClient,
                title.trim(),
                question.trim(),
                standardAnswer.trim(),
                userId,
                keyPoints.trim()
            );

            // 2. Create First Attempt
            if (newNote && newNote.id) {
                await createAttempt(
                    userClient,
                    newNote.id,
                    1, // First attempt
                    attemptAnswer.trim(),
                    isCorrect,
                    undefined, // correction (not using field for now)
                    isCorrect ? undefined : errorContent.trim(), // error content only if incorrect
                    undefined // usecase
                );
            }

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
                        <h1 className="text-2xl font-bold text-white">建立 SQL 筆記</h1>
                        <p className="text-surface-400 text-sm">記錄題目並完成第一次練習</p>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="flex flex-col gap-6">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
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

                        <div>
                            <label htmlFor="keyPoints" className="block text-sm font-medium text-surface-300 mb-2">
                                題目重點 (Key Points)
                            </label>
                            <textarea
                                id="keyPoints"
                                placeholder="例如：使用 JOIN 語法、注意 NULL 判斷..."
                                value={keyPoints}
                                onChange={e => setKeyPoints(e.target.value)}
                                className="input-field font-mono text-sm leading-relaxed"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* First Attempt Section */}
                    <div className="p-5 rounded-xl bg-surface-800/30 border border-surface-700/50 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="badge bg-primary-500/20 text-primary-300 border-primary-500/30">第一次回答</span>
                            <span className="text-xs text-surface-400">建立筆記時同時記錄你的第一次練習成果</span>
                        </div>

                        <div>
                            <label htmlFor="attemptAnswer" className="block text-sm font-medium text-surface-300 mb-2">
                                你的 SQL 寫法 <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                id="attemptAnswer"
                                placeholder="SELECT ... FROM ..."
                                value={attemptAnswer}
                                onChange={e => setAttemptAnswer(e.target.value)}
                                className="input-field font-mono text-sm"
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-surface-300">執行結果</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCorrect(true)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${isCorrect
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                        : 'bg-surface-800/30 border-surface-700/30 text-surface-400 hover:border-surface-600'
                                        }`}
                                >
                                    <CheckCircle2 size={18} /> 答對
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCorrect(false)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${!isCorrect
                                        ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                        : 'bg-surface-800/30 border-surface-700/30 text-surface-400 hover:border-surface-600'
                                        }`}
                                >
                                    <XCircle size={18} /> 答錯
                                </button>
                            </div>
                        </div>

                        {!isCorrect && (
                            <div className="animate-fade-in pt-2">
                                <label htmlFor="errorContent" className="block text-sm font-medium text-red-300 mb-2">
                                    錯誤內容 / Error Message
                                </label>
                                <textarea
                                    id="errorContent"
                                    placeholder="請貼上錯誤訊息或描述錯誤原因..."
                                    value={errorContent}
                                    onChange={e => setErrorContent(e.target.value)}
                                    className="input-field border-red-500/30 focus:border-red-500/60"
                                    rows={3}
                                />
                            </div>
                        )}
                    </div>

                    {/* Standard Answer Section (Moved to Bottom) */}
                    <div className="pt-2">
                        <label htmlFor="standardAnswer" className="block text-sm font-medium text-surface-300 mb-2">
                            SQL 標準答案 <span className="text-surface-500 text-xs font-normal">(選填，供日後參考)</span>
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

                    {/* Action Buttons */}
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
                            {creating ? '建立中...' : '建立筆記與記錄'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
