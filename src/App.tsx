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
import { VisitorRegistration } from "./components/VisitorRegistration";
import { useAuthStore } from "./store/auth";
import Home from "./components/Home";
import { RequestVisit } from "./components/RequestVisit";


function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="loading">🔄 Loading authentication...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}


function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    console.log("🔄 Initializing authentication... dfgb");
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
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/display" element={<PublicDisplay />} />
        <Route path="/request-visit" element={<RequestVisit />} />

        {/* Private Routes */}
        <Route
          path="/dashboard"
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
          <Route path="register-visitor" element={<VisitorRegistration />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>


  );
}

export default App;
