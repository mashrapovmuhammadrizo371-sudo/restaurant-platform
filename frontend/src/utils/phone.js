// Mirrors backend/src/utils/phoneValidator.js.
// Client-side validation is a UX convenience (instant feedback, no
// round-trip); the backend enforces the same rule independently and is
// what actually protects the data, since a client check can always be
// bypassed (devtools, curl, a different client).

const UZ_PHONE_REGEX = /^\+998\d{9}$/;

export function normalizeUzPhone(raw) {
  if (typeof raw !== 'string') return null;

  const digits = raw.replace(/\D/g, '');
  let national;

  if (digits.startsWith('998') && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.length === 9) {
    national = digits;
  } else {
    return null;
  }

  if (!/^\d{9}$/.test(national)) return null;

  const normalized = `+998${national}`;
  return UZ_PHONE_REGEX.test(normalized) ? normalized : null;
}

export function isValidUzPhone(raw) {
  return normalizeUzPhone(raw) !== null;
}

export const UZ_PHONE_PLACEHOLDER = '+998901234567';
export const UZ_PHONE_ERROR = "Iltimos, to'g'ri O'zbekiston telefon raqamini kiriting (masalan, +998901234567)";
