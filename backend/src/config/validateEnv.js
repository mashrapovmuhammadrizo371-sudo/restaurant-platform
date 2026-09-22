// Fails fast, with a clear message, if required production environment
// variables are missing — instead of the app booting "successfully" and
// then throwing a cryptic low-level error the first time something tries
// to use the missing value (e.g. jsonwebtoken's
// "secretOrPrivateKey must have a value" the first time anyone logs in,
// which is exactly what happened in a previous deployment: the server
// started fine because nothing at boot time actually touched
// JWT_SECRET, and the failure only surfaced later, on the first login
// request, with no indication of *why*).
function requireEnv() {
  const missing = [];

  if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
    missing.push('JWT_SECRET');
  }
  if (!process.env.MONGO_URI || !process.env.MONGO_URI.trim()) {
    missing.push('MONGO_URI');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Set these in the environment (see backend/.env.example) before starting the server.'
    );
  }

  if (process.env.JWT_SECRET.length < 16) {
    // Not a hard failure (an existing deployment may already be using a
    // shorter one and we don't want to brick it), but a clear warning is
    // better than silence for something security-sensitive.
    // eslint-disable-next-line no-console
    console.warn(
      '[config] Warning: JWT_SECRET is very short. Use a long, random value in production ' +
      '(e.g. `node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"`).'
    );
  }
}

module.exports = { requireEnv };
