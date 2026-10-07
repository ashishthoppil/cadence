import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Set up" };

export default function OnboardingPage() {
  return (
    <WorkspaceProvider>
      <Suspense fallback={<div className="skeleton m-8 h-96 rounded-2xl" />}>
        <OnboardingWizard />
      </Suspense>
    </WorkspaceProvider>
  );
}
