// Mirrors backend/src/utils/phoneValidator.js exactly.
//
// ONLY the literal format "+998 XX XXX XX XX" is accepted — e.g.
// "+998 90 123 45 67". This is intentionally strict and does not
// normalize other shapes into it; the backend re-validates the same
// way and is the actual source of truth (a client-side check can
// always be bypassed).

const UZ_PHONE_REGEX = /^\+998 \d{2} \d{3} \d{2} \d{2}$/;

export function isValidUzPhone(value) {
  return typeof value === 'string' && UZ_PHONE_REGEX.test(value);
}

export const UZ_PHONE_PLACEHOLDER = '+998 90 123 45 67';
export const UZ_PHONE_ERROR = "Telefon raqam aynan +998 XX XXX XX XX shaklida bo'lishi kerak (masalan, +998 90 123 45 67)";

// Formats keystrokes into the required "+998 XX XXX XX XX" shape as the
// user types, inserting the separating spaces automatically at the
// right positions. This is an input-assist for producing the one
// accepted format — it does not accept some other complete/finished
// format and rewrite it; it only ever builds up digits the user is
// actively typing into the required grouping.
export function formatUzPhoneInput(raw) {
  const digitsAll = raw.replace(/\D/g, '');
  if (digitsAll.length === 0) return '+998 ';

  const digits = (digitsAll.startsWith('998') ? digitsAll.slice(3) : digitsAll).slice(0, 9);

  let out = '+998';
  if (digits.length > 0) out += ` ${digits.slice(0, 2)}`;
  if (digits.length > 2) out += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) out += ` ${digits.slice(5, 7)}`;
  if (digits.length > 7) out += ` ${digits.slice(7, 9)}`;
  return out;
}
