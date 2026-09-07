// Generates a human-readable, sufficiently-unique order number.
// Format: RO-YYMMDD-XXXXX (XXXXX = random base36 chars)
module.exports = function generateOrderNumber() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `RO-${y}${m}${d}-${rand}`;
};
