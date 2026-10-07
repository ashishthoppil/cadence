"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { EMPTY_CALENDAR } from "@/lib/presets";
import { supabase } from "@/lib/supabase/client";
import type { CalendarSlot, Workspace } from "@/lib/types";

interface WorkspaceContext {
  user: User | null;
  workspace: Workspace | null;
  slots: CalendarSlot[];
  loading: boolean;
  saveWorkspace: (patch: Partial<Workspace>) => Promise<Workspace>;
  saveSlots: (slots: CalendarSlot[]) => Promise<void>;
}

const Ctx = createContext<WorkspaceContext | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [slots, setSlots] = useState<CalendarSlot[]>(EMPTY_CALENDAR);
  const [loading, setLoading] = useState(true);

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
      const [{ data: ws }, { data: cal }] = await Promise.all([
        db.from("workspaces").select("*").eq("owner_id", user.id).maybeSingle(),
        db.from("calendar_slots").select("weekday, format, theme, brief, other_content").order("weekday"),
      ]);
      if (cancelled) return;
      setWorkspace(ws as Workspace | null);
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

  return (
    <Ctx.Provider value={{ user, workspace, slots, loading, saveWorkspace, saveSlots }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
