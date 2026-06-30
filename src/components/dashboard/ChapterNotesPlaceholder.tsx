import { featureFlags } from "../../data/featureFlags";
import { DashboardCard } from "../ui/DashboardCard";

export function ChapterNotesPlaceholder() {
  // Revisit Chapter Notes after evaluating long-term note synchronization options.
  if (!featureFlags.chapterNotes) {
    return null;
  }

  return (
    <DashboardCard className="chapter-notes-card">
      <h2>Chapter Notes</h2>
      <p>Notes sync is not enabled yet.</p>
    </DashboardCard>
  );
}
