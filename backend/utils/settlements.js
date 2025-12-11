module.exports = function calculateSettlements(members, rows) {
  const balances = {};

  // Start with zero balances
  members.forEach((m) => (balances[m.id] = 0));

  // Apply expenses and splits
  rows.forEach((row) => {
    if (balances[row.paid_by] !== undefined) {
      balances[row.paid_by] += row.amount;
    }

    if (row.member_id && balances[row.member_id] !== undefined) {
      balances[row.member_id] -= row.split_amount;
    }
  });

  // Separate creditors & debtors
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([memberId, balance]) => {
    balance = parseFloat(balance.toFixed(2));
    if (balance > 0.01) creditors.push({ memberId, amount: balance });
    if (balance < -0.01) debtors.push({ memberId, amount: -balance });
  });

  // Minimize transaction count
  let i = 0,
    j = 0;
  const results = [];

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].amount, debtors[j].amount);

    results.push({
      from: debtors[j].memberId,
      to: creditors[i].memberId,
      amount: parseFloat(amount.toFixed(2)),
    });

    creditors[i].amount -= amount;
    debtors[j].amount -= amount;

    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return results.map((s) => ({
    ...s,
    fromName: members.find((m) => m.id == s.from)?.name,
    toName: members.find((m) => m.id == s.to)?.name,
  }));
};
