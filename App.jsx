import React, { useState, useEffect } from 'react';
import AmbientBackground from './components/AmbientBackground';
import CustomCursor from './components/CustomCursor';
import UploadZone from './components/UploadZone';
import ReportDetails from './components/ReportDetails';
import HistorySidebar from './components/HistorySidebar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/resume';

const LOADING_STATUSES = [
  "Extracting resume text and metadata...",
  "Analyzing formatting and structure...",
  "Running deep skill gap analysis...",
  "Connecting to Gemini 1.5 Flash AI...",
  "Searching for in-demand technologies...",
  "Curating online learning courses...",
  "Assembling your custom career report..."
];

function App() {
  const [activeView, setActiveView] = useState('UPLOAD'); // UPLOAD, LOADING, REPORT
  const [errorMessage, setErrorMessage] = useState('');
  const [reportData, setReportData] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Fetch scan history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Cycle loading messages when in LOADING state
  useEffect(() => {
    let interval;
    if (activeView === 'LOADING') {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STATUSES.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [activeView]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleFileSelect = async (file) => {
    setErrorMessage('');
    setActiveView('LOADING');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume');
      }

      const report = await response.json();
      setReportData(report);
      setActiveView('REPORT');
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error('Upload/Analysis error:', err);
      setErrorMessage(err.message || 'An error occurred during resume analysis.');
      setActiveView('UPLOAD');
    }
  };

  const handleUploadError = (error) => {
    setErrorMessage(error);
    setActiveView('UPLOAD');
  };

  const handleSelectReport = async (id) => {
    setIsSidebarOpen(false); // Close sidebar drawer
    try {
      const response = await fetch(`${API_BASE_URL}/report/${id}`);
      if (!response.ok) {
        throw new Error('Could not retrieve report details');
      }
      const data = await response.json();
      setReportData(data);
      setActiveView('REPORT');
    } catch (err) {
      console.error('Fetch report details error:', err);
      alert(err.message);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scan report?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/report/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // If active report is deleted, go back to upload screen
      if (reportData && reportData._id === id) {
        setReportData(null);
        setActiveView('UPLOAD');
      }

      // Refresh list
      fetchHistory();
    } catch (err) {
      console.error('Delete report error:', err);
      alert(err.message);
    }
  };

  const handleBackToUpload = () => {
    setReportData(null);
    setActiveView('UPLOAD');
  };

  return (
    <>
      <CustomCursor />
      <AmbientBackground />
      
      <div className="app-container">
        <header>
          <div className="logo">
            <h1 className="interactive-element" onClick={handleBackToUpload}>ResumeIntellect</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="logo-sub text-secondary" style={{ marginRight: '0.5rem' }}>
              <span>AI Scanner & Coach</span>
            </div>
            <button 
              className="history-toggle-btn interactive-element" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              History
            </button>
          </div>
        </header>

        <main>
          {activeView === 'UPLOAD' && (
            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 10 }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Analyze Your Resume</h2>
                <p className="text-secondary" style={{ fontSize: '1rem' }}>
                  Upload your resume in PDF, TXT, or MD format to identify skill gaps and get curated learning paths.
                </p>
              </div>

              <UploadZone 
                onFileSelect={handleFileSelect} 
                onError={handleUploadError} 
              />

              {errorMessage && (
                <div style={{ 
                  color: 'var(--error-color)', 
                  backgroundColor: 'rgba(255, 77, 77, 0.1)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(255, 77, 77, 0.2)',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}>
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {activeView === 'LOADING' && (
            <div className="loading-container">
              <div className="spinner-wrapper">
                <div className="spinner"></div>
                <div className="spinner-inner"></div>
              </div>
              <div>
                <div className="loading-text">Analyzing Resume</div>
                <div className="loading-subtext">{LOADING_STATUSES[loadingStep]}</div>
              </div>
            </div>
          )}

          {activeView === 'REPORT' && (
            <ReportDetails 
              report={reportData} 
              onBack={handleBackToUpload} 
            />
          )}
        </main>
      </div>

      <HistorySidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        historyList={historyList}
        onSelectReport={handleSelectReport}
        onDeleteReport={handleDeleteReport}
        activeReportId={reportData ? reportData._id : null}
      />
    </>
  );
}

export default App;
