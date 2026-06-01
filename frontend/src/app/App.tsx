import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { ChatPage } from "../features/chat/ChatPage";
import { useAuthStore } from "../store/authStore";
import { ErrorBoundary } from "./ErrorBoundary";

export const App = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/chat"
      element={
        <ErrorBoundary>
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        </ErrorBoundary>
      }
    />
    <Route path="*" element={<Navigate to="/chat" replace />} />
  </Routes>
);

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};
