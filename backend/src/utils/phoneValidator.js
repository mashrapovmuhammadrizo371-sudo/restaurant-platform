// Strict Uzbekistan phone number validator.
//
// Per product requirement, ONLY this exact literal format is accepted:
//
//     +998 XX XXX XX XX
//
// i.e. "+998", a space, 2 digits, a space, 3 digits, a space, 2 digits,
// a space, 2 digits — e.g. "+998 90 123 45 67".
//
// This is deliberately strict: it does NOT normalize, reformat, or
// otherwise accept equivalent-looking input in a different shape
// ("998901234567", "+998901234567", "90 123 45 67", "+998-90-123-45-67",
// etc.). Anything that isn't already exactly this format is rejected.
// The value is used/stored exactly as the caller provided it (after
// trimming only leading/trailing whitespace, which is not a format
// change) — never rewritten into the canonical shape.

const UZ_PHONE_REGEX = /^\+998 \d{2} \d{3} \d{2} \d{2}$/;

function isValidUzPhone(value) {
  return typeof value === 'string' && UZ_PHONE_REGEX.test(value);
}

module.exports = { UZ_PHONE_REGEX, isValidUzPhone };
