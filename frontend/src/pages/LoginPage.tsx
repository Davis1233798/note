import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, ArrowRight, Github } from 'lucide-react';

export default function LoginPage() {
    const { user, signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
                setSuccess('註冊成功！請檢查你的電子郵件以驗證帳號。');
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: any) {
            setError(err.message || '認證失敗，請重試。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-600/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary-400/8 rounded-full blur-[128px]" />
            </div>

            <div className="relative w-full max-w-md animate-slide-up">
                {/* Logo section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-2xl shadow-primary-500/25 animate-pulse-glow mb-5">
                        <BookOpen size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent mb-2">
                        學習筆記系統
                    </h1>
                    <p className="text-surface-400 text-sm">
                        記錄你的學習歷程，追蹤錯誤與進步
                    </p>
                </div>

                {/* Login card */}
                <div className="glass-card p-8">
                    {/* OAuth Buttons */}
                    <div className="flex flex-col gap-3 mb-6">
                        <button onClick={signInWithGoogle} className="btn-oauth btn-google" id="google-login-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            使用 Google 登入
                        </button>

                        <button onClick={signInWithGithub} className="btn-oauth btn-github" id="github-login-btn">
                            <Github size={20} />
                            使用 GitHub 登入
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center my-6">
                        <div className="flex-grow border-t border-surface-700/60"></div>
                        <span className="px-4 text-xs text-surface-500 font-medium uppercase tracking-wider">或使用 Email</span>
                        <div className="flex-grow border-t border-surface-700/60"></div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                            <input
                                id="email-input"
                                type="email"
                                placeholder="電子郵件"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input-field pl-10"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                            <input
                                id="password-input"
                                type="password"
                                placeholder="密碼（至少 6 位）"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-field pl-10"
                                minLength={6}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm animate-fade-in">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary justify-center py-3 text-base"
                            id="email-submit-btn"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? '註冊帳號' : '登入'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Sign Up / Sign In */}
                    <p className="text-center text-sm text-surface-400 mt-5">
                        {isSignUp ? '已有帳號？' : '還沒有帳號？'}
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
                            className="text-primary-400 hover:text-primary-300 font-medium ml-1 transition-colors"
                            id="toggle-auth-mode"
                        >
                            {isSignUp ? '登入' : '註冊'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
