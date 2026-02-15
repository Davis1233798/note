import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import {
    LayoutDashboard,
    PlusCircle,
    BookOpen,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    isMobile: boolean;
}

export default function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // Auto-close on mobile when route changes
    useEffect(() => {
        if (isMobile && isOpen) {
            setIsOpen(false);
        }
    }, [location.pathname, isMobile]);

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: '總覽 Dashboard' },
        { path: '/new', icon: PlusCircle, label: '新增筆記' },
        { path: '/guide', icon: BookOpen, label: '使用教學' },
        { path: '/setup', icon: Settings, label: '系統設定' },
    ];

    const sidebarClass = isMobile
        ? `fixed inset-y-0 left-0 z-50 w-64 bg-surface-900 border-r border-surface-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        : `sticky top-0 h-screen bg-surface-900 border-r border-surface-800 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'} flex flex-col`;

    return (
        <aside className={sidebarClass}>
            {/* Header / Logo */}
            <div className={`h-16 flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between px-6'} border-b border-surface-800`}>
                <Link to="/" className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0">
                        <BookOpen size={18} className="text-white" />
                    </div>
                    {(!collapsed || isMobile) && (
                        <span className="font-bold text-lg text-white whitespace-nowrap">
                            SQL Master
                        </span>
                    )}
                </Link>
                {isMobile && (
                    <button onClick={() => setIsOpen(false)} className="text-surface-400 hover:text-white">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive(item.path)
                            ? 'bg-primary-500/10 text-primary-400'
                            : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
                            }`}
                        title={collapsed && !isMobile ? item.label : ''}
                    >
                        <item.icon size={20} className={`shrink-0 ${isActive(item.path) ? 'text-primary-400' : 'group-hover:text-surface-200'}`} />
                        {(!collapsed || isMobile) && (
                            <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-surface-800">
                <div className={`flex items-center gap-3 p-2 rounded-lg ${!collapsed || isMobile ? 'bg-surface-800/50' : 'justify-center'}`}>
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="User" className="w-8 h-8 rounded-full bg-surface-700" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-surface-700 to-surface-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {(user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                    )}

                    {(!collapsed || isMobile) && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.user_metadata?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                        </div>
                    )}

                    {(!collapsed || isMobile) && (
                        <button
                            onClick={signOut}
                            className="p-1.5 rounded-md text-surface-400 hover:text-red-400 hover:bg-surface-700 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>

                {/* Collapse Toggle (Desktop Only) */}
                {!isMobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center mt-2 p-1 text-surface-500 hover:text-white transition-colors"
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                )}
            </div>
        </aside>
    );
}
