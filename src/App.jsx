import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import AdminPanel from './components/Admin/AdminPanel'; // We will create this next
import UpdatePassword from './components/Auth/UpdatePassword';
import { AuthProvider } from './components/Auth/AuthProvider';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<AppLayout />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
