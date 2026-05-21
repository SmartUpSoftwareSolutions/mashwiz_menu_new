// export default AdminLogin;
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/auth.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import SocialLogin from "@/components/register/SocialLogin";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const isSubmitDisabled = useMemo(
    () => !email.trim() || !password.trim() || isLoading,
    [email, password, isLoading]
  );

  const handleLogin = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitDisabled) return;

      setIsLoading(true);
      try {
        await login({ email, password });
        navigate("/admin");
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unable to sign in. Try again.";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, navigate, isSubmitDisabled]
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,244,230,0.6),_transparent_60%)]" />
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-orange-100 bg-white/95 p-10 shadow-2xl backdrop-blur-xl sm:p-12">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Admin Workspace
          </h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Sign in with your credentials to manage menu, locations, and more.
          </p>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-800">
              Email Address
            </Label>
            <Input
              id="email"
              // type="email"
              autoComplete="email"
              placeholder="admin@restaurant.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-2xl border border-orange-100 bg-white/90 text-sm shadow-sm transition focus:border-orange-300 focus:ring-orange-200"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-800">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-2xl border border-orange-100 bg-white/90 text-sm shadow-sm transition focus:border-orange-300 focus:ring-orange-200"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className={cn(
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-white shadow-md transition",
              "hover:from-orange-600 hover:to-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200",
              isSubmitDisabled && "cursor-not-allowed opacity-60"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <SocialLogin />
      </div>
    </div>
  );
};

export default AdminLogin;
