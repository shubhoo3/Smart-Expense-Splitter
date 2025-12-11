import React, { useEffect, useState } from "react";
import Header from "./components/Layout/Header.jsx";

import Button from "./components/ui/Button";
import Input from "./components/ui/Input";
import Select from "./components/ui/Select";
import Spinner from "./components/ui/Spinner";
import EmptyState from "./components/EmptyState";

import GroupDetail from "./modules/group/GroupDetail";

import { api } from "./api";

export default function App() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", type: "Trip" });

  const [error, setError] = useState(null);

  // Load groups + backend health
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
        setError(err.message || "Failed to load groups");
      } finally {
        setLoadingGroups(false);
      }
    })();
  }, []);

  // Create group
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

  // Delete group
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
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row">
        {/* LEFT SIDEBAR — Groups */}
        <section className="w-full md:w-64">
          <div className="sticky top-3 flex flex-col gap-4">
            {/* Create Group */}
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

            {/* Groups List */}
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

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL — Group Details */}
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
