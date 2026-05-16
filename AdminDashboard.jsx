// src/Components/AdminDashboard.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = "http://127.0.0.1:5000";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem("adminName") || "Admin";
  
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    department: "", 
    password: "" 
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAdvisor = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/admin/add-advisor`, formData);
      if (res.data.ok) {
        alert(res.data.message); // Shows the newly generated ADV-xxx code
        // Clear the form after a successful save
        setFormData({ name: "", email: "", department: "", password: "" }); 
      }
    } catch (err) {
      console.error("Error adding advisor:", err);
      alert(err.response?.data?.message || "Failed to add advisor.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminName");
    navigate("/");
  };

  return (
    <div className="adv-container">
      <div className="adv-mobile-frame">
        
        {/* Header Section */}
        <div className="adv-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 className="adv-title">Admin Dashboard 🧠</h1>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#e53e3e", fontWeight: "bold", cursor: "pointer" }}>
            Logout
          </button>
        </div>

        <div className="adv-greeting-row" style={{ marginBottom: "20px" }}>
          <div>
             <p className="adv-greeting-sub">Good morning!</p>
             <h2 className="adv-greeting-name" style={{ margin: "5px 0 0 0" }}>{adminName}</h2>
          </div>
        </div>

        {/* Advisor Creation Form */}
        <div style={{ backgroundColor: "#e2e8f0", padding: "25px 20px", borderRadius: "10px", marginTop: "10px" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "26px", color: "#1a202c" }}>Make Advisors</h2>
          
          <form onSubmit={handleAddAdvisor} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "18px", fontWeight: "600", color: "#2d3748", flex: 1 }}>Name</label>
              <input 
                type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="Advisor Name" required
                style={{ flex: 1.8, padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "18px", fontWeight: "600", color: "#2d3748", flex: 1 }}>Email</label>
              <input 
                type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="example@gmail.com" required
                style={{ flex: 1.8, padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "18px", fontWeight: "600", color: "#2d3748", flex: 1 }}>Department</label>
              <input 
                type="text" name="department" value={formData.department} onChange={handleChange}
                placeholder="e.g. Computer Science" required
                style={{ flex: 1.8, padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "18px", fontWeight: "600", color: "#2d3748", flex: 1 }}>Password</label>
              <input 
                type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="Password" required
                style={{ flex: 1.8, padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
              />
            </div>

            <button 
              type="submit" disabled={loading}
              style={{ 
                marginTop: "15px", backgroundColor: "#667eea", color: "white", 
                padding: "12px", borderRadius: "15px", border: "none", 
                fontWeight: "bold", fontSize: "16px", cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "ADDING..." : "ADD"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;