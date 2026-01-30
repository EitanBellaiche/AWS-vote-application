import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // כשה-auth מסתיים, נזרוק את המשתמש למסך הצבעה (או דף הבית)
    if (auth.isAuthenticated) navigate("/user-vote");
  }, [auth.isAuthenticated, navigate]);

  if (auth.isLoading) return <div style={{ padding: 24 }}>Connecting...</div>;
  if (auth.error) return <div style={{ padding: 24 }}>Auth error: {auth.error.message}</div>;

  return <div style={{ padding: 24 }}>Finishing login...</div>;
}
