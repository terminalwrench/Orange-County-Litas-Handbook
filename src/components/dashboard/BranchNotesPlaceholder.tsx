import { featureFlags } from "../../data/featureFlags";
import { DashboardCard } from "../ui/DashboardCard";

export function BranchNotesPlaceholder() {
  // Revisit Branch Notes after evaluating long-term note synchronization options.
  if (!featureFlags.branchNotes) {
    return null;
  }

  return (
    <DashboardCard className="branch-notes-card">
      <h2>Branch Notes</h2>
      <p>Notes sync is not enabled yet.</p>
    </DashboardCard>
  );
}
