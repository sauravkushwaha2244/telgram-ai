import { useState } from 'react';
import './TeacherView.css';

function TeacherView({ assignments, loading, onStatusUpdate, API }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(a => a.status === filter);

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    switch(sortBy) {
      case 'date':
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      case 'risk':
        return Math.max(b.aiScore, b.plagiarismScore) - Math.max(a.aiScore, a.plagiarismScore);
      case 'name':
        return a.studentName.localeCompare(b.studentName);
      default:
        return 0;
    }
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Safe': return '#4CAF50';
      case 'Needs Review': return '#FF9800';
      case 'High Risk': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'Safe': return '#E8F5E9';
      case 'Needs Review': return '#FFF3E0';
      case 'High Risk': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  const stats = {
    total: assignments.length,
    safe: assignments.filter(a => a.status === 'Safe').length,
    review: assignments.filter(a => a.status === 'Needs Review').length,
    risk: assignments.filter(a => a.status === 'High Risk').length
  };

  return (
    <div className="teacher-container">
      <h2>📋 Teacher Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Submissions</p>
          <h3>{stats.total}</h3>
        </div>
        <div className="stat-card safe">
          <p className="stat-label">Safe</p>
          <h3>{stats.safe}</h3>
        </div>
        <div className="stat-card review">
          <p className="stat-label">Needs Review</p>
          <h3>{stats.review}</h3>
        </div>
        <div className="stat-card risk">
          <p className="stat-label">High Risk</p>
          <h3>{stats.risk}</h3>
        </div>
      </div>

      <div className="controls">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Submissions</option>
            <option value="Safe">Safe</option>
            <option value="Needs Review">Needs Review</option>
            <option value="High Risk">High Risk</option>
          </select>
        </div>

        <div className="sort-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Recent First</option>
            <option value="risk">Highest Risk</option>
            <option value="name">Student Name</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading assignments...</div>
      ) : sortedAssignments.length === 0 ? (
        <div className="empty-state">
          <p>No submissions yet</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Subject</th>
                <th>File</th>
                <th>AI Score</th>
                <th>Plagiarism</th>
                <th>Grammar</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedAssignments.map((assignment) => (
                <tr key={assignment._id} className="submission-row">
                  <td className="student-name">{assignment.studentName}</td>
                  <td>{assignment.rollNo}</td>
                  <td>{assignment.subject}</td>
                  <td className="file-name">{assignment.fileName}</td>
                  <td>
                    <div className="score-cell">
                      <span className="score-num">{assignment.aiScore}%</span>
                      <div className="score-mini">
                        <div 
                          style={{width: `${assignment.aiScore}%`, backgroundColor: '#2196F3'}}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="score-cell">
                      <span className="score-num">{assignment.plagiarismScore}%</span>
                      <div className="score-mini">
                        <div 
                          style={{width: `${assignment.plagiarismScore}%`, backgroundColor: '#FF9800'}}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="score-cell">
                      <span className="score-num">{assignment.grammarScore}%</span>
                      <div className="score-mini">
                        <div 
                          style={{width: `${assignment.grammarScore}%`, backgroundColor: '#4CAF50'}}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusBg(assignment.status),
                        color: getStatusColor(assignment.status)
                      }}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td>
                    <select 
                      className="status-select"
                      value={assignment.status}
                      onChange={(e) => onStatusUpdate(assignment._id, e.target.value)}
                    >
                      <option value="Safe">Safe</option>
                      <option value="Needs Review">Needs Review</option>
                      <option value="High Risk">High Risk</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sortedAssignments.length > 0 && (
        <div className="table-footer">
          Showing {sortedAssignments.length} of {assignments.length} submissions
        </div>
      )}
    </div>
  );
}

export default TeacherView;
