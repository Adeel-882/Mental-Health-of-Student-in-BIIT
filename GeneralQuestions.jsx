import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE = "http://127.0.0.1:5000";

const GeneralQuestions = () => {
  const [questions, setQuestions] = useState([]); // gates
  const [responses, setResponses] = useState({}); // { gate_id: score }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const aridNo = localStorage.getItem("userAridNo");

  // 5-point Likert (0..4) — must match backend logic
  const options = useMemo(
    () => [
      { label: "Never", score: 0 },
      { label: "Rarely", score: 1 },
      { label: "Sometimes", score: 2 },
      { label: "Often", score: 3 },
      { label: "Always", score: 4 },
    ],
    []
  );

// At the start of GeneralQuestions.jsx useEffect, add this check:

useEffect(() => {
  const checkExistingAndLoad = async () => {
    try {
      if (!aridNo) {
        alert("Arid No not found. Please login again.");
        navigate("/");
        return;
      }
      
      // Check for existing completed test
      const latestRes = await axios.get(`${API_BASE}/api/test/latest`, {
        params: { arid_no: aridNo }
      });
      
      // If they have a completed test and came here directly (not via "New Assessment" button)
      // redirect to dashboard
      if (latestRes.data?.exists && 
          latestRes.data?.status === 'Completed' && 
          !location.state?.forceNew) {
        const proceed = window.confirm(
          "You have already completed a wellness assessment. " +
          "Would you like to view your dashboard, or start a new assessment?"
        );
        if (!proceed) {
          navigate('/dashboard');
          return;
        }
        // If proceed, continue to load questions for new assessment
      }
      
      // Load gates as normal
      const res = await axios.get(`${API_BASE}/api/category-gates`, {
        params: { arid_no: aridNo },
      });
      setQuestions(res.data || []);
    } catch (err) {
      console.error("Error fetching category gates", err);
      alert("Failed to load general category questions.");
    } finally {
      setLoading(false);
    }
  };
  
  checkExistingAndLoad();
}, [aridNo, navigate, location.state]);

  useEffect(() => {
    const fetchGates = async () => {
      try {
        if (!aridNo) {
          alert("Arid No not found. Please login again.");
          navigate("/");
          return;
        }
        // NEW endpoint: category gates filtered by profile rules
        const res = await axios.get(`${API_BASE}/api/category-gates`, {
          params: { arid_no: aridNo },
        });
        setQuestions(res.data || []);
      } catch (err) {
        console.error("Error fetching category gates", err);
        alert("Failed to load general category questions.");
      } finally {
        setLoading(false);
      }
    };
    fetchGates();
  }, [aridNo, navigate]);

  const handleOptionSelect = (gateId, score) => {
    setResponses((prev) => ({ ...prev, [gateId]: score }));
  };

  const handleSubmit = async () => {
    if (questions.length === 0) {
      alert("No gate questions found.");
      return;
    }
    if (Object.keys(responses).length !== questions.length) {
      alert("Please answer all questions to proceed.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        Arid_No: aridNo,
        responses: Object.keys(responses).map((gateId) => ({
          gate_id: parseInt(gateId, 10),
          score: responses[gateId],
        })),
      };

      // NEW endpoint: submit gates, create test session, return test_id + triggered list
      const res = await axios.post(`${API_BASE}/api/test/gates/submit`, payload);

      // Navigate to your existing TestResult.jsx
      // I return: { test_id, triggered_categories, pie, gates_summary }
      navigate("/test-result", { state: { result: res.data } });
    } catch (err) {
      console.error("Gate submission failed", err);
      alert("Error submitting general category answers.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading Assessment...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>General Category Check</h2>
          <p>Please answer honestly based on how you felt recently.</p>
          <p style={{ marginTop: 6 }}>
            Answered: <b>{Object.keys(responses).length}</b> / <b>{questions.length}</b>
          </p>
        </div>

        <div className="questions-list">
          {questions.map((q, index) => (
            <div key={q.id} className="question-block">
              <p className="question-text">
                <span className="q-number">{index + 1}.</span> {q.text}
              </p>

              <div className="options-grid">
                {options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className={`option-btn ${responses[q.id] === opt.score ? "selected" : ""}`}
                    onClick={() => handleOptionSelect(q.id, opt.score)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="submit-btn full-width"
          style={{ marginTop: "30px", opacity: submitting ? 0.7 : 1 }}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default GeneralQuestions;