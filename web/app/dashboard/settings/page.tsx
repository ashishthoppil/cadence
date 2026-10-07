import { Suspense } from "react";
import { SettingsView } from "./settings-view";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <SettingsView />
    </Suspense>
  );
}
