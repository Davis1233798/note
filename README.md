# 📝 學習筆記系統

記錄學習歷程、追蹤答題錯誤與訂正的全端筆記系統。

| 層級 | 技術 |
|------|------|
| 前端 | React + Vite + TypeScript + TailwindCSS v4 |
| 後端 | Rust + Axum |
| 資料庫 | Supabase (PostgreSQL + Auth) |
| CI/CD | GitHub Actions → Oracle VPS |

---

## 🚀 快速開始

### 1. 建立 Supabase 專案

#### Step 1：註冊 / 登入 Supabase

1. 前往 [https://supabase.com](https://supabase.com)
2. 點擊右上角 **「Start your project」**
3. 使用 **GitHub 帳號** 登入（推薦），或用 Email 註冊

#### Step 2：建立新專案

1. 登入後進入 Dashboard，點擊 **「New Project」**
2. 填寫：
   - **Name**：`note`（或任意名稱）
   - **Database Password**：設定一個強密碼（保存好，之後可能用到）
   - **Region**：選擇 **Northeast Asia (Tokyo)** 離台灣最近
3. 點擊 **「Create new project」**
4. 等待 1~2 分鐘，專案建立完成

#### Step 3：取得 SUPABASE_URL 和 SUPABASE_ANON_KEY

**取得 Project URL（`VITE_SUPABASE_URL`）：**
1. 進入你的專案 Dashboard
2. 點擊左側選單 **「Project Settings」**（齒輪圖示 ⚙️）
3. 點擊 **「General」** 分頁
4. 在 **「Project URL」** 區塊找到，格式為 `https://xxxxxxx.supabase.co`
5. 也可以直接看瀏覽器網址列：`https://supabase.com/dashboard/project/xxxxxxx`，其中 `xxxxxxx` 就是你的 project id，完整 URL 為 `https://xxxxxxx.supabase.co`

**取得 anon public key（`VITE_SUPABASE_ANON_KEY`）：**
1. 同樣在 **「Project Settings」** → **「API」** 分頁
2. 切換到 **「Legacy anon, service_role API keys」** 標籤頁
3. 複製 **anon public** 那一行的 key（以 `eyJ` 開頭的長字串）

> ⚠️ 注意：要複製的是 **anon public** 那個 key，**不是** service_role key

---

### 2. 建立資料表

1. 在 Supabase Dashboard 左側選單，點擊 **「SQL Editor」**
2. 點擊 **「New query」**
3. 貼入以下 SQL，然後點 **「Run」**：

```sql
-- ===== 建立 notes 表 =====
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 建立 attempts 表 =====
CREATE TABLE attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
  attempt_number INT NOT NULL,
  answer_content TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  correction TEXT,
  error_content TEXT,
  usecase TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 啟用 Row Level Security =====
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- 使用者只能操作自己的 notes
CREATE POLICY "Users manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- 使用者只能操作自己 notes 底下的 attempts
CREATE POLICY "Users manage own attempts" ON attempts
  FOR ALL USING (
    note_id IN (SELECT id FROM notes WHERE user_id = auth.uid())
  );
```

4. 確認看到 **「Success. No rows returned」** 表示建立成功

---

### 3. 設定 OAuth 登入（Google + GitHub）

#### 3a. 設定 GitHub OAuth

1. 前往 [https://github.com/settings/developers](https://github.com/settings/developers)
2. 點擊 **「New OAuth App」**
3. 填寫：
   - **Application name**：`學習筆記系統`
   - **Homepage URL**：`http://你的VPS IP`（例如 `http://138.2.60.98`）
   - **Authorization callback URL**：回到 Supabase Dashboard → 左側 **「Authentication」** → **「Providers」** → 展開 **GitHub** → 複製 **「Callback URL (for OAuth)」** 的值貼到這裡
     - 格式通常是：`https://abcdefg.supabase.co/auth/v1/callback`
4. 點擊 **「Register application」**
5. 建立後會看到 **Client ID**，接著點 **「Generate a new client secret」** 取得 **Client Secret**
6. 回到 Supabase Dashboard → **Authentication** → **Providers** → **GitHub**：
   - 打開 **Enable** 開關
   - 貼入 **Client ID** 和 **Client Secret**
   - 點擊 **「Save」**

#### 3b. 設定 Google OAuth

1. 前往 [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 搜尋並啟用 **「Google Identity」** 或前往 **「APIs & Services」→「Credentials」**
4. 設定 **OAuth consent screen**：
   - User Type：**External**
   - App name：`學習筆記系統`
   - User support email：你的 Email
   - 其他可跳過，點 **「Save and Continue」** 到結束
5. 建立 **OAuth 2.0 Client ID**：
   - 到 **「Credentials」** → **「Create Credentials」** → **「OAuth client ID」**
   - Application type：**Web application**
   - **Authorized redirect URIs**：貼入 Supabase 的 Callback URL
     - 同上，在 Supabase → Authentication → Providers → Google 中複製
     - 格式：`https://abcdefg.supabase.co/auth/v1/callback`
   - 點擊 **「Create」**
6. 複製 **Client ID** 和 **Client Secret**
7. 回到 Supabase Dashboard → **Authentication** → **Providers** → **Google**：
   - 打開 **Enable** 開關
   - 貼入 **Client ID** 和 **Client Secret**
   - 點擊 **「Save」**

---

### 4. 設定 GitHub Secrets

到 GitHub Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**：

| Secret 名稱 | 值 |
|---|---|
| `VPS_HOST` | `138.2.60.98` |
| `VPS_USER` | `ubuntu` |
| `VPS_SSH_KEY` | 連線 VPS 的 SSH 私鑰全文（`~/.ssh/id_rsa` 的內容） |
| `VITE_SUPABASE_URL` | Step 3 取得的 Project URL |
| `VITE_SUPABASE_ANON_KEY` | Step 3 取得的 anon public key |

---

### 5. 部署

設定完成後，Push 到 `main` 分支即自動部署：

```bash
git push origin main
```

或到 GitHub → **Actions** 頁面手動觸發 **「Deploy to Oracle VPS」** workflow。

---

## 🛠️ 本地開發

```bash
# 1. 複製 .env
cp frontend/.env.example frontend/.env
# 填入你的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

# 2. 啟動前端
cd frontend
npm install
npm run dev

# 3. 啟動後端（另一個終端）
cd backend
cargo run
```

---

## 📁 專案結構

```
note/
├── .github/workflows/deploy.yml   # CI/CD 部署 workflow
├── backend/
│   ├── Cargo.toml                 # Rust 依賴
│   ├── Dockerfile                 # Docker 建置
│   └── src/main.rs                # Axum HTTP server
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.ts        # Supabase client + API
│   │   │   └── AuthContext.tsx     # 認證狀態管理
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx       # 登入頁面
│   │   │   ├── SummaryPage.tsx     # 總表頁面
│   │   │   └── NotePage.tsx        # 筆記詳細頁面
│   │   └── components/
│   │       ├── Navbar.tsx          # 導航列
│   │       └── ProtectedRoute.tsx  # 路由保護
│   └── .env.example               # 環境變數範本
├── deploy/
│   ├── note-app.service            # systemd 服務設定
│   └── nginx.conf                  # nginx 反向代理
└── docker-compose.yml
```
