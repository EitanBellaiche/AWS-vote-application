import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./ui.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "react-oidc-context";
import { oidcConfig } from "./auth/oidcConfig";

import App from "./App.jsx";
import UserVote from "./pages/UserVote.jsx";

function RequireAuth({ children }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <div className="auth-gate">
        <div className="auth-card">
          <div className="auth-title">Preparing login</div>
          <div className="auth-sub">Checking your session…</div>
        </div>
      </div>
    );
  }
  if (!auth.isAuthenticated) {
    auth.signinRedirect();
    return (
      <div className="auth-gate">
        <div className="auth-card">
          <div className="auth-title">Redirecting to AWS login</div>
          <div className="auth-sub">Please wait, you’ll be back shortly.</div>
        </div>
      </div>
    );
  }
  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/user-vote"
            element={
              <RequireAuth>
                <UserVote />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
