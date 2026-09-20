// Validates and normalizes Uzbekistan phone numbers.
//
// Accepts common input shapes a user might type or paste:
//   "+998901234567", "998901234567", "901234567",
//   "+998 90 123 45 67", "90-123-45-67", etc.
// Always normalizes to the canonical E.164-style form "+998XXXXXXXXX"
// (9 national digits after the 998 country code), which is what gets
// stored in the database and what should be used for lookups/uniqueness
// checks, so the same number typed with different spacing/formatting
// always matches.
//
// This is intentionally used on the backend (not just the frontend) so
// authentication and registration are enforced server-side regardless of
// what the client sends.

const UZ_PHONE_REGEX = /^\+998\d{9}$/;

function normalizeUzPhone(raw) {
  if (typeof raw !== 'string') return null;

  const digits = raw.replace(/\D/g, '');
  let national;

  if (digits.startsWith('998') && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.length === 9) {
    // Assume the caller omitted the country code (e.g. "901234567").
    national = digits;
  } else {
    return null;
  }

  if (!/^\d{9}$/.test(national)) return null;

  const normalized = `+998${national}`;
  return UZ_PHONE_REGEX.test(normalized) ? normalized : null;
}

function isValidUzPhone(raw) {
  return normalizeUzPhone(raw) !== null;
}

module.exports = { UZ_PHONE_REGEX, normalizeUzPhone, isValidUzPhone };
