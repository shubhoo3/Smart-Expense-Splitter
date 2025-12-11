import React, { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/EmptyState";
import { api } from "../../api";

export default function MembersPanel({
  groupId,
  members,
  onMemberAdded,
  onMemberDeleted,
}) {
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
      {/* Members List */}
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

      {/* Add Member */}
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
