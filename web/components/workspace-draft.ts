"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/workspace-provider";
import type { Workspace } from "@/lib/types";
import { pickEditable } from "@/lib/workspace";

/** Local editable copy of the workspace with dirty tracking and save/reset. */
export function useWorkspaceDraft() {
  const { workspace, saveWorkspace } = useWorkspace();
  const [draft, setDraft] = useState<Partial<Workspace>>(workspace ?? {});
  const [synced, setSynced] = useState(workspace);
  const [saving, setSaving] = useState(false);

  // Adopt the stored workspace whenever it changes (initial load or after a save).
  if (synced !== workspace) {
    setSynced(workspace);
    if (workspace) setDraft(workspace);
  }

  const dirty = !!workspace && JSON.stringify(pickEditable(draft)) !== JSON.stringify(pickEditable(workspace));

  async function save(validate?: (d: Partial<Workspace>) => string | null) {
    const problem = validate?.(draft);
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      await saveWorkspace(pickEditable(draft));
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return {
    workspace,
    draft,
    patch: (p: Partial<Workspace>) => setDraft((d) => ({ ...d, ...p })),
    dirty,
    saving,
    save,
    reset: () => workspace && setDraft(workspace),
  };
}
