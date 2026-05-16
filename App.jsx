import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; // <--- THIS IMPORT IS CRITICAL
import Login from './Components/Login';
import ProfileQuestions from './Components/ProfileQuestions';
import GeneralQuestions from './Components/GeneralQuestions'; // Import New Component
import TestResult from './Components/TestResult'; // Import the new file
import DeepDive from "./Components/DeepDive";
import DeepDiveResult from "./Components/DeepDiveResult";
import StudentDashboard from "./Components/StudentDashboard";
import Remedies from "./Components/Remedies";
import RemedyHistory from "./Components/RemedyHistory";
import DailyCheckIn from "./Components/DailyCheckIn";
import WeeklyCheckIn from "./Components/WeeklyCheckIn";
import AdvisorDashboard from "./Components/AdvisorDashboard";
import MyReports from "./Components/MyReports";
import AdvisorStudentReport from "./Components/AdvisorStudentReport";
import PsychologistDashboard from "./Components/PsychologistDashboard";
import AdminDashboard from "./Components/AdminDashboard";



// const ProfileQuestions = () => <h2>Profile Questions Page</h2>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/profile-questions" element={<ProfileQuestions />} />
        <Route path="/general-questions" element={<GeneralQuestions />} />
        <Route path="/test-result" element={<TestResult />} />
        <Route path="/deep-dive" element={<DeepDive />} />
        <Route path="/deep-dive-result" element={<DeepDiveResult />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/remedies" element={<Remedies />} />
        <Route path="/remedy-history" element={<RemedyHistory />} />
        <Route path="/daily-checkin" element={<DailyCheckIn />} />
        <Route path="/weekly-checkin" element={<WeeklyCheckIn />} />
        <Route path="/advisor-dashboard" element={<AdvisorDashboard />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/advisor/student-report/:aridNo" element={<AdvisorStudentReport />} />
        <Route path="/psychologist-dashboard" element={<PsychologistDashboard />} />
        <Route path="/psychologist/student-report/:aridNo" element={<AdvisorStudentReport />} />
        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>
    </Router>
  );
}

export default App;