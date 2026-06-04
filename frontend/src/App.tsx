import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import type { ReactNode } from 'react';

// Pages
import Home          from './pages/Home';
import Login         from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterTutor   from './pages/RegisterTutor';
import ForgotPassword  from './pages/ForgotPassword';
import CourseList      from './pages/CourseList';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard   from './pages/TutorDashboard';
import AdminDashboard   from './pages/AdminDashboard';
import ProfilePage      from './pages/ProfilePage';
import CourseRoom       from './pages/CourseRoom';
import ReviewPage       from './pages/ReviewPage';
import TutorContractPage  from './pages/TutorContractPage';
import TutorProfileDetail from './pages/TutorProfileDetail';
import CourseDetail       from './pages/CourseDetail';
import TutorPaymentPage   from './pages/TutorPaymentPage';
import TutorList          from './pages/TutorList';
import VNPayReturn        from './pages/VNPayReturn';

// Guard: chỉ cho vào nếu đã đăng nhập đúng role
function RoleGuard({ role, children }: { role: string | string[]; children: ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải...</div>;
    if (!user) return <Navigate to="/login" replace />;
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) return <Navigate to="/" replace />;
    return <>{children}</>;
}

// Guard: chỉ cho vào nếu đã đăng nhập (bất kỳ role)
function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang tải...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* ===== PUBLIC ===== */}
            <Route path="/"           element={<Home />} />
            <Route path="/courses"    element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/tutors"     element={<TutorList />} />

            {/* Auth — redirect nếu đã đăng nhập */}
            <Route path="/login"
                element={user ? <Navigate to={`/${user.role.toLowerCase()}`} replace /> : <Login />} />
            <Route path="/register/student" element={<RegisterStudent />} />
            <Route path="/register/tutor"   element={<RegisterTutor />} />
            <Route path="/forgot-password"  element={<ForgotPassword />} />

            {/* ===== PROTECTED — STUDENT ===== */}
            <Route path="/student" element={
                <RoleGuard role="STUDENT"><StudentDashboard /></RoleGuard>
            } />
            <Route path="/student/course/:courseId" element={
                <RoleGuard role="STUDENT"><CourseRoom /></RoleGuard>
            } />
            <Route path="/student/review/:registrationId" element={
                <RoleGuard role="STUDENT"><ReviewPage /></RoleGuard>
            } />

            {/* ===== PROTECTED — TUTOR ===== */}
            <Route path="/tutor" element={
                <RoleGuard role="TUTOR"><TutorDashboard /></RoleGuard>
            } />
            <Route path="/tutor/course/:courseId" element={
                <RoleGuard role="TUTOR"><CourseRoom /></RoleGuard>
            } />
            <Route path="/tutor/contracts" element={
                <RoleGuard role="TUTOR"><TutorContractPage /></RoleGuard>
            } />
            <Route path="/tutor/payments" element={
                <RoleGuard role="TUTOR"><TutorPaymentPage /></RoleGuard>
            } />

            {/* ===== PUBLIC — TUTOR PROFILE ===== */}
            <Route path="/tutor-profile/:id" element={<TutorProfileDetail />} />

            {/* ===== VNPAY RETURN ===== */}
            <Route path="/payment/vnpay/return" element={<VNPayReturn />} />

            {/* ===== PROTECTED — ADMIN ===== */}
            <Route path="/admin" element={
                <RoleGuard role="ADMIN"><AdminDashboard /></RoleGuard>
            } />

            {/* ===== PROTECTED — ANY ROLE ===== */}
            <Route path="/profile" element={
                <AuthGuard><ProfilePage /></AuthGuard>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 3500,
                        style: { borderRadius: '10px', fontFamily: 'inherit', fontSize: '0.9rem' },
                        success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
                        error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
                    }}
                />
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}
