// src/Components/PsychologistDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = "http://127.0.0.1:5000";

const PsychologistDashboard = () => {
  const navigate = useNavigate();
  const psyId = localStorage.getItem("psychologistId") || 1; 

  const [data, setData] = useState({ 
    name: "Loading...", 
    credentials: "", 
    available_day: "",
    urgent_students: [] 
  });
  const [loading, setLoading] = useState(true);
  const [meetingAlerts, setMeetingAlerts] = useState(0);
  
  const [viewMode, setViewMode] = useState("students"); 
  const [meetingsList, setMeetingsList] = useState([]);
  
  // NEW: State to handle the active scheduling input
  const [schedulingId, setSchedulingId] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState("");

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API}/api/psychologist/dashboard`, { params: { psychologist_id: psyId } });
      if (res.data.ok) setData(res.data);

      const alertsRes = await axios.get(`${API}/api/psychologist/meeting-alerts`);
      if (alertsRes.data.ok) setMeetingAlerts(alertsRes.data.new_requests);
    } catch (err) {
      console.error("Failed to load psychologist dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [psyId]);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${API}/api/psychologist/meetings-list`);
      if (res.data.ok) {
        setMeetingsList(res.data.meetings);
      }
    } catch (err) {
      console.error("Error fetching meetings", err);
    }
  };

  const handleToggleMeetings = async () => {
    if (viewMode === "students") {
      await fetchMeetings();
      setViewMode("meetings");
      setMeetingAlerts(0); 
    } else {
      setViewMode("students");
      fetchDashboard(); // Refresh alerts when going back
    }
  };

  // NEW: The actual scheduling function
  const handleConfirmSchedule = async (meetingId) => {
    if (!selectedDateTime) {
        alert("Please select a date and time.");
        return;
    }

    try {
        const res = await axios.post(`${API}/api/psychologist/schedule-meeting`, {
            meeting_id: meetingId,
            meeting_date: selectedDateTime
        });

        if (res.data.ok) {
            setSchedulingId(null);
            setSelectedDateTime("");
            await fetchMeetings(); // Refresh the list to show the new status
        }
    } catch (err) {
        console.error("Failed to schedule", err);
        alert("Failed to save the schedule. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("psychologistId");
    localStorage.removeItem("psychologistName");
    navigate("/");
  };

  if (loading) return <div className="loading-spinner">Loading Clinical Portal...</div>;

  return (
    <div className="adv-container">
      <div className="adv-mobile-frame">
        
        <div className="adv-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 className="adv-title">Psychologist Mental<br/>Health Dashboard 🧠</h1>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#e53e3e", fontWeight: "bold", cursor: "pointer" }}>Logout</button>
        </div>

        <div className="adv-greeting-row" style={{ marginBottom: "20px" }}>
          <div>
            <p className="adv-greeting-sub">On Duty: {data.available_day}</p>
            <h2 className="adv-greeting-name" style={{ margin: "5px 0 0 0" }}>{data.name}</h2>
            <p style={{ color: "#667eea", fontWeight: "600", fontSize: "14px", margin: "5px 0 0 0" }}>
              {data.credentials}
            </p>
          </div>
        </div>

        <button 
          className="adv-full-width-btn" 
          style={{ 
              marginBottom: "30px", 
              backgroundColor: viewMode === "meetings" ? "#4a5568" : "#667eea", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: "10px",
              transition: "background-color 0.3s"
          }}
          onClick={handleToggleMeetings}
        >
          {viewMode === "meetings" ? "🔙 Back to Urgent Students" : "📅 See the meetings"}
          {viewMode === "students" && meetingAlerts > 0 && (
              <span className="fade-in" style={{ backgroundColor: "#e53e3e", color: "white", borderRadius: "12px", padding: "2px 8px", fontSize: "12px", fontWeight: "bold", marginLeft: "5px" }}>
                  {meetingAlerts} New
              </span>
          )}
        </button>

        {/* VIEW 1: URGENT STUDENTS */}
        {viewMode === "students" && (
          <div className="fade-in">
            <h3 className="adv-section-title">Students need urgent attention</h3>
            {data.urgent_students.length === 0 ? (
              <div className="adv-empty-state">No students currently require urgent attention.</div>
            ) : (
              <div className="adv-student-grid">
                {data.urgent_students.map((student, idx) => (
                  <div key={idx} className="adv-student-card fade-in">
                    <p className="adv-student-info">Name: <strong>{student.name}</strong></p>
                    <p className="adv-student-info">Arid: <strong>{student.arid.includes('-') ? student.arid.split('-')[2] : student.arid}</strong></p>
                    
                    <button 
                      className="adv-report-btn"
                      onClick={() => navigate(`/psychologist/student-report/${student.arid}`, { state: { studentName: student.name } })}
                    >
                      Reports
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MEETINGS LIST */}
        {viewMode === "meetings" && (
          <div className="fade-in">
            <h3 className="adv-section-title">Meeting Requests</h3>
            {meetingsList.length === 0 ? (
              <div className="adv-empty-state">No meetings have been requested.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {meetingsList.map((meeting, idx) => (
                  <div key={idx} style={{ padding: "15px", background: "white", borderRadius: "10px", borderLeft: meeting.status === 'Scheduled' ? "4px solid #48bb78" : "4px solid #e53e3e", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "16px", color: "#2d3748" }}>{meeting.name}</strong>
                      <span style={{ 
                          backgroundColor: meeting.status === 'Scheduled' ? "#c6f6d5" : "#fed7d7", 
                          color: meeting.status === 'Scheduled' ? "#276749" : "#c53030", 
                          padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" 
                      }}>
                        {meeting.status}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#4a5568" }}>Arid: <strong>{meeting.arid}</strong></p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#718096" }}>Requested On: {meeting.date}</p>
                    
                    {/* The Action Area */}
                    <div style={{ marginTop: "15px" }}>
                        {meeting.status === 'Scheduled' ? (
                            <div style={{ backgroundColor: "#f7fafc", padding: "10px", borderRadius: "8px", fontSize: "14px", color: "#2d3748", textAlign: "center", border: "1px solid #e2e8f0" }}>
                                Meeting is confirmed.
                            </div>
                        ) : schedulingId === meeting.id ? (
                            <div className="fade-in" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <input 
                                    type="datetime-local" 
                                    value={selectedDateTime}
                                    onChange={(e) => setSelectedDateTime(e.target.value)}
                                    style={{ flex: 2, padding: "8px", borderRadius: "5px", border: "1px solid #cbd5e0" }}
                                />
                                <button 
                                    className="btn-primary" 
                                    style={{ flex: 1, backgroundColor: "#48bb78", padding: "9px" }}
                                    onClick={() => handleConfirmSchedule(meeting.id)}
                                >
                                    Confirm
                                </button>
                                <button 
                                    onClick={() => setSchedulingId(null)}
                                    style={{ background: "none", border: "none", color: "#a0aec0", fontSize: "20px", cursor: "pointer" }}
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button 
                                    className="btn-secondary" 
                                    style={{ flex: 1, padding: "8px", fontSize: "14px" }}
                                    onClick={() => navigate(`/psychologist/student-report/${meeting.arid}`, { state: { studentName: meeting.name } })}
                                >
                                    View Profile
                                </button>
                                <button 
                                    className="btn-primary" 
                                    style={{ flex: 1, padding: "8px", fontSize: "14px", backgroundColor: "#e53e3e" }}
                                    onClick={() => setSchedulingId(meeting.id)}
                                >
                                    Schedule Time
                                </button>
                            </div>
                        )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PsychologistDashboard;