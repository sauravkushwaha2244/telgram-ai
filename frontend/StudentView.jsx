import { useState } from 'react';
import './StudentView.css';

function StudentView({ onNewSubmission, API }) {
  const [formData, setFormData] = useState({
    studentName: '',
    rollNo: '',
    subject: ''
  });

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!file) {
        throw new Error('Please select a file');
      }

      const fd = new FormData();
      fd.append('studentName', formData.studentName);
      fd.append('rollNo', formData.rollNo);
      fd.append('subject', formData.subject);
      fd.append('assignment', file);

      const res = await fetch(`${API}/api/assignments/upload`, {
        method: 'POST',
        body: fd
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned invalid response');
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Upload failed');
      }

      setResult(data.assignment);
      onNewSubmission(data.assignment);

      setFormData({
        studentName: '',
        rollNo: '',
        subject: ''
      });

      setFile(null);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Safe':
        return '#4CAF50';
      case 'Needs Review':
        return '#FF9800';
      case 'High Risk':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <div className="student-container">
      <div className="upload-section">
        <h2>Submit Your Assignment</h2>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Student Name *</label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Roll Number *</label>
            <input
              type="text"
              name="rollNo"
              value={formData.rollNo}
              onChange={handleInputChange}
              placeholder="Enter your roll number"
              required
            />
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="e.g., Mathematics, English"
              required
            />
          </div>

          <div className="form-group">
            <label>Upload Assignment *</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt,.pdf,.doc,.docx,.xls,.xlsx"
              required
            />
            {file && <p className="file-name">✓ {file.name}</p>}
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Submit Assignment'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {result && (
        <div className="result-section">
          <h2>Analysis Results</h2>

          <div className="student-info">
            <p><strong>Student:</strong> {result.studentName}</p>
            <p><strong>Roll No:</strong> {result.rollNo}</p>
            <p><strong>Subject:</strong> {result.subject}</p>
            <p><strong>File:</strong> {result.fileName}</p>
          </div>

          <div className="scores-grid">
            <div className="score-card">
              <h3>AI Quality Score</h3>
              <div className="score-value">{result.aiScore}%</div>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${result.aiScore}%` }}
                ></div>
              </div>
              <p className="score-label">Content originality & quality</p>
            </div>

            <div className="score-card">
              <h3>Plagiarism Risk</h3>
              <div className="score-value">{result.plagiarismScore}%</div>
              <div className="score-bar">
                <div
                  className="score-fill plagiarism"
                  style={{ width: `${result.plagiarismScore}%` }}
                ></div>
              </div>
              <p className="score-label">Risk of copied/AI content</p>
            </div>

            <div className="score-card">
              <h3>Grammar Score</h3>
              <div className="score-value">{result.grammarScore}%</div>
              <div className="score-bar">
                <div
                  className="score-fill grammar"
                  style={{ width: `${result.grammarScore}%` }}
                ></div>
              </div>
              <p className="score-label">Language quality</p>
            </div>
          </div>

          <div
            className="status-box"
            style={{ borderLeftColor: getStatusColor(result.status) }}
          >
            <p className="status-label">Overall Status</p>
            <h3 style={{ color: getStatusColor(result.status) }}>
              {result.status}
            </h3>
            {result.reasoning && (
              <p className="reasoning">{result.reasoning}</p>
            )}
          </div>

          <button
            className="new-submission-btn"
            onClick={() => setResult(null)}
          >
            Submit Another Assignment
          </button>
        </div>
      )}
    </div>
  );
}

export default StudentView;