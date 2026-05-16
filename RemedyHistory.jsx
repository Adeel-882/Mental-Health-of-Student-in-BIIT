import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE = "http://127.0.0.1:5000";

const RemedyHistory = () => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("completed");

  // ✅ New state for assessment history dropdown
  const [sessionHistory, setSessionHistory] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [latestTest, setLatestTest] = useState(null);
  const [latestSummary, setLatestSummary] = useState(null);

  const navigate = useNavigate();
  const aridNo = localStorage.getItem("userAridNo");
  const userName = localStorage.getItem("userName") || "Student";

  useEffect(() => {
    if (!aridNo) {
      navigate("/");
      return;
    }

    loadAllData();
  }, [aridNo, navigate]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadHistory(),
        loadAssessmentHistory(),
      ]);
    } catch (err) {
      console.error("Load error:", err);
      setError("Failed to load your wellness history");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/remedies/history`, {
        params: { arid_no: aridNo },
      });

      if (res.data?.ok) {
        setHistory(res.data);
      } else {
        setError(res.data?.message || "Failed to load remedy history");
      }
    } catch (err) {
      console.error("History load error:", err);
      setError("Failed to load your wellness toolkit");
    }
  };

  // ✅ New loader for assessment history
  const loadAssessmentHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tests/history`, {
        params: { arid_no: aridNo },
      });

      const tests = Array.isArray(res.data?.history)
        ? res.data.history
        : Array.isArray(res.data?.sessions)
        ? res.data.sessions
        : Array.isArray(res.data)
        ? res.data
        : [];

      setSessionHistory(tests);

      if (tests.length > 0) {
        const latest = tests[0];
        setLatestTest(latest);

        // Try loading latest summary details
        if (latest?.test_id) {
          try {
            const summaryRes = await axios.get(
              `${API_BASE}/api/test/result/${latest.test_id}`
            );

            const summary = summaryRes.data || null;
            setLatestSummary(summary);

            setSelectedSession({
              ...latest,
              stress:
                summary?.pie?.stress ??
                latest?.stress ??
                0,
              anxiety:
                summary?.pie?.anxiety ??
                latest?.anxiety ??
                0,
              depression:
                summary?.pie?.depression ??
                latest?.depression ??
                0,
              severity:
                summary?.Severity ||
                summary?.severity ||
                latest?.severity ||
                "Normal",
              triggered:
                summary?.triggered_categories?.map(
                  (c) => c.Category_Short_Name || c.Category_Name
                ) ||
                latest?.triggered ||
                [],
              isLatest: true,
            });
          } catch (summaryErr) {
            console.error("Latest summary load error:", summaryErr);

            setSelectedSession({
              ...latest,
              stress: latest?.stress || 0,
              anxiety: latest?.anxiety || 0,
              depression: latest?.depression || 0,
              severity: latest?.severity || "Normal",
              triggered: latest?.triggered || [],
              isLatest: true,
            });
          }
        }
      }
    } catch (err) {
      console.error("Assessment history load error:", err);
      // Do not fail entire page just because assessment history failed
      setSessionHistory([]);
      setLatestTest(null);
      setLatestSummary(null);
      setSelectedSession(null);
    }
  };

  const handleViewSessionDetails = (session) => {
    if (!session?.test_id) return;
    navigate("/history", { state: { testId: session.test_id } });
  };

  const handleRetakeAssessment = () => {
    navigate("/general-questions");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return "✓";
      case "Viewed":
        return "👁";
      case "Dismissed":
        return "✕";
      case "Suggested":
        return "○";
      case "Saved":
        return "🔖";
      default:
        return "•";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#22c55e";
      case "Viewed":
        return "#3b82f6";
      case "Dismissed":
        return "#ef4444";
      case "Suggested":
        return "#9ca3af";
      case "Saved":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const d = new Date(dateValue);
    return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  };

  const toolkit = history?.toolkit || {};

  const stats = useMemo(() => {
    return {
      total: history?.total_remedies_suggested || 0,
      completed: toolkit.completed?.length || 0,
      saved: toolkit.saved?.length || 0,
      dismissed: toolkit.dismissed?.length || 0,
      rated: toolkit.rated?.length || 0,
      completionRate: history?.completion_rate?.toFixed?.(1) || 0,
    };
  }, [history, toolkit]);

  const currentList = toolkit[activeTab] || [];

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading your wellness toolkit...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-card">
          <div className="error-msg">{error}</div>
          <button className="login-btn" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-card remedy-history">
        {/* Header */}
        <div className="history-header">
          <h2>📚 My Wellness Toolkit</h2>
          <p>
            Welcome, {userName}. Your personal collection of mental health
            resources, activities, and assessment sessions.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Suggested</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card saved">
            <div className="stat-number">{stats.saved}</div>
            <div className="stat-label">Saved</div>
          </div>
          <div className="stat-card rate">
            <div className="stat-number">{stats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>

        {/* ✅ Assessment History Section - DROPDOWN VERSION */}
        <div className="section-card">
          <div className="section-header">
            <h2>📊 Assessment History</h2>
            <span className="session-count">{sessionHistory.length} Sessions</span>
          </div>

          {sessionHistory.length > 0 ? (
            <div className="history-dropdown-container">
              {/* Dropdown Selector */}
              <div className="history-select-wrapper">
                <select
                  className="history-dropdown"
                  value={selectedSession?.test_id || ""}
                  onChange={(e) => {
                    const testId = parseInt(e.target.value, 10);
                    const session = sessionHistory.find((s) => s.test_id === testId);

                    if (session) {
                      if (testId === latestTest?.test_id && latestSummary) {
                        setSelectedSession({
                          ...session,
                          stress: latestSummary.pie?.stress || 0,
                          anxiety: latestSummary.pie?.anxiety || 0,
                          depression: latestSummary.pie?.depression || 0,
                          severity:
                            latestSummary.Severity ||
                            latestSummary.severity ||
                            session.severity ||
                            "Normal",
                          triggered:
                            latestSummary.triggered_categories?.map(
                              (c) => c.Category_Short_Name || c.Category_Name
                            ) || [],
                          isLatest: true,
                        });
                      } else {
                        setSelectedSession({
                          ...session,
                          stress: session.stress || 0,
                          anxiety: session.anxiety || 0,
                          depression: session.depression || 0,
                          severity: session.severity || "Normal",
                          triggered: session.triggered || [],
                          isLatest: false,
                        });
                      }
                    }
                  }}
                >
                  <option value="">Select a session to view details...</option>
                  {sessionHistory.map((session, idx) => (
                    <option key={session.test_id} value={session.test_id}>
                      Session {idx + 1} - {formatDate(session.date)} (
                      {session.dominant_disease || "General"}) -{" "}
                      {session.severity || "Normal"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Session Details Panel */}
              {selectedSession && (
                <div className="selected-session-panel">
                  <div className="session-detail-header">
                    <h3>Session Details</h3>
                    <span
                      className={`severity-badge ${(
                        selectedSession.severity || "low"
                      ).toLowerCase()}`}
                    >
                      {selectedSession.severity || "Normal"}
                    </span>
                  </div>

                  <div className="session-metrics-grid">
                    <div className="metric-box stress">
                      <div className="metric-value">
                        {selectedSession.stress || 0}%
                      </div>
                      <div className="metric-label">Stress</div>
                    </div>
                    <div className="metric-box anxiety">
                      <div className="metric-value">
                        {selectedSession.anxiety || 0}%
                      </div>
                      <div className="metric-label">Anxiety</div>
                    </div>
                    <div className="metric-box depression">
                      <div className="metric-value">
                        {selectedSession.depression || 0}%
                      </div>
                      <div className="metric-label">Depression</div>
                    </div>
                  </div>

                  {selectedSession.triggered?.length > 0 && (
                    <div className="triggered-section">
                      <h4>Triggered Categories</h4>
                      <div className="triggered-tags">
                        {selectedSession.triggered.map((cat, idx) => (
                          <span key={idx} className="triggered-tag">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="session-actions">
                    <button
                      className="btn-view-details"
                      onClick={() => handleViewSessionDetails(selectedSession)}
                    >
                      View Full Q&amp;A Details
                    </button>
                    <button
                      className="btn-retake"
                      onClick={() =>
                        navigate("/remedies", {
                          state: { testId: selectedSession.test_id },
                        })
                      }
                    >
                      View Remedies
                    </button>
                  </div>
                </div>
              )}

              {!selectedSession && (
                <div className="empty-state small">
                  <p>Select a session from the dropdown above to view details</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>No assessment history yet.</p>
              <button className="btn-primary" onClick={handleRetakeAssessment}>
                Take Your First Assessment
              </button>
            </div>
          )}
        </div>

        {/* Remedy Tabs */}
        <div className="history-tabs">
          <button
            className={`tab ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            ✓ Completed ({stats.completed})
          </button>
          <button
            className={`tab ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            🔖 Saved ({stats.saved})
          </button>
          <button
            className={`tab ${activeTab === "rated" ? "active" : ""}`}
            onClick={() => setActiveTab("rated")}
          >
            ⭐ Rated ({stats.rated})
          </button>
          <button
            className={`tab ${activeTab === "dismissed" ? "active" : ""}`}
            onClick={() => setActiveTab("dismissed")}
          >
            ✕ Dismissed ({stats.dismissed})
          </button>
        </div>

        {/* Remedy List */}
        <div className="history-list">
          {currentList.length === 0 ? (
            <div className="empty-state">
              <p>No items in this category yet.</p>
              <button className="login-btn" onClick={() => navigate("/remedies")}>
                Get New Remedies
              </button>
            </div>
          ) : (
            currentList.map((item, idx) => (
              <div key={idx} className="history-item">
                <div
                  className="status-icon"
                  style={{ color: getStatusColor(item.status) }}
                >
                  {getStatusIcon(item.status)}
                </div>

                <div className="item-content">
                  <h4>{item.title}</h4>

                  <div className="item-meta">
                    <span className="type-badge">{item.type || "Resource"}</span>
                    <span className="duration">
                      {item.duration_minutes || 0} min
                    </span>

                    {item.rating && (
                      <span className="user-rating">
                        {"★".repeat(item.rating)}
                        {"☆".repeat(5 - item.rating)}
                      </span>
                    )}
                  </div>

                  <div className="item-date">
                    {item.status === "Completed"
                      ? `Completed on ${formatDate(item.completed_on)}`
                      : `Suggested on ${formatDate(item.suggested_on)}`}
                  </div>

                  {item.test_date && (
                    <div className="test-context">
                      From assessment: {formatDate(item.test_date)}
                    </div>
                  )}
                </div>

                {item.resource_link && (
                  <a
                    href={item.resource_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="item-link"
                  >
                    Open →
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="history-footer">
          <button
            className="btn-secondary"
            onClick={() => navigate("/remedies")}
          >
            ← Back to Remedies
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemedyHistory;