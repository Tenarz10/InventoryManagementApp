const ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff"
});

const BCRYPT_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_JWT_EXPIRES_IN = "1d";

module.exports = {
  ROLES,
  BCRYPT_SALT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  DEFAULT_JWT_EXPIRES_IN
};
