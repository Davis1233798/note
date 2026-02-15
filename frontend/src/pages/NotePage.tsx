import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserDatabase } from '../lib/UserDatabaseContext';
import { fetchNoteContent, createAttempt, updateNote, deleteAttempt, type Note, type Attempt } from '../lib/supabase';
import { ArrowLeft, Send, Save, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle, Play, ChevronDown, ChevronUp } from 'lucide-react';

export default function NotePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { status, userClient } = useUserDatabase();

    // Data state
    const [note, setNote] = useState<Note | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit Note fields
    const [editTitle, setEditTitle] = useState('');
    const [editQuestion, setEditQuestion] = useState('');
    const [editStandardAnswer, setEditStandardAnswer] = useState('');

    // New Attempt fields
    const [newAnswer, setNewAnswer] = useState('');
    const [newIsCorrect, setNewIsCorrect] = useState(true);
    const [newError, setNewError] = useState('');
    // const [newCorrection, setNewCorrection] = useState(''); // Hidden optional
    // const [newUsecase, setNewUsecase] = useState(''); // Hidden optional

    // Refs for scrolling
    const attemptsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === 'connected' && userClient && id) {
            loadData();
        }
    }, [status, userClient, id]);

    // Scroll to bottom of attempts when added
    useEffect(() => {
        attemptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [attempts]);

    const loadData = async () => {
        if (!userClient || !id) return;
        try {
            const { note: noteData, attempts: attemptsData } = await fetchNoteContent(userClient, id);
            setNote(noteData);
            setAttempts(attemptsData);

            // Init edit state
            setEditTitle(noteData.title);
            setEditQuestion(noteData.question);
            setEditStandardAnswer(noteData.standard_answer || '');
        } catch (err) {
            console.error('Failed to load note:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!id || !editTitle.trim() || !editQuestion.trim() || !userClient) return;
        setSaving(true);
        try {
            const updated = await updateNote(userClient, id, {
                title: editTitle.trim(),
                question: editQuestion.trim(),
                standard_answer: editStandardAnswer.trim()
            });
            setNote(updated);
            setEditingNote(false);
        } catch (err) {
            console.error('Failed to update note:', err);
            alert('更新失敗');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitAttempt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !newAnswer.trim() || !userClient) return;

        setSubmitting(true);
        try {
            const nextAttemptNumber = attempts.length + 1;
            const attempt = await createAttempt(
                userClient,
                id,
                nextAttemptNumber,
                newAnswer.trim(),
                newIsCorrect,
                undefined, // correction
                newIsCorrect ? undefined : newError.trim(),
                undefined // usecase
            );

            setAttempts([...attempts, attempt]);
            setNewAnswer('');
            setNewIsCorrect(true);
            setNewError('');
        } catch (err) {
            console.error('Failed to submit attempt:', err);
            alert('提交失敗');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAttempt = async (attemptId: string) => {
        if (!userClient || !confirm('確定要刪除此記錄？')) return;
        try {
            await deleteAttempt(userClient, attemptId);
            setAttempts(attempts.filter(a => a.id !== attemptId));
        } catch (err) {
            console.error('Failed to delete attempt:', err);
        }
    };

    if (loading) return <div className="p-8 text-center text-surface-400">載入中...</div>;
    if (!note) return <div className="p-8 text-center text-surface-400">找不到筆記</div>;

    return (
        <div className="animate-fade-in pb-12">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} />
                    <span className="font-medium">返回列表</span>
                </button>
                <div className="text-sm text-surface-500">
                    建立於 {new Date(note.created_at).toLocaleDateString()}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Panel: Question & Standard Answer (Sticky on Desktop) */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                    {editingNote ? (
                        <div className="glass-card p-6 border-primary-500/30">
                            <h3 className="text-lg font-bold text-white mb-4">編輯筆記</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">標題</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="label">題目描述</label>
                                    <textarea
                                        value={editQuestion}
                                        onChange={e => setEditQuestion(e.target.value)}
                                        className="input-field font-mono text-sm leading-relaxed"
                                        rows={8}
                                    />
                                </div>
                                <div>
                                    <label className="label">標準答案 (SQL)</label>
                                    <textarea
                                        value={editStandardAnswer}
                                        onChange={e => setEditStandardAnswer(e.target.value)}
                                        className="input-field font-mono text-sm"
                                        rows={5}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setEditingNote(false)} className="btn-secondary flex-1">取消</button>
                                    <button onClick={handleSaveNote} disabled={saving} className="btn-primary flex-1">
                                        {saving ? '儲存中...' : '儲存變更'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-6 sm:p-8">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-2xl font-bold text-white leading-tight">{note.title}</h1>
                                <button
                                    onClick={() => setEditingNote(true)}
                                    className="p-2 -mr-2 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 transition-colors"
                                    title="編輯"
                                >
                                    <Save size={18} />
                                </button>
                            </div>

                            <div className="prose prose-invert max-w-none text-surface-200 mb-8 whitespace-pre-wrap leading-relaxed">
                                {note.question}
                            </div>

                            {note.standard_answer && (
                                <div className="mt-8 pt-6 border-t border-surface-700/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 size={16} className="text-emerald-400" />
                                        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">標準答案</h3>
                                    </div>
                                    <div className="p-4 rounded-xl bg-surface-900/50 border border-emerald-500/20 group relative">
                                        <code className="block text-emerald-300 whitespace-pre-wrap text-sm font-mono">
                                            {note.standard_answer}
                                        </code>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel: Attempts History & New Form */}
                <div className="lg:col-span-7 space-y-6">

                    {/* New Attempt Form */}
                    <div className="glass-card p-6 border-t-4 border-t-primary-500">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Play size={20} className="text-primary-400" />
                            新增練習記錄
                        </h3>
                        <form onSubmit={handleSubmitAttempt} className="space-y-4">
                            <div>
                                <textarea
                                    placeholder="輸入你的 SQL 寫法..."
                                    value={newAnswer}
                                    onChange={e => setNewAnswer(e.target.value)}
                                    className="input-field font-mono text-sm min-h-[120px]"
                                    required
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewIsCorrect(true)}
                                        className={`flex-1 btn-base rounded-xl border ${newIsCorrect
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                            : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-600'}`}
                                    >
                                        <CheckCircle2 size={18} /> 答對
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewIsCorrect(false)}
                                        className={`flex-1 btn-base rounded-xl border ${!newIsCorrect
                                            ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                            : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-600'}`}
                                    >
                                        <XCircle size={18} /> 答錯
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || !newAnswer.trim()}
                                    className="btn-primary px-8"
                                >
                                    {submitting ? '提交中...' : <><Send size={18} /> 提交</>}
                                </button>
                            </div>

                            {!newIsCorrect && (
                                <div className="animate-fade-in pt-2">
                                    <label className="text-sm text-red-300 block mb-1.5">錯誤訊息 (Error Message)</label>
                                    <textarea
                                        placeholder="貼上錯誤訊息..."
                                        value={newError}
                                        onChange={e => setNewError(e.target.value)}
                                        className="input-field border-red-500/30 focus:border-red-500/60 min-h-[80px]"
                                    />
                                </div>
                            )}
                        </form>
                    </div>

                    {/* History List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Clock size={20} className="text-surface-400" />
                                練習歷史
                            </h3>
                            <span className="text-sm text-surface-400">共 {attempts.length} 次</span>
                        </div>

                        {attempts.length === 0 ? (
                            <div className="text-center py-12 text-surface-500 border-2 border-dashed border-surface-800 rounded-2xl">
                                尚未有練習記錄，開始你的第一次練習吧！
                            </div>
                        ) : (
                            <div className="flex flex-col-reverse gap-4">
                                {/* flex-col-reverse to show latest at top visually if mapped normally? 
                                Wait, database returns order? If I map normal, first is oldest.
                                User usually wants latest top.
                                I'll iterate normally but use flex-col-reverse? Or sort?
                                Let's sort manually to be safe.
                            */}
                                {[...attempts].sort((a, b) => b.attempt_number - a.attempt_number).map((attempt) => (
                                    <div key={attempt.id} className="glass-card p-5 animate-slide-up">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-sm font-bold text-surface-300">
                                                    #{attempt.attempt_number}
                                                </span>
                                                <span className="text-xs text-surface-500">
                                                    {new Date(attempt.created_at).toLocaleString('zh-TW')}
                                                </span>
                                                {attempt.is_correct ? (
                                                    <span className="badge badge-correct flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> 正確
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-incorrect flex items-center gap-1">
                                                        <XCircle size={12} /> 錯誤
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAttempt(attempt.id)}
                                                className="text-surface-600 hover:text-red-400 transition-colors p-1"
                                                title="刪除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="bg-surface-950/50 rounded-lg p-3 font-mono text-sm text-surface-200 border border-surface-800/50 overflow-x-auto">
                                            {attempt.answer_content}
                                        </div>

                                        {!attempt.is_correct && attempt.error_content && (
                                            <div className="mt-3 text-sm flex gap-2 text-red-300/90 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                                <div className="whitespace-pre-wrap font-mono text-xs">{attempt.error_content}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={attemptsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}
