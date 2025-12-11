import React from "react";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/EmptyState";

export default function StatsPanel({ stats, expenses, members }) {
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
      {/* Overview Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Overview</h3>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Total spent</p>
            <p className="mt-1 text-lg font-semibold">₹{total.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Expenses</p>
            <p className="mt-1 text-lg font-semibold">{totalExpenses}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] text-slate-500">Average amount</p>
            <p className="mt-1 text-lg font-semibold">₹{avg.toFixed(2)}</p>
          </div>
        </div>

        {/* Category Breakdown */}
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

      {/* Recent Summary */}
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
                    {payer} paid for{" "}
                    <span className="font-medium">{e.description}</span>
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
          <span className="font-medium">where your money is going</span> across
          the group.
        </p>
      </div>
    </div>
  );
}
