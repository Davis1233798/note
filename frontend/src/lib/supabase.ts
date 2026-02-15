import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ===== 共享 Supabase（認證 + 使用者設定）=====

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '缺少 Supabase 環境變數。請在 .env 檔案中設定 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
    );
}

/** 共享 Supabase client - 用於 OAuth 認證和 user_settings */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== Types =====

export interface Note {
    id: string;
    user_id: string;
    title: string;
    question: string;
    standard_answer: string | null; // [NEW] 標準答案
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

export interface UserSettings {
    id: string;
    user_id: string;
    supabase_url: string;
    supabase_anon_key: string;
    created_at: string;
    updated_at: string;
}

// ===== 使用者 Supabase Client 管理（LRU Cache）=====

interface CacheEntry {
    client: SupabaseClient;
    lastUsed: number;
}

const MAX_CLIENTS = 50;
const clientCache = new Map<string, CacheEntry>();

function getCacheKey(url: string, anonKey: string): string {
    return `${url}::${anonKey}`;
}

/** 取得或建立使用者專屬的 Supabase client（帶 LRU 快取）*/
export function getUserSupabaseClient(url: string, anonKey: string): SupabaseClient {
    const key = getCacheKey(url, anonKey);
    const cached = clientCache.get(key);

    if (cached) {
        cached.lastUsed = Date.now();
        return cached.client;
    }

    // 超出上限時，清除最久未用的 client
    if (clientCache.size >= MAX_CLIENTS) {
        let oldestKey = '';
        let oldestTime = Infinity;
        for (const [k, v] of clientCache.entries()) {
            if (v.lastUsed < oldestTime) {
                oldestTime = v.lastUsed;
                oldestKey = k;
            }
        }
        if (oldestKey) clientCache.delete(oldestKey);
    }

    const client = createClient(url, anonKey);
    clientCache.set(key, { client, lastUsed: Date.now() });
    return client;
}

// ===== User Settings API（共享 Supabase）=====

/** 讀取目前使用者的 Supabase 設定 */
export async function getUserSettings(): Promise<UserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('未登入');

    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/** 儲存使用者的 Supabase 設定 */
export async function saveUserSettings(supabaseUrl: string, supabaseAnonKey: string): Promise<UserSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('未登入');

    const { data, error } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            supabase_url: supabaseUrl,
            supabase_anon_key: supabaseAnonKey,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}


/** 測試使用者的 Supabase 連線是否正常 */
export async function testConnection(url: string, anonKey: string): Promise<{ ok: boolean; error?: string }> {
    try {
        const client = createClient(url, anonKey);
        // 嘗試查詢（即使表不存在也不會出錯，只是回空）
        const { error } = await client.from('notes').select('id').limit(1);
        if (error && !error.message.includes('does not exist') && error.code !== '42P01') {
            return { ok: false, error: error.message };
        }
        return { ok: true };
    } catch (err: any) {
        return { ok: false, error: err.message || '連線失敗' };
    }
}

/** 在使用者的 Supabase 中初始化資料表 */
export async function initUserDatabase(client: SupabaseClient): Promise<{ ok: boolean; error?: string }> {
    try {
        // 先嘗試查 notes 表，看是否已存在
        const { error: checkError } = await client.from('notes').select('id').limit(1);

        if (checkError && (checkError.message.includes('does not exist') || checkError.code === '42P01')) {
            // 表不存在，嘗試用 rpc 建表（需要使用者在 Supabase 中開啟 SQL functions）
            // 但更實際的做法是：提示使用者手動執行 SQL
            return {
                ok: false,
                error: 'NEED_CREATE_TABLES',
            };
        }

        if (checkError) {
            return { ok: false, error: checkError.message };
        }

        return { ok: true };
    } catch (err: any) {
        return { ok: false, error: err.message || '初始化失敗' };
    }
}

// ===== Notes API（使用者的 Supabase）=====

export async function fetchNotes(client: SupabaseClient) {
    const { data, error } = await client
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data as Note[];
}

export async function fetchNote(client: SupabaseClient, id: string) {
    const { data, error } = await client
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data as Note;
}

export async function createNote(client: SupabaseClient, title: string, question: string, standardAnswer: string, userId: string) {
    const { data, error } = await client
        .from('notes')
        .insert({
            title,
            question,
            standard_answer: standardAnswer, // [NEW]
            user_id: userId
        })
        .select()
        .single();
    if (error) throw error;
    return data as Note;
}

export async function updateNote(client: SupabaseClient, id: string, updates: Partial<Pick<Note, 'title' | 'question' | 'standard_answer'>>) {
    const { data, error } = await client
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Note;
}

export async function deleteNote(client: SupabaseClient, id: string) {
    const { error } = await client.from('notes').delete().eq('id', id);
    if (error) throw error;
}

// ===== Attempts API（使用者的 Supabase）=====

export async function fetchAttempts(client: SupabaseClient, noteId: string) {
    const { data, error } = await client
        .from('attempts')
        .select('*')
        .eq('note_id', noteId)
        .order('attempt_number', { ascending: true });
    if (error) throw error;
    return data as Attempt[];
}

export async function createAttempt(
    client: SupabaseClient,
    noteId: string,
    attemptNumber: number,
    answerContent: string,
    isCorrect: boolean,
    correction?: string,
    errorContent?: string,
    usecase?: string
) {
    const { data, error } = await client
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
    client: SupabaseClient,
    id: string,
    updates: Partial<Pick<Attempt, 'answer_content' | 'is_correct' | 'correction' | 'error_content' | 'usecase'>>
) {
    const { data, error } = await client
        .from('attempts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data as Attempt;
}

export async function deleteAttempt(client: SupabaseClient, id: string) {
    const { error } = await client.from('attempts').delete().eq('id', id);
    if (error) throw error;
}

// ===== Summary API =====

export async function fetchNotesWithAttempts(client: SupabaseClient) {
    const { data, error } = await client
        .from('notes')
        .select(`
      *,
      attempts (*)
    `)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return data as (Note & { attempts: Attempt[] })[];
}

// ===== SQL for user's Supabase (使用者需手動執行) =====

export const USER_DATABASE_SQL = `
-- 建立 notes 表
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    standard_answer TEXT, -- [NEW] 標準答案
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 建立 attempts 表
CREATE TABLE IF NOT EXISTS attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    answer_content TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    correction TEXT,
    error_content TEXT,
    usecase TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 關閉 RLS（讓 anon key 可以正常讀寫）
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- 允許所有操作（因為每個使用者有自己的 Supabase 專案，不需要 RLS 限制）
CREATE POLICY "Allow all on notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on attempts" ON attempts FOR ALL USING (true) WITH CHECK (true);
`;
