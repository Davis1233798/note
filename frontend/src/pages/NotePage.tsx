import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserDatabase } from '../lib/UserDatabaseContext';
import { fetchNoteContent, createAttempt, updateNote, deleteAttempt, type Note, type Attempt } from '../lib/supabase';
import {
    Play,
    FileText,
    Code2,
    History,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    TerminalSquare,
    Trash2,
    ArrowLeft
} from 'lucide-react';

type Tab = 'description' | 'solution' | 'submissions';

export default function NotePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { status, userClient } = useUserDatabase();

    // Data state
    const [note, setNote] = useState<Note | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('description');
    const [consoleOpen, setConsoleOpen] = useState(true);

    // Editor state
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<{
        success: boolean;
        message?: string;
        error?: string;
    } | null>(null);

    // Edit Note state (for Description tab)
    const [startEditing, setStartEditing] = useState(false);
    const [editQuestion, setEditQuestion] = useState('');
    const [editStandardAnswer, setEditStandardAnswer] = useState('');

    useEffect(() => {
        if (status === 'connected' && userClient && id) {
            loadData();
        }
    }, [status, userClient, id]);

    const loadData = async () => {
        if (!userClient || !id) return;
        try {
            const { note: noteData, attempts: attemptsData } = await fetchNoteContent(userClient, id);
            setNote(noteData);
            setAttempts(attemptsData);
            setCode('');

            // Init edit state
            setEditQuestion(noteData.question);
            setEditStandardAnswer(noteData.standard_answer || '');
        } catch (err) {
            console.error('Failed to load note:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRunCode = async () => {
        if (!id || !code.trim() || !userClient) return;

        setSubmitting(true);
        setConsoleOpen(true);
        setSubmissionResult(null);

        // Simulate "Running"
        setTimeout(() => {
            setSubmissionResult({ success: true, message: 'Execution finished. verify result...' });
            setSubmitting(false);
        }, 500);
    };

    const handleConfirmResult = async (isCorrect: boolean, errorMsg?: string) => {
        if (!id || !code.trim() || !userClient) return;
        setSubmitting(true);
        try {
            const nextAttemptNumber = attempts.length + 1;
            const attempt = await createAttempt(
                userClient,
                id,
                nextAttemptNumber,
                code.trim(),
                isCorrect,
                undefined,
                isCorrect ? undefined : errorMsg,
                undefined
            );
            setAttempts([...attempts, attempt]);
            setSubmissionResult({
                success: isCorrect,
                message: isCorrect ? 'Accepted' : 'Wrong Answer',
                error: errorMsg
            });
            if (isCorrect) {
                // setActiveTab('submissions'); 
            }
        } catch (err) {
            console.error(err);
            setSubmissionResult({ success: false, error: 'Failed to save attempt' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveNoteContent = async () => {
        if (!id || !userClient || !note) return;
        try {
            const updated = await updateNote(userClient, id, {
                title: note.title,
                question: editQuestion,
                standard_answer: editStandardAnswer
            });
            setNote(updated);
            setStartEditing(false);
        } catch (err) {
            alert('Update failed');
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
        <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] lg:h-screen w-full bg-neutral-950 overflow-hidden text-sm animate-fade-in relative z-10">
            {/* Mobile Back Button (Top Left Overlay) - Only visible if we need it? 
                Actually Layout has Sidebar.
                But if full screen, Sidebar might be hidden?
                DashboardLayout logic: Sidebar is sticky.
                If NotePage is full screen, does it cover Sidebar?
                No, NotePage is inside 'main' which is next to Sidebar.
                So Sidebar is always visible (collapsed).
                I'll add a 'Back' button in Left Panel header if needed, but Sidebar has 'Dashboard' link.
                So explicit back button is not strictly necessary, but good for UX.
             */}

            {/* Left Panel */}
            <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-surface-800 bg-neutral-900">
                {/* Tabs Header */}
                <div className="flex items-center h-10 bg-surface-900 border-b border-surface-800 px-2 select-none relative">
                    <button onClick={() => navigate('/')} className="mr-2 p-1 text-surface-500 hover:text-white" title="返回列表">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="h-4 w-px bg-surface-700 mx-1"></div>
                    <button
                        onClick={() => setActiveTab('description')}
                        className={`flex items-center gap-2 px-4 h-full text-xs font-medium transition-colors border-b-2 ${activeTab === 'description' ? 'text-white border-white' : 'text-surface-400 border-transparent hover:text-surface-200'}`}
                    >
                        <FileText size={14} /> Description
                    </button>
                    <button
                        onClick={() => setActiveTab('solution')}
                        className={`flex items-center gap-2 px-4 h-full text-xs font-medium transition-colors border-b-2 ${activeTab === 'solution' ? 'text-white border-white' : 'text-surface-400 border-transparent hover:text-surface-200'}`}
                    >
                        <Code2 size={14} /> Solution
                    </button>
                    <button
                        onClick={() => setActiveTab('submissions')}
                        className={`flex items-center gap-2 px-4 h-full text-xs font-medium transition-colors border-b-2 ${activeTab === 'submissions' ? 'text-white border-white' : 'text-surface-400 border-transparent hover:text-surface-200'}`}
                    >
                        <History size={14} /> Submissions
                    </button>
                </div>

                {/* Left Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {activeTab === 'description' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex justify-between items-start">
                                <h1 className="text-xl font-bold text-white">{note.title}</h1>
                                <button onClick={() => setStartEditing(!startEditing)} className="text-surface-500 hover:text-white transition-colors">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            {startEditing ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={editQuestion}
                                        onChange={e => setEditQuestion(e.target.value)}
                                        className="input-field font-mono text-sm"
                                        rows={10}
                                    />
                                    <button onClick={handleSaveNoteContent} className="btn-primary w-full">Save</button>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none text-surface-200 whitespace-pre-wrap leading-relaxed">
                                    {note.question}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'solution' && (
                        <div className="animate-fade-in space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white">Standard Solution (SQL)</h3>
                                {startEditing && (
                                    <button onClick={handleSaveNoteContent} className="text-xs btn-primary py-1 px-2">Save</button>
                                )}
                            </div>
                            {startEditing ? (
                                <textarea
                                    value={editStandardAnswer}
                                    onChange={e => setEditStandardAnswer(e.target.value)}
                                    className="input-field font-mono text-sm"
                                    rows={10}
                                />
                            ) : (
                                <div className="p-4 rounded-lg bg-surface-950 border border-surface-800 font-mono text-sm text-emerald-400">
                                    {note.standard_answer || 'No standard answer provided.'}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="animate-fade-in space-y-3">
                            {attempts.length === 0 ? (
                                <div className="text-center py-8 text-surface-500">No submissions yet</div>
                            ) : (
                                [...attempts].sort((a, b) => b.attempt_number - a.attempt_number).map(attempt => (
                                    <div key={attempt.id} className="p-3 bg-surface-800/30 rounded-lg hover:bg-surface-800/50 transition-colors border border-surface-800 group relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${attempt.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {attempt.is_correct ? 'Accepted' : 'Wrong Answer'}
                                            </span>
                                            <span className="text-xs text-surface-500">{new Date(attempt.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="font-mono text-xs text-surface-300 overflow-x-auto whitespace-pre-wrap">
                                            {attempt.answer_content}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAttempt(attempt.id)}
                                            className="absolute top-3 right-3 text-surface-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-1/2 flex flex-col bg-neutral-900 border-surface-800 lg:border-l">
                {/* Toolbar */}
                <div className="h-10 bg-surface-900 border-b border-surface-800 flex items-center justify-between px-3">
                    <div className="flex items-center gap-2 text-surface-400 text-xs">
                        <Code2 size={14} /> SQL Query
                    </div>
                </div>

                {/* Code Editor Area */}
                <div className="flex-1 relative bg-[#1e1e1e]">
                    <textarea
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full h-full bg-[#1e1e1e] text-gray-200 font-mono text-sm p-4 resize-none focus:outline-none"
                        placeholder="/* Write your T-SQL query statement below */"
                        spellCheck={false}
                    />
                </div>

                {/* Console / Action Bar */}
                <div className={`border-t border-surface-800 bg-surface-900 flex flex-col ${consoleOpen ? 'h-1/3' : 'h-12'}`}>
                    <div className="h-12 flex items-center justify-between px-4 border-b border-surface-800 shrink-0">
                        <button
                            onClick={() => setConsoleOpen(!consoleOpen)}
                            className="flex items-center gap-2 text-surface-400 hover:text-white text-xs font-medium transition-colors"
                        >
                            <TerminalSquare size={14} /> Console
                            {consoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={handleRunCode}
                                disabled={submitting || !code.trim()}
                                className="btn-base bg-surface-700 hover:bg-surface-600 text-white px-4 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors"
                            >
                                <Play size={12} fill="currentColor" /> Run Code
                            </button>
                            <button
                                onClick={handleRunCode}
                                disabled={submitting || !code.trim()}
                                className="btn-primary px-4 py-1.5 rounded text-xs font-medium"
                            >
                                Submit
                            </button>
                        </div>
                    </div>

                    {/* Console Content */}
                    {consoleOpen && (
                        <div className="flex-1 overflow-y-auto p-4 bg-surface-950">
                            {submissionResult === null && !submitting && (
                                <div className="text-surface-500 text-sm">Enter SQL and click Run or Submit...</div>
                            )}
                            {submitting && (
                                <div className="text-surface-400 text-sm animate-pulse">Running...</div>
                            )}
                            {submissionResult && submissionResult.message === 'Execution finished. verify result...' && (
                                <div className="space-y-4 animate-fade-in">
                                    <p className="text-surface-300 text-sm">System cannot verify SQL execution automatically. Please verify your result:</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleConfirmResult(true)}
                                            className="px-4 py-2 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium border border-emerald-500/30 transition-colors"
                                        >
                                            Accepted
                                        </button>
                                        <button
                                            onClick={() => handleConfirmResult(false, 'Self reported wrong answer')}
                                            className="px-4 py-2 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium border border-red-500/30 transition-colors"
                                        >
                                            Wrong Answer
                                        </button>
                                    </div>
                                    <div className="mt-4">
                                        <input
                                            type="text"
                                            placeholder="Optional: Error details..."
                                            className="input-field text-sm"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleConfirmResult(false, (e.target as HTMLInputElement).value)
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            {submissionResult && (submissionResult.success || submissionResult.error) && (
                                <div className={`text-sm ${submissionResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                    <div className="font-bold text-lg mb-2">{submissionResult.message}</div>
                                    {submissionResult.error && (
                                        <div className="p-3 bg-surface-900 rounded border border-surface-700 font-mono">
                                            {submissionResult.error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
