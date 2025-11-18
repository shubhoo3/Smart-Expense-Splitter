import React, { useEffect, useMemo, useState } from "react";
import { api } from "./api";

// Small reusable button
function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
      {children}
    </span>
  );
}

function Badge({ color = "slate", children }) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[color]}`}
    >
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
    </div>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// =========== MAIN APP ===========

export default function App() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", type: "Trip" });
  const [error, setError] = useState(null);

  // Load groups + health check
  useEffect(() => {
    (async () => {
      try {
        setLoadingGroups(true);
        setError(null);
        await api.health();
        const data = await api.getGroups();
        setGroups(data);
        if (data.length && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load groups");
      } finally {
        setLoadingGroups(false);
      }
    })();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    try {
      setCreatingGroup(true);
      const newGroup = await api.createGroup(groupForm);
      setGroups((prev) => [newGroup, ...prev]);
      setGroupForm({ name: "", type: "Trip" });
      setSelectedGroupId(newGroup.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Delete this group and all its data?")) return;
    try {
      await api.deleteGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
              S
            </span>
            <div>
              <h1 className="text-sm font-semibold tracking-tight sm:text-base">
                Smart Expense Splitter
              </h1>
              <p className="text-[11px] text-slate-500">
                Track shared expenses and settle up with ease
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row">
        {/* LEFT: Groups */}
        <section className="w-full md:w-64">
          <div className="sticky top-3 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Groups
              </h2>

              <form className="mt-3 flex flex-col gap-2" onSubmit={handleCreateGroup}>
                <Input
                  placeholder="Group name (e.g. Goa Trip)"
                  value={groupForm.name}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                <Select
                  value={groupForm.type}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option value="Trip">Trip</option>
                  <option value="Household">Household</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </Select>
                <Button type="submit" disabled={creatingGroup}>
                  {creatingGroup ? "Creating..." : "Create Group"}
                </Button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {loadingGroups ? (
                <Spinner />
              ) : groups.length === 0 ? (
                <EmptyState
                  title="No groups yet"
                  description="Create your first group to start tracking shared expenses."
                />
              ) : (
                <ul className="space-y-1">
                  {groups.map((g) => (
                    <li
                      key={g.id}
                      className={`flex items-center justify-between rounded-xl px-2 py-2 text-sm ${
                        selectedGroupId === g.id
                          ? "bg-blue-50 text-blue-800"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <button
                        className="flex flex-1 flex-col text-left"
                        onClick={() => setSelectedGroupId(g.id)}
                      >
                        <span className="font-medium truncate">{g.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {g.type}
                        </span>
                      </button>
                      <button
                        className="ml-2 rounded-md p-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"
                        onClick={() => handleDeleteGroup(g.id)}
                        title="Delete group"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Group detail */}
        <section className="flex-1">
          {selectedGroupId ? (
            <GroupDetail groupId={selectedGroupId} />
          ) : (
            <EmptyState
              title="Select or create a group"
              description="Get started by choosing a group from the left or creating a new one."
            />
          )}
        </section>
      </main>
    </div>
  );
}

// ================ GROUP DETAIL ================

function GroupDetail({ groupId }) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState("expenses");
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [g, m, e, s, b, st] = await Promise.all([
        api.getGroup(groupId),
        api.getMembers(groupId),
        api.getExpenses(groupId),
        api.getGroupStats(groupId),
        api.getBalances(groupId),
        api.getSettlements(groupId),
      ]);
      setGroup(g);
      setMembers(m);
      setExpenses(e);
      setStats(s);
      setBalances(b);
      setSettlements(st);
    } catch (err) {
      console.error(err);
      alert("Failed to load group data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [groupId]);

  const handleMemberAdded = (member) => {
    setMembers((prev) => [...prev, member]);
  };

  const handleMemberDeleted = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    // Expenses and balances will be refreshed separately when needed.
  };

  const handleExpenseAdded = (expense) => {
    setExpenses((prev) => [expense, ...prev]);
    // Refresh derived data
    Promise.all([
      api.getGroupStats(groupId),
      api.getBalances(groupId),
      api.getSettlements(groupId),
    ]).then(([s, b, st]) => {
      setStats(s);
      setBalances(b);
      setSettlements(st);
    });
  };

  const handleExpenseDeleted = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await api.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      const [s, b, st] = await Promise.all([
        api.getGroupStats(groupId),
        api.getBalances(groupId),
        api.getSettlements(groupId),
      ]);
      setStats(s);
      setBalances(b);
      setSettlements(st);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === "all") return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const categories = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.category))).sort(),
    [expenses]
  );

  const handleExportCSV = () => {
    if (!expenses.length) {
      alert("No expenses to export.");
      return;
    }
    const headers = [
      "Description",
      "Amount",
      "Paid By",
      "Category",
      "Split Type",
      "Created At",
    ];
    const rows = expenses.map((e) => {
      const payer = members.find((m) => m.id === e.paid_by)?.name || "Unknown";
      return [
        e.description,
        e.amount,
        payer,
        e.category,
        e.split_type,
        e.created_at,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group?.name || "group"}-expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Group header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <Spinner />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">
                  {group?.name}
                </h2>
                <Badge color="blue">{group?.type}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
                {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Total spent</span>
                <span className="text-sm font-semibold text-slate-900">
                  ₹{(stats?.overall?.total_amount || 0).toFixed(2)}
                </span>
              </div>
              <Button variant="secondary" onClick={handleExportCSV}>
                Export CSV
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {[
            ["expenses", "Expenses"],
            ["members", "Members"],
            ["balances", "Balances"],
            ["stats", "Analytics"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`rounded-full px-3 py-1 ${
                activeTab === id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          {activeTab === "members" && (
            <MembersPanel
              groupId={groupId}
              members={members}
              onMemberAdded={handleMemberAdded}
              onMemberDeleted={handleMemberDeleted}
            />
          )}

          {activeTab === "expenses" && (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
              <ExpenseForm
                groupId={groupId}
                members={members}
                onExpenseAdded={handleExpenseAdded}
              />
              <ExpensesPanel
                expenses={filteredExpenses}
                allExpenses={expenses}
                members={members}
                categories={categories}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                onDeleteExpense={handleExpenseDeleted}
              />
            </div>
          )}

          {activeTab === "balances" && (
            <BalancesPanel
              members={members}
              balances={balances}
              settlements={settlements}
            />
          )}

          {activeTab === "stats" && (
            <StatsPanel stats={stats} expenses={expenses} members={members} />
          )}
        </>
      )}
    </div>
  );
}

// ================ MEMBERS PANEL ================

function MembersPanel({ groupId, members, onMemberAdded, onMemberDeleted }) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setAdding(true);
      const member = await api.addMember(groupId, { name });
      onMemberAdded(member);
      setName("");
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this member? Existing expenses remain.")) return;
    try {
      await api.deleteMember(id);
      onMemberDeleted(id);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Members</h3>
        {members.length === 0 ? (
          <EmptyState
            title="No members yet"
            description="Add members to start sharing expenses."
          />
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{m.name}</span>
                </div>
                <button
                  className="rounded-md p-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"
                  onClick={() => handleDelete(m.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Add member</h3>
        <form className="mt-3 space-y-2" onSubmit={handleAdd}>
          <Input
            placeholder="Name (e.g. Rahul)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add"}
          </Button>
          <p className="mt-1 text-[11px] text-slate-500">
            Members can be used as payers and participants in expenses.
          </p>
        </form>
      </div>
    </div>
  );
}

// ================ EXPENSE FORM ================

function ExpenseForm({ groupId, members, onExpenseAdded }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("General");
  const [splitType, setSplitType] = useState("equal");
  const [participants, setParticipants] = useState([]);
  const [customSplits, setCustomSplits] = useState({});
  const [percentSplits, setPercentSplits] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (members.length && !paidBy) {
      setPaidBy(String(members[0].id));
    }
    if (participants.length === 0 && members.length) {
      setParticipants(members.map((m) => m.id.toString()));
    }
  }, [members]);

  const toggleParticipant = (id) => {
    setParticipants((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };

  const computeSplits = () => {
    const amt = parseFloat(amount);
    if (!amt || !participants.length) return null;

    const splits = {};

    if (splitType === "equal") {
      const per = amt / participants.length;
      participants.forEach((id) => {
        splits[id] = parseFloat(per.toFixed(2));
      });
    } else if (splitType === "percentage") {
      let totalPercent = 0;
      participants.forEach((id) => {
        totalPercent += Number(percentSplits[id] || 0);
      });
      if (Math.round(totalPercent) !== 100) {
        alert("Total percentage must equal 100%");
        return null;
      }
      participants.forEach((id) => {
        const p = Number(percentSplits[id] || 0);
        splits[id] = parseFloat(((amt * p) / 100).toFixed(2));
      });
    } else if (splitType === "custom") {
      let total = 0;
      for (const id of participants) {
        total += Number(customSplits[id] || 0);
      }
      // Allow small rounding differences
      if (Math.abs(total - amt) > 0.05) {
        alert(
          `Custom amounts must add up to total (current: ${total.toFixed(
            2
          )}, expected: ${amt.toFixed(2)})`
        );
        return null;
      }
      participants.forEach((id) => {
        splits[id] = parseFloat(Number(customSplits[id] || 0).toFixed(2));
      });
    }

    return splits;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (!amount || !paidBy || !category) return;
    const splits = computeSplits();
    if (!splits) return;

    try {
      setSubmitting(true);
      const payload = {
        description,
        amount: parseFloat(amount),
        paidBy: Number(paidBy),
        category,
        splitType,
        splits,
      };
      const created = await api.createExpense(groupId, payload);
      onExpenseAdded(created);
      setDescription("");
      setAmount("");
      setSplitType("equal");
      setCustomSplits({});
      setPercentSplits({});
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!members.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Add expense</h3>
        <EmptyState
          title="No members yet"
          description="Add some members first to record expenses."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold">Add expense</h3>
      <form className="mt-3 space-y-2" onSubmit={handleSubmit}>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Description
            </label>
            <Input
              placeholder="e.g. Dinner at Fat Fish"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Amount (₹)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Paid by
            </label>
            <Select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Category
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>General</option>
              <option>Food & Drinks</option>
              <option>Travel</option>
              <option>Stay</option>
              <option>Shopping</option>
              <option>Activities</option>
              <option>Groceries</option>
              <option>Utilities</option>
              <option>Other</option>
            </Select>
          </div>
        </div>

        {/* Split type */}
        <div>
          <label className="text-xs font-medium text-slate-600">
            Split type
          </label>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {[
              ["equal", "Equal"],
              ["percentage", "Percentage"],
              ["custom", "Custom"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`rounded-full px-3 py-1 ${
                  splitType === id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setSplitType(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="text-xs font-medium text-slate-600">
            Participants
          </label>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {members.map((m) => {
              const id = m.id.toString();
              const selected = participants.includes(id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`rounded-full px-3 py-1 ${
                    selected
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  onClick={() => toggleParticipant(id)}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split details */}
        {splitType !== "equal" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              {splitType === "percentage"
                ? "Percent per participant"
                : "Custom amount per participant"}
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {participants.map((id) => {
                const member = members.find((m) => m.id.toString() === id);
                if (!member) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-2 py-1.5 text-xs"
                  >
                    <span className="truncate">{member.name}</span>
                    <Input
                      className="w-24 text-right"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        splitType === "percentage"
                          ? percentSplits[id] || ""
                          : customSplits[id] || ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (splitType === "percentage") {
                          setPercentSplits((prev) => ({ ...prev, [id]: v }));
                        } else {
                          setCustomSplits((prev) => ({ ...prev, [id]: v }));
                        }
                      }}
                      placeholder={splitType === "percentage" ? "%" : "₹"}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-1">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Add expense"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ================ EXPENSES PANEL (LIST + TIMELINE) ================

function ExpensesPanel({
  expenses,
  allExpenses,
  members,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  onDeleteExpense,
}) {
  const resolveName = (id) =>
    members.find((m) => m.id === id)?.name || "Unknown";

  const sortedByDate = useMemo(
    () =>
      [...allExpenses].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ),
    [allExpenses]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Expenses</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Select
              className="w-40"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Tag>{expenses.length} shown</Tag>
          </div>
        </div>

        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Add an expense to start tracking who owes whom."
          />
        ) : (
          <ul className="space-y-2 text-sm">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between rounded-xl border border-slate-100 px-3 py-2"
              >
                <div className="flex flex-1 flex-col">
                  <span className="font-medium">{e.description}</span>
                  <span className="text-xs text-slate-500">
                    Paid by {resolveName(e.paid_by)} ·{" "}
                    <span className="font-medium text-slate-700">
                      ₹{Number(e.amount).toFixed(2)}
                    </span>
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                    <Badge>{e.category}</Badge>
                    <Tag>{e.split_type}</Tag>
                    <span>
                      {new Date(e.created_at).toLocaleString(undefined, {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <button
                  className="ml-2 rounded-md p-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"
                  onClick={() => onDeleteExpense(e.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Activity timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Group activity</h3>
        {sortedByDate.length === 0 ? (
          <EmptyState
            title="No activity"
            description="New expenses will appear here as a timeline."
          />
        ) : (
          <ol className="mt-3 space-y-2 text-xs">
            {sortedByDate.map((e, idx) => (
              <li key={e.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  {idx !== sortedByDate.length - 1 && (
                    <div className="mt-1 h-full w-px bg-slate-200" />
                  )}
                </div>
                <div>
                  <p className="text-slate-700">
                    <span className="font-medium">
                      {resolveName(e.paid_by)}
                    </span>{" "}
                    added{" "}
                    <span className="font-medium">{e.description}</span> for{" "}
                    <span className="font-semibold">
                      ₹{Number(e.amount).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// ================ BALANCES PANEL ================

function BalancesPanel({ members, balances, settlements }) {
  if (!balances) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Spinner />
      </div>
    );
  }

  const memberById = (id) => members.find((m) => m.id == id);

  const entries = Object.entries(balances).map(([id, obj]) => ({
    id,
    name: obj.name,
    balance: obj.balance,
  }));

  const creditors = entries.filter((b) => b.balance > 0.01);
  const debtors = entries.filter((b) => b.balance < -0.01);

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Member balances</h3>
        {entries.length === 0 ? (
          <EmptyState
            title="No balances yet"
            description="Add expenses to see who owes whom."
          />
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {entries.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
              >
                <span>{b.name}</span>
                <span
                  className={`text-sm font-semibold ${
                    b.balance > 0.01
                      ? "text-green-600"
                      : b.balance < -0.01
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                >
                  {b.balance > 0
                    ? `Gets ₹${b.balance.toFixed(2)}`
                    : b.balance < 0
                    ? `Owes ₹${Math.abs(b.balance).toFixed(2)}`
                    : "Settled"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Settlement suggestions</h3>
          <Tag>{settlements.length} transactions</Tag>
        </div>
        {settlements.length === 0 ? (
          <EmptyState
            title="All settled up"
            description="No settlement transactions are required."
          />
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {settlements.map((s, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
              >
                <span>
                  <span className="font-medium">
                    {memberById(s.from)?.name || s.fromName || "Unknown"}
                  </span>{" "}
                  should pay{" "}
                  <span className="font-medium">
                    {memberById(s.to)?.name || s.toName || "Unknown"}
                  </span>
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  ₹{s.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-[11px] text-slate-500">
          These suggestions are generated to{" "}
          <span className="font-medium">minimize the number of transactions</span>.
        </p>
      </div>
    </div>
  );
}

// ================ STATS PANEL ================

function StatsPanel({ stats, expenses, members }) {
  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Spinner />
      </div>
    );
  }

  const total = stats.overall.total_amount || 0;
  const totalExpenses = stats.overall.total_expenses || 0;
  const avg = stats.overall.avg_amount || 0;

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Overview</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Total spent</p>
            <p className="mt-1 text-lg font-semibold">
              ₹{total.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Expenses</p>
            <p className="mt-1 text-lg font-semibold">{totalExpenses}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Average amount</p>
            <p className="mt-1 text-lg font-semibold">
              ₹{avg.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-slate-600">Top categories</p>
          {stats.by_category && stats.by_category.length ? (
            <ul className="mt-2 space-y-1 text-xs">
              {stats.by_category.map((c, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2"
                >
                  <span>{c.category}</span>
                  <span className="text-slate-700">
                    {c.category_count} · ₹{c.category_amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No category data yet"
              description="Add some expenses with categories to see breakdowns."
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Recent summary</h3>
        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Once you add expenses, you’ll see a quick summary here."
          />
        ) : (
          <ul className="mt-3 space-y-1 text-xs">
            {expenses.slice(0, 6).map((e) => {
              const payer = members.find((m) => m.id === e.paid_by)?.name;
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-1.5"
                >
                  <span className="truncate">
                    {payer} paid for <span className="font-medium">{e.description}</span>
                  </span>
                  <span className="text-sm font-semibold">
                    ₹{Number(e.amount).toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-3 text-[11px] text-slate-500">
          Use this view to quickly understand{" "}
          <span className="font-medium">where your money is going</span> across the
          group.
        </p>
      </div>
    </div>
  );
}
