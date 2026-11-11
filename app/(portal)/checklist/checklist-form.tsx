"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateCompletion, CHECKLIST_ITEMS, STATUS_LABELS } from "@/lib/checklist";
import type { ChecklistStatus, Farm } from "@/lib/types";
import styles from "./page.module.css";

type DraftResponse = { status?: ChecklistStatus; note: string };

const CHECKLIST_SECTIONS = [
  {
    title: "Records and traceability",
    description: "Confirm that people and shared equipment can be traced.",
    itemIds: ["visitor_log", "equipment_cleaning"],
  },
  {
    title: "Farm controls",
    description: "Review the controls that reduce entry and feed-related risks.",
    itemIds: ["entry_controls", "feed_water"],
  },
  {
    title: "Animal monitoring",
    description: "Check that health and mortality observations are current.",
    itemIds: ["animal_health", "mortality_disposal"],
  },
] as const;

function todayForInput() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function ChecklistForm({ farms, initialFarmId }: { farms: Farm[]; initialFarmId?: string }) {
  const router = useRouter();
  const submissionKey = useRef(crypto.randomUUID());
  const [farmId, setFarmId] = useState(initialFarmId ?? farms[0]?.id ?? "");
  const [assessedOn, setAssessedOn] = useState(todayForInput);
  const [responses, setResponses] = useState<Record<string, DraftResponse>>(() =>
    Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.id, { note: "" }])),
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const answered = Object.values(responses).filter((response) => response.status);
  const summary = useMemo(
    () => calculateCompletion(answered as { status: ChecklistStatus }[]),
    [answered],
  );

  function updateStatus(itemId: string, status: ChecklistStatus) {
    setResponses((current) => ({
      ...current,
      [itemId]: { ...current[itemId], status },
    }));
  }

  function updateNote(itemId: string, note: string) {
    setResponses((current) => ({
      ...current,
      [itemId]: { ...current[itemId], note },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (!farmId || !assessedOn || answered.length !== CHECKLIST_ITEMS.length) {
      setError("Select a farm and date, then answer every checklist item.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId,
          assessedOn,
          submissionKey: submissionKey.current,
          responses: CHECKLIST_ITEMS.map((item) => ({
            itemId: item.id,
            status: responses[item.id].status,
            note: responses[item.id].note,
          })),
        }),
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id) {
        setError(result.error ?? "The assessment could not be saved. Please try again.");
        return;
      }
      router.push(`/history/${result.id}?saved=1`);
      router.refresh();
    } catch {
      setError("The assessment could not be saved. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={`card ${styles.detailsCard}`}>
        <div className="field">
          <label htmlFor="farm">Farm</label>
          <select id="farm" value={farmId} onChange={(event) => setFarmId(event.target.value)} required>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name} · {farm.type === "pig" ? "Pig" : "Poultry"}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="assessedOn">Assessment date</label>
          <input
            id="assessedOn"
            type="date"
            value={assessedOn}
            onChange={(event) => setAssessedOn(event.target.value)}
            required
          />
        </div>
      </section>

      <div className={styles.progressRow} aria-live="polite">
        <span>{answered.length} of {CHECKLIST_ITEMS.length} answered</span>
        <div><i style={{ width: `${(answered.length / CHECKLIST_ITEMS.length) * 100}%` }} /></div>
      </div>

      <div className={styles.items}>
        {CHECKLIST_SECTIONS.map((section) => (
          <section className={styles.itemSection} key={section.title}>
            <header className={styles.sectionHeader}>
              <div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <span>
                {section.itemIds.filter((itemId) => responses[itemId].status).length}/{section.itemIds.length}
              </span>
            </header>
            <div className={styles.sectionItems}>
              {CHECKLIST_ITEMS.filter((item) => section.itemIds.some((itemId) => itemId === item.id)).map((item) => {
                const index = CHECKLIST_ITEMS.findIndex((candidate) => candidate.id === item.id);
                return (
                  <fieldset className={`card ${styles.itemCard}`} key={item.id}>
                    <legend>
                      <span>{index + 1}</span> {item.label}
                    </legend>
                    <p className="muted">{item.help}</p>
                    <div className={styles.statusGroup}>
                      {(Object.keys(STATUS_LABELS) as ChecklistStatus[]).map((status) => {
                        const selected = responses[item.id].status === status;
                        return (
                          <label
                            className={`${styles.statusOption} ${styles[status]} ${selected ? styles.selectedStatus : ""}`}
                            key={status}
                          >
                            <input
                              type="radio"
                              name={`status-${item.id}`}
                              value={status}
                              checked={selected}
                              onChange={() => updateStatus(item.id, status)}
                              required
                            />
                            <span className={styles.statusDot} aria-hidden="true">{selected ? "✓" : ""}</span>
                            {STATUS_LABELS[status]}
                          </label>
                        );
                      })}
                    </div>
                    <div className="field">
                      <label htmlFor={`note-${item.id}`}>Optional note</label>
                      <textarea
                        id={`note-${item.id}`}
                        maxLength={500}
                        placeholder="Add a record reference or follow-up detail"
                        value={responses[item.id].note}
                        onChange={(event) => updateNote(item.id, event.target.value)}
                      />
                    </div>
                  </fieldset>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <aside className={`card ${styles.summary}`} aria-live="polite">
        <div>
          <p className={styles.summaryLabel}>Checklist completion</p>
          <strong className={styles.percentage}>
            {summary.percentage === null ? "—" : `${summary.percentage}%`}
          </strong>
          {summary.percentage === null && answered.length > 0 ? (
            <p>Not calculated because all answered items are Not applicable.</p>
          ) : null}
        </div>
        <dl>
          <div><dt>Done</dt><dd>{summary.done}</dd></div>
          <div><dt>Needs follow-up</dt><dd>{summary.followUp}</dd></div>
          <div><dt>Not applicable</dt><dd>{summary.notApplicable}</dd></div>
        </dl>
      </aside>

      {error ? <p className={`error ${styles.formError}`} role="alert">{error}</p> : null}
      <div className={styles.saveRow}>
        <p className="muted">Saved as an internal self-assessment record.</p>
        <button className="button" type="submit" disabled={submitting || farms.length === 0}>
          {submitting ? "Saving assessment…" : "Save assessment"}
        </button>
      </div>
    </form>
  );
}
