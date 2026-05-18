import { useEffect, useState } from 'react';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import './App.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [page, setPage] = useState('student');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/assignments`);
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleNewSubmission = (newAssignment) => {
    setAssignments([newAssignment, ...assignments]);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/api/assignments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      
      setAssignments(assignments.map(a => a._id === id ? updated : a));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="logo">🤖 AI Assignment System</h1>
          <div className="nav-right">
            <div className="nav-buttons">
              <button 
                className={`nav-btn ${page === 'student' ? 'active' : ''}`}
                onClick={() => setPage('student')}
              >
                📤 Student
              </button>
              <button 
                className={`nav-btn ${page === 'teacher' ? 'active' : ''}`}
                onClick={() => setPage('teacher')}
              >
                📋 Dashboard
              </button>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </nav>

      {error && <div className="error-banner">{error}</div>}

      <div className="main-content">
        {page === 'student' && (
          <StudentView 
            onNewSubmission={handleNewSubmission}
            API={API}
          />
        )}
        {page === 'teacher' && (
          <TeacherView 
            assignments={assignments}
            loading={loading}
            onStatusUpdate={handleStatusUpdate}
            API={API}
          />
        )}
      </div>
    </div>
  );
}

export default App;
