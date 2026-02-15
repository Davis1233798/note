import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { UserDatabaseProvider } from './lib/UserDatabaseContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import SummaryPage from './pages/SummaryPage';
import NotePage from './pages/NotePage';
import CreateNotePage from './pages/CreateNotePage';
import GuidePage from './pages/GuidePage'; // [NEW] // [NEW]

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <UserDatabaseProvider>
                    <Navbar />
                    <main className="flex-1">
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/guide" element={<GuidePage />} />
                            <Route
                                path="/setup"
                                element={
                                    <ProtectedRoute>
                                        <SetupPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <SummaryPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/new"
                                element={
                                    <ProtectedRoute>
                                        <CreateNotePage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/notes/:id"
                                element={
                                    <ProtectedRoute>
                                        <NotePage />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </main>
                </UserDatabaseProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
