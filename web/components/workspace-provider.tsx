"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { EMPTY_CALENDAR } from "@/lib/presets";
import { supabase } from "@/lib/supabase/client";
import { ENTITLED_STATUSES, FREE_POSTS, type PlanId } from "@/lib/plans";
import type { CalendarSlot, Subscription, Workspace } from "@/lib/types";

interface WorkspaceContext {
  user: User | null;
  workspace: Workspace | null;
  slots: CalendarSlot[];
  subscription: Subscription | null;
  /** The plan in effect: a paid plan while the subscription is active, otherwise "free". */
  plan: "free" | PlanId;
  freePostsLeft: number;
  loading: boolean;
  reloadSubscription: () => Promise<void>;
  saveWorkspace: (patch: Partial<Workspace>) => Promise<Workspace>;
  saveSlots: (slots: CalendarSlot[]) => Promise<void>;
}

const Ctx = createContext<WorkspaceContext | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [slots, setSlots] = useState<CalendarSlot[]>(EMPTY_CALENDAR);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadSubscription = useCallback(async () => {
    const { data } = await supabase().from("subscriptions").select("*").maybeSingle();
    setSubscription(data as Subscription | null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = supabase();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (cancelled) return;
      setUser(user);
      if (!user) return setLoading(false);
      const [{ data: ws }, { data: cal }, { data: sub }] = await Promise.all([
        db.from("workspaces").select("*").eq("owner_id", user.id).maybeSingle(),
        db.from("calendar_slots").select("weekday, format, theme, brief, other_content").order("weekday"),
        db.from("subscriptions").select("*").maybeSingle(),
      ]);
      if (cancelled) return;
      setWorkspace(ws as Workspace | null);
      setSubscription(sub as Subscription | null);
      if (cal?.length) {
        setSlots(EMPTY_CALENDAR.map((s) => (cal as CalendarSlot[]).find((c) => c.weekday === s.weekday) ?? s));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveWorkspace = useCallback(
    async (patch: Partial<Workspace>) => {
      if (!user) throw new Error("Not signed in");
      const db = supabase();
      const query = workspace
        ? db.from("workspaces").update(patch).eq("id", workspace.id)
        : db.from("workspaces").insert({ ...patch, owner_id: user.id });
      const { data, error } = await query.select("*").single();
      if (error) throw error;
      setWorkspace(data as Workspace);
      return data as Workspace;
    },
    [user, workspace],
  );

  const saveSlots = useCallback(
    async (next: CalendarSlot[]) => {
      if (!workspace) throw new Error("Create your workspace first");
      const { error } = await supabase()
        .from("calendar_slots")
        .upsert(next.map((s) => ({ ...s, workspace_id: workspace.id })));
      if (error) throw error;
      setSlots(next);
    },
    [workspace],
  );

  const plan = subscription && ENTITLED_STATUSES.includes(subscription.status) ? subscription.plan : "free";
  const freePostsLeft = Math.max(0, FREE_POSTS - (workspace?.free_posts_used ?? 0));

  return (
    <Ctx.Provider
      value={{ user, workspace, slots, subscription, plan, freePostsLeft, loading, saveWorkspace, saveSlots, reloadSubscription }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
