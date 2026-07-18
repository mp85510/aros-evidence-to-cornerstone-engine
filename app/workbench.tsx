"use client";

import { useMemo, useState } from "react";

type Evidence = {
  id: string;
  title: string;
  source: string;
  owner: string;
  jurisdiction: string;
  status: "Review" | "Drift risk" | "Classified" | "Unowned";
  kind: string;
  age: string;
  confidence: number;
};

const evidence: Evidence[] = [
  { id: "EV-284", title: "Enterprise AI exception pattern", source: "Architecture council notes", owner: "Maya Chen", jurisdiction: "Enterprise Architecture", status: "Drift risk", kind: "Observed pattern", age: "2h", confidence: 86 },
  { id: "EV-281", title: "Regional retention interpretation", source: "Legal advisory · EMEA", owner: "Jon Bell", jurisdiction: "Data Governance", status: "Review", kind: "Expert interpretation", age: "5h", confidence: 74 },
  { id: "EV-279", title: "Model access approval sequence", source: "Production operating guide", owner: "Priya Shah", jurisdiction: "AI Platform", status: "Classified", kind: "Operational evidence", age: "1d", confidence: 92 },
  { id: "EV-276", title: "Third-party model risk threshold", source: "Risk working session", owner: "Unassigned", jurisdiction: "Proposed · Model Risk", status: "Unowned", kind: "Candidate decision", age: "1d", confidence: 61 },
  { id: "EV-272", title: "PII redaction verification", source: "Control test results", owner: "Owen Wright", jurisdiction: "Security Assurance", status: "Review", kind: "Validated control", age: "2d", confidence: 95 },
];

const nav = [
  ["⌂", "Workbench"],
  ["↓", "Evidence intake"],
  ["◇", "Classification"],
  ["◎", "Ownership"],
  ["⌖", "Jurisdiction"],
  ["↗", "Authority drift"],
];

export function GovernanceWorkbench() {
  const [active, setActive] = useState("EV-284");
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const selected = evidence.find((item) => item.id === active) ?? evidence[0];
  const visible = useMemo(
    () => evidence.filter((item) => filter === "All" || item.status === filter),
    [filter],
  );

  const act = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span><b>AROS</b><small>Governance system</small></span>
        </div>
        <nav aria-label="Primary navigation">
          <p className="nav-label">Operate</p>
          {nav.map(([icon, label], index) => (
            <button className={index === 0 ? "nav-item active" : "nav-item"} key={label}>
              <span>{icon}</span>{label}{label === "Authority drift" && <em>3</em>}
            </button>
          ))}
          <p className="nav-label space">Synthesize</p>
          <button className="nav-item"><span>◫</span>Daily pulse</button>
          <button className="nav-item"><span>◆</span>Consolidation points</button>
          <button className="nav-item"><span>✦</span>Architect recommendation</button>
        </nav>
        <div className="principle">
          <span>Operating principle</span>
          <p>Evidence earns inheritance.</p>
        </div>
        <div className="profile"><span>MC</span><div><b>Maya Chen</b><small>Lead Architect</small></div><button aria-label="Profile menu">•••</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Governance workbench</p>
            <h1>Good morning, Maya.</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search">⌕</button>
            <button className="icon-button has-dot" aria-label="Notifications">♢</button>
            <button className="primary-button" onClick={() => setIntakeOpen(true)}><span>＋</span> Add evidence</button>
          </div>
        </header>

        <section className="pulse">
          <div className="pulse-title">
            <span className="pulse-icon">⌁</span>
            <div><p>Daily pulse · Friday, July 18</p><h2>Three decisions need architectural attention.</h2></div>
          </div>
          <div className="pulse-metrics">
            <div><strong>12</strong><span>New evidence</span></div>
            <div><strong>5</strong><span>Awaiting review</span></div>
            <div className="warn"><strong>3</strong><span>Drift signals</span></div>
            <div><strong>2</strong><span>Consolidation points</span></div>
          </div>
          <button onClick={() => act("Daily pulse marked as reviewed.")}>Review pulse <span>→</span></button>
        </section>

        <section className="architect-note">
          <span className="spark">✦</span>
          <div><p>Architect recommendation</p><h3>Consolidate repeated AI exception guidance into one governed decision.</h3>
            <span>Seven observations now share the same intent across three production teams. Name an owner before the pattern hardens into assumed authority.</span>
          </div>
          <button onClick={() => act("Recommendation opened for decision drafting.")}>Open recommendation</button>
        </section>

        <section className="content-grid">
          <div className="queue-panel">
            <div className="panel-heading">
              <div><h2>Decision queue</h2><p>Evidence requiring governance action</p></div>
              <div className="segmented" role="group" aria-label="Filter evidence">
                {["All", "Review", "Drift risk"].map((item) => <button className={filter === item ? "selected" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}
              </div>
            </div>
            <div className="table-head"><span>Evidence</span><span>Owner</span><span>Jurisdiction</span><span>Status</span></div>
            <div className="evidence-list">
              {visible.map((item) => (
                <button className={`evidence-row ${active === item.id ? "row-active" : ""}`} onClick={() => setActive(item.id)} key={item.id}>
                  <span className="evidence-cell"><i>{item.id}</i><b>{item.title}</b><small>{item.source} · {item.age} ago</small></span>
                  <span className={item.owner === "Unassigned" ? "muted owner" : "owner"}><i>{item.owner === "Unassigned" ? "?" : item.owner.split(" ").map(n => n[0]).join("")}</i>{item.owner}</span>
                  <span className="jurisdiction">{item.jurisdiction}</span>
                  <span><i className={`status ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</i></span>
                </button>
              ))}
            </div>
            <div className="queue-footer"><span>Showing {visible.length} of 12 items</span><button>View all evidence →</button></div>
          </div>

          <aside className="detail-panel" aria-label="Selected evidence detail">
            <div className="detail-top"><span>{selected.id}</span><button aria-label="Close detail">×</button></div>
            <p className="detail-kicker">{selected.kind}</p>
            <h2>{selected.title}</h2>
            <p className="detail-summary">Teams are repeatedly applying the same exception logic, but no governed decision currently grants it authority.</p>
            <div className="confidence"><span>Evidence confidence</span><b>{selected.confidence}%</b><i><em style={{ width: `${selected.confidence}%` }} /></i></div>
            <dl>
              <div><dt>Source</dt><dd>{selected.source}</dd></div>
              <div><dt>Accountable owner</dt><dd className={selected.owner === "Unassigned" ? "needs-owner" : ""}>{selected.owner}</dd></div>
              <div><dt>Jurisdiction</dt><dd>{selected.jurisdiction}</dd></div>
              <div><dt>Authority state</dt><dd><span className="authority-state">Observation only</span></dd></div>
            </dl>
            <div className="drift-card"><div><span>↗</span><b>Authority drift detected</b></div><p>Cited in 7 production decisions without a named governing object.</p></div>
            <p className="next-label">Strengthens the next hundred decisions</p>
            <p className="next-copy">Create one governed decision, assign enterprise ownership, then link the seven observations as supporting evidence.</p>
            <div className="detail-actions"><button onClick={() => act(`${selected.id} classified as an observed pattern.`)}>Classify evidence</button><button onClick={() => act("Decision draft created. Ownership is still required.")}>Draft governed decision</button></div>
          </aside>
        </section>
      </section>

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
      {intakeOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIntakeOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="intake-title" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head"><div><p>Evidence intake</p><h2 id="intake-title">Add an observation</h2></div><button onClick={() => setIntakeOpen(false)} aria-label="Close">×</button></div>
            <label>Evidence title<input autoFocus placeholder="What was observed?" /></label>
            <label>Source or context<input placeholder="Meeting, control test, operating guide…" /></label>
            <div className="form-row"><label>Proposed owner<select defaultValue=""><option value="" disabled>Select owner</option><option>Maya Chen</option><option>Jon Bell</option><option>Priya Shah</option></select></label><label>Evidence type<select><option>Observed pattern</option><option>Expert interpretation</option><option>Validated control</option></select></label></div>
            <div className="intake-rule"><span>i</span><p><b>Intake does not grant authority.</b> This evidence will enter review as an observation until ownership and jurisdiction are verified.</p></div>
            <div className="modal-actions"><button onClick={() => setIntakeOpen(false)}>Cancel</button><button onClick={() => { setIntakeOpen(false); act("Evidence added to the review queue."); }}>Add to review queue</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
