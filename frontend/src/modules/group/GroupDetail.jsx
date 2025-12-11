import React, { useEffect, useState, useMemo } from "react";
import { api } from "../../api";

import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/EmptyState";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

import MembersPanel from "./MembersPanel";
import ExpenseForm from "./ExpenseForm";
import ExpensesPanel from "./ExpensesPanel";
import BalancesPanel from "./BalancesPanel";
import StatsPanel from "./StatsPanel";

export default function GroupDetail({ groupId }) {
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
  };

  const handleExpenseAdded = (expense) => {
    setExpenses((prev) => [expense, ...prev]);

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
      const payer =
        members.find((m) => m.id === e.paid_by)?.name || "Unknown";

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
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group?.name || "group"}-expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Spinner />
      </div>
    );

  if (!group)
    return (
      <EmptyState
        title="Group not found"
        description="Please select a valid group."
      />
    );

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500">
              Total spent{" "}
              <span className="text-sm font-semibold text-slate-900">
                ₹{(stats?.overall?.total_amount || 0).toFixed(2)}
              </span>
            </div>
            <Button variant="secondary" onClick={handleExportCSV}>
              Export CSV
            </Button>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-4 flex gap-2 text-xs">
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
                  : "bg-slate-100 text-slate-700"
              }`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
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
        <StatsPanel
          stats={stats}
          expenses={expenses}
          members={members}
        />
      )}
    </div>
  );
}
