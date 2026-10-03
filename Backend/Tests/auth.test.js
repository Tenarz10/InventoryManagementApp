const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = require("../app");
const User = require("../Models/User");
const authService = require("../Services/authService");
const { protect, authorize } = require("../Middleware/authMiddleware");
const { validateRegister, validateLogin } = require("../Validators/authValidator");
const { ROLES } = require("../Utils/authConstants");

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

describe("User model", () => {
  it("defaults to the staff role and hides the password in JSON", () => {
    const user = new User({ name: "Ada", email: "ADA@Example.com", password: "longenough" });
    assert.equal(user.role, ROLES.STAFF);
    assert.equal(user.email, "ada@example.com");
    assert.equal(user.toJSON().password, undefined);
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
  const user = { _id: userId, role: ROLES.STAFF };

  before(() => {
    authService.getUserById = async (id) => (id === userId.toString() ? user : null);
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

describe("Protected stock routes", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => server.close());

  const modifyingRoutes = [
    ["POST", "/api/stock"],
    ["PATCH", `/api/stock/${productId}`],
    ["DELETE", `/api/stock/${productId}`],
    ["POST", `/api/stock/${productId}/in`],
    ["POST", `/api/stock/${productId}/out`],
    ["POST", `/api/stock/${productId}/adjust`],
    ["GET", "/api/auth/me"]
  ];

  for (const [method, path] of modifyingRoutes) {
    it(`${method} ${path} returns 401 without a token`, async () => {
      const response = await fetch(baseUrl + path, { method });
      assert.equal(response.status, 401);
    });
  }
});
