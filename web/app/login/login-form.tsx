"use client";

import { ArrowRight, MailCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Field, Input, Segmented } from "@/components/ui";
import { supabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic";

export function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const next = params.get("next") ?? "/dashboard";
  const error = params.get("error");

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    setGoogleLoading(true);
    const { error } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback() },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const auth = supabase().auth;
      if (mode === "magic") {
        const { error } = await auth.signInWithOtp({ email, options: { emailRedirectTo: callback() } });
        if (error) throw error;
        setSent("We sent you a sign-in link.");
      } else if (mode === "signup") {
        const { data, error } = await auth.signUp({ email, password, options: { emailRedirectTo: callback() } });
        if (error) throw error;
        if (data.session) router.replace("/onboarding");
        else setSent("Confirm your email to finish creating your account.");
      } else {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-tint/10 bg-tint/[0.04]">
          <MailCheck className="size-5 text-brand-soft" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">Check your inbox</h2>
        <p className="mt-2 text-sm text-ink-mute">
          {sent} It was sent to <span className="text-ink-soft">{email}</span>.
        </p>
        <Button variant="ghost" size="sm" className="mt-6" onClick={() => setSent(null)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Button type="button" variant="secondary" size="lg" className="w-full" loading={googleLoading} onClick={google}>
        {!googleLoading && <GoogleIcon />}
        {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
      </Button>
      <div className="flex items-center gap-3 text-xs text-ink-mute">
        <span className="h-px flex-1 bg-line" />
        or with email
        <span className="h-px flex-1 bg-line" />
      </div>
      <Segmented<Mode>
        value={mode}
        onChange={setMode}
        className="grid w-full grid-cols-3"
        options={[
          { value: "signin", label: <span className="w-full">Sign in</span> },
          { value: "signup", label: <span className="w-full">Create account</span> },
          { value: "magic", label: <span className="w-full">Magic link</span> },
        ]}
      />
      {error && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
      )}
      <Field label="Email">
        {(id) => (
          <Input
            id={id}
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>
      {mode !== "magic" && (
        <Field label="Password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
      )}
      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Email me a link"}
        {!loading && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}
