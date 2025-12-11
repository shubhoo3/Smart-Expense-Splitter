import React from "react";
import EmptyState from "../../components/EmptyState";
import Tag from "../../components/ui/Tag";
import Spinner from "../../components/ui/Spinner";

export default function BalancesPanel({ members, balances, settlements }) {
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
      {/* Member Balances */}
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

      {/* Settlement Suggestions */}
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
          <span className="font-medium">
            minimize the number of transactions
          </span>
          .
        </p>
      </div>
    </div>
  );
}
