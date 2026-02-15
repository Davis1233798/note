import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '缺少 Supabase 環境變數。請在 .env 檔案中設定 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== Types =====

export interface Note {
    id: string;
    user_id: string;
    title: string;
    question: string;
    created_at: string;
    updated_at: string;
}

export interface Attempt {
    id: string;
    note_id: string;
    attempt_number: number;
    answer_content: string;
    is_correct: boolean;
    correction: string | null;
    error_content: string | null;
    usecase: string | null;
    created_at: string;
}

// ===== Notes API =====

export async function fetchNotes() {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data as Note[];
}

export async function fetchNote(id: string) {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as Note;
}

export async function createNote(title: string, question: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('未登入');

    const { data, error } = await supabase
        .from('notes')
        .insert({ title, question, user_id: user.id })
        .select()
        .single();
    if (error) throw error;
    return data as Note;
}

export async function updateNote(id: string, updates: Partial<Pick<Note, 'title' | 'question'>>) {
    const { data, error } = await supabase
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Note;
}

export async function deleteNote(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
}

// ===== Attempts API =====

export async function fetchAttempts(noteId: string) {
    const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('note_id', noteId)
        .order('attempt_number', { ascending: true });
    if (error) throw error;
    return data as Attempt[];
}

export async function createAttempt(
    noteId: string,
    attemptNumber: number,
    answerContent: string,
    isCorrect: boolean,
    correction?: string,
    errorContent?: string,
    usecase?: string
) {
    const { data, error } = await supabase
        .from('attempts')
        .insert({
            note_id: noteId,
            attempt_number: attemptNumber,
            answer_content: answerContent,
            is_correct: isCorrect,
            correction: correction || null,
            error_content: errorContent || null,
            usecase: usecase || null,
        })
        .select()
        .single();
    if (error) throw error;
    return data as Attempt;
}

export async function updateAttempt(
    id: string,
    updates: Partial<Pick<Attempt, 'answer_content' | 'is_correct' | 'correction' | 'error_content' | 'usecase'>>
) {
    const { data, error } = await supabase
        .from('attempts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Attempt;
}

export async function deleteAttempt(id: string) {
    const { error } = await supabase.from('attempts').delete().eq('id', id);
    if (error) throw error;
}

// ===== Summary API (帶有每個筆記的錯誤摘要) =====

export async function fetchNotesWithAttempts() {
    const { data, error } = await supabase
        .from('notes')
        .select(`
      *,
      attempts (*)
    `)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data as (Note & { attempts: Attempt[] })[];
}
