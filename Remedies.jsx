// src/Components/Remedies.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE = "http://127.0.0.1:5000";

const Remedies = () => {
  const [loading, setLoading] = useState(true);
  const [emergencyData, setEmergencyData] = useState(null);
  const [remedies, setRemedies] = useState(null);
  const [error, setError] = useState(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [studentId, setStudentId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const testIdFromState = location.state?.testId;
  const aridNo = localStorage.getItem("userAridNo");

  useEffect(() => {
    if (!aridNo) {
      navigate("/");
      return;
    }

    fetchStudentId();
  }, [aridNo, navigate]);

  const fetchStudentId = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/student-id`, {
        params: { arid_no: aridNo },
      });

      setStudentId(res.data.student_id);
      loadRemedies(res.data.student_id);
    } catch (err) {
      loadRemedies(null);
    }
  };

  const loadRemedies = async (sid = null) => {
    try {
      setLoading(true);
      setError(null);

      let tid = testIdFromState;

      if (!tid) {
        const latestRes = await axios.get(`${API_BASE}/api/test/latest`, {
          params: { arid_no: aridNo },
        });

        if (!latestRes.data?.exists) {
          setError("No test found. Please complete an assessment first.");
          setLoading(false);
          return;
        }

        tid = latestRes.data.test_id;
      }

      const remedyRes = await axios.get(`${API_BASE}/api/remedies/recommend`, {
        params: {
          test_id: tid,
          arid_no: aridNo,
          max_duration: 30,
        },
      });

      if (remedyRes.data?.ok === false) {
        setError(remedyRes.data.message || "Failed to load remedies");
        setLoading(false);
        return;
      }

      if (remedyRes.data?.is_emergency) {
        setEmergencyData({
          ...remedyRes.data,
          test_id: tid,
        });
      } else {
        setRemedies({
          ...remedyRes.data,
          student_context: {
            ...remedyRes.data.student_context,
            student_id: sid,
            test_id: tid,
          },
        });
      }
    } catch (err) {
      console.error("Error loading remedies:", err);
      setError("Failed to load remedies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeEmergency = async () => {
    try {
      setAcknowledging(true);

      const protocols = emergencyData.emergency_protocols.map((p) =>
        p.Protocol_Name || p.title || "Unknown Protocol"
      );

      await axios.post(`${API_BASE}/api/remedies/acknowledge-emergency`, {
        test_id: emergencyData.test_id || testIdFromState,
        arid_no: aridNo,
        acknowledged_protocols: protocols,
      });

      setEmergencyData(null);
      await loadRemedies(studentId);
    } catch (err) {
      console.error("Error acknowledging:", err);
      alert("Failed to record acknowledgment. Please try again.");
    } finally {
      setAcknowledging(false);
    }
  };

  const submitFeedback = async (
    remedyId,
    status,
    rating = null,
    feedbackText = null
  ) => {
    try {
      // THE FIX: Added arid_no to the payload so Python accepts the request!
      const payload = {
        arid_no: aridNo, 
        student_id: studentId || remedies?.student_context?.student_id,
        test_id: remedies?.student_context?.test_id || testIdFromState,
        remedy_id: remedyId,
        status: status,
      };

      if (rating) payload.rating = rating;
      if (feedbackText) payload.feedback_text = feedbackText;

      await axios.post(`${API_BASE}/api/remedies/feedback`, payload);

      if (status === "Completed" || status === "Dismissed") {
        setRemedies((prev) => {
          if (!prev) return prev;

          const updatedAll =
            prev.remedies?.all_remedies?.filter(
              (r) => r.Remedy_ID !== remedyId
            ) || [];

          const updateTier = (tier) =>
            tier?.filter((r) => r.Remedy_ID !== remedyId) || [];

          return {
            ...prev,
            remedies: {
              ...prev.remedies,
              all_remedies: updatedAll,
              by_duration: {
                immediate_0_5_min: updateTier(
                  prev.remedies?.by_duration?.immediate_0_5_min
                ),
                quick_6_15_min: updateTier(
                  prev.remedies?.by_duration?.quick_6_15_min
                ),
                standard_16_30_min: updateTier(
                  prev.remedies?.by_duration?.standard_16_30_min
                ),
                extended_30_plus: updateTier(
                  prev.remedies?.by_duration?.extended_30_plus
                ),
              },
            },
          };
        });
      } else if (status === "Viewed") {
        setRemedies((prev) => {
          if (!prev) return prev;

          const updateRemedy = (r) =>
            r.Remedy_ID === remedyId ? { ...r, Status: "Viewed" } : r;

          return {
            ...prev,
            remedies: {
              ...prev.remedies,
              all_remedies: prev.remedies.all_remedies.map(updateRemedy),
            },
          };
        });
      }
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Failed to save feedback. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading your wellness plan...</div>
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

  if (emergencyData?.is_emergency) {
    return (
      <div className="page-container emergency-mode">
        <div className="page-card emergency-card">
          <div className="emergency-header">
            <span className="emergency-icon">🚨</span>
            <h2>Immediate Action Required</h2>
            <p className="emergency-subtitle">{emergencyData.message}</p>
          </div>

          <div className="emergency-protocols">
            {emergencyData.emergency_protocols?.map((protocol, idx) => (
              <div
                key={idx}
                className={`protocol-card ${(
                  protocol.Protocol_Type || "contact"
                ).toLowerCase()}`}
              >
                <div className="protocol-priority">
                  Priority {protocol.Priority || protocol.priority || idx + 1}
                </div>

                <h3>{protocol.Protocol_Name || protocol.title}</h3>

                <p className="protocol-description">
                  {protocol.Action_Text ||
                    protocol.description ||
                    protocol.action}
                </p>

                {(protocol.Contact_Number || protocol.contact) && (
                  <div className="protocol-contact">
                    <strong>📞 {protocol.Contact_Number || protocol.contact}</strong>
                    {(protocol.Contact_Name || protocol.contact_name) && (
                      <span>
                        {" "}
                        - {protocol.Contact_Name || protocol.contact_name}
                      </span>
                    )}
                  </div>
                )}

                {(protocol.Location || protocol.location) && (
                  <div className="protocol-location">
                    📍 {protocol.Location || protocol.location}
                  </div>
                )}

                {(protocol.Required_Documentation ||
                  protocol.documentation_needed) && (
                  <div className="protocol-docs">
                    <strong>Bring/Prepare:</strong>
                    <p>
                      {protocol.Required_Documentation ||
                        protocol.documentation_needed}
                    </p>
                  </div>
                )}

                {(protocol.Operating_Hours ||
                  protocol.operating_hours ||
                  protocol.available ||
                  protocol.hours) && (
                  <div className="protocol-hours">
                    🕐{" "}
                    {protocol.Operating_Hours ||
                      protocol.operating_hours ||
                      protocol.available ||
                      protocol.hours}
                  </div>
                )}

                {(protocol.Resource_Link || protocol.link) && (
                  <a
                    href={protocol.Resource_Link || protocol.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="protocol-link"
                  >
                    Open Resource →
                  </a>
                )}

                {protocol.action_steps && (
                  <div className="protocol-steps">
                    <strong>Steps:</strong>
                    <ol>
                      {protocol.action_steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="emergency-acknowledgment">
            <p className="ack-warning">
              ⚠️ Your safety is our priority. Please complete the above steps
              before proceeding.
            </p>

            <button
              className="submit-btn emergency-ack-btn"
              onClick={acknowledgeEmergency}
              disabled={acknowledging}
            >
              {acknowledging
                ? "Recording..."
                : "I have contacted authorities / Help is arranged"}
            </button>

            <button
              className="btn-secondary"
              onClick={() => navigate("/dashboard")}
              style={{ marginTop: 12 }}
            >
              Back to Dashboard (I will return later)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { student_context, remedies: remedyData } = remedies || {};
  const { by_duration, all_remedies } = remedyData || {};
  const totalRemedies = all_remedies?.length || 0;

  return (
    <div className="page-container">
      <div className="page-card remedy-screen">
        <div className="remedy-header">
          <h2>Your Personalized Wellness Plan</h2>

          {student_context && (
            <div className="context-badge">
              <span
                className={`disease-tag ${(
                  student_context.dominant_disease || "general"
                ).toLowerCase()}`}
              >
                {student_context.dominant_disease || "General Wellness"}
              </span>

              <span
                className={`severity-tag ${student_context.severity || "low"}`}
              >
                {(student_context.severity || "Normal").toUpperCase()} SEVERITY
              </span>
            </div>
          )}
        </div>

        {student_context?.disease_breakdown && (
          <div className="disease-breakdown">
            <div className="breakdown-bar">
              {student_context.disease_breakdown.stress > 0 && (
                <div
                  className="breakdown-segment stress"
                  style={{
                    width: `${student_context.disease_breakdown.stress}%`,
                  }}
                  title={`Stress: ${student_context.disease_breakdown.stress}%`}
                />
              )}
              {student_context.disease_breakdown.anxiety > 0 && (
                <div
                  className="breakdown-segment anxiety"
                  style={{
                    width: `${student_context.disease_breakdown.anxiety}%`,
                  }}
                  title={`Anxiety: ${student_context.disease_breakdown.anxiety}%`}
                />
              )}
              {student_context.disease_breakdown.depression > 0 && (
                <div
                  className="breakdown-segment depression"
                  style={{
                    width: `${student_context.disease_breakdown.depression}%`,
                  }}
                  title={`Depression: ${student_context.disease_breakdown.depression}%`}
                />
              )}
            </div>

            <div className="breakdown-legend">
              {student_context.disease_breakdown.stress > 0 && (
                <span className="stress">
                  Stress {student_context.disease_breakdown.stress}%
                </span>
              )}
              {student_context.disease_breakdown.anxiety > 0 && (
                <span className="anxiety">
                  Anxiety {student_context.disease_breakdown.anxiety}%
                </span>
              )}
              {student_context.disease_breakdown.depression > 0 && (
                <span className="depression">
                  Depression {student_context.disease_breakdown.depression}%
                </span>
              )}
            </div>
          </div>
        )}

        {student_context?.triggered_categories?.length > 0 && (
          <div className="triggered-areas">
            <h4>Areas Needing Support:</h4>
            <div className="area-tags">
              {student_context.triggered_categories.map((cat, idx) => (
                <span key={idx} className="area-tag">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {student_context?.profile_applied && (
          <div className="profile-context">
            <small>
              Personalized for: {student_context.profile_applied.gender} •{" "}
              {student_context.profile_applied.living_situation} •{" "}
              {student_context.profile_applied.income_context}
            </small>
          </div>
        )}

        <div className="remedies-section">
          <h3>Recommended Actions ({totalRemedies})</h3>

          {by_duration?.immediate_0_5_min?.length > 0 && (
            <div className="duration-tier immediate">
              <h4>⚡ Immediate Relief (0-5 min)</h4>
              <div className="remedy-grid">
                {by_duration.immediate_0_5_min.map((remedy) => (
                  <RemedyCard
                    key={remedy.Remedy_ID || remedy.remedy_id}
                    remedy={remedy}
                    onFeedback={submitFeedback}
                  />
                ))}
              </div>
            </div>
          )}

          {by_duration?.quick_6_15_min?.length > 0 && (
            <div className="duration-tier quick">
              <h4>🌱 Quick Practice (6-15 min)</h4>
              <div className="remedy-grid">
                {by_duration.quick_6_15_min.map((remedy) => (
                  <RemedyCard
                    key={remedy.Remedy_ID || remedy.remedy_id}
                    remedy={remedy}
                    onFeedback={submitFeedback}
                  />
                ))}
              </div>
            </div>
          )}

          {by_duration?.standard_16_30_min?.length > 0 && (
            <div className="duration-tier standard">
              <h4>🎯 Deeper Work (16-30 min)</h4>
              <div className="remedy-grid">
                {by_duration.standard_16_30_min.map((remedy) => (
                  <RemedyCard
                    key={remedy.Remedy_ID || remedy.remedy_id}
                    remedy={remedy}
                    onFeedback={submitFeedback}
                  />
                ))}
              </div>
            </div>
          )}

          {by_duration?.extended_30_plus?.length > 0 && (
            <div className="duration-tier extended">
              <h4>🌊 Extended Session (30+ min)</h4>
              <div className="remedy-grid">
                {by_duration.extended_30_plus.map((remedy) => (
                  <RemedyCard
                    key={remedy.Remedy_ID || remedy.remedy_id}
                    remedy={remedy}
                    onFeedback={submitFeedback}
                  />
                ))}
              </div>
            </div>
          )}

          {totalRemedies === 0 && (
            <div className="empty-state">
              <p>No active remedies. You've completed all recommended actions!</p>
              <button
                className="login-btn"
                onClick={() => navigate("/remedy-history")}
              >
                View Your Wellness History
              </button>
            </div>
          )}

          {all_remedies?.length > 0 &&
            !by_duration?.immediate_0_5_min?.length &&
            !by_duration?.quick_6_15_min?.length &&
            !by_duration?.standard_16_30_min?.length && (
              <div className="remedy-grid">
                {all_remedies.map((remedy) => (
                  <RemedyCard
                    key={remedy.Remedy_ID || remedy.remedy_id}
                    remedy={remedy}
                    onFeedback={submitFeedback}
                  />
                ))}
              </div>
            )}
        </div>

        {remedies?.modality_distribution &&
          Object.keys(remedies.modality_distribution).length > 0 && (
            <div className="modality-summary">
              <h4>Your Plan Includes:</h4>
              <div className="modality-badges">
                {Object.entries(remedies.modality_distribution).map(
                  ([type, count]) =>
                    count > 0 && (
                      <span
                        key={type}
                        className={`modality-badge ${type.toLowerCase()}`}
                      >
                        {getModalityIcon(type)} {type}: {count}
                      </span>
                    )
                )}
              </div>
            </div>
          )}

        {remedies?.rules_applied && (
          <details className="rules-applied">
            <summary>How we personalized your plan</summary>
            <ul>
              {remedies.rules_applied.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="remedy-actions-footer">
          <button
            className="btn-secondary"
            onClick={() => navigate("/remedy-history")}
          >
            📚 My Wellness History
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

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
    Counseling: "💬",
  };

  return icons[type] || "✨";
};

const RemedyCard = ({ remedy, onFeedback }) => {
  const [expanded, setExpanded] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const handleComplete = () => {
    onFeedback(
      remedy.Remedy_ID || remedy.remedy_id,
      "Completed",
      rating || null,
      feedbackText || null
    );
  };

  const handleDismiss = () => {
    onFeedback(remedy.Remedy_ID || remedy.remedy_id, "Dismissed");
  };

  const handleView = () => {
    setExpanded(true);
    onFeedback(remedy.Remedy_ID || remedy.remedy_id, "Viewed");
  };

  return (
    <div className={`remedy-card ${expanded ? "expanded" : ""}`}>
      <div className="remedy-header-row">
        <span
          className={`modality-indicator ${(
            remedy.Remedy_Type ||
            remedy.remedy_type ||
            "general"
          ).toLowerCase()}`}
        >
          {getModalityIcon(remedy.Remedy_Type || remedy.remedy_type)}
        </span>

        <span className="duration-badge">
          {remedy.Duration_Minutes || remedy.duration_minutes || 10} min
        </span>
      </div>

      <h4 className="remedy-title">{remedy.Title || remedy.title}</h4>

      <p className="remedy-description">
        {remedy.Description || remedy.description}
      </p>

      {remedy.Target_Severity && (
        <span
          className={`severity-indicator ${(
            remedy.Target_Severity || "normal"
          ).toLowerCase()}`}
        >
          {remedy.Target_Severity}
        </span>
      )}

      {remedy.Linked_Sub_Category_ID && (
        <span className="sub-category-tag">{remedy.Linked_Sub_Category_ID}</span>
      )}

      {expanded && (
        <div className="remedy-expanded">
          {remedy.Resource_Link || remedy.resource_link ? (
            <a
              href={remedy.Resource_Link || remedy.resource_link}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              Open Resource →
            </a>
          ) : (
            <div className="self-guided">
              <strong>Self-Guided Activity</strong>
              <p>Follow the steps above to complete this remedy.</p>
            </div>
          )}

          {/* {!showFeedback ? (
            <div className="action-buttons">
              <button
                className="btn-complete"
                onClick={() => setShowFeedback(true)}
              >
                ✓ Mark Complete
              </button>
              <button className="btn-dismiss" onClick={handleDismiss}>
                ✕ Dismiss
              </button>
            </div>
          ) : (
            <div className="feedback-form">
              <p>How helpful was this?</p>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${rating >= star ? "active" : ""}`}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Optional feedback..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={2}
              />

              <div className="feedback-actions">
                <button
                  className="btn-submit"
                  onClick={handleComplete}
                  disabled={!rating}
                >
                  Submit & Complete
                </button>
                <button
                  className="btn-skip"
                  onClick={() => {
                    setShowFeedback(false);
                    setRating(0);
                  }}
                >
                  Skip Rating
                </button>
              </div>
            </div>
          )} */}
        </div>
      )}

      {!expanded && (
        <button className="btn-expand" onClick={handleView}>
          View Details →
        </button>
      )}
    </div>
  );
};

export default Remedies;