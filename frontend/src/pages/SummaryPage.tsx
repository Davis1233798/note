import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserDatabase } from '../lib/UserDatabaseContext';
import { fetchNotesWithAttempts, createNote, deleteNote, type Note, type Attempt } from '../lib/supabase';
import { Plus, FileText, ExternalLink, Trash2, Search, AlertTriangle, CheckCircle2, XCircle, Settings } from 'lucide-react';

export default function SummaryPage() {
    const navigate = useNavigate();
    const { status, userClient, userId } = useUserDatabase();
    const [notes, setNotes] = useState<(Note & { attempts: Attempt[] })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showNewNote, setShowNewNote] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newQuestion, setNewQuestion] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (status === 'needs_setup') {
            navigate('/setup');
        }
    }, [status, navigate]);

    useEffect(() => {
        if (status === 'connected' && userClient) {
            loadNotes();
        }
    }, [status, userClient]);

    const loadNotes = async () => {
        if (!userClient) return;
        try {
            const data = await fetchNotesWithAttempts(userClient);
            setNotes(data);
        } catch (err) {
            console.error('Failed to load notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newQuestion.trim() || !userClient || !userId) return;
        setCreating(true);
        try {
            await createNote(userClient, newTitle.trim(), newQuestion.trim(), userId);
            setNewTitle('');
            setNewQuestion('');
            setShowNewNote(false);
            await loadNotes();
        } catch (err) {
            console.error('Failed to create note:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!userClient) return;
        if (!confirm('確定要刪除這個筆記嗎？所有答題記錄也會一併刪除。')) return;
        try {
            await deleteNote(userClient, id);
            setNotes(notes.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    // 等待資料庫連線
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-surface-400 text-sm">連線資料庫中...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="glass-card p-8 text-center max-w-md animate-fade-in">
                    <XCircle size={40} className="mx-auto text-red-400 mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">連線失敗</h3>
                    <p className="text-surface-400 text-sm mb-4">無法連接到你的 Supabase 資料庫。</p>
                    <button onClick={() => navigate('/setup')} className="btn-primary">
                        <Settings size={16} /> 重新設定
                    </button>
                </div>
            </div>
        );
    }

    const filteredNotes = notes.filter(
        n => n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.question.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-surface-400 text-sm">載入筆記中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-screen-2xl mx-auto px-6 lg:px-10 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">📋 筆記總表</h1>
                    <p className="text-surface-400 text-sm">
                        共 {notes.length} 份筆記，{notes.reduce((sum, n) => sum + n.attempts.filter(a => !a.is_correct).length, 0)} 個待訂正
                    </p>
                </div>
                <button
                    onClick={() => setShowNewNote(!showNewNote)}
                    className="btn-primary"
                    id="new-note-btn"
                >
                    <Plus size={18} />
                    新增筆記
                </button>
            </div>

            {/* New Note Form */}
            {showNewNote && (
                <div className="glass-card p-6 mb-6 animate-slide-up">
                    <h3 className="text-lg font-semibold text-white mb-4">建立新筆記</h3>
                    <form onSubmit={handleCreate} className="flex flex-col gap-4">
                        <input
                            id="note-title-input"
                            type="text"
                            placeholder="筆記標題"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="input-field"
                            required
                        />
                        <textarea
                            id="note-question-input"
                            placeholder="題目內容"
                            value={newQuestion}
                            onChange={e => setNewQuestion(e.target.value)}
                            className="input-field"
                            required
                        />
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setShowNewNote(false)} className="btn-secondary">
                                取消
                            </button>
                            <button type="submit" disabled={creating} className="btn-primary" id="create-note-btn">
                                {creating ? '建立中...' : '建立筆記'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
                <input
                    id="search-input"
                    type="text"
                    placeholder="搜尋筆記..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-field pl-10"
                />
            </div>

            {/* Notes Table */}
            {filteredNotes.length === 0 ? (
                <div className="glass-card p-12 text-center animate-fade-in">
                    <FileText size={48} className="mx-auto text-surface-600 mb-4" />
                    <h3 className="text-lg font-semibold text-surface-300 mb-2">
                        {notes.length === 0 ? '還沒有筆記' : '找不到符合的筆記'}
                    </h3>
                    <p className="text-surface-500 text-sm">
                        {notes.length === 0 ? '點擊上方「新增筆記」開始你的學習記錄！' : '試試其他搜尋關鍵字'}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredNotes.map((note, index) => {
                        const incorrectAttempts = note.attempts.filter(a => !a.is_correct);
                        const correctCount = note.attempts.filter(a => a.is_correct).length;
                        const totalAttempts = note.attempts.length;

                        return (
                            <div
                                key={note.id}
                                className="glass-card p-5 sm:p-6 animate-slide-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={`/notes/${note.id}`}
                                            className="text-lg font-semibold text-white hover:text-primary-300 transition-colors flex items-center gap-2 group"
                                        >
                                            <span className="truncate">{note.title}</span>
                                            <ExternalLink size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                        <p className="text-surface-400 text-sm mt-1 line-clamp-1">{note.question}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {totalAttempts > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="badge badge-attempt">作答 {totalAttempts} 次</span>
                                                {correctCount > 0 && (
                                                    <span className="badge badge-correct">
                                                        <CheckCircle2 size={12} /> {correctCount}
                                                    </span>
                                                )}
                                                {incorrectAttempts.length > 0 && (
                                                    <span className="badge badge-incorrect">
                                                        <XCircle size={12} /> {incorrectAttempts.length}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className="p-2 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="刪除筆記"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Error summary rows */}
                                {incorrectAttempts.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-surface-700/40">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <AlertTriangle size={13} className="text-amber-400" />
                                            <span className="text-xs font-medium text-amber-400">錯誤記錄</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {incorrectAttempts.map(attempt => (
                                                <div key={attempt.id} className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-surface-400">
                                                    <span className="text-surface-500 font-medium shrink-0">第 {attempt.attempt_number} 次</span>
                                                    {attempt.error_content && (
                                                        <span className="text-red-400/80">
                                                            <span className="text-surface-500">錯誤：</span>{attempt.error_content.length > 60 ? attempt.error_content.slice(0, 60) + '...' : attempt.error_content}
                                                        </span>
                                                    )}
                                                    {attempt.usecase && (
                                                        <span className="text-primary-400/80">
                                                            <span className="text-surface-500">Use Case：</span>{attempt.usecase.length > 40 ? attempt.usecase.slice(0, 40) + '...' : attempt.usecase}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
