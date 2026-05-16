import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
