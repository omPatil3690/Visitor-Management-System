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
import { VisitorRegistration } from "./components/VisitorRegistration";
import { useAuthStore } from "./store/auth";
import Home from "./components/Home";


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
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

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
          <Route path="visitor" element={<VisitorRegistration />} />
          <Route path="approval" element={<VisitorApproval />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>


  );
}

export default App;
