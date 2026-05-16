import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE = "http://127.0.0.1:5000";

// ✅ Same idea as second code: fallback likert if backend doesn't send options
const DEFAULT_LIKERT = {
  Never: 0,
  Rarely: 1,
  Sometimes: 2,
  Often: 3,
  Always: 4,
};

const DeepDive = () => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // progress from backend if available, otherwise we approximate
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const navigate = useNavigate();
  const location = useLocation();
  const testId = location.state?.testId;

  // Prevent StrictMode double initialization
  const didInit = useRef(false);

  // ✅ UPDATED: options are now dynamic like second code
  // - if backend sends question.options => use it
  // - else fallback to DEFAULT_LIKERT
  // Still returns {label, score} to match your existing UI logic.
  const options = useMemo(() => {
    const optMap = question?.options || DEFAULT_LIKERT;
    const order = ["Never", "Rarely", "Sometimes", "Often", "Always"];

    // keep only those that exist in optMap (supports backend custom options too)
    const built = order
      .filter((k) => optMap[k] !== undefined && optMap[k] !== null)
      .map((k) => ({ label: k, score: optMap[k] }));

    // If backend sends options in a different shape (rare), fallback to default list:
    if (built.length > 0) return built;

    return [
      { label: "Never", score: 0 },
      { label: "Rarely", score: 1 },
      { label: "Sometimes", score: 2 },
      { label: "Often", score: 3 },
      { label: "Always", score: 4 },
    ];
  }, [question]);

  // ✅ MOVED ABOVE useEffect (safer pattern, like second code)
  const loadNextQuestion = async (isFirst = false) => {
    try {
      const res = await axios.get(`${API_BASE}/api/test/next`, {
        params: { test_id: testId },
      });

      if (res.data?.done) {
        navigate("/deep-dive-result", { state: { testId } });
        return;
      }

      setQuestion(res.data);
      setSelectedOption(null);
      setError(null);

      // If backend sends progress, prefer that:
      // expected optional fields: res.data.progress_current, res.data.progress_total
      const backendCurrent = res.data?.progress_current;
      const backendTotal = res.data?.progress_total;

      if (
        Number.isFinite(backendCurrent) &&
        Number.isFinite(backendTotal) &&
        backendTotal > 0
      ) {
        setProgress({ current: backendCurrent, total: backendTotal });
      } else {
        // fallback approximate
        setProgress((prev) => {
          if (isFirst) return { current: 1, total: Math.max(prev.total || 10, 10) };
          const nextCurrent = (prev.current || 0) + 1;
          const nextTotal = Math.max(prev.total || 0, nextCurrent + 5);
          return { current: nextCurrent, total: nextTotal };
        });
      }
    } catch (err) {
      console.error("Load next error:", err);
      setError("Failed to load question.");
    }
  };

  useEffect(() => {
    if (!testId) {
      // ✅ Keep your behavior, but also match second code's clarity
      // (no harm; you already navigate)
      navigate("/general-questions");
      return;
    }

    if (didInit.current) return;
    didInit.current = true;

    const initAndLoad = async () => {
      try {
        setLoading(true);
        setError(null);

        await axios.post(`${API_BASE}/api/test/deepdive/init`, {
          test_id: testId,
        });

        await loadNextQuestion(true);
      } catch (err) {
        console.error("Init error:", err);
        setError("Failed to start deep dive. Check backend /api/test/deepdive/init");
      } finally {
        setLoading(false);
      }
    };

    initAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, navigate]);

  const submit = async () => {
    // ✅ Same core check as your first code
    if (selectedOption === null || !question) return;

    // ✅ ADDED from second code: queue_id guard (super useful)
    if (!question?.queue_id) {
      setError("Missing queue_id from backend. Cannot submit this answer.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await axios.post(`${API_BASE}/api/test/answer`, {
        test_id: testId,
        queue_id: question.queue_id,
        score: selectedOption,
      });

      await loadNextQuestion();
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit answer. Check backend /api/test/answer");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent =
    progress.total > 0 ? Math.min((progress.current / progress.total) * 100, 100) : 0;

  if (loading) {
    return <div className="loading-spinner">Loading assessment...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-card">
          <div className="error-msg">{error}</div>
          <button className="login-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate("/dashboard")}
            style={{ marginTop: 10 }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="page-container">
      <div className="page-card">
        {/* Progress */}
        <div className="dd-progress-wrap">
          <div className="dd-progress-bar">
            <div className="dd-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          {/* Numbering in Deep dive questions */}
          {/* <div className="dd-progress-text">
            Question {progress.current || 1} {progress.total ? `of ~${progress.total}` : ""}
          </div> */}
        </div>

        {/* Header / badge */}
        <div className="dd-badge">
          <span className="dd-badge-icon">📋</span>
          <span className="dd-badge-title">{question.category_name || "Deep Dive"}</span>
          <span className={`dd-type ${question.item_type === "Base" ? "base" : "sub"}`}>
            {question.item_type === "Base" ? "Main" : "Follow-up"}
          </span>
        </div>

        {/* Question */}
        <div className="question-block" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <div className="question-text">{question.question_text}</div>

          {/* Options (your CSS already forces consistent grid) */}
          <div className="options-grid">
            {options.map((opt) => (
              <button
                key={opt.label}
                className={`option-btn ${selectedOption === opt.score ? "selected" : ""}`}
                onClick={() => setSelectedOption(opt.score)}
                disabled={submitting}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <button
            className="submit-btn"
            onClick={submit}
            disabled={selectedOption === null || submitting}
            type="button"
            style={{ opacity: selectedOption === null || submitting ? 0.7 : 1 }}
          >
            {submitting ? "Submitting..." : "Next →"}
          </button>

          <button className="btn-secondary" onClick={() => navigate("/dashboard")} type="button">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeepDive;