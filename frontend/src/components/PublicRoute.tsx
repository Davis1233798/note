import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

interface PublicRouteProps {
    children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-surface-950 text-surface-400">載入中...</div>;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
