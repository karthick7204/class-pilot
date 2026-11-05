import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import axios from 'axios';
import { API_BASE_URL } from './config/api';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('srm_token');
  });

  const [studentData, setStudentData] = useState<any>(() => {
    const saved = localStorage.getItem('srm_data');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);

  // Sync session on mount if token exists
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('srm_token');
      if (!storedToken) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/api/srm/attendance`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.data.data) {
          setStudentData(res.data.data);
          localStorage.setItem('srm_data', JSON.stringify(res.data.data));
        }
      } catch (err) {
        // If expired or server restarted, clear session
        localStorage.removeItem('srm_token');
        localStorage.removeItem('srm_data');
        setToken(null);
        setStudentData(null);
      }
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (newToken: string, data: any) => {
    setToken(newToken);
    setStudentData(data);
    localStorage.setItem('srm_token', newToken);
    localStorage.setItem('srm_data', JSON.stringify(data));
  };

  const handleLogout = () => {
    setToken(null);
    setStudentData(null);
    localStorage.removeItem('srm_token');
    localStorage.removeItem('srm_data');
  };

  const handleRefresh = async () => {
    // To refresh real data with SRM, the student re-authenticates with fresh CAPTCHA
    handleLogout();
  };

  if (!token || !studentData) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DashboardPage
      data={studentData}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
    />
  );
};

export default App;
