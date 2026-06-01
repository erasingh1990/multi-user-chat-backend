import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../../components/auth/AuthShell";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const loading = useAuthStore((state) => state.loading);
  const loadUsers = useChatStore((state) => state.loadUsers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);

    try {
      await login({ email, password });
      const token = useAuthStore.getState().token;
      if (token) {
        const currentUser = await loadUsers(token, email);
        setCurrentUser(currentUser);
      }
      navigate("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your conversations">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-chat-accent"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-chat-accent"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
          />
        </label>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <button className="h-11 rounded-md bg-chat-accent font-semibold text-white disabled:opacity-60" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="text-center text-sm text-slate-500">
          New here? <Link className="font-semibold text-chat-accent" to="/register">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
};
