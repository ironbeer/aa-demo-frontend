/**
 * Human-readable title for your website
 */
export const rpName = "AccountAbstraction demo with WebAuthn";

/**
 * A unique identifier for your website. 'localhost' is okay for
 * local dev
 */
export const rpID = process.env.WEBAUTHN_RP_ID || "localhost";

/**
 * The URL at which registrations and authentications should occur.
 * 'http://localhost' and 'http://localhost:PORT' are also valid.
 * Do NOT include any trailing /
 */
export const rpOrigin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";
