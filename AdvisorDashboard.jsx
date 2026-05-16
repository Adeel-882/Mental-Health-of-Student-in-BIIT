// src/Components/AdvisorDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = "http://127.0.0.1:5000";

const AdvisorDashboard = () => {
  const navigate = useNavigate();
  const advisorId = localStorage.getItem("advisorId"); 
  
  const [dashboardData, setDashboardData] = useState({
    advisor_name: "Loading...", assigned_count: 0, high_severity_count: 0, high_alert_students: []
  });
  const [allStudents, setAllStudents] = useState([]);
  const [viewMode, setViewMode] = useState("alerts"); 
  const [loading, setLoading] = useState(true);
  const [referredList, setReferredList] = useState([]); 

  // NEW: Alert System States
  const [alertData, setAlertData] = useState({ new_alerts: [], accepted_meetings: [] });
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [proposingFor, setProposingFor] = useState(null); // stores the ARID of the student we are setting a meeting for
  const [slotInput, setSlotInput] = useState("");

  const fetchDashboardAndAlerts = async () => {
    try {
      const res = await axios.get(`${API}/api/advisor/dashboard`, { params: { advisor_id: advisorId } });
      if (res.data.ok) setDashboardData(res.data);

      const allRes = await axios.get(`${API}/api/advisor/all-students`, { params: { advisor_id: advisorId } });
      if (allRes.data.ok) setAllStudents(allRes.data.students);

      const alertsRes = await axios.get(`${API}/api/advisor/alerts-and-meetings`, { params: { advisor_id: advisorId } });
      if (alertsRes.data.ok) setAlertData(alertsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!advisorId) { navigate("/"); return; }
    fetchDashboardAndAlerts();
  }, [advisorId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("advisorId");
    localStorage.removeItem("advisorName");
    navigate("/");
  };

  const handleReferStudent = async (studentArid) => {
    if (!window.confirm("Are you sure you want to escalate this student to the Psychologist?")) return;
    try {
        const res = await axios.post(`${API}/api/advisor/refer-student`, { arid_no: studentArid, advisor_id: advisorId });
        if (res.data.ok) setReferredList((prev) => [...prev, studentArid]);
    } catch (err) { alert("Failed to refer student."); }
  };

  // NEW: Send Slots to Student
  const handleSendSlots = async () => {
      if(!slotInput) return alert("Please enter available slots.");
      try {
          await axios.post(`${API}/api/advisor/propose-meeting`, {
              arid_no: proposingFor, advisor_id: advisorId, slots: slotInput
          });
          setProposingFor(null);
          setSlotInput("");
          fetchDashboardAndAlerts(); // Refresh the alerts list!
      } catch (e) { alert("Failed to send slots."); }
  };

  // NEW: Acknowledge Completed Meeting
  const handleMarkCompleted = async (meetingId) => {
      try {
          await axios.post(`${API}/api/advisor/mark-meeting-complete`, { meeting_id: meetingId });
          fetchDashboardAndAlerts();
      } catch (e) { alert("Failed to mark complete."); }
  };

  const currentList = viewMode === "alerts" ? dashboardData.high_alert_students : allStudents;
  const hasAlerts = alertData.new_alerts.length > 0 || alertData.accepted_meetings.length > 0;

  if (loading) return <div className="loading-spinner">Loading Advisor Portal...</div>;

  return (
    <div className="adv-container">
      <div className="adv-mobile-frame">
        
        <div className="adv-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 className="adv-title">Advisor Mental Health <br/>Dashboard 🧠</h1>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#e53e3e", fontWeight: "bold", cursor: "pointer" }}>Logout</button>
        </div>

        <div className="adv-greeting-row">
          <button className="adv-alerts-btn" onClick={() => setShowAlertModal(true)}>
            Alerts {hasAlerts && <span className="adv-alert-dot" style={{ animation: "pulse 2s infinite" }}></span>}
          </button>
        </div>

        {/* ... (Metrics Grid and Main Student List remain identical to your code) ... */}
        <div className="adv-metrics-grid">
          <div className={`adv-metric-card ${viewMode === 'all' ? 'active-metric' : ''}`} onClick={() => setViewMode('all')} style={{ cursor: "pointer" }}>
            <p className="adv-metric-title red-text">Student Assigned</p>
            <h2 className="adv-metric-value">{dashboardData.assigned_count}</h2>
          </div>
          <div className={`adv-metric-card ${viewMode === 'alerts' ? 'active-metric' : ''}`} onClick={() => setViewMode('alerts')} style={{ cursor: "pointer" }}>
            <p className="adv-metric-title red-text">High Severity:</p>
            <h2 className="adv-metric-value">{dashboardData.high_severity_count}</h2>
          </div>
        </div>

        <button className="adv-full-width-btn" style={{ marginBottom: "25px" }} onClick={() => setViewMode('all')}>Student Reports</button>
        <h3 className="adv-section-title">{viewMode === "alerts" ? "Students on High ALERT:" : "All Assigned Students:"}</h3>
        
        {currentList.length === 0 ? (
          <div className="adv-empty-state">No students in this category.</div>
        ) : (
          <div className="adv-student-grid">
            {currentList.map((student, idx) => {
              const isReferred = referredList.includes(student.arid);
              return (
                <div key={idx} className="adv-student-card fade-in">
                  <p className="adv-student-info">Name: <strong>{student.name}</strong></p>
                  <p className="adv-student-info">Arid: <strong>{student.arid.includes('-') ? student.arid.split('-')[2] : student.arid}</strong></p>
                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button className="adv-report-btn" style={{ flex: 1 }} onClick={() => navigate(`/advisor/student-report/${student.arid}`, { state: { studentName: student.name } })}>Report</button>
                    {viewMode === 'alerts' && (
                      <button className="adv-report-btn" style={{ flex: 1, backgroundColor: isReferred ? "#48bb78" : "#e53e3e", color: "white", border: "none", cursor: isReferred ? "default" : "pointer" }} onClick={() => !isReferred && handleReferStudent(student.arid)} disabled={isReferred}>
                        {isReferred ? "Referred ✓" : "Refer"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =======================================
            THE ALERTS & MEETING MODAL
        ======================================= */}
        {showAlertModal && (
          <div className="modal-overlay" onClick={() => setShowAlertModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: "90%", maxWidth: "500px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, color: "#1a202c" }}>Action Center</h2>
                <button onClick={() => setShowAlertModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>×</button>
              </div>

              {/* SECTION: Confirmed Meetings */}
              <h3 style={{ fontSize: "16px", color: "#48bb78", borderBottom: "2px solid #f0fff4", paddingBottom: "5px" }}>✅ Confirmed Meetings</h3>
              {alertData.accepted_meetings.length === 0 ? <p style={{ fontSize: "14px", color: "#a0aec0" }}>No new confirmed meetings.</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                      {alertData.accepted_meetings.map((m, i) => (
                          <div key={i} style={{ padding: "10px", background: "#f0fff4", borderRadius: "8px", border: "1px solid #c6f6d5" }}>
                              <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>{m.name} ({m.arid})</p>
                              <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#2f855a" }}>Confirmed Time: {m.slot}</p>
                              <button onClick={() => handleMarkCompleted(m.meeting_id)} style={{ padding: "5px 10px", background: "#48bb78", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Mark Completed</button>
                          </div>
                      ))}
                  </div>
              )}

              {/* SECTION: New Alerts Needing Meetings */}
              <h3 style={{ fontSize: "16px", color: "#e53e3e", borderBottom: "2px solid #fff5f5", paddingBottom: "5px", marginTop: "20px" }}>🚨 New Alerts</h3>
              {alertData.new_alerts.length === 0 ? <p style={{ fontSize: "14px", color: "#a0aec0" }}>All clear!</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {alertData.new_alerts.map((student, i) => (
                          <div key={i} style={{ padding: "15px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                              <p style={{ margin: "0 0 5px 0", fontWeight: "bold", fontSize: "16px" }}>{student.name}</p>
                              <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#718096" }}>Arid: {student.arid}</p>
                              
                              {proposingFor === student.arid ? (
                                  <div className="fade-in">
                                      <input 
                                          type="text" 
                                          placeholder="e.g., Mon 10AM or Tue 2PM" 
                                          value={slotInput} 
                                          onChange={(e) => setSlotInput(e.target.value)}
                                          style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
                                      />
                                      <div style={{ display: "flex", gap: "10px" }}>
                                          <button onClick={handleSendSlots} style={{ flex: 1, padding: "8px", background: "#48bb78", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Send to Student</button>
                                          <button onClick={() => setProposingFor(null)} style={{ padding: "8px 15px", background: "#e2e8f0", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancel</button>
                                      </div>
                                  </div>
                              ) : (
                                  <button onClick={() => setProposingFor(student.arid)} style={{ width: "100%", padding: "8px", background: "#667eea", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                                      📅 Set Meeting
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvisorDashboard;