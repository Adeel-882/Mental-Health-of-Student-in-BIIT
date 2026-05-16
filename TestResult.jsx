import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../App.css";

const COLORS = {
  stress: "#FF8042",    // Orange
  anxiety: "#FFBB28",   // Yellow  
  depression: "#0088FE", // Blue
  wellness: "#00C49F"   // Green for healthy
};

const TestResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resultData = location.state?.result;

  // Validate data exists
  if (!resultData) {
    return (
      <div className="profile-container">
        <div className="profile-card" style={{ textAlign: "center" }}>
          <h2>Error</h2>
          <p>No result data found. Please complete the assessment.</p>
          <button className="login-btn" onClick={() => navigate("/general-questions")}>
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  // Extract pie data with validation
  const pieData = resultData?.pie || {};
  
  const stressVal = Math.max(0, Math.min(100, Number(pieData.stress) || 0));
  const anxietyVal = Math.max(0, Math.min(100, Number(pieData.anxiety) || 0));
  const depressionVal = Math.max(0, Math.min(100, Number(pieData.depression) || 0));

  // Check if all zero (no triggers or error)
  const totalVal = stressVal + anxietyVal + depressionVal;
  const hasNoData = totalVal === 0;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (hasNoData) {
      return [{ name: "General Wellness", value: 100, color: COLORS.wellness }];
    }
    
    return [
      { name: "Stress", value: stressVal, color: COLORS.stress },
      { name: "Anxiety", value: anxietyVal, color: COLORS.anxiety },
      { name: "Depression", value: depressionVal, color: COLORS.depression }
    ].filter(d => d.value > 0); // Hide zero slices
  }, [stressVal, anxietyVal, depressionVal, hasNoData]);

  // Triggered categories
  const triggeredCategories = Array.isArray(resultData.triggered_categories)
    ? resultData.triggered_categories
    : [];

  const triggeredByText = triggeredCategories.length > 0
    ? triggeredCategories.map((c) => c.Category_Short_Name || c.Category_Name).join(" • ")
    : "No significant concerns identified";

  // Determine dominant concern
  const dominantConcern = useMemo(() => {
    if (hasNoData) return "General Wellness";
    if (resultData.Dominant_Disease) return resultData.Dominant_Disease;
    
    const maxVal = Math.max(stressVal, anxietyVal, depressionVal);
    if (maxVal === stressVal) return "Stress";
    if (maxVal === anxietyVal) return "Anxiety";
    return "Depression";
  }, [hasNoData, resultData.Dominant_Disease, stressVal, anxietyVal, depressionVal]);

  // Determine severity level
  const severityLevel = useMemo(() => {
    if (hasNoData) return "low";
    const maxVal = Math.max(stressVal, anxietyVal, depressionVal);
    if (maxVal >= 50) return "high";
    if (maxVal >= 25) return "moderate";
    return "mild";
  }, [hasNoData, stressVal, anxietyVal, depressionVal]);

  const testId = resultData.test_id;

  return (
    <div className="profile-container">
      <div className="profile-card" style={{ textAlign: "center" }}>
        <h2>Your Wellness Report</h2>

        {/* Pie chart */}
        <div style={{ width: "100%", height: "300px", minHeight: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => value > 0 ? `${name}: ${value}%` : ''}
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="result-summary">
          <h3>
            Primary Concern: {" "}
            <span style={{ 
              color: hasNoData ? COLORS.wellness : 
                     dominantConcern === "Stress" ? COLORS.stress :
                     dominantConcern === "Anxiety" ? COLORS.anxiety : COLORS.depression,
              fontWeight: "bold"
            }}>
              {dominantConcern}
            </span>
          </h3>
          
          <p>Severity Level: <strong>{severityLevel.toUpperCase()}</strong></p>

          <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            Triggered Areas: <strong>{triggeredByText}</strong>
          </p>
          
          {triggeredCategories.length > 0 && (
            <p style={{ marginTop: "10px", fontSize: "12px", color: "#888" }}>
              ({triggeredCategories.length} area{triggeredCategories.length !== 1 ? 's' : ''} need{triggeredCategories.length === 1 ? 's' : ''} deeper exploration)
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          <button
            className="login-btn"
            onClick={() => {
              if (!testId) {
                alert("Missing test session. Please retake the assessment.");
                return;
              }
              navigate("/deep-dive", { state: { testId } });
            }}
            style={{ 
              background: triggeredCategories.length > 0 ? "#2c3e50" : "#ccc",
              cursor: triggeredCategories.length > 0 ? "pointer" : "not-allowed"
            }}
            disabled={triggeredCategories.length === 0}
          >
            {triggeredCategories.length > 0 ? "Start Deep Dive Assessment" : "No Deep Dive Needed"}
          </button>

          <button
            className="login-btn"
            onClick={() => navigate("/dashboard")}
            style={{ background: "#666" }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResult;