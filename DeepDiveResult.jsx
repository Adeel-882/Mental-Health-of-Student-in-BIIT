import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../App.css";

const API = "http://127.0.0.1:5000";

const DeepDiveResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const aridNo = localStorage.getItem("userAridNo");
  const testIdFromState = location.state?.testId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const pieData = useMemo(() => {
    if (!data?.pie) return [];
    return [
      { name: "Stress", value: data.pie.stress || 0, color: "#FF8042" },
      { name: "Anxiety", value: data.pie.anxiety || 0, color: "#FFBB28" },
      { name: "Depression", value: data.pie.depression || 0, color: "#0088FE" }
    ];
  }, [data]);

  const triggeredText = useMemo(() => {
    const arr = data?.triggered_categories || [];
    if (!Array.isArray(arr) || arr.length === 0) return "No triggers";
    return arr.map(x => x.Category_Short_Name || x.Category_Name).join(" • ");
  }, [data]);

  useEffect(() => {
    const load = async () => {
      try {
        let tid = testIdFromState;

        // If no testId passed, fallback to latest test
        if (!tid) {
          const latest = await axios.get(`${API}/api/test/latest`, { params: { arid_no: aridNo } });
          if (!latest.data?.exists) {
            alert("No test found. Please take a test first.");
            navigate("/general-questions");
            return;
          }
          tid = latest.data.test_id;
        }

        const res = await axios.get(`${API}/api/test/result`, { params: { test_id: tid } });
        setData(res.data);
      } catch (e) {
        console.error(e);
        alert("Failed to load result.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [aridNo, navigate, testIdFromState]);

  if (loading) return <div className="loading-spinner">Loading Result...</div>;
  if (!data) return <div>No result found.</div>;

  return (
    <div className="profile-container">
      <div className="profile-card" style={{ textAlign: "center" }}>
        <h2>Deep Dive Result</h2>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 14, color: "#666" }}>Triggered Categories</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{triggeredText}</div>
        </div>

                <button 
          className="login-btn" 
          style={{ marginTop: 16, background: "#22c55e" }}
          onClick={() => navigate("/remedies", { state: { testId: data.test_id || testIdFromState } })}
        >
          View My Remedies
        </button>
        <button className="login-btn" style={{ marginTop: 12, background: "#666" }} onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </button>

        {/* <button className="login-btn" style={{ marginTop: 16 }} onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </button> */}
      </div>
    </div>
  );
};

export default DeepDiveResult;