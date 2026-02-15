import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { BookOpen, LogOut, LayoutDashboard, Settings } from 'lucide-react';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 border-b border-surface-800/60" style={{
            background: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
        }}>
            <div className="w-full max-w-screen-2xl mx-auto px-6 lg:px-10">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
                            <BookOpen size={18} className="text-white" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-primary-300 to-primary-500 bg-clip-text text-transparent">
                            學習筆記
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-1">
                        <Link
                            to="/"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/')
                                ? 'bg-primary-500/15 text-primary-300'
                                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                                }`}
                        >
                            <LayoutDashboard size={16} />
                            <span className="hidden sm:inline">總表</span>
                        </Link>
                        <Link
                            to="/setup"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/setup')
                                ? 'bg-primary-500/15 text-primary-300'
                                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                                }`}
                        >
                            <Settings size={16} />
                            <span className="hidden sm:inline">設定</span>
                        </Link>
                    </div>

                    {/* User & Logout */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2">
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="avatar"
                                    className="w-7 h-7 rounded-full ring-2 ring-surface-700"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xs font-bold text-white">
                                    {(user.email?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                            <span className="text-sm text-surface-400 max-w-[140px] truncate">
                                {user.user_metadata?.full_name || user.email}
                            </span>
                        </div>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="登出"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">登出</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
