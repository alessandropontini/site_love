import type { QuestProgressSnapshot } from "@/components/quest/questSchema";

export function QuestSummary({ snapshot }: { snapshot: QuestProgressSnapshot }) {
  return (
    <div className="quest-summary">
      <div>
        <span>Stages cleared</span>
        <strong>
          {snapshot.completedCount}/{snapshot.total}
        </strong>
      </div>
      <div>
        <span>Hearts collected</span>
        <strong>{snapshot.heartsCollected}</strong>
      </div>
      <div>
        <span>Next chapter</span>
        <strong>
          {snapshot.completedCount === snapshot.total
            ? "Credits"
            : `Stage ${snapshot.completedCount + 1}`}
        </strong>
      </div>
    </div>
  );
}

export default QuestSummary;
