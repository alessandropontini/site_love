import type { Change, Plan } from "@/lib/guest-sync/model";
import { householdSummary, planningDetails } from "@/lib/guest-sync/presentation";
import styles from "./sync.module.css";

const labels: Record<Change["operation"], string> = {
  INSERT: "New", UPDATE: "Modified", "NO CHANGE": "Unchanged",
  "MISSING FROM SOURCE": "Missing from Sheet — retained"
};

export default function PreviewDetails({ plan }: { plan: Plan }) {
  const households = householdSummary(plan);
  const unchanged = plan.changes.filter(c => c.operation === "NO CHANGE" && !c.errors.length);
  const review = plan.changes.filter(c => c.operation !== "NO CHANGE" || c.errors.length);
  const renderTable = (changes: Change[]) => (
    <div className={styles.scroll} role="region" aria-label="Planning changes" tabIndex={0}>
      <table>
        <caption>Planning details — current → proposed</caption>
        <thead><tr><th scope="col">Guest / household</th><th scope="col">Operation</th><th scope="col">Details</th><th scope="col">Validation</th></tr></thead>
        <tbody>{changes.map((change, index) => (
          <tr key={`${(change.next ?? change.current)!.externalId}:${index}`}>
            <th scope="row">{change.guest}</th>
            <td>{labels[change.operation]}</td>
            <td><dl className={styles.differences}>{planningDetails(change).map(row => (
              <div key={row.field}><dt>{row.label}</dt><dd>
                {change.operation === "MISSING FROM SOURCE" || change.operation === "NO CHANGE"
                  ? row.before
                  : <><span>{row.before}</span><span aria-label=" changes to "> → </span><strong>{row.after}</strong></>}
              </dd></div>
            ))}</dl>{change.operation === "MISSING FROM SOURCE" && <p>Stored values are retained. Nothing is deleted.</p>}</td>
            <td className={change.errors.length ? styles.errors : undefined}>
              {change.errors.length ? <ul>{change.errors.map((error, i) => <li key={i}>{error}</li>)}</ul> : "Valid"}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
  return <>
    <dl className={styles.metrics}>
      <div><dt>Households represented in this plan</dt><dd>{households.length}</dd></div>
      <div><dt>Households with proposed inserts or updates</dt><dd>{households.filter(h => h.changed).length}</dd></div>
      <div><dt>Households with row errors</dt><dd>{households.filter(h => h.blocked).length}</dd></div>
    </dl>
    <details><summary>Households in this plan ({households.length})</summary>
      <ul>{households.map((h, i) => <li key={i}>{h.name}: {h.rows} planning rows — {h.blocked ? "Blocked" : h.changed ? "Changes proposed" : "No inserts or updates"}</li>)}</ul>
    </details>
    <h3>Rows to review ({review.length})</h3>
    {review.length ? renderTable(review) : <p>No new, modified, missing or blocked rows.</p>}
    {!!unchanged.length && <details><summary>Unchanged rows ({unchanged.length})</summary>{renderTable(unchanged)}</details>}
  </>;
}
