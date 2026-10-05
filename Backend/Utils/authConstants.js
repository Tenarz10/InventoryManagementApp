const ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff"
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

// Which roles may perform each action. Every action also requires a logged-in, active account.
// Routes use these with authorize(...PERMISSIONS.X) so the rules live in one place.
const PERMISSIONS = Object.freeze({
  // View stock levels, summaries and movement history
  STOCK_READ: ALL_ROLES,
  // Record deliveries and sales (stock in / stock out)
  STOCK_MOVE: ALL_ROLES,
  // Create stock records, change reorder/max levels and location, set exact quantities
  STOCK_MANAGE: Object.freeze([ROLES.ADMIN, ROLES.MANAGER]),
  // Delete stock records
  STOCK_DELETE: Object.freeze([ROLES.ADMIN]),
  // View the list of user accounts
  USERS_READ: Object.freeze([ROLES.ADMIN, ROLES.MANAGER]),
  // Create, edit, deactivate and delete user accounts, change roles, reset passwords
  USERS_MANAGE: Object.freeze([ROLES.ADMIN])
});

const BCRYPT_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
// bcrypt only uses the first 72 bytes of a password
const MAX_PASSWORD_LENGTH = 72;
const DEFAULT_JWT_EXPIRES_IN = "1d";
const MIN_JWT_SECRET_LENGTH = 32;

module.exports = {
  ROLES,
  ALL_ROLES,
  PERMISSIONS,
  BCRYPT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  DEFAULT_JWT_EXPIRES_IN,
  MIN_JWT_SECRET_LENGTH
};
