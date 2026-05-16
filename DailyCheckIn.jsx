// src/Components/DailyCheckIn.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = "http://127.0.0.1:5000";

const DailyCheckIn = () => {
  const navigate = useNavigate();
  const aridNo = localStorage.getItem("userAridNo");
  const studentName = localStorage.getItem("userName") || "Student";
  
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); 

  // States for Remedies & Academics
  const [activeRemedies, setActiveRemedies] = useState([]);
  const [checkedRemedies, setCheckedRemedies] = useState([]); // Now stores objects!
  const [subject, setSubject] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [notes, setNotes] = useState("");

  const [responses, setResponses] = useState({
    mood: 2, stress: 2, anxiety: 2, sleep: 2, energy: 2
  });

  const moodOptions = [
    { label: "Very Low", value: 0, emoji: "😢" },
    { label: "Low", value: 1, emoji: "😕" },
    { label: "Neutral", value: 2, emoji: "😐" },
    { label: "Good", value: 3, emoji: "🙂" },
    { label: "Excellent", value: 4, emoji: "🌟" }
  ];

  // UPDATED: Now saves the Remedy_ID so the backend knows exactly what to update
  useEffect(() => {
    const fetchRemedies = async () => {
      try {
        const res = await axios.get(`${API}/api/remedies/recommend`, { params: { arid_no: aridNo } });
        let list = [];
        if (res.data?.is_emergency && res.data?.emergency_protocols) {
          list = res.data.emergency_protocols.map(p => ({ id: p.Protocol_ID || Math.random(), title: p.Protocol_Name }));
        } else if (res.data?.remedies?.all_remedies) {
          list = res.data.remedies.all_remedies.map(r => ({ id: r.Remedy_ID, title: r.Title }));
        }
        setActiveRemedies(list.slice(0, 3)); 
      } catch (err) {
        console.error("Error fetching remedies:", err);
      }
    };
    if (aridNo) fetchRemedies();
  }, [aridNo]);

  // UPDATED: Toggles the whole object instead of just the string
  const toggleRemedy = (remedy) => {
    setCheckedRemedies(prev => 
      prev.some(r => r.id === remedy.id) 
        ? prev.filter(r => r.id !== remedy.id) 
        : [...prev, remedy]
    );
  };

  const handleMoodSelect = (value) => {
    setResponses(prev => ({ ...prev, mood: value }));
  };

  const handleComplete = async () => {
    setSubmitting(true);
    
    let finalNotes = notes ? `General Notes: ${notes}\n` : "";
    
    if (checkedRemedies.length > 0) {
      finalNotes += `[Remedies Completed Today]: ${checkedRemedies.map(r => r.title).join(', ')}\n`;
    }
    if (subject) {
      finalNotes += `[Academic Difficulty]: Struggling with ${subject} (Since: ${issueDate || 'Unspecified'})\n`;
    }

    try {
      await axios.post(`${API}/api/daily-checkin`, {
        arid_no: aridNo,
        date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
        responses: responses, 
        notes: finalNotes.trim(),
        completed_remedy_ids: checkedRemedies.map(r => r.id) // <-- SENDING IDs TO BACKEND!
      });
      setCurrentStep(2); 
    } catch (err) {
      console.error("Error saving check-in:", err);
      alert("Failed to save check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!aridNo) {
    return (
      <div className="checkin-container">
        <div className="checkin-card"><h2>Session Expired</h2><button className="submit-btn" onClick={() => navigate("/")}>Return to Login</button></div>
      </div>
    );
  }

  return (
    <div className="checkin-container">
      {currentStep === 0 && (
        <div className="checkin-card fade-in" style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: "15px" }}>Welcome back, {studentName} 👋</h2>
          <p style={{ marginBottom: "30px", color: "#6b7280" }}>Let's do a quick pulse check on your wellness and academics today.</p>
          <button className="submit-btn" onClick={() => setCurrentStep(1)}>Start Check-in</button>
        </div>
      )}

      {currentStep === 1 && (
        <div className="checkin-card fade-in" style={{ textAlign: "left", maxWidth: "600px" }}>
          <h2 style={{ marginBottom: "25px", textAlign: "center" }}>Daily Log</h2>
          
          <div className="question-section" style={{ marginBottom: "30px" }}>
            <h3 className="section-title">🎭 How are you feeling today?</h3>
            <div className="mood-options-container">
              {moodOptions.map((option) => (
                <div key={option.value} className={`mood-btn ${responses.mood === option.value ? 'active' : ''}`} onClick={() => handleMoodSelect(option.value)}>
                  <span className="mood-emoji">{option.emoji}</span>
                  <span className="mood-label">{option.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* UPDATED: Checklist rendering logic */}
          {activeRemedies.length > 0 && (
            <div className="question-section" style={{ marginBottom: "30px" }}>
              <h3 className="section-title">✅ Recommended Wellness Tasks</h3>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "15px" }}>Did you complete any of your dashboard remedies today?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {activeRemedies.map((remedy, idx) => {
                  const isChecked = checkedRemedies.some(r => r.id === remedy.id);
                  return (
                    <label key={idx} className={`checklist-item ${isChecked ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleRemedy(remedy)}
                        className="custom-checkbox"
                      />
                      <span>{remedy.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="question-section" style={{ marginBottom: "30px" }}>
            <h3 className="section-title">📚 Academic Check</h3>
            <div style={{ marginTop: "15px" }}>
              <label className="input-label">Are you facing difficulties in any specific subject right now?</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="custom-input">
                <option value="">No, I am doing fine academically</option>
                <option value="Computer Vision (CV)">Computer Vision (CV)</option>
                <option value="ISL">ISL</option>
                <option value="ADBMS">ADBMS</option>
                <option value="ENT">ENT</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            {subject && (
              <div className="fade-in" style={{ marginTop: "15px" }}>
                <label className="input-label" style={{ color: "#d32f2f" }}>Since what date have you been facing this issue?</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="custom-input error-border" />
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
            <button className="btn-secondary" onClick={() => setCurrentStep(0)}>Back</button>
            <button className="submit-btn" onClick={handleComplete} disabled={submitting}>
              {submitting ? "Saving..." : "Submit Check-in"}
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="checkin-card fade-in complete-card" style={{ textAlign: "center" }}>
          <div className="success-icon" style={{ fontSize: "60px", marginBottom: "20px" }}>🎉</div>
          <h2 style={{ marginBottom: "10px" }}>Check-in Complete!</h2>
          <p style={{ color: "#6b7280" }}>Your responses and remedies have been logged.</p>
          <button className="submit-btn" style={{marginTop: "30px"}} onClick={() => navigate("/dashboard")}>Return to Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default DailyCheckIn;