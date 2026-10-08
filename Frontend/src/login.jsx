import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
export default function Login() {
  const [email, setEmail] = useState("admin@inventory.com");
  const [password, setPassword] = useState("admin123");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
      setMsg("Login success!");
    try {
  const res = await axios.post("https://inventorymanagementapp-jxrh.onrender.com/api/users/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      setMsg("Login success!");
      navigate("/products");
      window.location.reload();
    } catch (err) {
      setMsg(err.response?.data?.message || "Login failed");
    }
  };
  return (
    <div style={{maxWidth:"400px", margin:"50px auto", padding:"20px", border:"1px solid #ccc"}}>
      <h2>Inventory Login</h2>
      <form onSubmit={handleLogin}>
        <input style={{width:"100%", padding:"8px", margin:"5px 0"}} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input style={{width:"100%", padding:"8px", margin:"5px 0"}} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        <button style={{width:"100%", padding:"10px", background:"black", color:"white"}} type="submit">Login</button>
      </form>
      <p>{msg}</p>
      <small>Use: admin@inventory.com / admin123</small>
    </div>
  );
}