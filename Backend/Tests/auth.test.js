const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = require("../app");
const User = require("../Models/User");
const authService = require("../Services/authService");
const userService = require("../Services/userService");
const { protect, authorize, registrationOpen } = require("../Middleware/authMiddleware");
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword
} = require("../Validators/authValidator");
const { validateUpdateUser, validateUserQuery } = require("../Validators/userValidator");
const { ROLES, PERMISSIONS } = require("../Utils/authConstants");

const userId = new mongoose.Types.ObjectId();
const productId = new mongoose.Types.ObjectId().toString();

// Runs a middleware and resolves with the error passed to next (if any)
const run = async (middleware, req) => {
  let error;
  await middleware(req, {}, (err) => {
    error = err;
  });
  return error;
};

describe("Auth validators", () => {
  it("requires name, email and password to register", async () => {
    const error = await run(validateRegister, { body: {} });
    assert.deepEqual(error.details, [
      "name is required",
      "email is required",
      "password is required"
    ]);
  });

  it("rejects an invalid email and a short password", async () => {
    const error = await run(validateRegister, {
      body: { name: "Ada", email: "not-an-email", password: "short" }
    });
    assert.equal(error.details.length, 2);
  });

  it("accepts a valid registration", async () => {
    const error = await run(validateRegister, {
      body: { name: "Ada", email: " ada@example.com ", password: "longenough" }
    });
    assert.equal(error, undefined);
  });

  it("requires email and password to log in", async () => {
    assert.ok(await run(validateLogin, { body: undefined }));
    assert.equal(
      await run(validateLogin, { body: { email: "ada@example.com", password: "x" } }),
      undefined
    );
  });
});

describe("Account and user validators", () => {
  it("does not let users change their own role, status or password via the profile", async () => {
    const error = await run(validateUpdateProfile, {
      body: { name: "Ada", role: "admin", isActive: true, password: "longenough" }
    });
    assert.equal(error.details.length, 3);
  });

  it("requires something to update on the profile", async () => {
    assert.ok(await run(validateUpdateProfile, { body: {} }));
    assert.equal(await run(validateUpdateProfile, { body: { name: "Ada L" } }), undefined);
  });

  it("requires a new password that differs from the current one", async () => {
    const same = await run(validateChangePassword, {
      body: { currentPassword: "longenough", newPassword: "longenough" }
    });
    assert.match(same.details[0], /different/);

    assert.equal(
      await run(validateChangePassword, {
        body: { currentPassword: "longenough", newPassword: "evenlonger" }
      }),
      undefined
    );
  });

  it("validates role and isActive on admin user updates", async () => {
    const error = await run(validateUpdateUser, { body: { role: "owner", isActive: "maybe" } });
    assert.equal(error.details.length, 2);

    const req = { body: { isActive: "false" } };
    assert.equal(await run(validateUpdateUser, req), undefined);
    assert.equal(req.body.isActive, false);
  });

  it("rejects an unknown role filter", async () => {
    assert.ok(await run(validateUserQuery, { query: { role: "owner" } }));
  });
});

describe("Permissions", () => {
  it("lets every role read and move stock", () => {
    for (const role of Object.values(ROLES)) {
      assert.ok(PERMISSIONS.STOCK_READ.includes(role));
      assert.ok(PERMISSIONS.STOCK_MOVE.includes(role));
    }
  });

  it("limits managing stock to managers and admins, and deleting to admins", () => {
    assert.deepEqual(PERMISSIONS.STOCK_MANAGE, [ROLES.ADMIN, ROLES.MANAGER]);
    assert.deepEqual(PERMISSIONS.STOCK_DELETE, [ROLES.ADMIN]);
    assert.deepEqual(PERMISSIONS.USERS_MANAGE, [ROLES.ADMIN]);
  });

  it("can turn off public registration", async () => {
    process.env.ALLOW_REGISTRATION = "false";
    assert.equal((await run(registrationOpen, {})).statusCode, 403);
    delete process.env.ALLOW_REGISTRATION;
    assert.equal(await run(registrationOpen, {}), undefined);
  });
});

describe("User model", () => {
  it("defaults to an active staff account and hides secrets in JSON", () => {
    const user = new User({ name: "Ada", email: "ADA@Example.com", password: "longenough" });
    assert.equal(user.role, ROLES.STAFF);
    assert.equal(user.isActive, true);
    assert.equal(user.email, "ada@example.com");
    assert.equal(user.toJSON().password, undefined);
    assert.equal(user.toJSON().tokenVersion, undefined);
  });

  it("compares passwords against the bcrypt hash", async () => {
    const bcrypt = require("bcryptjs");
    const user = new User({ password: await bcrypt.hash("longenough", 4) });
    assert.equal(await user.comparePassword("longenough"), true);
    assert.equal(await user.comparePassword("wrong-password"), false);
  });
});

describe("protect middleware", () => {
  const originalGetUserById = authService.getUserById;
  const user = { _id: userId, role: ROLES.STAFF, isActive: true, tokenVersion: 2 };
  const inactiveUser = { _id: new mongoose.Types.ObjectId(), role: ROLES.STAFF, isActive: false };
  const users = [user, inactiveUser];

  before(() => {
    authService.getUserById = async (id) => users.find((u) => u._id.toString() === id) || null;
  });

  after(() => {
    authService.getUserById = originalGetUserById;
  });

  const withToken = (token) => ({ headers: { authorization: `Bearer ${token}` } });

  it("rejects a request without a token", async () => {
    const error = await run(protect, { headers: {} });
    assert.equal(error.statusCode, 401);
  });

  it("rejects an invalid or expired token", async () => {
    assert.equal((await run(protect, withToken("garbage"))).statusCode, 401);

    const expired = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
      expiresIn: -10
    });
    const error = await run(protect, withToken(expired));
    assert.match(error.message, /expired/);
  });

  it("rejects a token for a user that no longer exists", async () => {
    const token = authService.signToken({ _id: new mongoose.Types.ObjectId(), role: "staff" });
    assert.equal((await run(protect, withToken(token))).statusCode, 401);
  });

  it("rejects a token revoked by logout or a password change", async () => {
    const oldToken = authService.signToken({ ...user, tokenVersion: 1 });
    const error = await run(protect, withToken(oldToken));
    assert.equal(error.statusCode, 401);
    assert.match(error.message, /revoked/);
  });

  it("rejects a deactivated account", async () => {
    const error = await run(protect, withToken(authService.signToken(inactiveUser)));
    assert.equal(error.statusCode, 403);
  });

  it("attaches the user to req.user for a valid token", async () => {
    const req = withToken(authService.signToken(user));
    assert.equal(await run(protect, req), undefined);
    assert.equal(req.user, user);
  });

  it("authorize allows only the listed roles", async () => {
    const onlyAdmin = authorize(ROLES.ADMIN);
    assert.equal((await run(onlyAdmin, { user })).statusCode, 403);
    assert.equal(await run(onlyAdmin, { user: { role: ROLES.ADMIN } }), undefined);
  });
});

describe("Route access rules", () => {
  const originalGetUserById = authService.getUserById;
  const accounts = {
    [ROLES.STAFF]: { _id: new mongoose.Types.ObjectId(), role: ROLES.STAFF, isActive: true },
    [ROLES.MANAGER]: { _id: new mongoose.Types.ObjectId(), role: ROLES.MANAGER, isActive: true },
    [ROLES.ADMIN]: { _id: new mongoose.Types.ObjectId(), role: ROLES.ADMIN, isActive: true }
  };
  let server;
  let baseUrl;

  before(async () => {
    authService.getUserById = async (id) =>
      Object.values(accounts).find((account) => account._id.toString() === id) || null;
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    authService.getUserById = originalGetUserById;
    server.close();
  });

  const request = (method, path, role, body) =>
    fetch(baseUrl + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(role && { Authorization: `Bearer ${authService.signToken(accounts[role])}` })
      },
      ...(body && method !== "GET" && { body: JSON.stringify(body) })
    });

  const protectedRoutes = [
    ["GET", "/api/stock"],
    ["GET", "/api/stock/summary"],
    ["GET", "/api/stock/low-stock"],
    ["GET", "/api/stock/movements"],
    ["GET", `/api/stock/${productId}`],
    ["GET", `/api/stock/${productId}/movements`],
    ["POST", "/api/stock"],
    ["PATCH", `/api/stock/${productId}`],
    ["DELETE", `/api/stock/${productId}`],
    ["POST", `/api/stock/${productId}/in`],
    ["POST", `/api/stock/${productId}/out`],
    ["POST", `/api/stock/${productId}/adjust`],
    ["GET", "/api/auth/me"],
    ["PATCH", "/api/auth/me"],
    ["PATCH", "/api/auth/password"],
    ["POST", "/api/auth/logout"],
    ["GET", "/api/users"],
    ["POST", "/api/users"],
    ["GET", `/api/users/${userId}`],
    ["PATCH", `/api/users/${userId}`],
    ["DELETE", `/api/users/${userId}`],
    ["PATCH", `/api/users/${userId}/password`]
  ];

  for (const [method, path] of protectedRoutes) {
    it(`${method} ${path} returns 401 without a token`, async () => {
      assert.equal((await request(method, path)).status, 401);
    });
  }

  // [method, path, role, expected status]. A 400 means the role passed the permission
  // check and the request reached validation (the bodies are deliberately empty).
  const roleRules = [
    ["POST", `/api/stock/${productId}/in`, ROLES.STAFF, 400],
    ["POST", `/api/stock/${productId}/out`, ROLES.STAFF, 400],
    ["POST", "/api/stock", ROLES.STAFF, 403],
    ["PATCH", `/api/stock/${productId}`, ROLES.STAFF, 403],
    ["POST", `/api/stock/${productId}/adjust`, ROLES.STAFF, 403],
    ["DELETE", `/api/stock/${productId}`, ROLES.STAFF, 403],
    ["POST", "/api/stock", ROLES.MANAGER, 400],
    ["PATCH", `/api/stock/${productId}`, ROLES.MANAGER, 400],
    ["POST", `/api/stock/${productId}/adjust`, ROLES.MANAGER, 400],
    ["DELETE", `/api/stock/${productId}`, ROLES.MANAGER, 403],
    ["DELETE", "/api/stock/not-an-id", ROLES.ADMIN, 400],
    ["GET", "/api/users?role=owner", ROLES.STAFF, 403],
    ["GET", "/api/users?role=owner", ROLES.MANAGER, 400],
    ["POST", "/api/users", ROLES.MANAGER, 403],
    ["PATCH", `/api/users/${userId}`, ROLES.MANAGER, 403],
    ["DELETE", `/api/users/${userId}`, ROLES.MANAGER, 403],
    ["PATCH", `/api/users/${userId}/password`, ROLES.MANAGER, 403],
    ["POST", "/api/users", ROLES.ADMIN, 400],
    ["PATCH", `/api/users/${userId}`, ROLES.ADMIN, 400],
    ["PATCH", `/api/users/${userId}/password`, ROLES.ADMIN, 400]
  ];

  for (const [method, path, role, expected] of roleRules) {
    it(`${role} ${method} ${path} returns ${expected}`, async () => {
      assert.equal((await request(method, path, role, {})).status, expected);
    });
  }

  it("rate limits repeated failed logins", async () => {
    const statuses = [];
    for (let i = 0; i < 11; i++) {
      statuses.push((await request("POST", "/api/auth/login", null, {})).status);
    }
    assert.equal(statuses.at(-2), 400);
    assert.equal(statuses.at(-1), 429);
  });
});

describe("User management rules", () => {
  const originalFindById = User.findById;
  const originalCountDocuments = User.countDocuments;
  const admin = { _id: new mongoose.Types.ObjectId(), role: ROLES.ADMIN, isActive: true };
  let otherActiveAdmins;

  before(() => {
    User.findById = async (id) => (id.toString() === admin._id.toString() ? admin : null);
    User.countDocuments = async () => otherActiveAdmins;
  });

  after(() => {
    User.findById = originalFindById;
    User.countDocuments = originalCountDocuments;
  });

  it("stops admins demoting, deactivating or deleting themselves", async () => {
    otherActiveAdmins = 3;
    await assert.rejects(
      userService.updateUser(admin._id, { role: ROLES.STAFF }, admin),
      /your own admin role/
    );
    await assert.rejects(userService.updateUser(admin._id, { isActive: false }, admin), /your own/);
    await assert.rejects(userService.deleteUser(admin._id, admin), /your own account/);
  });

  it("never removes the last active admin", async () => {
    otherActiveAdmins = 0;
    const someoneElse = { _id: new mongoose.Types.ObjectId(), role: ROLES.ADMIN };
    await assert.rejects(
      userService.updateUser(admin._id, { role: ROLES.MANAGER }, someoneElse),
      /last active admin/
    );
    await assert.rejects(userService.deleteUser(admin._id, someoneElse), /last active admin/);
  });

  it("returns 404 for an unknown user", async () => {
    await assert.rejects(userService.getUser(new mongoose.Types.ObjectId()), (error) => {
      assert.equal(error.statusCode, 404);
      return true;
    });
  });
});
