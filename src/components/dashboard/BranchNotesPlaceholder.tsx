import { DashboardCard } from "../ui/DashboardCard";
import { getFeatureFlags } from "../../services/settingsService";

export function BranchNotesPlaceholder() {
  // Revisit Branch Notes after evaluating long-term note synchronization options.
  if (!getFeatureFlags().branchNotes) {
    return null;
  }

  return (
    <DashboardCard className="branch-notes-card">
      <h2>Branch Notes</h2>
      <p>Notes sync is not enabled yet.</p>
    </DashboardCard>
  );
}
