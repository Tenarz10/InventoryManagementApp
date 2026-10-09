
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./products.css";

const API =
  "https://inventorymanagementapp-jxrh.onrender.com/api/products";

const emptyForm = {
  name: "",
  sku: "",
  price: "",
  quantity: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const getConfig = useCallback(() => {
    const token = localStorage.getItem("token");

    return {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API, getConfig());
      setProducts(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      setError(
        err.response?.status === 401 || err.response?.status === 403
          ? "Your session may have expired. Please sign in again."
          : "We couldn't load your products. The server may be starting up."
      );
    } finally {
      setLoading(false);
    }
  }, [getConfig]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const lowStock = products.filter(
    (product) =>
      Number(product.quantity) > 0 &&
      Number(product.quantity) <= 5
  ).length;

  const outOfStock = products.filter(
    (product) => Number(product.quantity) <= 0
  ).length;

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      [product.name, product.sku]
        .some((value) =>
          String(value ?? "").toLowerCase().includes(term)
        )
    );
  }, [products, search]);

  const handleAdd = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.sku.trim() ||
      form.price === "" ||
      form.quantity === ""
    ) {
      setError("Please complete all four product fields.");
      return;
    }

    if (
      Number(form.price) < 0 ||
      Number(form.quantity) < 0
    ) {
      setError("Price and quantity cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      await axios.post(
        API,
        {
          name: form.name.trim(),
          sku: form.sku.trim(),
          price: Number(form.price),
          quantity: Number(form.quantity),
        },
        getConfig()
      );

      setForm({ ...emptyForm });
      setNotice("Product added successfully.");
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to add the product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${product.name}"?`
      )
    ) {
      return;
    }

    try {
      setError("");
      setNotice("");

      await axios.delete(`${API}/${product._id}`, getConfig());

      if (editing === product._id) {
        setEditing(null);
      }

      setNotice("Product deleted successfully.");
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete the product. Please try again."
      );
    }
  };

  const startEdit = (product) => {
    setEditing(product._id);
    setEditForm({
      name: product.name ?? "",
      price: product.price ?? "",
      quantity: product.quantity ?? "",
    });
    setError("");
    setNotice("");
  };

  const handleUpdate = async (id) => {
    if (
      !editForm.name.trim() ||
      editForm.price === "" ||
      editForm.quantity === ""
    ) {
      setError("Please complete all edit fields.");
      return;
    }

    if (
      Number(editForm.price) < 0 ||
      Number(editForm.quantity) < 0
    ) {
      setError("Price and quantity cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      await axios.put(
        `${API}/${id}`,
        {
          name: editForm.name.trim(),
          price: Number(editForm.price),
          quantity: Number(editForm.quantity),
        },
        getConfig()
      );

      setEditing(null);
      setNotice("Product updated successfully.");
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (quantity) => {
    const qty = Number(quantity);

    if (qty <= 0) {
      return { label: "Out of stock", className: "out" };
    }

    if (qty <= 5) {
      return { label: "Low stock", className: "low" };
    }

    return { label: "In stock", className: "available" };
  };

  return (
    <main className="inventory-page">
      <div className="inventory-shell">
        <header className="inventory-header">
          <div>
            <span className="eyebrow">INVENTORY MANAGEMENT</span>
            <h1>Products</h1>
            <p>Manage your products, prices and stock levels.</p>
          </div>

          <div className="header-count">
            <span className="count-number">{products.length}</span>
            <span className="count-label">Total products</span>
          </div>
        </header>

        <section
          className="inventory-stats"
          aria-label="Inventory summary"
        >
          <article className="stat-card">
            <span className="stat-icon blue">P</span>
            <div>
              <p>Total products</p>
              <strong>{products.length}</strong>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-icon amber">!</span>
            <div>
              <p>Low stock</p>
              <strong>{lowStock}</strong>
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-icon red">↓</span>
            <div>
              <p>Out of stock</p>
              <strong>{outOfStock}</strong>
            </div>
          </article>
        </section>

        {error && (
          <div className="feedback feedback-error" role="alert">
            <span>{error}</span>
            {loading && <span> Please wait.</span>}
            {!loading && (
              <button
                type="button"
                className="feedback-action"
                onClick={fetchProducts}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {notice && (
          <div className="feedback feedback-success" role="status">
            {notice}
          </div>
        )}

        <section className="panel add-product-panel">
          <div className="section-heading">
            <div>
              <h2>Add a product</h2>
              <p>Enter the details of the product you want to track.</p>
            </div>
          </div>

          <form className="product-form" onSubmit={handleAdd}>
            <label className="field">
              <span>Product name</span>
              <input
                type="text"
                placeholder="e.g. Long grain rice"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span>SKU</span>
              <input
                type="text"
                placeholder="e.g. RIC-001"
                value={form.sku}
                onChange={(event) =>
                  setForm({ ...form, sku: event.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span>Price (₦)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
                required
              />
            </label>

            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.quantity}
                onChange={(event) =>
                  setForm({ ...form, quantity: event.target.value })
                }
                required
              />
            </label>

            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "Saving..." : "+ Add product"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel product-list-panel">
          <div className="list-heading">
            <div>
              <h2>Product inventory</h2>
              <p>
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
                {search ? " found" : " in your inventory"}
              </p>
            </div>

            <label className="search-box">
              <span className="search-symbol" aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search name or SKU..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search products by name or SKU"
              />
            </label>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner" />
              <h3>Loading products</h3>
              <p>Connecting to your inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>{search ? "No matching products" : "No products yet"}</h3>
              <p>
                {search
                  ? "Try another product name or SKU."
                  : "Add your first product using the form above."}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Stock status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product.quantity);
                    const isEditing = editing === product._id;

                    return (
                      <tr key={product._id}>
                        <td>
                          {isEditing ? (
                            <input
                              aria-label="Product name"
                              value={editForm.name}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  name: event.target.value,
                                })
                              }
                            />
                          ) : (
                            <div className="product-name">
                              <span className="product-avatar">
                                {(product.name || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                              <strong>{product.name}</strong>
                            </div>
                          )}
                        </td>

                        <td className="sku-cell">{product.sku || "—"}</td>

                        <td>
                          {isEditing ? (
                            <input
                              aria-label="Product price"
                              type="number"
                              min="0"
                              step="0.01"
                              value={editForm.price}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  price: event.target.value,
                                })
                              }
                            />
                          ) : (
                            formatCurrency(product.price)
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <input
                              aria-label="Product quantity"
                              type="number"
                              min="0"
                              step="1"
                              value={editForm.quantity}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  quantity: event.target.value,
                                })
                              }
                            />
                          ) : (
                            product.quantity
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <span className="status-muted">
                              Updates when saved
                            </span>
                          ) : (
                            <span className={`stock-badge ${status.className}`}>
                              <span className="status-dot" />
                              {status.label}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="row-actions">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="small-button save-button"
                                  onClick={() => handleUpdate(product._id)}
                                  disabled={saving}
                                >
                                  {saving ? "Saving..." : "Save"}
                                </button>
                                <button
                                  type="button"
                                  className="small-button cancel-button"
                                  onClick={() => setEditing(null)}
                                  disabled={saving}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="small-button edit-button"
                                  onClick={() => startEdit(product)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="small-button delete-button"
                                  onClick={() => handleDelete(product)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="inventory-footer">
          <span>Inventory Management System</span>
          <span>Product records · {products.length} total</span>
        </footer>
      </div>
    </main>
  );
}

export default Products;