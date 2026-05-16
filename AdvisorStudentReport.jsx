// src/Components/AdvisorStudentReport.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../App.css";

const API = "http://127.0.0.1:5000";

const AdvisorStudentReport = () => {
  const { aridNo } = useParams(); // Grabs the ARID from the URL
  const location = useLocation();
  const navigate = useNavigate();
  
  const studentName = location.state?.studentName || "Student";
  const [activeTab, setActiveTab] = useState("daily"); 
  
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [chartDataDaily, setChartDataDaily] = useState([]);
  const [chartDataWeekly, setChartDataWeekly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const dailyRes = await axios.get(`${API}/api/daily-results`, { params: { arid_no: aridNo } });
        setDailyData([...dailyRes.data].reverse()); 
        setChartDataDaily(dailyRes.data.map(d => ({
          ...d, dateShort: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })));

        const weeklyRes = await axios.get(`${API}/api/weekly-results`, { params: { arid_no: aridNo } });
        setWeeklyData(weeklyRes.data);
        setChartDataWeekly([...weeklyRes.data].reverse().map(w => ({
          ...w, dateShort: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })));
      } catch (err) {
        console.error("Error fetching reports", err);
      } finally {
        setLoading(false);
      }
    };
    if (aridNo) fetchReports();
  }, [aridNo]);

  const moodLabels = ['Very Low 😢', 'Low 😕', 'Neutral 😐', 'Good 🙂', 'Excellent 🌟'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "white", padding: "10px", border: "1px solid #ccc", borderRadius: "5px", fontSize: "12px" }}>
          <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>{entry.name}: {entry.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="loading-spinner">Loading Student Data...</div>;

  return (
    <div className="adv-container">
      <div className="adv-mobile-frame" style={{ maxWidth: "600px", padding: "30px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: "8px 15px" }}>&larr; Back to Dashboard</button>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Detailed Report</h2>
        </div>

        <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", marginBottom: "25px", border: "1px solid #e2e8f0" }}>
          <h1 style={{ fontSize: "24px", margin: "0 0 5px 0" }}>{studentName}</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>ARID: {aridNo}</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("daily")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeTab === "daily" ? "#667eea" : "#edf2f7", color: activeTab === "daily" ? "white" : "#4a5568" }}>
            Daily Check-ins
          </button>
          <button onClick={() => setActiveTab("weekly")} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeTab === "weekly" ? "#667eea" : "#edf2f7", color: activeTab === "weekly" ? "white" : "#4a5568" }}>
            Weekly Deep Dives
          </button>
        </div>

        {/* DAILY TAB */}
        {activeTab === "daily" && (
          <div className="fade-in">
            {chartDataDaily.length > 0 && (
              <div style={{ height: "250px", marginBottom: "20px", padding: "15px 15px 5px 0", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataDaily} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="dateShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#718096" }} dy={10} padding={{ left: 15, right: 15 }} />
                    <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#718096" }} dx={-10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f7fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="mood" fill="#667eea" name="Mood" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="stress" fill="#e53e3e" name="Stress" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "40vh", overflowY: "auto" }}>
              {dailyData.length === 0 ? <p style={{ textAlign: "center", color: "#718096" }}>No records yet.</p> : dailyData.map((log, idx) => (
                <div key={idx} style={{ padding: "15px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontWeight: "bold" }}>
                    <span>{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span>{moodLabels[log.mood] || 'Unknown'}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#4a5568" }}>Stress: {log.stress}/4 | Anxiety: {log.anxiety}/4 | Energy: {log.energy}/4</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEEKLY TAB */}
        {activeTab === "weekly" && (
          <div className="fade-in">
             {chartDataWeekly.length > 0 && (
              <div style={{ height: "250px", marginBottom: "20px", padding: "15px 15px 5px 0", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataWeekly} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="dateShort" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#718096" }} dy={10} padding={{ left: 15, right: 15 }} />
                    <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#718096" }} dx={-10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f7fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="score" fill="#48bb78" name="Total Severity Score" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "40vh", overflowY: "auto" }}>
              {weeklyData.length === 0 ? <p style={{ textAlign: "center", color: "#718096" }}>No records yet.</p> : weeklyData.map((week, idx) => (
                <div key={idx} style={{ padding: "15px", borderLeft: "4px solid #667eea", borderRadius: "10px", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <strong>{new Date(week.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    <span style={{ fontWeight: "bold", color: "#4a5568" }}>Score: {week.score}</span>
                  </div>
                  <div style={{ fontSize: "14px", color: "#2d3748" }}>Triggered Area: <strong>{week.category || "N/A"}</strong><br/>Primary Alert: <strong style={{ color: "#e53e3e" }}>{week.disease || "N/A"}</strong></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvisorStudentReport;