import React, { useMemo } from "react";
import Select from "../../components/ui/Select";
import Tag from "../../components/ui/Tag";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/EmptyState";

export default function ExpensesPanel({
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
      {/* Expenses List */}
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
                    Paid by {resolveName(e.paid_by)} •{" "}
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

      {/* Timeline */}
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
                    <span className="font-medium">{resolveName(e.paid_by)}</span>{" "}
                    added <span className="font-medium">{e.description}</span>{" "}
                    for{" "}
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
