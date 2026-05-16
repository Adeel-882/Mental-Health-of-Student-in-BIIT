// src/Components/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../App.css";

const API_BASE = "http://127.0.0.1:5000";

const Login = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        const trimmedId = loginId.trim();

        try {
            // Send login_id so the backend safely processes Students, Advisors, and Psychologists
            const response = await axios.post(`${API_BASE}/api/login`, {
                login_id: trimmedId, 
                password: password
            });

            if (response.data.ok) {
                // === SMART ROUTING ===
                
                // 1. Route Advisor
                if (response.data.role === "advisor") {
                    localStorage.setItem('advisorId', response.data.advisor_id);
                    localStorage.setItem('advisorName', response.data.name);
                    navigate('/advisor-dashboard');
                } 
                // 2. Route Student
                else if (response.data.role === "student") {
                    localStorage.setItem('userAridNo', response.data.arid_no);
                    localStorage.setItem('userName', response.data.name);
                    
                    // Only check profile status for students
                    await checkProfileStatus(response.data.arid_no);
                } 
                // 3. Route Psychologist
                else if (response.data.role === "psychologist") {
                    localStorage.setItem('psychologistId', response.data.psychologist_id);
                    localStorage.setItem('psychologistName', response.data.name);
                    navigate('/psychologist-dashboard');
                }
                // 3. Route Psychologist
                else if (response.data.role === "psychologist") {
                    localStorage.setItem('psychologistId', response.data.psychologist_id);
                    localStorage.setItem('psychologistName', response.data.name);
                    navigate('/psychologist-dashboard');
                }
                // 4. Route Admin 
                else if (response.data.role === "admin") {
                    localStorage.setItem('adminId', response.data.admin_id);
                    localStorage.setItem('adminName', response.data.name);
                    navigate('/admin');
                }
            }

        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const checkProfileStatus = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/api/check-profile-status/${id}`);

            if (!res.data.isComplete) {
                alert("Welcome! Please complete your profile first.");
                navigate('/profile-questions');
            } else {
                alert("Welcome back!");
                navigate('/dashboard'); 
            }

        } catch (error) {
            console.error("Error checking profile", error);
            setError("Could not verify profile status. Please try again.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Mental Health of Student in Biit</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>ARID Number or Advisor Code or Psychologist Code or Admin Code</label>
                        <input
                            type="text"
                            placeholder="e.g., 2022-Arid-1234 or ADV-xxx or PSY-xxx or ADM-XXX"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;