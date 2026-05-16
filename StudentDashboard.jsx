import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "../App.css";

const API = "http://127.0.0.1:5000";

// Mini Donut Chart Component
const MiniDonut = ({ label, value, color }) => {
  const data = useMemo(
    () => [
      { name: label, value: value || 0 },
      { name: "Remaining", value: Math.max(0, 100 - (value || 0)) }
    ],
    [label, value]
  );

  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ width: "100%", height: 90 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={22}
              outerRadius={32}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#eaeaea" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#666" }}>{value || 0}%</div>
    </div>
  );
};

// REPLACE your entire SessionDetailModal with this fixed version:

const SessionDetailModal = ({ session, onClose, aridNo }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("summary");
  const [qaData, setQaData] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState({ 
      needsMeeting: false, 
      alreadyRequested: false,
      isScheduled: false,
      meetingDate: null
  });
  const [advMeeting, setAdvMeeting] = useState({ has_meeting: false });
  const [selectedAdvSlot, setSelectedAdvSlot] = useState("");

  // Load summary immediately
  useEffect(() => {
    loadSessionSummary();
  }, [session.test_id]);

  // Load Q&A only when tab is clicked
  useEffect(() => {
    if (viewMode === "qa" && !qaData && !qaLoading) {
      loadQADetails();
    }
  }, [viewMode]);

  const loadSessionSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/test/result`, {
        params: { test_id: session.test_id }
      });
      setDetails(res.data);
    } catch (e) {
      console.error("Summary load error:", e);
      // Use session data as fallback
      setDetails({
        pie: {
          stress: session.stress,
          anxiety: session.anxiety,
          depression: session.depression
        },
        triggered_categories:
          session.triggered?.map((name) => ({
            Category_Short_Name: name,
            Category_Name: name
          })) || [],
        Severity: session.severity,
        Dominant_Disease: session.dominant_disease
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQADetails = async () => {
    try {
      setQaLoading(true);
      const res = await axios.get(`${API}/api/test/details`, {
        params: { test_id: session.test_id, arid_no: aridNo }
      });
      setQaData(res.data.qa || []);
    } catch (e) {
      console.error("Q&A load error:", e);
      setQaData([]); // Empty array on error
    } finally {
      setQaLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner">Loading session details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content session-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Session Details</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={viewMode === "summary" ? "active" : ""}
            onClick={() => setViewMode("summary")}
          >
            📊 Summary
          </button>
          <button
            className={viewMode === "qa" ? "active" : ""}
            onClick={() => setViewMode("qa")}
          >
            ❓ Q & A ({qaData?.length || "..."})
          </button>
        </div>

        {viewMode === "summary" ? (
          <div className="session-summary">
            <div className="date-badge">
              {new Date(session.date).toLocaleString()}
            </div>

            <div className="metrics-grid">
              <div className="metric-box stress">
                <div className="metric-value">{session.stress}%</div>
                <div className="metric-label">Stress</div>
              </div>
              <div className="metric-box anxiety">
                <div className="metric-value">{session.anxiety}%</div>
                <div className="metric-label">Anxiety</div>
              </div>
              <div className="metric-box depression">
                <div className="metric-value">{session.depression}%</div>
                <div className="metric-label">Depression</div>
              </div>
            </div>

            <div className="triggered-section">
              <h4>Triggered Categories</h4>
              <div className="triggered-tags">
                {details?.triggered_categories?.length > 0 ? (
                  details.triggered_categories.map((cat, idx) => (
                    <span key={idx} className="triggered-tag">
                      {cat.Category_Short_Name || cat.Category_Name}
                    </span>
                  ))
                ) : session.triggered?.length > 0 ? (
                  session.triggered.map((cat, idx) => (
                    <span key={idx} className="triggered-tag">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="no-data">No categories triggered</span>
                )}
              </div>
            </div>

            <div
              className={`severity-badge ${(
                details?.Severity ||
                session.severity ||
                "low"
              ).toLowerCase()}`}
            >
              {(details?.Severity || session.severity || "Normal")} Severity
            </div>

            {details?.Dominant_Disease && (
              <div className="dominant-disease">
                <strong>Primary Concern:</strong> {details.Dominant_Disease}
              </div>
            )}
          </div>
        ) : (
          <div className="qa-section">
            {qaLoading ? (
              <div className="loading-spinner small">Loading questions...</div>
            ) : qaData?.length > 0 ? (
              <div className="qa-list">
                {qaData.map((item, idx) => (
                  <div key={idx} className="qa-item">
                    <div className="question-number">Q{idx + 1}</div>
                    <div className="qa-content">
                      <div className="question-text">
                        {item.question || "Question not available"}
                      </div>
                      <div className="answer-text">
                        <span className="answer-label">Your Answer:</span>
                        <span className="answer-value">
                          {item.answer || "Not recorded"}
                        </span>
                        {item.score !== undefined && item.score !== null && (
                          <span className="score-badge">
                            Score: {item.score}
                          </span>
                        )}
                      </div>
                      {item.category && (
                        <div className="question-category">{item.category}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <p>No Q&A data available for this session.</p>
                <p className="sub-text">
                  This may be an older test or data was not recorded.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Calendar Component
// ==========================================
// COMPACT CALENDAR VIEW
// ==========================================
const CalendarView = ({ dailyResults, onDateClick }) => {
  // Generate the last 30 days
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // Format date safely to YYYY-MM-DD
  const formatDate = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Bulletproof String-Only Matching (Ignores Timezones entirely)
  const getResultForDate = (dateStr) => {
    if (!dailyResults || !Array.isArray(dailyResults)) return null;

    return dailyResults.find((r) => {
      const backendDateStr = r.date || r.CheckIn_Date;
      if (!backendDateStr) return false;

      // Extract only the 'YYYY-MM-DD' part from the database string and compare directly
      return backendDateStr.substring(0, 10) === dateStr;
    });
  };

  return (
    <div className="compact-calendar">
      {days.map((date, idx) => {
        const dateStr = formatDate(date);
        const result = getResultForDate(dateStr);

        // Color coding based on Mood Score (0-4)
        let bgClass = "empty-day";
        if (result) {
          if (result.mood >= 3) bgClass = "good-day"; // Good/Excellent
          else if (result.mood === 2) bgClass = "neutral-day"; // Neutral
          else bgClass = "bad-day"; // Low/Very Low
        }

        return (
          <div
            key={idx}
            className={`calendar-day ${bgClass}`}
            onClick={() => onDateClick(result || { date: dateStr, empty: true })}
            title={dateStr}
          >
            {date.getDate()}
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// DAILY RESULT MODAL (POPUP DETAILS)
// ==========================================
const DailyResultModal = ({ result, onClose }) => {
  if (!result) return null;

  const isMissed = result.empty;
  const moodLabels = ["Very Low 😢", "Low 😕", "Neutral 😐", "Good 🙂", "Excellent 🌟"];
  const genericLabels = ["Never", "Rarely", "Sometimes", "Often", "Always"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <h2
          style={{
            marginBottom: "20px",
            borderBottom: "2px solid #eee",
            paddingBottom: "10px"
          }}
        >
          Daily Log:{" "}
          {new Date(result.date).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </h2>

        {isMissed ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#6b7280"
            }}
          >
            <div style={{ fontSize: "50px", marginBottom: "15px" }}>📭</div>
            <h3>No Check-in Found</h3>
            <p>You did not complete a daily check-in on this date.</p>
          </div>
        ) : (
          <div className="daily-log-details fade-in">
            {/* Grid of Scores */}
            <div className="metrics-grid">
              <div className="metric-box">
                <span className="metric-title">Mood</span>
                <span className="metric-value" style={{ color: "#4CAF50" }}>
                  {moodLabels[result.mood] || "N/A"}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Stress</span>
                <span className="metric-value">
                  {genericLabels[result.stress] || "N/A"}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Anxiety</span>
                <span className="metric-value">
                  {genericLabels[result.anxiety] || "N/A"}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Energy</span>
                <span className="metric-value">
                  {genericLabels[result.energy] || "N/A"}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Sleep</span>
                <span className="metric-value">
                  {genericLabels[result.sleep] || "N/A"}
                </span>
              </div>
            </div>

            {/* Notes Section (Shows Remedies & Academic issues) */}
            {result.notes ? (
              <div className="notes-box">
                <h3 style={{ marginBottom: "10px", fontSize: "16px" }}>
                  📝 Log Notes & Activity
                </h3>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    margin: 0,
                    color: "#374151"
                  }}
                >
                  {result.notes}
                </pre>
              </div>
            ) : (
              <div
                className="notes-box"
                style={{
                  background: "#f9fafb",
                  border: "1px dashed #d1d5db"
                }}
              >
                <p style={{ color: "#9ca3af", margin: 0, textAlign: "center" }}>
                  No extra notes recorded for this day.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const aridNo = localStorage.getItem("userAridNo");
  const studentName = localStorage.getItem("userName") || "Student";

  const [latestTest, setLatestTest] = useState(null);
  const [latestSummary, setLatestSummary] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeRemedies, setActiveRemedies] = useState([]);
  const [dailyResults, setDailyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedDailyResult, setSelectedDailyResult] = useState(null);

  // NEW: meeting status state
  const [meetingStatus, setMeetingStatus] = useState({
    needsMeeting: false,
    alreadyRequested: false,
    isScheduled: false,
    meetingDate: null
  });

  // NEW: Advisor Meeting Handshake States
  const [advMeeting, setAdvMeeting] = useState({ has_meeting: false });
  const [selectedAdvSlot, setSelectedAdvSlot] = useState("");

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning!";
    if (h < 17) return "Good afternoon!";
    return "Good evening!";
  }, []);

  useEffect(() => {
    if (!aridNo) {
      navigate("/");
      return;
    }
    loadAllData();
  }, [aridNo, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const latestRes = await axios.get(`${API}/api/test/latest`, {
        params: { arid_no: aridNo }
      });

      if (latestRes.data?.exists) {
        setLatestTest(latestRes.data);

        const summaryRes = await axios.get(`${API}/api/test/result`, {
          params: { test_id: latestRes.data.test_id }
        });
        setLatestSummary(summaryRes.data);
      }

      // Fetch Advisor Meeting Request
      const advMeetRes = await axios.get(`${API}/api/student/advisor-meeting-status`, { params: { arid_no: aridNo } });
      if (advMeetRes.data.ok) setAdvMeeting(advMeetRes.data);

      const historyRes = await axios.get(`${API}/api/test/history`, {
        params: { arid_no: aridNo }
      });
      setSessionHistory(historyRes.data?.sessions || []);

      // Fetch meeting notification status
      const meetingRes = await axios.get(`${API}/api/student/meeting-status`, {
        params: { arid_no: aridNo }
      });
      if (meetingRes.data.ok) {
        setMeetingStatus({
          needsMeeting: meetingRes.data.needs_meeting,
          alreadyRequested: meetingRes.data.already_requested,
          isScheduled: meetingRes.data.is_scheduled,
          meetingDate: meetingRes.data.meeting_date
        });
      }

      // Fetch currently recommended remedies based on the latest test (Dynamic)
      try {
        const remediesRes = await axios.get(`${API}/api/remedies/recommend`, {
          params: { arid_no: aridNo }
        });

        let activeList = [];

        if (remediesRes.data?.is_emergency && remediesRes.data?.emergency_protocols) {
          // If in an emergency state, prioritize emergency protocols on the dashboard
          activeList = remediesRes.data.emergency_protocols.map((p) => ({
            remedy_id: p.Protocol_ID || Math.random(),
            title: p.Protocol_Name,
            type: "Safety",
            duration_minutes: 0,
            status: "Urgent"
          }));
        } else if (remediesRes.data?.remedies?.all_remedies) {
          // Show standard tailored recommendations
          activeList = remediesRes.data.remedies.all_remedies.map((r) => ({
            remedy_id: r.Remedy_ID,
            title: r.Title,
            type: r.Remedy_Type || "General",
            duration_minutes: r.Duration_Minutes || 10,
            status: "Suggested"
          }));
        }

        setActiveRemedies(activeList.slice(0, 3));
      } catch (err) {
        console.error("Error fetching recommended remedies:", err);
      }

      const dailyRes = await axios.get(`${API}/api/daily-results`, {
        params: { arid_no: aridNo }
      });
      setDailyResults(dailyRes.data?.results || []);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeAssessment = () => {
    navigate("/general-questions");
  };

  const handleAcceptAdvisorSlot = async () => {
      if(!selectedAdvSlot) return alert("Please type your preferred time from the proposed slots.");
      try {
          await axios.post(`${API}/api/student/accept-advisor-meeting`, { meeting_id: advMeeting.meeting_id, slot: selectedAdvSlot });
          setAdvMeeting({ ...advMeeting, status: 'Accepted', confirmed_slot: selectedAdvSlot });
          alert("Time confirmed! Your advisor has been notified.");
      } catch (e) { alert("Failed to confirm slot."); }
  };

  // NEW: meeting request handler
  const handleRequestMeeting = async () => {
    try {
        await axios.post(`${API}/api/student/request-meeting`, { arid_no: aridNo });
        // Ensure we pass all variables so the button doesn't vanish!
        setMeetingStatus({ needsMeeting: false, alreadyRequested: true, isScheduled: false, meetingDate: null });
        alert("Meeting request sent! The Clinical Team will arrange a time with you shortly.");
    } catch (e) {
        console.error("Meeting request failed", e);
    }
  };

  const handleDailyCheckIn = () => {
    navigate("/daily-checkin");
  };

  const handleWeeklyCheckIn = () => {
    navigate("/weekly-checkin");
  };

  const handleViewRemedies = () => {
    navigate("/remedies", {
      state: { testId: latestTest?.test_id }
    });
  };

  const handleViewSessionDetails = (session) => {
    setSelectedSession(session);
  };

  const handleDateClick = (result) => {
    setSelectedDailyResult(result);
  };

  const stressPct = latestSummary?.pie?.stress ?? 0;
  const anxPct = latestSummary?.pie?.anxiety ?? 0;
  const depPct = latestSummary?.pie?.depression ?? 0;

  const formatDate = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
  };

  const buildSessionObject = (session, idx = 0, useLatestSummary = false) => {
    if (useLatestSummary) {
      return {
        ...session,
        session_number: idx + 1,
        stress: latestSummary?.pie?.stress || 0,
        anxiety: latestSummary?.pie?.anxiety || 0,
        depression: latestSummary?.pie?.depression || 0,
        severity:
          latestSummary?.Severity ||
          latestSummary?.severity ||
          latestSummary?.Severity_Label ||
          session?.severity ||
          "Normal",
        triggered:
          latestSummary?.triggered_categories?.map(
            (c) => c.Category_Short_Name || c.Category_Name
          ) || [],
        date: session?.started_on || session?.date || new Date().toISOString(),
        isLatest: true
      };
    }

    return {
      ...session,
      session_number: idx + 1,
      stress: session?.stress || 0,
      anxiety: session?.anxiety || 0,
      depression: session?.depression || 0,
      severity: session?.severity || "Normal",
      triggered: session?.triggered || [],
      date: session?.date || session?.started_on || new Date().toISOString(),
      isLatest: false
    };
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page-container dashboard-page">
      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="greeting-section">
            <div className="greeting-text">{greeting}</div>
            <h1 className="student-name">{studentName}</h1>
            <div className="arid-display">ARID: {aridNo}</div>
          </div>

          <div className="header-actions" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* ADVISOR MEETING HANDSHAKE */}
            {advMeeting.has_meeting && advMeeting.status === 'Proposed' && (
                <div className="fade-in" style={{ backgroundColor: "#ebf4ff", padding: "15px", borderRadius: "8px", border: "2px solid #667eea", marginBottom: "10px" }}>
                    <p style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold", color: "#2b6cb0" }}>
                        👨‍🏫 Your Advisor requested a meeting.
                    </p>
                    <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#4a5568" }}>
                        <strong>Proposed Times:</strong> {advMeeting.slots}
                    </p>
                    <input 
                        type="text" 
                        placeholder="Type your preferred time..." 
                        value={selectedAdvSlot}
                        onChange={(e) => setSelectedAdvSlot(e.target.value)}
                        style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #a0aec0" }}
                    />
                    <button onClick={handleAcceptAdvisorSlot} style={{ width: "100%", padding: "8px", backgroundColor: "#667eea", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold" }}>
                        Confirm Time
                    </button>
                </div>
            )}
            
            {advMeeting.has_meeting && advMeeting.status === 'Accepted' && (
                <button className="fade-in" style={{ backgroundColor: "#48bb78", color: "white", padding: "8px 15px", fontSize: "14px", border: "none", borderRadius: "5px", cursor: "default", marginBottom: "10px" }} disabled>
                    ✅ Advisor Meeting: {advMeeting.confirmed_slot}
                </button>
            )}

            <button className="btn-retake" onClick={handleRetakeAssessment}>
              🔄 Retake Assessment
            </button>
            
            {/* STATE 1: Needs to schedule */}
            {meetingStatus.needsMeeting && (
              <button 
                className="btn-primary fade-in" 
                style={{ backgroundColor: "#e53e3e", position: "relative", padding: "8px 15px", fontSize: "14px" }}
                onClick={handleRequestMeeting}
              >
                📅 Set Meeting (Required)
                <span className="notification-dot" style={{ position: "absolute", top: "-5px", right: "-5px", height: "12px", width: "12px", backgroundColor: "#ffeb3b", borderRadius: "50%", border: "2px solid #e53e3e", animation: "pulse 2s infinite" }}></span>
              </button>
            )}
            
            {/* STATE 2: Requested, waiting for psychologist to confirm */}
            {meetingStatus.alreadyRequested && (
              <button 
                className="btn-secondary fade-in" 
                style={{ cursor: "default", backgroundColor: "#e2e8f0", color: "#718096", padding: "8px 15px", fontSize: "14px", border: "none" }}
                disabled
              >
                ⏳ Meeting Requested
              </button>
            )}

            {/* STATE 3: Scheduled by psychologist! Turns green and shows the time. */}
            {meetingStatus.isScheduled && (
              <button 
                className="btn-primary fade-in" 
                style={{ cursor: "default", backgroundColor: "#48bb78", padding: "8px 15px", fontSize: "14px", border: "none", display: "flex", flexDirection: "column", alignItems: "center" }}
                disabled
              >
                <span style={{ fontWeight: "bold" }}>✅ Meeting Confirmed with psychologist</span>
                <span style={{ fontSize: "12px", marginTop: "2px", color: "#f0fff4" }}>{meetingStatus.meetingDate}</span>
              </button>
            )}
          </div>
        </div>

        {/* Assessment History Section - DROPDOWN VERSION */}
        <div className="section-card">
          <div className="section-header">
            <h2>📊 Assessment History</h2>
            <span className="session-count">{sessionHistory.length} Sessions</span>
          </div>

          {sessionHistory.length > 0 ? (
            <div className="history-dropdown-container">
              <div className="history-select-wrapper">
                <select
                  className="history-dropdown"
                  value={selectedSession?.test_id || ""}
                  onChange={(e) => {
                    const testId = parseInt(e.target.value, 10);
                    const idx = sessionHistory.findIndex((s) => s.test_id === testId);
                    const session = sessionHistory.find((s) => s.test_id === testId);

                    if (session) {
                      const isLatest =
                        latestTest?.test_id === testId || sessionHistory[0]?.test_id === testId;

                      const preparedSession = buildSessionObject(
                        session,
                        idx,
                        isLatest && !!latestSummary
                      );

                      setSelectedSession(preparedSession);
                    }
                  }}
                >
                  <option value="">Select a session to view details...</option>
                  {sessionHistory.map((session, idx) => (
                    <option key={session.test_id} value={session.test_id}>
                      Session {idx + 1} - {formatDate(session.date || session.started_on)} (
                      {session.dominant_disease || session.Dominant_Disease || "General"}) -{" "}
                      {session.severity || "Normal"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSession && (
                <div className="selected-session-panel">
                  <div className="session-detail-header">
                    <h3>Session Details</h3>
                    <span
                      className={`severity-badge ${(
                        selectedSession.severity || "normal"
                      ).toLowerCase()}`}
                    >
                      {selectedSession.severity || "Normal"}
                    </span>
                  </div>

                  <div className="session-metrics-grid">
                    <div className="metric-box stress">
                      <div className="metric-value">{selectedSession.stress || 0}%</div>
                      <div className="metric-label">Stress</div>
                    </div>
                    <div className="metric-box anxiety">
                      <div className="metric-value">{selectedSession.anxiety || 0}%</div>
                      <div className="metric-label">Anxiety</div>
                    </div>
                    <div className="metric-box depression">
                      <div className="metric-value">{selectedSession.depression || 0}%</div>
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
                          state: { testId: selectedSession.test_id }
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

        {/* Check-in Buttons */}
        <div className="checkin-grid">
          <button className="checkin-btn daily" onClick={handleDailyCheckIn}>
            <span className="icon">📅</span>
            <span className="label">Daily Check-in</span>
          </button>
          <button className="checkin-btn weekly" onClick={handleWeeklyCheckIn}>
            <span className="icon">📊</span>
            <span className="label">Weekly Check-in</span>
          </button>
        </div>

        {/* Current Health Status */}
        {latestSummary && (
          <div className="section-card health-status">
            <div className="section-header">
              <h2>💚 Current Health Status</h2>
              <span
                className={`severity-badge ${(
                  (latestSummary.severity || latestSummary.Severity || "normal").toLowerCase()
                )}`}
              >
                {latestSummary.severity || latestSummary.Severity || "Normal"}
              </span>
            </div>

            <div className="health-metrics">
              <div className="metric-bar">
                <div className="metric-label">Stress</div>
                <div className="progress-bar">
                  <div className="progress-fill stress" style={{ width: `${stressPct}%` }} />
                </div>
                <div className="metric-value">{stressPct}%</div>
              </div>

              <div className="metric-bar">
                <div className="metric-label">Anxiety</div>
                <div className="progress-bar">
                  <div className="progress-fill anxiety" style={{ width: `${anxPct}%` }} />
                </div>
                <div className="metric-value">{anxPct}%</div>
              </div>

              <div className="metric-bar">
                <div className="metric-label">Depression</div>
                <div className="progress-bar">
                  <div className="progress-fill depression" style={{ width: `${depPct}%` }} />
                </div>
                <div className="metric-value">{depPct}%</div>
              </div>
            </div>

            <div
              className="deep-dive-card"
              onClick={() =>
                navigate("/deep-dive-result", {
                  state: { testId: latestTest?.test_id }
                })
              }
            >
              <div className="deep-dive-icon">🔍</div>
              <div className="deep-dive-content">
                <h4>Deep Dive Assessment</h4>
                <p>Based on comprehensive evaluation of your specific concerns</p>
              </div>
            </div>
          </div>
        )}

        {/* My Remedies Section - DYNAMIC */}
        <div className="section-card remedies-section">
          <div className="section-header">
            <h2>🧩 My Remedies</h2>
            <span className="active-count">{activeRemedies.length} Active</span>
          </div>

          {activeRemedies.length > 0 ? (
            <>
              <div className="remedy-list">
                {activeRemedies.map((remedy) => (
                  <div
                    key={remedy.remedy_id || remedy.Remedy_ID}
                    className="remedy-item"
                  >
                    <div className="remedy-icon">
                      {getModalityIcon(remedy.type || remedy.Remedy_Type)}
                    </div>
                    <div className="remedy-info">
                      <div className="remedy-title">{remedy.title || remedy.Title}</div>
                      <div className="remedy-meta">
                        {remedy.type || remedy.Remedy_Type} •{" "}
                        {remedy.duration_minutes || remedy.Duration_Minutes} min
                      </div>
                    </div>
                    <div className="remedy-status">{remedy.status}</div>
                  </div>
                ))}
              </div>

              <button className="btn-view-all" onClick={handleViewRemedies}>
                🔗 View All Remedies
              </button>
            </>
          ) : (
            <div className="empty-state small">
              <p>No active remedies. Complete an assessment to get personalized recommendations.</p>
            </div>
          )}
        </div>

        {/* ==========================================
            PROGRESS REPORT BUTTONS (Inserted Here)
        ========================================== */}
        <div
          className="student-reports-row"
          style={{
            display: "flex",
            gap: "15px",
            marginTop: "10px",
            marginBottom: "25px",
            justifyContent: "center"
          }}
        >
          <button
            className="submit-btn"
            style={{
              flex: 1,
              maxWidth: "250px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            onClick={() => navigate("/my-reports", { state: { defaultTab: "daily" } })}
          >
            <span>📊</span> View daily reports
          </button>

          <button
            style={{
              flex: 1,
              maxWidth: "250px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              backgroundColor: "#e2e8f0",
              color: "#4a5568",
              border: "none",
              padding: "12px 20px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
            onClick={() => navigate("/my-reports", { state: { defaultTab: "weekly" } })}
          >
            <span>📈</span> View weekly reports
          </button>
        </div>
        {/* ========================================== */}

        {/* Recovery Trend & Calendar */}
        <div className="section-card recovery-section">
          <div className="section-header">
            <h2>📈 Recovery Trend</h2>
            <span className="trend-badge">1w</span>
          </div>

          <div className="recovery-chart-placeholder">
            <div className="chart-line">
              <div className="trend-point" style={{ left: "10%", bottom: "30%" }} />
              <div className="trend-point" style={{ left: "30%", bottom: "45%" }} />
              <div className="trend-point" style={{ left: "50%", bottom: "40%" }} />
              <div className="trend-point current" style={{ left: "70%", bottom: "60%" }} />
            </div>
            <div className="chart-labels">
              <span>Baseline</span>
              <span>Current</span>
            </div>
          </div>

          <div className="calendar-section">
            <h3>📅 Daily Check-in Calendar</h3>
            <CalendarView dailyResults={dailyResults} onDateClick={handleDateClick} />
          </div>
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <div className="streak-indicator">🔥 1 day: 62/100. Check in tomorrow!</div>
        </div>
      </div>

      {/* Modals */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          aridNo={aridNo}
        />
      )}

      {selectedDailyResult && (
        <DailyResultModal
          result={selectedDailyResult}
          onClose={() => setSelectedDailyResult(null)}
        />
      )}
    </div>
  );
};

// Helper function for modality icons
const getModalityIcon = (type) => {
  const icons = {
    Physical: "💪",
    Cognitive: "🧠",
    Social: "👥",
    Spiritual: "🧘",
    Breathing: "🫁",
    Grounding: "🌍",
    Planning: "📝",
    Writing: "✍️",
    Walking: "🚶",
    Routine: "⏰",
    Safety: "🛡️",
    Counseling: "💬"
  };
  return icons[type] || "✨";
};

export default StudentDashboard;