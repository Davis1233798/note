import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    fetchNote, updateNote, fetchAttempts, createAttempt, updateAttempt, deleteAttempt,
    type Note, type Attempt,
} from '../lib/supabase';
import {
    ArrowLeft, Save, Plus, CheckCircle2, XCircle, Trash2, Edit3,
    ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';

export default function NotePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [note, setNote] = useState<Note | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);

    // Note editing
    const [editingNote, setEditingNote] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editQuestion, setEditQuestion] = useState('');
    const [saving, setSaving] = useState(false);

    // New attempt form
    const [showNewAttempt, setShowNewAttempt] = useState(false);
    const [newAnswer, setNewAnswer] = useState('');
    const [newIsCorrect, setNewIsCorrect] = useState(true);
    const [newCorrection, setNewCorrection] = useState('');
    const [newError, setNewError] = useState('');
    const [newUsecase, setNewUsecase] = useState('');
    const [creatingAttempt, setCreatingAttempt] = useState(false);

    // Expanded attempts
    const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

    // Editing attempt
    const [editingAttemptId, setEditingAttemptId] = useState<string | null>(null);
    const [editAttemptData, setEditAttemptData] = useState<Partial<Attempt>>({});

    useEffect(() => {
        if (id) loadData(id);
    }, [id]);

    const loadData = async (noteId: string) => {
        try {
            const [noteData, attemptsData] = await Promise.all([
                fetchNote(noteId),
                fetchAttempts(noteId),
            ]);
            setNote(noteData);
            setAttempts(attemptsData);
            setEditTitle(noteData.title);
            setEditQuestion(noteData.question);
        } catch (err) {
            console.error('Failed to load note:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!id || !editTitle.trim() || !editQuestion.trim()) return;
        setSaving(true);
        try {
            const updated = await updateNote(id, { title: editTitle.trim(), question: editQuestion.trim() });
            setNote(updated);
            setEditingNote(false);
        } catch (err) {
            console.error('Failed to update note:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateAttempt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !newAnswer.trim()) return;
        setCreatingAttempt(true);
        try {
            const attemptNumber = attempts.length + 1;
            await createAttempt(
                id,
                attemptNumber,
                newAnswer.trim(),
                newIsCorrect,
                newIsCorrect ? undefined : newCorrection.trim(),
                newIsCorrect ? undefined : newError.trim(),
                newIsCorrect ? undefined : newUsecase.trim(),
            );
            setNewAnswer('');
            setNewIsCorrect(true);
            setNewCorrection('');
            setNewError('');
            setNewUsecase('');
            setShowNewAttempt(false);
            await loadData(id);
        } catch (err) {
            console.error('Failed to create attempt:', err);
        } finally {
            setCreatingAttempt(false);
        }
    };

    const handleStartEditAttempt = (attempt: Attempt) => {
        setEditingAttemptId(attempt.id);
        setEditAttemptData({
            answer_content: attempt.answer_content,
            is_correct: attempt.is_correct,
            correction: attempt.correction || '',
            error_content: attempt.error_content || '',
            usecase: attempt.usecase || '',
        });
    };

    const handleSaveAttempt = async () => {
        if (!editingAttemptId) return;
        try {
            await updateAttempt(editingAttemptId, editAttemptData);
            setEditingAttemptId(null);
            if (id) await loadData(id);
        } catch (err) {
            console.error('Failed to update attempt:', err);
        }
    };

    const handleDeleteAttempt = async (attemptId: string) => {
        if (!confirm('確定要刪除這次答題記錄嗎？')) return;
        try {
            await deleteAttempt(attemptId);
            if (id) await loadData(id);
        } catch (err) {
            console.error('Failed to delete attempt:', err);
        }
    };

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

    if (!note) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
                <h2 className="text-xl font-semibold text-surface-300">找不到這份筆記</h2>
                <button onClick={() => navigate('/')} className="btn-primary mt-4">
                    <ArrowLeft size={16} /> 返回總表
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-surface-400 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                返回總表
            </button>

            {/* Note Header */}
            <div className="glass-card p-6 sm:p-8 mb-6 animate-fade-in">
                {editingNote ? (
                    <div className="flex flex-col gap-4">
                        <input
                            id="edit-note-title"
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="input-field text-xl font-bold"
                            placeholder="筆記標題"
                        />
                        <textarea
                            id="edit-note-question"
                            value={editQuestion}
                            onChange={e => setEditQuestion(e.target.value)}
                            className="input-field"
                            placeholder="題目內容"
                            rows={4}
                        />
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setEditingNote(false)} className="btn-secondary">取消</button>
                            <button onClick={handleSaveNote} disabled={saving} className="btn-primary">
                                <Save size={16} /> {saving ? '儲存中...' : '儲存'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">{note.title}</h1>
                            <button
                                onClick={() => setEditingNote(true)}
                                className="btn-secondary shrink-0"
                                id="edit-note-btn"
                            >
                                <Edit3 size={14} /> 編輯
                            </button>
                        </div>
                        <div className="p-4 rounded-xl bg-surface-900/50 border border-surface-700/30">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen size={14} className="text-primary-400" />
                                <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">題目</span>
                            </div>
                            <p className="text-surface-200 whitespace-pre-wrap leading-relaxed">{note.question}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm text-surface-500">
                            <span>建立：{new Date(note.created_at).toLocaleDateString('zh-TW')}</span>
                            <span>更新：{new Date(note.updated_at).toLocaleDateString('zh-TW')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Attempts Section */}
            <div className="flex items-center justify-between mb-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📝 答題記錄
                    <span className="text-sm font-normal text-surface-400">({attempts.length} 次)</span>
                </h2>
                <button
                    onClick={() => setShowNewAttempt(!showNewAttempt)}
                    className="btn-primary"
                    id="new-attempt-btn"
                >
                    <Plus size={16} /> 新增答題
                </button>
            </div>

            {/* New Attempt Form */}
            {showNewAttempt && (
                <div className="glass-card p-6 mb-6 animate-slide-up">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        第 {attempts.length + 1} 次答題
                    </h3>
                    <form onSubmit={handleCreateAttempt} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-1.5">答案</label>
                            <textarea
                                id="attempt-answer"
                                value={newAnswer}
                                onChange={e => setNewAnswer(e.target.value)}
                                className="input-field"
                                placeholder="輸入你的答案..."
                                rows={5}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-300 mb-2">結果</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setNewIsCorrect(true)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${newIsCorrect
                                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                            : 'bg-surface-800/30 border-surface-700/30 text-surface-400 hover:border-surface-600'
                                        }`}
                                >
                                    <CheckCircle2 size={18} /> 正確
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewIsCorrect(false)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-all ${!newIsCorrect
                                            ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                            : 'bg-surface-800/30 border-surface-700/30 text-surface-400 hover:border-surface-600'
                                        }`}
                                >
                                    <XCircle size={18} /> 錯誤
                                </button>
                            </div>
                        </div>

                        {/* Error fields - only show when incorrect */}
                        {!newIsCorrect && (
                            <div className="flex flex-col gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium text-surface-300 mb-1.5">訂正</label>
                                    <textarea
                                        id="attempt-correction"
                                        value={newCorrection}
                                        onChange={e => setNewCorrection(e.target.value)}
                                        className="input-field"
                                        placeholder="正確的答案或訂正內容..."
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-300 mb-1.5">錯誤內容</label>
                                    <textarea
                                        id="attempt-error"
                                        value={newError}
                                        onChange={e => setNewError(e.target.value)}
                                        className="input-field"
                                        placeholder="描述錯誤的原因..."
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-300 mb-1.5">Use Case</label>
                                    <textarea
                                        id="attempt-usecase"
                                        value={newUsecase}
                                        onChange={e => setNewUsecase(e.target.value)}
                                        className="input-field"
                                        placeholder="相關使用情境..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setShowNewAttempt(false)} className="btn-secondary">取消</button>
                            <button type="submit" disabled={creatingAttempt} className="btn-primary" id="create-attempt-btn">
                                {creatingAttempt ? '儲存中...' : '儲存答題'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Attempts List */}
            {attempts.length === 0 ? (
                <div className="glass-card p-10 text-center animate-fade-in">
                    <BookOpen size={40} className="mx-auto text-surface-600 mb-3" />
                    <h3 className="text-lg font-semibold text-surface-300 mb-1">尚未作答</h3>
                    <p className="text-surface-500 text-sm">點擊「新增答題」記錄你的第一次作答</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {attempts.map((attempt, index) => {
                        const isExpanded = expandedAttempt === attempt.id;
                        const isEditing = editingAttemptId === attempt.id;

                        return (
                            <div
                                key={attempt.id}
                                className="glass-card overflow-hidden animate-slide-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Attempt header */}
                                <div
                                    className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-surface-800/20 transition-colors"
                                    onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="badge badge-attempt">第 {attempt.attempt_number} 次</span>
                                        <span className={`badge ${attempt.is_correct ? 'badge-correct' : 'badge-incorrect'}`}>
                                            {attempt.is_correct ? <><CheckCircle2 size={12} /> 正確</> : <><XCircle size={12} /> 錯誤</>}
                                        </span>
                                        <span className="text-xs text-surface-500">
                                            {new Date(attempt.created_at).toLocaleDateString('zh-TW')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={e => { e.stopPropagation(); handleStartEditAttempt(attempt); }}
                                            className="p-1.5 rounded-lg text-surface-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                                            title="編輯"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDeleteAttempt(attempt.id); }}
                                            className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                            title="刪除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        {isExpanded ? <ChevronUp size={16} className="text-surface-500" /> : <ChevronDown size={16} className="text-surface-500" />}
                                    </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="px-4 sm:px-5 pb-5 border-t border-surface-700/30 animate-fade-in">
                                        {isEditing ? (
                                            /* Edit mode */
                                            <div className="flex flex-col gap-4 pt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-surface-300 mb-1.5">答案</label>
                                                    <textarea
                                                        value={editAttemptData.answer_content || ''}
                                                        onChange={e => setEditAttemptData({ ...editAttemptData, answer_content: e.target.value })}
                                                        className="input-field"
                                                        rows={4}
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditAttemptData({ ...editAttemptData, is_correct: true })}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all ${editAttemptData.is_correct
                                                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                                                : 'bg-surface-800/30 border-surface-700/30 text-surface-400'
                                                            }`}
                                                    >
                                                        <CheckCircle2 size={16} /> 正確
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditAttemptData({ ...editAttemptData, is_correct: false })}
                                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all ${!editAttemptData.is_correct
                                                                ? 'bg-red-500/15 border-red-500/40 text-red-400'
                                                                : 'bg-surface-800/30 border-surface-700/30 text-surface-400'
                                                            }`}
                                                    >
                                                        <XCircle size={16} /> 錯誤
                                                    </button>
                                                </div>
                                                {!editAttemptData.is_correct && (
                                                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                                        <div>
                                                            <label className="block text-sm font-medium text-surface-300 mb-1">訂正</label>
                                                            <textarea
                                                                value={editAttemptData.correction || ''}
                                                                onChange={e => setEditAttemptData({ ...editAttemptData, correction: e.target.value })}
                                                                className="input-field"
                                                                rows={2}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-surface-300 mb-1">錯誤內容</label>
                                                            <textarea
                                                                value={editAttemptData.error_content || ''}
                                                                onChange={e => setEditAttemptData({ ...editAttemptData, error_content: e.target.value })}
                                                                className="input-field"
                                                                rows={2}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-surface-300 mb-1">Use Case</label>
                                                            <textarea
                                                                value={editAttemptData.usecase || ''}
                                                                onChange={e => setEditAttemptData({ ...editAttemptData, usecase: e.target.value })}
                                                                className="input-field"
                                                                rows={2}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-3 justify-end">
                                                    <button onClick={() => setEditingAttemptId(null)} className="btn-secondary">取消</button>
                                                    <button onClick={handleSaveAttempt} className="btn-primary">
                                                        <Save size={14} /> 儲存
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* View mode */
                                            <div className="pt-4 flex flex-col gap-4">
                                                <div>
                                                    <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">答案</h4>
                                                    <p className="text-surface-200 whitespace-pre-wrap leading-relaxed text-sm">{attempt.answer_content}</p>
                                                </div>
                                                {!attempt.is_correct && (
                                                    <>
                                                        {attempt.correction && (
                                                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                                                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">訂正</h4>
                                                                <p className="text-surface-200 whitespace-pre-wrap text-sm">{attempt.correction}</p>
                                                            </div>
                                                        )}
                                                        {attempt.error_content && (
                                                            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                                                <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">錯誤內容</h4>
                                                                <p className="text-surface-300 whitespace-pre-wrap text-sm">{attempt.error_content}</p>
                                                            </div>
                                                        )}
                                                        {attempt.usecase && (
                                                            <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/10">
                                                                <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">Use Case</h4>
                                                                <p className="text-surface-300 whitespace-pre-wrap text-sm">{attempt.usecase}</p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
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
