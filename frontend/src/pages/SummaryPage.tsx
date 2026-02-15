import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserDatabase } from '../lib/UserDatabaseContext';
import { fetchNotesWithAttempts, deleteNote, type Note, type Attempt } from '../lib/supabase';
import {
    Plus,
    FileText,
    ExternalLink,
    Trash2,
    Search,
    XCircle,
    Settings,
    TrendingUp,
    Activity,
    Clock
} from 'lucide-react';

export default function SummaryPage() {
    const navigate = useNavigate();
    const { status, userClient } = useUserDatabase();
    const [notes, setNotes] = useState<(Note & { attempts: Attempt[] })[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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

    // Calculate Stats
    const totalNotes = notes.length;
    const totalAttempts = notes.reduce((sum, n) => sum + n.attempts.length, 0);
    const totalCorrect = notes.reduce((sum, n) => sum + n.attempts.filter(a => a.is_correct).length, 0);
    const successRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;


    const filteredNotes = notes.filter(
        n => n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.question.toLowerCase().includes(search.toLowerCase())
    );

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                    <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-surface-400 text-sm">載入資料中...</p>
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
                    <p className="text-surface-400 text-sm mb-4">無法連接到 Supabase 資料庫。</p>
                    <button onClick={() => navigate('/setup')} className="btn-primary">
                        <Settings size={16} /> 重新設定
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 w-full max-w-[1920px] mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">總覽 Dashboard</h1>
                <p className="text-surface-400 text-sm">歡迎回來！查看你的學習進度。</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-surface-400">總筆記數</p>
                        <p className="text-2xl font-bold text-white">{totalNotes}</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-surface-400">平均答對率</p>
                        <p className="text-2xl font-bold text-white">{successRate}%</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-surface-400">總練習次數</p>
                        <p className="text-2xl font-bold text-white">{totalAttempts}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="glass-card overflow-hidden">
                {/* Visual Tooltip / Actions */}
                <div className="p-6 border-b border-surface-700/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                        <input
                            type="text"
                            placeholder="搜尋筆記..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input-field pl-9 py-2 text-sm w-full md:w-64"
                        />
                    </div>
                    <button onClick={() => navigate('/new')} className="btn-primary">
                        <Plus size={16} /> 新增筆記
                    </button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-surface-400">
                        <thead className="bg-surface-800/50 text-surface-300 font-medium">
                            <tr>
                                <th className="px-6 py-3">標題 / 題目</th>
                                <th className="px-6 py-3 text-center">狀態</th>
                                <th className="px-6 py-3">錯誤備註</th>
                                <th className="px-6 py-3 text-center">最後練習</th>
                                <th className="px-6 py-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-700/30">
                            {filteredNotes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-surface-500">
                                        沒有找到符合的筆記
                                    </td>
                                </tr>
                            ) : (
                                filteredNotes.map(note => {
                                    const lastAttempt = note.attempts[note.attempts.length - 1];
                                    const correctCount = note.attempts.filter(a => a.is_correct).length;
                                    return (
                                        <tr key={note.id} className="hover:bg-surface-800/30 transition-colors group">
                                            <td className="px-6 py-4 max-w-md">
                                                <Link to={`/notes/${note.id}`} className="block">
                                                    <p className="font-semibold text-white group-hover:text-primary-300 transition-colors truncate">
                                                        {note.title}
                                                    </p>
                                                    <p className="text-surface-500 truncate mt-0.5 max-w-xs">
                                                        {note.question}
                                                    </p>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xs font-medium text-surface-300">
                                                        正確率 {note.attempts.length > 0 ? Math.round((correctCount / note.attempts.length) * 100) : 0}%
                                                    </span>
                                                    <div className="w-16 h-1 mt-1 bg-surface-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500"
                                                            style={{ width: `${note.attempts.length > 0 ? (correctCount / note.attempts.length) * 100 : 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-red-300 max-w-xs truncate" title={lastAttempt?.error_content || ''}>
                                                {lastAttempt && !lastAttempt.is_correct ? (lastAttempt.error_content || '-') : ''}
                                            </td>
                                            <td className="px-6 py-4 text-center text-surface-500 text-xs">
                                                {note.attempts.length > 0 ? (
                                                    <span className="flex items-center justify-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(note.updated_at).toLocaleDateString('zh-TW')}
                                                    </span>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-surface-500">
                                                    <Link to={`/notes/${note.id}`} className="p-2 hover:text-primary-400 hover:bg-surface-800 rounded-lg transition-all">
                                                        <ExternalLink size={16} />
                                                    </Link>
                                                    <button onClick={() => handleDelete(note.id)} className="p-2 hover:text-red-400 hover:bg-surface-800 rounded-lg transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-surface-700/30">
                    {filteredNotes.length === 0 ? (
                        <div className="p-8 text-center text-surface-500">
                            沒有找到符合的筆記
                        </div>
                    ) : (
                        filteredNotes.map(note => (
                            <div key={note.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0">
                                        <Link to={`/notes/${note.id}`} className="font-semibold text-white hover:text-primary-300 block truncate">
                                            {note.title}
                                        </Link>
                                        <p className="text-sm text-surface-500 mt-0.5 line-clamp-2">{note.question}</p>
                                    </div>
                                    <button onClick={() => handleDelete(note.id)} className="text-surface-500 hover:text-red-400 p-1 shrink-0">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {note.attempts.length > 0 && !note.attempts[note.attempts.length - 1].is_correct && note.attempts[note.attempts.length - 1].error_content && (
                                    <div className="text-xs text-red-300 bg-red-500/10 p-2 rounded truncate">
                                        錯誤: {note.attempts[note.attempts.length - 1].error_content}
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-xs text-surface-400">
                                    <div className="flex items-center gap-3">
                                        <Link to={`/notes/${note.id}`} className="flex items-center gap-1 text-primary-400 font-medium">
                                            進入練習 <ExternalLink size={12} />
                                        </Link>
                                    </div>
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} /> {new Date(note.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
