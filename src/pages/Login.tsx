import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const inputClass = "w-full border rounded-lg p-3";

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) {
    navigate("/inbox", { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/inbox", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Agent Login</h1>
        <p className="text-gray-500 mb-6 text-sm">Sign in to view your inbox</p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-lg p-3"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
