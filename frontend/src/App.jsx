import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import "./styles.css";

import Welcome from "./pages/Welcome";
import AuthLayout from "./pages/AuthLayout";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import TwoFactor from "./pages/TwoFactor";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Screening from "./pages/Screening";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/2fa" element={<TwoFactor />} />
          </Route>

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="screening" element={<Screening />} />
            {/* Placeholders for other routes */}
            <Route path="history" element={<div className="content"><h2>Case History</h2></div>} />
            <Route path="pending" element={<div className="content"><h2>Pending Cases</h2></div>} />
            <Route path="reports" element={<div className="content"><h2>Reports</h2></div>} />
            <Route path="notifications" element={<div className="content"><h2>Notifications</h2></div>} />
            <Route path="settings" element={<div className="content"><h2>Settings</h2></div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
