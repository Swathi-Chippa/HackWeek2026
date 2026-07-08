import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight, X, Check,
  AlertTriangle, SlidersHorizontal, BookOpen,
} from "lucide-react";

/* ---------------------------------------------------------
   Design tokens — "Household Ledger"
   A running account book: ruled lines, a tally column that
   accumulates like a real checkbook register, brass & forest
   ink on soft paper.
--------------------------------------------------------- */
const TOKENS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  .ledger-root {
    --paper: #F4F5EF;
    --paper-raised: #FFFFFF;
    --paper-alt: #EAEDE3;
    --ink: #212822;
    --ink-soft: #62695F;
    --ink-faint: #9BA096;
    --rule: #D9DBCC;
    --rule-strong: #C3C6B5;
    --forest: #2F5233;
    --forest-soft: #4A7856;
    --forest-wash: #E4ECE3;
    --brass: #93692F;
    --brass-wash: #F2E9D8;
    --brick: #A6392F;
    --brick-wash: #F5E1DE;
    font-family: 'Inter', sans-serif;
    background: var(--paper);
    color: var(--ink);
    min-height: 100%;
    position: relative;
  }
  .ledger-root * { box-sizing: border-box; }
  .font-display { font-family: 'Fraunces', serif; }
  .font-mono { font-family: 'IBM Plex Mono', monospace; }

  .ledger-root::before {
    content: "";
    position: absolute; inset: 0;
    background-image: repeating-linear-gradient(
      to bottom, transparent, transparent 35px, var(--rule) 35px, var(--rule) 36px
    );
    opacity: 0.35;
    pointer-events: none;
  }

  .binding {
    position: absolute; left: 0; top: 0; bottom: 0; width: 34px;
    background: linear-gradient(to right, var(--forest) 0%, var(--forest) 78%, transparent 100%);
    opacity: 0.9;
  }
  .binding-stitch {
    position: absolute; left: 16px; top: 0; bottom: 0; width: 1px;
    background: repeating-linear-gradient(to bottom, transparent, transparent 10px, #F4F5EF88 10px, #F4F5EF88 16px);
  }

  .scroller { position: relative; z-index: 1; }

  button { font-family: inherit; cursor: pointer; }
  input, select { font-family: inherit; }

  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid var(--rule-strong);
    background: var(--paper-raised);
    color: var(--ink);
    padding: 8px 14px;
    border-radius: 3px;
    font-size: 13px;
    font-weight: 500;
    transition: border-color .15s ease, transform .1s ease;
  }
  .btn:hover { border-color: var(--forest); }
  .btn:active { transform: translateY(1px); }
  .btn-primary {
    background: var(--forest); color: var(--paper); border-color: var(--forest);
  }
  .btn-primary:hover { background: var(--forest-soft); border-color: var(--forest-soft); }
  .btn-ghost { border-color: transparent; background: transparent; padding: 6px 8px; }
  .btn-ghost:hover { background: var(--paper-alt); }
  .btn-icon { padding: 6px; border-radius: 3px; }

  .field {
    border: 1px solid var(--rule-strong);
    background: var(--paper-raised);
    border-radius: 3px;
    padding: 7px 10px;
    font-size: 13px;
    color: var(--ink);
    width: 100%;
  }
  .field:focus { outline: 2px solid var(--forest-soft); outline-offset: 1px; }

  .card {
    background: var(--paper-raised);
    border: 1px solid var(--rule);
    border-radius: 4px;
  }

  .tab-chip {
    padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 500;
    border: 1px solid var(--rule-strong); background: var(--paper-raised); color: var(--ink-soft);
  }
  .tab-chip.active { background: var(--forest); border-color: var(--forest); color: var(--paper); }

  table.register { border-collapse: collapse; width: 100%; }
  table.register th {
    text-align: left; font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
    color: var(--ink-faint); font-weight: 600; padding: 8px 10px; border-bottom: 1px solid var(--rule-strong);
  }
  table.register td {
    padding: 10px; font-size: 13.5px; border-bottom: 1px solid var(--rule);
    vertical-align: middle;
  }
  table.register tr:hover td { background: var(--paper-alt); }

  .cat-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

  .progress-track {
    height: 6px; border-radius: 3px; background: var(--paper-alt); overflow: hidden; position: relative;
    border: 1px solid var(--rule);
  }
  .progress-fill { height: 100%; border-radius: 3px; transition: width .3s ease; }

  .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: var(--rule-strong); border-radius: 3px; }

  @media (max-width: 720px) {
    .hide-mobile { display: none; }
  }
`;

const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#C97C4D" },
  { name: "Transport", color: "#5B7C99" },
  { name: "Housing", color: "#2F5233" },
  { name: "Utilities", color: "#93692F" },
  { name: "Entertainment", color: "#8B5E83" },
  { name: "Health", color: "#4A8B7C" },
  { name: "Shopping", color: "#A6392F" },
  { name: "Other", color: "#6B6B6B" },
];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const fmtMoney = (n) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMonthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};
const shortMonth = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short" });
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysInMonth = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};

const SEED_EXPENSES = [
  { id: uid(), date: todayISO(), amount: 42.5, category: "Food", note: "Groceries" },
  { id: uid(), date: todayISO(), amount: 15, category: "Transport", note: "Metro card" },
];

export default function Ledger() {
  const [loaded, setLoaded] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState({});
  const [cursor, setCursor] = useState(() => monthKey(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const catColor = useCallback(
    (name) => categories.find((c) => c.name === name)?.color || "#6B6B6B",
    [categories]
  );

  // ---- load (browser localStorage — persists on this device only) ----
  useEffect(() => {
    try {
      const e = localStorage.getItem("ledger:expenses");
      const c = localStorage.getItem("ledger:categories");
      const b = localStorage.getItem("ledger:budgets");
      setExpenses(e ? JSON.parse(e) : SEED_EXPENSES);
      if (c) setCategories(JSON.parse(c));
      if (b) setBudgets(JSON.parse(b));
    } catch (err) {
      setExpenses(SEED_EXPENSES);
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = useCallback(async (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      setSaveError(true);
    }
  }, []);

  useEffect(() => { if (loaded) persist("ledger:expenses", expenses); }, [expenses, loaded, persist]);
  useEffect(() => { if (loaded) persist("ledger:categories", categories); }, [categories, loaded, persist]);
  useEffect(() => { if (loaded) persist("ledger:budgets", budgets); }, [budgets, loaded, persist]);

  // ---- derived ----
  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.date.slice(0, 7) === cursor)
        .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    [expenses, cursor]
  );

  const runningRows = useMemo(() => {
    let running = 0;
    return monthExpenses.map((e) => {
      running += Number(e.amount);
      return { ...e, running };
    });
  }, [monthExpenses]);

  const monthTotal = runningRows.length ? runningRows[runningRows.length - 1].running : 0;

  const prevMonthKey = useMemo(() => {
    const [y, m] = cursor.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    return monthKey(d);
  }, [cursor]);
  const prevMonthTotal = useMemo(
    () => expenses.filter((e) => e.date.slice(0, 7) === prevMonthKey).reduce((s, e) => s + Number(e.amount), 0),
    [expenses, prevMonthKey]
  );
  const pctChange = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : null;

  const byCategory = useMemo(() => {
    const map = {};
    monthExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: catColor(name) }))
      .sort((a, b) => b.value - a.value);
  }, [monthExpenses, catColor]);

  const topCategory = byCategory[0];

  const trend = useMemo(() => {
    const points = [];
    const [cy, cm] = cursor.split("-").map(Number);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(cy, cm - 1 - i, 1);
      const key = monthKey(d);
      const total = expenses.filter((e) => e.date.slice(0, 7) === key).reduce((s, e) => s + Number(e.amount), 0);
      points.push({ key, label: shortMonth(key), total });
    }
    return points;
  }, [expenses, cursor]);

  // ---- actions ----
  const shiftMonth = (delta) => {
    const [y, m] = cursor.split("-").map(Number);
    setCursor(monthKey(new Date(y, m - 1 + delta, 1)));
  };

  const upsertExpense = (payload) => {
    if (editingId) {
      setExpenses((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...payload } : e)));
    } else {
      setExpenses((prev) => [...prev, { id: uid(), ...payload }]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const deleteExpense = (id) => setExpenses((prev) => prev.filter((e) => e.id !== id));

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setShowForm(true);
  };

  const editingExpense = editingId ? expenses.find((e) => e.id === editingId) : null;

  if (!loaded) {
    return (
      <div className="ledger-root" style={{ padding: 40, textAlign: "center", color: "#62695F" }}>
        <style>{TOKENS}</style>
        Opening the ledger…
      </div>
    );
  }

  return (
    <div className="ledger-root">
      <style>{TOKENS}</style>
      <div className="binding"><div className="binding-stitch" /></div>
      <div className="scroller" style={{ padding: "28px 24px 40px 52px", maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookOpen size={22} color="#2F5233" strokeWidth={1.75} />
            <div>
              <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
                Household Ledger
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#62695F" }}>
                A running account of where the money goes.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setShowSettings(true)}>
              <SlidersHorizontal size={14} /> Budgets
            </button>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
              <Plus size={15} /> Add expense
            </button>
          </div>
        </header>

        {saveError && (
          <div className="card" style={{ padding: "8px 12px", marginBottom: 14, background: "#F5E1DE", border: "1px solid #A6392F44", fontSize: 12.5, color: "#7A2A22" }}>
            Entries can't be saved to this browser right now — they'll be lost on reload.
          </div>
        )}

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, minWidth: 168, textAlign: "center" }}>
            {fmtMonthLabel(cursor)}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
          {cursor !== monthKey(new Date()) && (
            <button className="tab-chip" onClick={() => setCursor(monthKey(new Date()))}>Today</button>
          )}
        </div>

        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 20 }}>
          <SummaryCard label="Total spent" value={fmtMoney(monthTotal)}
            sub={pctChange === null ? "no prior month" : `${pctChange >= 0 ? "▲" : "▼"} ${Math.abs(pctChange).toFixed(0)}% vs last month`}
            subColor={pctChange === null ? "#9BA096" : pctChange > 0 ? "#A6392F" : "#2F5233"} />
          <SummaryCard label="Entries this month" value={String(monthExpenses.length)} sub={`${byCategory.length} categories touched`} />
          <SummaryCard label="Top category" value={topCategory ? topCategory.name : "—"}
            sub={topCategory ? fmtMoney(topCategory.value) : "no spending yet"} dot={topCategory ? topCategory.color : null} />
          <SummaryCard label="Daily average" value={fmtMoney(monthTotal / daysInMonth(cursor))} sub="across the month" />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: 14, marginBottom: 22 }} className="charts-grid">
          <div className="card" style={{ padding: 16 }}>
            <SectionLabel>By category</SectionLabel>
            {byCategory.length === 0 ? (
              <EmptyNote text="No expenses logged this month yet." />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 128, height: 128, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2} stroke="none">
                        {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", borderRadius: 4, border: "1px solid #D9DBCC" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {byCategory.slice(0, 6).map((c) => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, marginBottom: 6 }}>
                      <span className="cat-dot" style={{ background: c.color }} />
                      <span style={{ flex: 1, color: "#212822" }}>{c.name}</span>
                      <span className="font-mono" style={{ color: "#62695F" }}>{fmtMoney(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 16 }}>
            <SectionLabel>Six-month trend</SectionLabel>
            <div style={{ width: "100%", height: 158 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#EAEDE3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#62695F", fontFamily: "Inter" }} axisLine={{ stroke: "#D9DBCC" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9BA096", fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} width={46}
                    tickFormatter={(v) => "$" + v} />
                  <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", borderRadius: 4, border: "1px solid #D9DBCC" }} />
                  <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                    {trend.map((t, i) => <Cell key={i} fill={t.key === cursor ? "#2F5233" : "#C7CFC3"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Budgets */}
        {Object.keys(budgets).length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 22 }}>
            <SectionLabel>Budget limits</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 6 }}>
              {Object.entries(budgets).filter(([, v]) => v > 0).map(([cat, limit]) => {
                const spent = byCategory.find((c) => c.name === cat)?.value || 0;
                const pct = Math.min(100, (spent / limit) * 100);
                const over = spent > limit;
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="cat-dot" style={{ background: catColor(cat) }} />
                        {cat}
                        {over && <AlertTriangle size={12} color="#A6392F" />}
                      </span>
                      <span className="font-mono" style={{ color: over ? "#A6392F" : "#62695F" }}>
                        {fmtMoney(spent)} / {fmtMoney(limit)}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: pct + "%", background: over ? "#A6392F" : catColor(cat) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Register */}
        <div className="card" style={{ padding: 16 }}>
          <SectionLabel>Register — {fmtMonthLabel(cursor)}</SectionLabel>
          {runningRows.length === 0 ? (
            <EmptyNote text="Nothing recorded for this month. Add your first expense above." />
          ) : (
            <div className="scrollbar-thin" style={{ overflowX: "auto" }}>
              <table className="register">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Date</th>
                    <th>Category</th>
                    <th className="hide-mobile">Note</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th style={{ textAlign: "right" }} className="hide-mobile">Balance</th>
                    <th style={{ width: 70 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {runningRows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-mono" style={{ color: "#62695F", fontSize: 12.5 }}>{row.date.slice(5)}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span className="cat-dot" style={{ background: catColor(row.category) }} />
                          {row.category}
                        </span>
                      </td>
                      <td className="hide-mobile" style={{ color: "#62695F" }}>{row.note || "—"}</td>
                      <td className="font-mono" style={{ textAlign: "right", fontWeight: 500 }}>{fmtMoney(row.amount)}</td>
                      <td className="font-mono hide-mobile" style={{ textAlign: "right", color: "#9BA096" }}>{fmtMoney(row.running)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => startEdit(row)} aria-label="Edit"><Pencil size={13} /></button>
                          <button className="btn btn-ghost btn-icon" onClick={() => deleteExpense(row.id)} aria-label="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ExpenseModal
          categories={categories}
          initial={editingExpense}
          onCancel={() => { setShowForm(false); setEditingId(null); }}
          onSubmit={upsertExpense}
        />
      )}

      {showSettings && (
        <SettingsModal
          categories={categories}
          budgets={budgets}
          onClose={() => setShowSettings(false)}
          onSaveBudgets={setBudgets}
          onSaveCategories={setCategories}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, subColor, dot }) {
  return (
    <div className="card" style={{ padding: "13px 15px" }}>
      <div style={{ fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase", color: "#9BA096", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div className="font-display" style={{ fontSize: 21, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
        {dot && <span className="cat-dot" style={{ background: dot }} />}
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: subColor || "#9BA096", marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "#2F5233", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".03em" }}>
      {children}
    </div>
  );
}

function EmptyNote({ text }) {
  return <div style={{ fontSize: 12.5, color: "#9BA096", padding: "18px 4px" }}>{text}</div>;
}

function ExpenseModal({ categories, initial, onCancel, onSubmit }) {
  const [date, setDate] = useState(initial?.date || todayISO());
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [category, setCategory] = useState(initial?.category || categories[0]?.name || "Other");
  const [note, setNote] = useState(initial?.note || "");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!date) return setError("Pick a date.");
    if (isNaN(amt) || amt <= 0) return setError("Enter an amount greater than zero.");
    onSubmit({ date, amount: amt, category, note: note.trim() });
  };

  return (
    <ModalShell onClose={onCancel} title={initial ? "Edit expense" : "Add expense"}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Labeled label="Date">
            <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} />
          </Labeled>
          <Labeled label="Amount">
            <input type="number" step="0.01" min="0" className="field font-mono" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Labeled>
        </div>
        <Labeled label="Category">
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </Labeled>
        <Labeled label="Note (optional)">
          <input type="text" className="field" placeholder="What was this for?" value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} />
        </Labeled>
        {error && <div style={{ fontSize: 12, color: "#A6392F" }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary"><Check size={14} /> {initial ? "Save changes" : "Add entry"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function SettingsModal({ categories, budgets, onClose, onSaveBudgets, onSaveCategories }) {
  const [local, setLocal] = useState(() => {
    const base = {};
    categories.forEach((c) => { base[c.name] = budgets[c.name] ?? ""; });
    return base;
  });
  const [newCat, setNewCat] = useState("");

  const palette = ["#C97C4D", "#5B7C99", "#2F5233", "#93692F", "#8B5E83", "#4A8B7C", "#A6392F", "#6B6B6B", "#7C8B4A", "#4A5B8B"];

  const addCategory = () => {
    const name = newCat.trim();
    if (!name || categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    const color = palette[categories.length % palette.length];
    onSaveCategories([...categories, { name, color }]);
    setLocal((prev) => ({ ...prev, [name]: "" }));
    setNewCat("");
  };

  const save = () => {
    const cleaned = {};
    Object.entries(local).forEach(([k, v]) => { if (v !== "" && !isNaN(v)) cleaned[k] = parseFloat(v); });
    onSaveBudgets(cleaned);
    onClose();
  };

  return (
    <ModalShell onClose={onClose} title="Monthly budgets">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }} className="scrollbar-thin">
        {categories.map((c) => (
          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="cat-dot" style={{ background: c.color }} />
            <span style={{ fontSize: 13, flex: 1 }}>{c.name}</span>
            <input
              type="number" min="0" step="1" placeholder="No limit" className="field font-mono"
              style={{ width: 110 }}
              value={local[c.name] ?? ""}
              onChange={(e) => setLocal((prev) => ({ ...prev, [c.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--rule)" }}>
        <input type="text" className="field" placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }} />
        <button type="button" className="btn" onClick={addCategory}><Plus size={14} /> Add</button>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}><Check size={14} /> Save budgets</button>
      </div>
    </ModalShell>
  );
}

function Labeled({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, color: "#62695F", fontWeight: 500 }}>
      {label}
      {children}
    </label>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#21282288", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 420, padding: 20, background: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="font-display" style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
