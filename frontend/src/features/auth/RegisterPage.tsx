import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../../components/auth/AuthShell";
import { useAuthStore } from "../../store/authStore";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);

    try {
      await register({ username, email, password });
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Register to start private chats">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Username
          <input className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-chat-accent" value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email
          <input className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-chat-accent" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Password
          <input className="h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-chat-accent" value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required />
        </label>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <button className="h-11 rounded-md bg-chat-accent font-semibold text-white disabled:opacity-60" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account? <Link className="font-semibold text-chat-accent" to="/login">Login</Link>
        </p>
      </form>
    </AuthShell>
  );
};
