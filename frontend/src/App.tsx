import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { UserDatabaseProvider } from './lib/UserDatabaseContext';
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import SummaryPage from './pages/SummaryPage';
import NotePage from './pages/NotePage';
import CreateNotePage from './pages/CreateNotePage';
import GuidePage from './pages/GuidePage';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <UserDatabaseProvider>
                    <div className="min-h-screen bg-surface-950 font-sans text-surface-50 selection:bg-primary-500/30">
                        <Routes>
                            <Route
                                path="/login"
                                element={
                                    <PublicRoute>
                                        <LoginPage />
                                    </PublicRoute>
                                }
                            />
                            <Route
                                path="/*"
                                element={
                                    <ProtectedRoute>
                                        <DashboardLayout>
                                            <Routes>
                                                <Route path="/" element={<SummaryPage />} />
                                                <Route path="/new" element={<CreateNotePage />} />
                                                <Route path="/guide" element={<GuidePage />} />
                                                <Route path="/setup" element={<SetupPage />} />
                                                <Route path="/notes/:id" element={<NotePage />} />
                                            </Routes>
                                        </DashboardLayout>
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </div>
                </UserDatabaseProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
