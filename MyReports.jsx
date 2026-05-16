// src/Components/MyReports.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
// We import the graphing tools from Recharts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../App.css";

const API = "http://127.0.0.1:5000";

const MyReports = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const aridNo = localStorage.getItem("userAridNo");
  
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || "daily"); 
  
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  // Separate state for the graphs (needs to be oldest-to-newest for left-to-right reading)
  const [chartDataDaily, setChartDataDaily] = useState([]);
  const [chartDataWeekly, setChartDataWeekly] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!aridNo) {
      navigate("/");
      return;
    }

    const fetchReports = async () => {
      try {
        const dailyRes = await axios.get(`${API}/api/daily-results`, { params: { arid_no: aridNo } });
        // The feed shows newest first
        setDailyData([...dailyRes.data].reverse()); 
        // The chart shows chronological order. We add a short date format for the X-Axis.
        setChartDataDaily(dailyRes.data.map(d => ({
          ...d,
          dateShort: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })));

        const weeklyRes = await axios.get(`${API}/api/weekly-results`, { params: { arid_no: aridNo } });
        setWeeklyData(weeklyRes.data);
        // We reverse the weekly data for the chart to go from oldest to newest
        setChartDataWeekly([...weeklyRes.data].reverse().map(w => ({
          ...w,
          dateShort: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })));

      } catch (err) {
        console.error("Error fetching reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [aridNo, navigate]);

  const moodLabels = ['Very Low 😢', 'Low 😕', 'Neutral 😐', 'Good 🙂', 'Excellent 🌟'];

  // Custom Tooltip for the Recharts graph
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: "white", padding: "10px", border: "1px solid #ccc", borderRadius: "5px", fontSize: "12px" }}>
          <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, margin: 0 }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="loading-spinner">Loading Your Progress...</div>;

  return (
    <div className="checkin-container">
      <div className="checkin-card fade-in" style={{ maxWidth: "600px", padding: "30px", textAlign: "left" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <h2 style={{ margin: 0 }}>My Progress Reports</h2>
          <button onClick={() => navigate("/dashboard")} className="btn-secondary" style={{ padding: "8px 15px", fontSize: "14px" }}>
            Return to Dashboard
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button 
            onClick={() => setActiveTab("daily")}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeTab === "daily" ? "#667eea" : "#edf2f7", color: activeTab === "daily" ? "white" : "#4a5568" }}
          >
            Daily Check-ins
          </button>
          <button 
            onClick={() => setActiveTab("weekly")}
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeTab === "weekly" ? "#667eea" : "#edf2f7", color: activeTab === "weekly" ? "white" : "#4a5568" }}
          >
            Weekly Deep Dives
          </button>
        </div>

        {/* ==========================================
            DAILY TAB CONTENT
        ========================================== */}
        {activeTab === "daily" && (
          <div className="fade-in">
            {/* The Daily Progress Graph */}
            {chartDataDaily.length > 0 && (
              <div style={{ height: "250px", marginBottom: "20px", padding: "15px 15px 5px 0", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartDataDaily} 
                    margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    {/* Added padding to XAxis so points don't get cut off at the exact edges */}
                    <XAxis dataKey="dateShort" padding={{ left: 15, right: 15 }} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#718096" }} dy={10} />
                    <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#718096" }} dx={-10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Line type="monotone" dataKey="mood" stroke="#667eea" name="Mood" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="stress" stroke="#e53e3e" name="Stress" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* The Daily Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "40vh", overflowY: "auto", paddingRight: "5px" }}>
              {dailyData.length === 0 ? (
                <p style={{ textAlign: "center", color: "#718096", padding: "20px" }}>You haven't logged any daily check-ins yet.</p>
              ) : (
                dailyData.map((log, idx) => (
                  <div key={idx} style={{ padding: "15px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontWeight: "bold" }}>
                      <span>{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span>{moodLabels[log.mood] || 'Unknown'}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#4a5568", marginBottom: log.notes ? "10px" : "0" }}>
                      Stress: {log.stress}/4 | Anxiety: {log.anxiety}/4 | Energy: {log.energy}/4
                    </div>
                    {log.notes && (
                      <div style={{ background: "white", padding: "10px", borderRadius: "6px", border: "1px dashed #cbd5e0", fontSize: "13px", whiteSpace: "pre-wrap" }}>
                        {log.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            WEEKLY TAB CONTENT
        ========================================== */}
        {activeTab === "weekly" && (
          <div className="fade-in">
             {/* The Weekly Progress Graph */}
             {chartDataWeekly.length > 0 && (
              <div style={{ height: "250px", marginBottom: "20px", padding: "15px 15px 5px 0", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 5px rgba(0,0,0,0.02)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartDataWeekly} 
                    margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="dateShort" padding={{ left: 15, right: 15 }} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#718096" }} dy={10} />
                    {/* The domain strict enforcement is added here */}
                    <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#718096" }} dx={-10} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Line type="monotone" dataKey="score" stroke="#48bb78" name="Total Severity Score" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* The Weekly Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", maxHeight: "40vh", overflowY: "auto", paddingRight: "5px" }}>
              {weeklyData.length === 0 ? (
                <p style={{ textAlign: "center", color: "#718096", padding: "20px" }}>You haven't completed any weekly assessments yet.</p>
              ) : (
                weeklyData.map((week, idx) => (
                  <div key={idx} style={{ padding: "15px", borderLeft: "4px solid #667eea", borderRadius: "10px", background: "#f8fafc", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <strong>{new Date(week.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                      <span style={{ fontWeight: "bold", color: "#4a5568" }}>Score: {week.score}</span>
                    </div>
                    <div style={{ fontSize: "14px", color: "#2d3748" }}>
                      Triggered Area: <strong>{week.category || "N/A"}</strong><br/>
                      Primary Alert: <strong style={{ color: "#e53e3e" }}>{week.disease || "N/A"}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyReports;