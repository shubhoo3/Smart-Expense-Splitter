const API_BASE = "https://smart-expense-splitter-eyzz.onrender.com/api"; // Adjust the base URL as needed

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    let error;
    try {
      error = JSON.parse(text);
    } catch {
      error = { error: text || "Unknown error" };
    }
    throw new Error(error.error || "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // Groups
  getGroups: () => request("/groups"),
  getGroup: (id) => request(`/groups/${id}`),
  createGroup: (data) =>
    request("/groups", { method: "POST", body: JSON.stringify(data) }),
  deleteGroup: (id) => request(`/groups/${id}`, { method: "DELETE" }),

  // Members
  getMembers: (groupId) => request(`/groups/${groupId}/members`),
  addMember: (groupId, data) =>
    request(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteMember: (memberId) =>
    request(`/members/${memberId}`, { method: "DELETE" }),

  // Expenses
  getExpenses: (groupId) => request(`/groups/${groupId}/expenses`),
  getExpense: (id) => request(`/expenses/${id}`),
  createExpense: (groupId, data) =>
    request(`/groups/${groupId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateExpense: (id, data) =>
    request(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteExpense: (id) =>
    request(`/expenses/${id}`, { method: "DELETE" }),

  // Analytics
  getGroupStats: (groupId) => request(`/groups/${groupId}/stats`),
  getBalances: (groupId) => request(`/groups/${groupId}/balances`),
  getSettlements: (groupId) => request(`/groups/${groupId}/settlements`),

  health: () => request("/health"),
};
