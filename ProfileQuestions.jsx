import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE = "http://127.0.0.1:5000";

const ProfileQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [target_key]: value }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const aridNo = localStorage.getItem("userAridNo");

  // Security check: must be logged in
  useEffect(() => {
    if (!aridNo) {
      alert("Please login first");
      navigate("/");
      return;
    }
    
    fetchQuestions();
  }, [aridNo, navigate]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/profile-questions`);
      
      // Validate response is array
      if (!Array.isArray(res.data)) {
        throw new Error("Invalid response format");
      }
      
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to load profile questions", err);
      setError("Failed to load questions. Please refresh or try again later.");
    } finally {
      setLoading(false);
    }
  };

  const totalRequired = useMemo(() => questions.length, [questions]);
  
  const answeredCount = useMemo(() => {
    return questions.reduce((acc, q) => {
      const v = answers[q.target_key];
      return v !== undefined && v !== null && String(v).trim() !== "" ? acc + 1 : acc;
    }, 0);
  }, [questions, answers]);

  const handleChange = (targetKey, value) => {
    setAnswers((prev) => ({ ...prev, [targetKey]: value }));
  };

  const validateAnswers = () => {
    const missing = questions.filter(q => {
      const v = answers[q.target_key];
      return v === undefined || v === null || String(v).trim() === "";
    });
    
    if (missing.length > 0) {
      return missing.map(q => q.text).join(", ");
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!aridNo) {
      alert("Session expired. Please login again.");
      navigate("/");
      return;
    }

    // Validation
    const missingFields = validateAnswers();
    if (missingFields) {
      alert(`Please answer all questions. Missing: ${missingFields}`);
      return;
    }

    // Build payload using question_id (as backend expects)
    const formattedResponses = questions.map((q) => ({
      question_id: q.id,        // ✅ Backend expects question_id
      answer: String(answers[q.target_key]),
    }));

    try {
      setSaving(true);
      const res = await axios.post(`${API_BASE}/api/save-profile`, {
        Arid_No: aridNo,
        responses: formattedResponses,
      });

      if (res.data.ok) {
        alert("Profile saved successfully!");
        navigate("/general-questions");
      } else {
        throw new Error(res.data.message || "Save failed");
      }
    } catch (err) {
      console.error("Error saving profile", err);
      setError(err.response?.data?.message || "Error saving profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading questions...</div>;
  if (error) return (
    <div className="profile-container">
      <div className="error-msg">{error}</div>
      <button onClick={fetchQuestions} className="submit-btn">Retry</button>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Complete Your Profile</h2>
          <p style={{ marginTop: 6 }}>
            Progress: <b>{answeredCount}</b> / <b>{totalRequired}</b>
          </p>
          <div style={{ 
            width: '100%', 
            height: 4, 
            background: '#e5e7eb', 
            borderRadius: 2,
            marginTop: 10 
          }}>
            <div style={{
              width: `${(answeredCount / totalRequired) * 100}%`,
              height: '100%',
              background: '#4CAF50',
              borderRadius: 2,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form-grid">
          {questions.map((q) => (
            <div key={q.id} className="form-group">
              <label>{q.text} {q.type === 'Radio' && <span style={{color: 'red'}}>*</span>}</label>

              {q.type === "Text" && (
                <input
                  type="text"
                  className="form-input"
                  required
                  value={answers[q.target_key] || ""}
                  onChange={(e) => handleChange(q.target_key, e.target.value)}
                  placeholder="Type your answer..."
                />
              )}

              {q.type === "Number" && (
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  required
                  value={answers[q.target_key] || ""}
                  onChange={(e) => handleChange(q.target_key, e.target.value)}
                  placeholder="0"
                />
              )}

              {q.type === "Dropdown" && (
                <select
                  className="form-select"
                  required
                  value={answers[q.target_key] || ""}
                  onChange={(e) => handleChange(q.target_key, e.target.value)}
                >
                  <option value="" disabled>Select an option...</option>
                  {(q.options || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {q.type === "Radio" && (
                <div className="radio-group">
                  {(q.options || []).map((opt, i) => (
                    <label key={i} className="radio-label">
                      <input
                        type="radio"
                        name={q.target_key}
                        value={opt}
                        required
                        checked={(answers[q.target_key] || "") === opt}
                        onChange={(e) => handleChange(q.target_key, e.target.value)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            className="submit-btn full-width"
            disabled={saving || answeredCount !== totalRequired}
          >
            {saving ? "Saving Profile..." : "Save & Continue to Assessment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileQuestions;