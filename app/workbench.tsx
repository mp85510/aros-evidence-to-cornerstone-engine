"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { deriveGovernanceState, deterministicRecommendation, promotionBlockers, pulse } from "../lib/governance.mjs";

type Evidence = {
  id: string;
  title: string;
  source: string;
  owner: string | null;
  jurisdiction: string | null;
  classification: string;
  status: string;
  authorityState: string;
  confidence: number;
  citations: number;
  summary: string;
  version: number;
};

type Recommendation = {
  headline: string;
  rationale: string;
  nextAction: string;
  risk: "low" | "medium" | "high";
};

const seed: Evidence[] = ([
  { id: "EV-284", title: "Enterprise AI exception pattern", source: "Architecture council notes", owner: "Maya Chen", jurisdiction: "Enterprise Architecture", classification: "Observed pattern", status: "Drift risk", authorityState: "Observation only", confidence: 86, citations: 7, summary: "Three teams are applying the same exception logic without a governed decision." },
  { id: "EV-281", title: "Regional retention interpretation", source: "Legal advisory · EMEA", owner: "Jon Bell", jurisdiction: "Data Governance", classification: "Expert interpretation", status: "Classified", authorityState: "Observation only", confidence: 74, citations: 2, summary: "A regional interpretation may be crossing into enterprise policy." },
  { id: "EV-279", title: "Model access approval sequence", source: "Production operating guide", owner: "Priya Shah", jurisdiction: "AI Platform", classification: "Operational evidence", status: "Governed", authorityState: "Governed decision", confidence: 92, citations: 4, summary: "The approved sequence is owned, scoped, and linked to its evidence." },
  { id: "EV-276", title: "Third-party model risk threshold", source: "Risk working session", owner: null, jurisdiction: "Model Risk", classification: "Candidate decision", status: "Unowned", authorityState: "Observation only", confidence: 61, citations: 1, summary: "A proposed threshold has no accountable owner." },
  { id: "EV-272", title: "PII redaction verification", source: "Control test results", owner: "Owen Wright", jurisdiction: "Security Assurance", classification: "Validated control", status: "Classified", authorityState: "Observation only", confidence: 95, citations: 2, summary: "Control tests support a repeatable verification step." },
] as Omit<Evidence, "version">[]).map((record) => ({ ...record, version: 1 }));

const filters = ["All", "Review", "Drift risk", "Unowned", "Governed"];

export function GovernanceWorkbench() {
  const [records, setRecords] = useState(seed);
  const [active, setActive] = useState(seed[0].id);
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [persistence, setPersistence] = useState<"checking" | "durable" | "demo">("checking");
  const [recommendation, setRecommendation] = useState<Recommendation>(deterministicRecommendation(seed[0]));
  const [recommendationEngine, setRecommendationEngine] = useState("Rules v1");
  const [advisoryReference, setAdvisoryReference] = useState<{ evidenceId: string; id: string } | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const selected = records.find((item) => item.id === active) ?? records[0];
  const metrics = pulse(records);
  const blockers = selected ? promotionBlockers(selected) : [];
  const visible = useMemo(
    () => records.filter((item) => filter === "All" || deriveGovernanceState(item) === filter),
    [filter, records],
  );

  useEffect(() => {
    fetch("/api/evidence")
      .then(async (response) => {
        if (!response.ok) throw new Error("The evidence store could not be reached.");
        return response.json();
      })
      .then((body) => {
        setRecords(body.evidence);
        setPersistence(body.persistence ? "durable" : "demo");
        if (body.evidence[0]) {
          setActive(body.evidence[0].id);
          setRecommendation(deterministicRecommendation(body.evidence[0]));
          setRecommendationEngine("Rules v1");
        }
      })
      .catch(() => {
        setPersistence("demo");
        setError("Durable storage is unavailable. The workbench remains usable in review-only demo mode.");
      })
      .finally(() => setLoading(false));
  }, []);

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  async function mutate(payload: Record<string, unknown>) {
    setError("");
    const response = await fetch("/api/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "The governance action failed.");
    setPersistence(body.persistence ? "durable" : "demo");
    setRecords((current) => current.map((item) => item.id === body.evidence.id ? body.evidence : item));
    setRecommendation(deterministicRecommendation(body.evidence));
    setRecommendationEngine("Rules v1");
    setAdvisoryReference(null);
    return body.evidence as Evidence;
  }

  async function runAction(action: "classify" | "assign" | "promote") {
    if (!selected) return;
    try {
      const payload: Record<string, unknown> = { action, id: selected.id, expectedVersion: selected.version };
      if (action === "classify") payload.classification = selected.classification === "Unclassified" ? "Observed pattern" : selected.classification;
      if (action === "assign") {
        payload.owner = selected.owner ?? "Maya Chen";
        payload.jurisdiction = selected.jurisdiction ?? "Enterprise Architecture";
      }
      if (action === "promote" && advisoryReference?.evidenceId === selected.id) {
        payload.modelAdvisoryReference = advisoryReference.id;
      }
      const updated = await mutate(payload);
      announce(action === "promote"
        ? `${updated.id} is now a governed decision with an audit event.`
        : `${updated.id} updated. Authority remains ${updated.authorityState.toLowerCase()}.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The action failed.");
    }
  }

  async function addEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: form.get("title"),
          source: form.get("source"),
          owner: form.get("owner"),
          jurisdiction: form.get("jurisdiction"),
          classification: form.get("classification"),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Evidence could not be added.");
      setRecords((current) => [body.evidence, ...current]);
      setActive(body.evidence.id);
      setRecommendation(deterministicRecommendation(body.evidence));
      setRecommendationEngine("Rules v1");
      setAdvisoryReference(null);
      setFilter("All");
      setPersistence(body.persistence ? "durable" : "demo");
      setIntakeOpen(false);
      announce(`${body.evidence.id} added as observation only.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Evidence could not be added.");
    }
  }

  async function askArchitect() {
    if (!selected) return;
    setRecommendationLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(selected),
      });
      const body = await response.json();
      if (!body.recommendation) throw new Error(body.error ?? "The advisory engine is unavailable.");
      setRecommendation(body.recommendation);
      setRecommendationEngine(body.mode === "ai-advisory" ? body.engine : `${body.engine} · ${body.fallbackState}`);
      setAdvisoryReference(body.advisoryId ? { evidenceId: selected.id, id: body.advisoryId } : null);
      if (body.mode !== "ai-advisory") announce(`Rules v1 returned (${body.fallbackState}); no AI output was presented as authority.`);
    } catch {
      setError("The advisory engine is unavailable. Governance actions remain operational.");
    } finally {
      setRecommendationLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span><b>AROS</b><small>Evidence-to-Cornerstone</small></span>
        </div>
        <nav aria-label="Evidence views">
          <p className="nav-label">Governance lens</p>
          {filters.map((item, index) => (
            <button className={filter === item ? "nav-item active" : "nav-item"} onClick={() => setFilter(item)} key={item}>
              <span>{["W", "R", "D", "O", "G"][index]}</span>{item === "All" ? "Workbench" : item}
              {item === "Drift risk" && <em>{metrics.drift}</em>}
            </button>
          ))}
          <p className="nav-label space">System state</p>
          <div className={`system-state ${persistence}`}>
            <i />{persistence === "durable" ? "Durable audit store" : persistence === "checking" ? "Checking storage" : "Review-only demo"}
          </div>
        </nav>
        <div className="principle"><span>Architect rule</span><p>What strengthens the next hundred decisions?</p></div>
        <div className="profile"><span>MC</span><div><b>Maya Chen</b><small>Lead Architect</small></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">Governance workbench · Version 1</p><h1>Turn evidence into accountable decisions.</h1></div>
          <div className="top-actions">
            <span className="model-policy"><i /> AI advises. Architects authorize.</span>
            <button className="primary-button" onClick={() => setIntakeOpen(true)}>+ Add evidence</button>
          </div>
        </header>

        {error && <div className="error-banner" role="alert"><b>Attention</b><span>{error}</span><button onClick={() => setError("")}>Dismiss</button></div>}

        <section className="pulse">
          <div className="pulse-title"><span className="pulse-icon">P</span><div><p>Daily pulse · live from evidence state</p><h2>{metrics.drift + metrics.unowned} items need architectural attention.</h2></div></div>
          <div className="pulse-metrics">
            <div><strong>{metrics.total}</strong><span>Total evidence</span></div>
            <div><strong>{metrics.review}</strong><span>Awaiting review</span></div>
            <div className="warn"><strong>{metrics.drift}</strong><span>Drift signals</span></div>
            <div><strong>{metrics.governed}</strong><span>Governed decisions</span></div>
          </div>
          <button onClick={() => setFilter("Drift risk")}>Review drift <span>→</span></button>
        </section>

        <section className="architect-note">
          <span className="spark">A</span>
          <div>
            <p>Architect recommendation · {recommendationEngine}</p>
            <h3>{recommendation.headline}</h3>
            <span>{recommendation.rationale}</span>
          </div>
          <button onClick={askArchitect} disabled={recommendationLoading}>{recommendationLoading ? "Analyzing…" : "Refresh analysis"}</button>
        </section>

        <section className="content-grid">
          <div className="queue-panel">
            <div className="panel-heading">
              <div><h2>{filter === "All" ? "Evidence queue" : filter}</h2><p>Every status is derived from governance state, not folder location</p></div>
              <div className="segmented" role="group" aria-label="Filter evidence">
                {["All", "Drift risk", "Unowned"].map((item) => <button className={filter === item ? "selected" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}
              </div>
            </div>
            <div className="table-head"><span>Evidence</span><span>Owner</span><span>Jurisdiction</span><span>State</span></div>
            <div className="evidence-list" aria-busy={loading}>
              {visible.map((item) => {
                const state = deriveGovernanceState(item);
                return (
                  <button className={`evidence-row ${active === item.id ? "row-active" : ""}`} onClick={() => {
                    setActive(item.id);
                    setRecommendation(deterministicRecommendation(item));
                    setRecommendationEngine("Rules v1");
                    setAdvisoryReference(null);
                  }} key={item.id}>
                    <span className="evidence-cell"><i>{item.id}</i><b>{item.title}</b><small>{item.source} · {item.citations} downstream citations</small></span>
                    <span className={!item.owner ? "muted owner" : "owner"}><i>{item.owner ? item.owner.split(" ").map((name) => name[0]).join("") : "?"}</i>{item.owner ?? "Unassigned"}</span>
                    <span className="jurisdiction">{item.jurisdiction ?? "Not established"}</span>
                    <span><i className={`status ${state.toLowerCase().replace(" ", "-")}`}>{state}</i></span>
                  </button>
                );
              })}
              {!visible.length && <div className="empty-state"><b>No evidence in this state.</b><span>Change the lens or add an observation.</span></div>}
            </div>
            <div className="queue-footer"><span>{visible.length} visible · {records.length} total</span><span>Status recalculates after every action</span></div>
          </div>

          {selected && <aside className="detail-panel" aria-label="Selected evidence detail">
            <div className="detail-top"><span>{selected.id}</span><span className={`status ${deriveGovernanceState(selected).toLowerCase().replace(" ", "-")}`}>{deriveGovernanceState(selected)}</span></div>
            <p className="detail-kicker">{selected.classification}</p>
            <h2>{selected.title}</h2>
            <p className="detail-summary">{selected.summary}</p>
            <div className="confidence"><span>Evidence confidence</span><b>{selected.confidence}%</b><i><em style={{ width: `${selected.confidence}%` }} /></i></div>
            <dl>
              <div><dt>Source</dt><dd>{selected.source}</dd></div>
              <div><dt>Accountable owner</dt><dd className={!selected.owner ? "needs-owner" : ""}>{selected.owner ?? "Required"}</dd></div>
              <div><dt>Jurisdiction</dt><dd>{selected.jurisdiction ?? "Required"}</dd></div>
              <div><dt>Authority state</dt><dd><span className="authority-state">{selected.authorityState}</span></dd></div>
            </dl>
            {selected.citations >= 3 && selected.authorityState !== "Governed decision" &&
              <div className="drift-card"><div><span>!</span><b>Authority drift detected</b></div><p>{selected.citations} downstream citations without a governed decision.</p></div>}
            <div className="readiness">
              <p className="next-label">Promotion readiness</p>
              {selected.authorityState === "Governed decision"
                ? <p className="next-copy ready">Governed. Reopen only if the evidence or jurisdiction changes.</p>
                : blockers.length
                  ? <p className="next-copy">Blocked by: {blockers.join(" · ")}</p>
                  : <p className="next-copy ready">All prerequisites passed. Architect authorization is still required.</p>}
            </div>
            <div className="detail-actions">
              <button onClick={() => runAction("classify")}>Confirm classification</button>
              <button onClick={() => runAction("assign")}>Confirm ownership</button>
              <button onClick={() => runAction("promote")} disabled={blockers.length > 0 || selected.authorityState === "Governed decision"}>Promote to governed decision</button>
            </div>
            <p className="authority-footnote">Promotion creates authority only after explicit architect action. Model output never changes this state.</p>
          </aside>}
        </section>
      </section>

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
      {intakeOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIntakeOpen(false)}>
          <form className="modal" role="dialog" aria-modal="true" aria-labelledby="intake-title" onSubmit={addEvidence} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-head"><div><p>Evidence intake</p><h2 id="intake-title">Add an observation</h2></div><button type="button" onClick={() => setIntakeOpen(false)} aria-label="Close">×</button></div>
            <label>Evidence title<input name="title" required minLength={6} autoFocus placeholder="What was observed?" /></label>
            <label>Source or context<input name="source" required minLength={3} placeholder="Meeting, control test, operating guide…" /></label>
            <div className="form-row">
              <label>Proposed owner<select name="owner" defaultValue=""><option value="">Unassigned</option><option>Maya Chen</option><option>Jon Bell</option><option>Priya Shah</option></select></label>
              <label>Classification<select name="classification"><option>Unclassified</option><option>Observed pattern</option><option>Expert interpretation</option><option>Validated control</option></select></label>
            </div>
            <label>Proposed jurisdiction<select name="jurisdiction" defaultValue=""><option value="">Not established</option><option>Enterprise Architecture</option><option>Data Governance</option><option>AI Platform</option><option>Model Risk</option><option>Security Assurance</option></select></label>
            <div className="intake-rule"><span>i</span><p><b>Observation does not become authority.</b> Intake creates a reviewable evidence record. Promotion requires classification, ownership, jurisdiction, confidence, and an explicit architect action.</p></div>
            <div className="modal-actions"><button type="button" onClick={() => setIntakeOpen(false)}>Cancel</button><button type="submit">Add to review queue</button></div>
          </form>
        </div>
      )}
    </main>
  );
}
