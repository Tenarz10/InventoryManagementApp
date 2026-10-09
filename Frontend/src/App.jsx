import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState } from "react";
import Login from "./login.jsx";
import Products from "./products.jsx";

function App() {
  const [token] = useState(localStorage.getItem("token"));
  return (
    <BrowserRouter>
      <nav style={{padding:"10px", background:"#222", color:"white", display:"flex", gap:"15px"}}>
        <Link to="/" style={{color:"white"}}>Login</Link>
        <Link to="/products" style={{color:"white"}}>Products</Link>
        {token && <button onClick={()=>{localStorage.clear(); window.location.href="/"}}>Logout</button>}
      </nav>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/products" element={<Products />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
