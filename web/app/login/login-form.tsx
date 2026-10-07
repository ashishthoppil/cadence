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
  const [sent, setSent] = useState<string | null>(null);
  const next = params.get("next") ?? "/dashboard";
  const error = params.get("error");

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

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
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
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
