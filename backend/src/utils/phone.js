/** Normalize Indian customer phone numbers to E.164 (+91XXXXXXXXXX). */
export function normalizeIndianPhone(value) {
  const raw = String(value || "").replace(/[^0-9+]/g, "");
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `+91${digits}`;
}
