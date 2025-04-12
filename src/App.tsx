import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { VisitorApproval } from "./components/VisitorApproval";
import { PublicDisplay } from "./components/PublicDisplay";
import { RegisterVisitor } from "./components/RegisterVisitor";
import { UserManagement } from "./components/UserManagement";
import { VisitLogs } from "./components/VisitLogs";
import { VisitorRegistration } from "./components/VisitorRegistration"; // ✅ Import the correct component
import { useAuthStore } from "./store/auth";

// ✅ Private Route (Ensures authentication before accessing pages)
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  console.log("🔍 Auth State →", { isAuthenticated, isLoading });

  if (isLoading) {
    return <div className="loading">🔄 Loading authentication...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

// ✅ Main App Component
function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    console.log("🔄 Initializing authentication...");
    initializeAuth().finally(() => {
      setAuthInitialized(true);
    });
  }, []);

  if (!authInitialized) {
    return <div className="loading">🔄 Initializing authentication...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* ✅ Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/display" element={<PublicDisplay />} />

        {/* ✅ Protected Routes (Requires Login) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="register" element={<RegisterVisitor />} />
          <Route path="approval" element={<VisitorApproval />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="logs" element={<VisitLogs />} />
          <Route path="register-visitor" element={<VisitorRegistration />} /> {/* ✅ FIXED: Added Route */}
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
