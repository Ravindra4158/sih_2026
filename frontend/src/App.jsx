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
import Result from "./pages/Result";
import Cases from "./pages/Cases";
import Analytics from "./pages/Analytics";
import PendingCases from "./pages/PendingCases";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

// New Dynamic Pages
import ScreeningPipeline from "./pages/ScreeningPipeline";
import ScreeningResult from "./pages/ScreeningResult";
import BiometricsDetail from "./pages/BiometricsDetail";
import ForensicsDetail from "./pages/ForensicsDetail";
import DocumentDataDetail from "./pages/DocumentDataDetail";
import CaseReview from "./pages/CaseReview";

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
            <Route path="result" element={<Result />} />
            <Route path="history" element={<Cases />} />
            <Route path="pending" element={<PendingCases />} />
            <Route path="reports" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Dynamic Screening Routes */}
          <Route 
            path="/screening/:id" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ScreeningPipeline />} />
            <Route path="results" element={<ScreeningResult />} />
            <Route path="biometrics" element={<BiometricsDetail />} />
            <Route path="forensics" element={<ForensicsDetail />} />
            <Route path="data" element={<DocumentDataDetail />} />
          </Route>

          {/* Dynamic Case Review Route */}
          <Route 
            path="/cases/:id" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CaseReview />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
