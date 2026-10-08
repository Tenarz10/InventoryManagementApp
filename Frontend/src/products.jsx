import { useState, useEffect } from "react"
import axios from "axios"

function Products() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ name: "", sku: "", price: "", quantity: "" })
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", price: "", quantity: "" })
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem("token")
  const config = { headers: { Authorization: `Bearer ${token}` } }
  const API = "https://inventorymanagementapp-jxrh.onrender.com/api/products"

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await axios.get(API, config)
      setProducts(res.data.data || [])
      setLoading(false)
    } catch (err) {
      console.log("Backend dey sleep, dey wake am...")
      setTimeout(fetchProducts, 4000)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleAdd = async () => {
    if(!form.name || !form.sku) return alert("Fill all")
    await axios.post(API, { name: form.name, sku: form.sku, price: Number(form.price), quantity: Number(form.quantity) }, config)
    setForm({ name: "", sku: "", price: "", quantity: "" })
    fetchProducts()
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return
    await axios.delete(`${API}/${id}`, config)
    fetchProducts()
  }

  const startEdit = (p) => {
    setEditing(p._id)
    setEditForm({ name: p.name, price: p.price, quantity: p.quantity })
  }

  const handleUpdate = async (id) => {
    await axios.put(`${API}/${id}`, { name: editForm.name, price: Number(editForm.price), quantity: Number(editForm.quantity) }, config)
    setEditing(null)
    fetchProducts()
  }

  return (
    <div style={{minHeight:"100vh", background:"#f3f4f6", padding:"20px"}}>
      <div style={{maxWidth:"700px", margin:"0 auto"}}>
        <h1 style={{textAlign:"center", fontSize:"24px", fontWeight:"bold", marginBottom:"20px"}}>Inventory Manager - {products.length} Products</h1>

        <div style={{background:"white", padding:"20px", borderRadius:"12px", marginBottom:"20px"}}>
          <h2 style={{color:"green", fontWeight:"bold"}}>+ Add New Product</h2>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px", marginTop:"10px"}}>
            <input style={{border:"1px solid #ccc", padding:"8px", borderRadius:"6px"}} placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input style={{border:"1px solid #ccc", padding:"8px", borderRadius:"6px"}} placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})}/>
            <input style={{border:"1px solid #ccc", padding:"8px", borderRadius:"6px"}} type="number" placeholder="Price" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
            <input style={{border:"1px solid #ccc", padding:"8px", borderRadius:"6px"}} type="number" placeholder="Qty" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})}/>
          </div>
          <button onClick={handleAdd} style={{width:"100%", background:"#16a34a", color:"white", padding:"10px", borderRadius:"8px", marginTop:"12px", border:"none", fontWeight:"bold", cursor:"pointer"}}>Add Product</button>
        </div>

        {loading ? <p style={{textAlign:"center"}}>⏳ Backend dey wake up... wait 30 secs</p> : products.map(p=>(
          <div key={p._id} style={{background:"white", padding:"15px", borderRadius:"12px", marginBottom:"10px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            {editing === p._id ? (
              <div style={{display:"flex", gap:"6px"}}>
                <input style={{border:"1px solid #ccc", padding:"6px", width:"80px"}} value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})}/>
                <input style={{border:"1px solid #ccc", padding:"6px", width:"60px"}} type="number" value={editForm.price} onChange={e=>setEditForm({...editForm, price:e.target.value})}/>
                <input style={{border:"1px solid #ccc", padding:"6px", width:"50px"}} type="number" value={editForm.quantity} onChange={e=>setEditForm({...editForm, quantity:e.target.value})}/>
              </div>
            ) : (
              <div><b>{p.name}</b><div style={{fontSize:"12px", color:"#666"}}>{p.sku} | ₦{p.price} - Qty {p.quantity}</div></div>
            )}
            <div style={{display:"flex", gap:"6px"}}>
              {editing === p._id ? (
                <><button onClick={()=>handleUpdate(p._id)} style={{background:"#2563eb", color:"white", padding:"6px 12px", borderRadius:"6px", border:"none"}}>Save</button><button onClick={()=>setEditing(null)} style={{background:"gray", color:"white", padding:"6px 12px", borderRadius:"6px", border:"none"}}>Cancel</button></>
              ) : (
                <><button onClick={()=>startEdit(p)} style={{background:"#eab308", color:"white", padding:"6px 12px", borderRadius:"6px", border:"none", fontWeight:"bold"}}>Edit</button><button onClick={()=>handleDelete(p._id)} style={{background:"#ef4444", color:"white", padding:"6px 12px", borderRadius:"6px", border:"none", fontWeight:"bold"}}>Delete</button></>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default Products