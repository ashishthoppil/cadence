import { DashboardShell } from "@/components/dashboard-shell";
import { WorkspaceProvider } from "@/components/workspace-provider";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <WorkspaceProvider>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
