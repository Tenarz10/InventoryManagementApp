const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Stock = require("../Models/Stock");
const { getPagination } = require("../Services/stockService");
const {
  validateProductIdParam,
  validateCreateStock,
  validateUpdateStock,
  validateStockMovement,
  validateStockAdjustment,
  validateStockQuery,
  validateMovementQuery
} = require("../Validators/stockValidator");
const { STOCK_STATUS } = require("../Utils/stockConstants");

const productId = new mongoose.Types.ObjectId().toString();

// Runs a validator middleware and returns the error passed to next (if any)
const run = (middleware, { body, params = {}, query = {} } = {}) => {
  const req = { body, params, query };
  let error;
  middleware(req, {}, (err) => {
    error = err;
  });
  return { req, error };
};

// Rejects only when validation fails on the given field
const invalidField = async (doc, field) => {
  try {
    await doc.validate();
  } catch (err) {
    if (err.errors?.[field]) throw err;
  }
};

describe("Stock model", () => {
  it("reports out_of_stock when quantity is 0", () => {
    const stock = new Stock({ product: productId, quantity: 0 });
    assert.equal(stock.status, STOCK_STATUS.OUT_OF_STOCK);
  });

  it("reports low_stock at or below the reorder level", () => {
    const stock = new Stock({ product: productId, quantity: 5, reorderLevel: 5 });
    assert.equal(stock.status, STOCK_STATUS.LOW_STOCK);
  });

  it("reports in_stock above the reorder level", () => {
    const stock = new Stock({ product: productId, quantity: 50, reorderLevel: 5 });
    assert.equal(stock.status, STOCK_STATUS.IN_STOCK);
  });

  it("reports overstocked above the max level", () => {
    const stock = new Stock({
      product: productId,
      quantity: 120,
      reorderLevel: 5,
      maxLevel: 100
    });
    assert.equal(stock.status, STOCK_STATUS.OVERSTOCKED);
  });

  it("rejects negative and fractional quantities", async () => {
    await assert.rejects(invalidField(new Stock({ product: productId, quantity: -1 }), "quantity"));
    await assert.rejects(invalidField(new Stock({ product: productId, quantity: 1.5 }), "quantity"));
  });

  it("rejects a max level below the reorder level", async () => {
    const stock = new Stock({ product: productId, reorderLevel: 20, maxLevel: 10 });
    await assert.rejects(invalidField(stock, "maxLevel"));
  });

  it("requires a product", async () => {
    await assert.rejects(invalidField(new Stock({}), "product"));
  });
});

describe("Stock validators", () => {
  it("rejects an invalid productId param", () => {
    const { error } = run(validateProductIdParam, { params: { productId: "abc" } });
    assert.equal(error.statusCode, 400);
  });

  it("accepts a valid productId param", () => {
    const { error } = run(validateProductIdParam, { params: { productId } });
    assert.equal(error, undefined);
  });

  it("requires a product when creating stock", () => {
    const { error } = run(validateCreateStock, { body: { quantity: 5 } });
    assert.ok(error.details.includes("product is required"));
  });

  it("converts numeric strings from form data to numbers", () => {
    const { req, error } = run(validateCreateStock, {
      body: { product: productId, quantity: "12", reorderLevel: "3" }
    });
    assert.equal(error, undefined);
    assert.equal(req.body.quantity, 12);
    assert.equal(req.body.reorderLevel, 3);
  });

  it("rejects maxLevel below reorderLevel", () => {
    const { error } = run(validateCreateStock, {
      body: { product: productId, reorderLevel: 20, maxLevel: 5 }
    });
    assert.ok(error);
  });

  it("does not allow quantity in a settings update", () => {
    const { error } = run(validateUpdateStock, { body: { quantity: 10, location: "A1" } });
    assert.ok(error);
  });

  it("requires at least one field in a settings update", () => {
    const { error } = run(validateUpdateStock, { body: {} });
    assert.ok(error);
  });

  it("requires a positive quantity for stock in/out", () => {
    assert.ok(run(validateStockMovement, { body: {} }).error);
    assert.ok(run(validateStockMovement, { body: { quantity: 0 } }).error);
    assert.ok(run(validateStockMovement, { body: { quantity: -3 } }).error);
    assert.equal(run(validateStockMovement, { body: { quantity: 3 } }).error, undefined);
  });

  it("handles a missing request body", () => {
    const { error } = run(validateStockMovement, { body: undefined });
    assert.ok(error.details.includes("quantity is required"));
  });

  it("allows adjusting to zero but requires a reason", () => {
    assert.ok(run(validateStockAdjustment, { body: { quantity: 0 } }).error);
    assert.equal(
      run(validateStockAdjustment, { body: { quantity: 0, reason: "Damaged" } }).error,
      undefined
    );
  });

  it("rejects an unknown status filter", () => {
    assert.ok(run(validateStockQuery, { query: { status: "missing" } }).error);
    assert.equal(run(validateStockQuery, { query: { status: "low_stock" } }).error, undefined);
  });

  it("rejects unknown movement types and invalid dates", () => {
    assert.ok(run(validateMovementQuery, { query: { type: "stolen" } }).error);
    assert.ok(run(validateMovementQuery, { query: { from: "not-a-date" } }).error);
    assert.equal(
      run(validateMovementQuery, { query: { type: "in", from: "2026-01-01" } }).error,
      undefined
    );
  });
});

describe("Pagination", () => {
  it("uses defaults when nothing is given", () => {
    assert.deepEqual(getPagination(), { page: 1, limit: 20, skip: 0 });
  });

  it("caps the page size and ignores invalid values", () => {
    assert.deepEqual(getPagination({ page: "3", limit: "500" }), {
      page: 3,
      limit: 100,
      skip: 200
    });
    assert.deepEqual(getPagination({ page: "-2", limit: "abc" }), {
      page: 1,
      limit: 20,
      skip: 0
    });
  });
});
