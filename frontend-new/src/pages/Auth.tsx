import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const body = isLogin 
        ? new URLSearchParams({ username: email, password })
        : JSON.stringify({ name, email, password });
        
      const headers = isLogin 
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : { "Content-Type": "application/json" };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Authentication failed");
      }

      const data = await res.json();
      login(data.access_token);
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Google authentication failed");
      }

      const data = await res.json();
      login(data.access_token);
      toast.success("Signed in with Google!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "DUMMY_CLIENT_ID";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md panel p-8 flex flex-col gap-6">
          <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {isLogin ? "Access Portal" : "Initialize Account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? "Enter your credentials to continue" : "Create a new lab environment"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="researcher@lab.com"
            />
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Dr. Jane Doe"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary text-primary-foreground py-2 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              toast.error("Google login failed");
            }}
            useOneTap
          />
        </div>
      </div>
    </div>
    </GoogleOAuthProvider>
  );
}
