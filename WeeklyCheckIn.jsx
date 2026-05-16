// src/Components/WeeklyCheckIn.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = "http://127.0.0.1:5000";

const WeeklyCheckIn = () => {
  const navigate = useNavigate();
  const aridNo = localStorage.getItem("userAridNo");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0=Intro, 1=Weekly, 2=MLE Intro, 3=MLE Qs, 4=Done
  
  const [sessionData, setSessionData] = useState(null);
  const [weeklyAnswers, setWeeklyAnswers] = useState({});
  const [mleAnswers, setMleAnswers] = useState({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${API}/api/weekly-checkin/init`, { params: { arid_no: aridNo } });
        setSessionData(res.data);
      } catch (err) {
        console.error("Error loading weekly questions", err);
      } finally {
        setLoading(false);
      }
    };
    if (aridNo) fetchQuestions();
  }, [aridNo]);

  const handleWeeklySelect = (qId, value) => {
    setWeeklyAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleMleSelect = (qId, value) => {
    setMleAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const calculateTotalScore = () => {
    return Object.values(weeklyAnswers).reduce((sum, val) => sum + val, 0);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Format payload for the backend
    const payload = {
      arid_no: aridNo,
      category_key: sessionData.triggered_category_key,
      total_score: calculateTotalScore(),
      weekly_answers: Object.keys(weeklyAnswers).map(id => ({ id: parseInt(id), value: weeklyAnswers[id] })),
      mle_answers: Object.keys(mleAnswers).map(id => ({ id: parseInt(id), value: mleAnswers[id] }))
    };

    try {
      await axios.post(`${API}/api/weekly-checkin/submit`, payload);
      setStep(4); // Success screen
    } catch (err) {
      alert("Failed to submit weekly check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading your personalized check-in...</div>;
  if (!sessionData) return <div className="error-msg">Could not load session. Return to dashboard.</div>;

  return (
    <div className="checkin-container">
      
      {/* STEP 0: Intro */}
      {step === 0 && (
        <div className="checkin-card fade-in" style={{ textAlign: "center" }}>
          <h2>Deep Dive: Weekly Check-in 🗓️</h2>
          <p style={{ margin: "20px 0", color: "#6b7280" }}>
            Based on your recent activity, we are tailoring this week's questions around 
            <strong style={{color:"#1f2937"}}> {sessionData.triggered_category_name}</strong>.
          </p>
          <button className="submit-btn" onClick={() => setStep(1)}>Start Reflection</button>
        </div>
      )}

      {/* STEP 1: Weekly Wellness Questions */}
      {step === 1 && (
        <div className="checkin-card fade-in">
          <h2 style={{borderBottom: "2px solid #eee", paddingBottom: "10px", marginBottom: "20px"}}>
            Weekly Reflection
          </h2>
          <div className="questions-scroll-container">
            {sessionData.weekly_questions.map((q, idx) => (
              <div key={q.id} className="question-item" style={{marginBottom: "25px"}}>
                <label className="input-label" style={{fontSize:"16px"}}>{idx + 1}. {q.text}</label>
                <div className="likert-scale" style={{display: "flex", gap: "10px", marginTop: "10px"}}>
                  {[0, 1, 2, 3, 4].map(val => (
                    <button
                      key={val}
                      className={`likert-btn ${weeklyAnswers[q.id] === val ? 'active' : ''}`}
                      onClick={() => handleWeeklySelect(q.id, val)}
                    >
                      {['Never', 'Rarely', 'Sometimes', 'Often', 'Always'][val]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button 
            className="submit-btn" 
            style={{width:"100%", marginTop: "20px"}}
            disabled={Object.keys(weeklyAnswers).length < sessionData.weekly_questions.length}
            onClick={() => setStep(2)}
          >
            Next Section
          </button>
        </div>
      )}

      {/* STEP 2: MLE Transition */}
      {step === 2 && (
        <div className="checkin-card fade-in" style={{ textAlign: "center" }}>
          <h2>Major Life Events (MLE) 🌍</h2>
          <p style={{ margin: "20px 0", color: "#6b7280" }}>
            Life can change fast. We want to know if any significant external events 
            have impacted you this week.
          </p>
          <button className="submit-btn" onClick={() => setStep(3)}>Continue</button>
        </div>
      )}

      {/* STEP 3: MLE Questions */}
      {step === 3 && (
        <div className="checkin-card fade-in">
          <h2 style={{borderBottom: "2px solid #eee", paddingBottom: "10px", marginBottom: "20px"}}>
            Life Events Impact
          </h2>
          <div className="questions-scroll-container">
            {sessionData.mle_questions.map((q, idx) => (
              <div key={q.id} className="question-item" style={{marginBottom: "25px"}}>
                <label className="input-label" style={{fontSize:"16px"}}>
                  {idx + 1}. {q.text} 
                  <span style={{fontSize:"12px", color:"#9ca3af", marginLeft:"10px"}}>({q.type})</span>
                </label>
                <div className="likert-scale" style={{display: "flex", gap: "10px", marginTop: "10px"}}>
                  {[0, 1, 2, 3, 4].map(val => (
                    <button
                      key={val}
                      className={`likert-btn ${mleAnswers[q.id] === val ? 'active' : ''}`}
                      onClick={() => handleMleSelect(q.id, val)}
                    >
                      {['Not at all', 'Slightly', 'Moderately', 'Very Much', 'Extremely'][val]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button 
              className="submit-btn" 
              disabled={Object.keys(mleAnswers).length < sessionData.mle_questions.length || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving..." : "Submit Answers"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Complete */}
      {step === 4 && (
        <div className="checkin-card fade-in complete-card" style={{ textAlign: "center" }}>
          <div className="success-icon" style={{ fontSize: "60px", marginBottom: "20px" }}>🛡️</div>
          <h2>Weekly Data Secured!</h2>
          <p style={{ color: "#6b7280", marginTop: "10px" }}>Your system profile has been updated.</p>
          <button className="submit-btn" style={{marginTop: "30px"}} onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default WeeklyCheckIn;