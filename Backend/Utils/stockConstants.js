const MOVEMENT_TYPES = Object.freeze({
  INITIAL: "initial",
  IN: "in",
  OUT: "out",
  ADJUSTMENT: "adjustment"
});

const STOCK_STATUS = Object.freeze({
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
  OVERSTOCKED: "overstocked"
});

const DEFAULT_REORDER_LEVEL = 10;

module.exports = {
  MOVEMENT_TYPES,
  STOCK_STATUS,
  DEFAULT_REORDER_LEVEL
};
