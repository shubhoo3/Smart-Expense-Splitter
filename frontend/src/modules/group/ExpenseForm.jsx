import React, { useEffect, useState } from "react";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/EmptyState";
import { api } from "../../api";

export default function ExpenseForm({ groupId, members, onExpenseAdded }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("General");
  const [splitType, setSplitType] = useState("equal");
  const [participants, setParticipants] = useState([]);
  const [customSplits, setCustomSplits] = useState({});
  const [percentSplits, setPercentSplits] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Set default payer + participants
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
    }

    else if (splitType === "percentage") {
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
    }

    else if (splitType === "custom") {
      let total = 0;
      for (const id of participants) {
        total += Number(customSplits[id] || 0);
      }

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

      // Reset form
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
        {/* Description + Amount */}
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

        {/* Paid by + Category */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">
              Paid by
            </label>
            <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
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

        {/* Split Details */}
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
