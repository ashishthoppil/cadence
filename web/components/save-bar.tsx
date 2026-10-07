"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui";

/** Floating "unsaved changes" bar shown while a settings draft differs from what's stored. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <AnimatePresence>
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-raised/95 py-2 pr-2 pl-5 shadow-2xl backdrop-blur-xl">
            <span className="text-sm text-ink-soft">You have unsaved changes</span>
            <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
              Discard
            </Button>
            <Button size="sm" onClick={onSave} loading={saving}>
              Save changes
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
