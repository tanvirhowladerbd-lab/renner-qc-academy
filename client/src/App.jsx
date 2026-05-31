import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('qc_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('qc_admin_token') === 'MovimodaQC2026';
  });

  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(window.location.pathname === '/admin');
  
  // Login input states
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Registration states
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Voice Recognition States
  const [activeMic, setActiveMic] = useState(null); // 'rough' or 'chat'
  const [processingMic, setProcessingMic] = useState(null); // 'rough' or 'chat'
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem('voice_lang') || 'en-US');
  const [micError, setMicError] = useState('');
  const [recognition, setRecognition] = useState(null);

  // Primary App States
  const [activeTab, setActiveTab] = useState('tip');
  const [allTips, setAllTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [tipLanguage, setTipLanguage] = useState('EN'); // EN or BN

  // Quiz States
  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState({ total: 0, correct: 0 });

  // Assistant Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'assistant', text: 'Hello! I am the Renner QC AI Assistant. Please ask any questions regarding defect classifications, standard rules, or AQL parameters.' }
  ]);

  // Report Finding Organizer States
  const [roughFinding, setRoughFinding] = useState('');
  const [organizedFinding, setOrganizedFinding] = useState('');

  // Shared UI States
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      setPhotoBase64(base64);
      setPhotoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Show Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
  };

  const [apiFallback, setApiFallback] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [copyText, setCopyText] = useState('📋 Copy to Clipboard');

  // Fetch API active status for users
  useEffect(() => {
    fetch(`${API_BASE}/health-status`)
      .then(r => r.json())
      .then(d => setApiFallback(d.active_api === 'gemini'))
      .catch(() => {});
  }, []);

  // Fetch detailed API status for admin
  useEffect(() => {
    if (isAdmin) {
      fetch(`${API_BASE}/admin/api-status`, {
        headers: {
          'x-admin-password': 'MovimodaQC2026'
        }
      })
      .then(r => r.json())
      .then(data => setApiStatus(data))
      .catch(() => {});
    }
  }, [isAdmin]);

  // Route routing simulation on mount
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setShowAdminLogin(true);
    }
  }, []);

  // Refs to avoid stale closure issues in SpeechRecognition callbacks
  const roughFindingRef = React.useRef(roughFinding);
  const chatInputRef = React.useRef(chatInput);
  const baseTextRef = React.useRef('');
  const activeMicRef = React.useRef(null);
  const voiceLangRef = React.useRef(voiceLang);
  const pendingStartRef = React.useRef(null);
  const startVoiceSessionRef = React.useRef(null);

  useEffect(() => {
    roughFindingRef.current = roughFinding;
  }, [roughFinding]);

  useEffect(() => {
    chatInputRef.current = chatInput;
  }, [chatInput]);

  useEffect(() => {
    activeMicRef.current = activeMic;
  }, [activeMic]);

  useEffect(() => {
    voiceLangRef.current = voiceLang;
    if (recognition) {
      recognition.lang = voiceLang;
    }
    localStorage.setItem('voice_lang', voiceLang);
  }, [voiceLang, recognition]);

  // Initializer logic for starting a voice session
  startVoiceSessionRef.current = (target) => {
    let initialText = '';
    if (target === 'rough') {
      initialText = roughFindingRef.current;
    } else if (target === 'chat') {
      initialText = chatInputRef.current;
    }
    baseTextRef.current = initialText;
    
    recognition.lang = voiceLangRef.current;
    setActiveMic(target);
    try {
      recognition.start();
    } catch (err) {
      console.error("Start error:", err);
    }
  };

  // Initialize Speech Recognition once on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = voiceLangRef.current;
      
      let silenceTimer = null;
      
      const resetSilenceTimer = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (activeMicRef.current) {
            console.log("Auto-stopping due to 5s silence");
            rec.stop();
          }
        }, 5000);
      };

      rec.onstart = () => {
        setMicError('');
        resetSilenceTimer();
      };

      rec.onresult = (event) => {
        resetSilenceTimer();
        let sessionTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript;
        }
        
        const target = activeMicRef.current;
        const base = baseTextRef.current;
        const space = base ? ' ' : '';
        const newVal = base + space + sessionTranscript;
        
        if (target === 'rough') {
          setRoughFinding(newVal);
        } else if (target === 'chat') {
          setChatInput(newVal);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone access denied. Please allow microphone in your browser settings to use voice typing.');
        } else {
          setMicError(`Speech error: ${event.error}`);
        }
        setActiveMic(null);
        if (silenceTimer) clearTimeout(silenceTimer);
      };

      rec.onend = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        
        setActiveMic(prevActive => {
          if (prevActive) {
            setProcessingMic(prevActive);
            setTimeout(() => {
              setProcessingMic(null);
            }, 1000);
          }
          return null;
        });

        if (pendingStartRef.current) {
          const nextTarget = pendingStartRef.current;
          pendingStartRef.current = null;
          if (startVoiceSessionRef.current) {
            startVoiceSessionRef.current(nextTarget);
          }
        }
      };

      setRecognition(rec);
    }
  }, []);

  const toggleVoice = (target) => {
    if (!recognition) return;
    
    if (activeMic === target) {
      recognition.stop();
    } else {
      if (activeMic) {
        pendingStartRef.current = target;
        recognition.stop();
      } else {
        if (startVoiceSessionRef.current) {
          startVoiceSessionRef.current(target);
        }
      }
    }
  };

  // Fetch all tips on startup
  useEffect(() => {
    if (user && !isAdmin) {
      setLoading(true);
      setLoadingText('Loading daily QC tips database...');
      fetch(`${API_BASE}/tips`)
        .then(res => res.json())
        .then(data => {
          setAllTips(data);
          setFilteredTips(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching tips:", err);
          setLoading(false);
        });
    }
  }, [user, isAdmin]);

  // Fetch initial quiz
  useEffect(() => {
    if (user && !isAdmin) {
      loadNextQuiz();
    }
  }, [user, isAdmin]);

  // Sync category filter
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredTips(allTips);
    } else {
      setFilteredTips(allTips.filter(t => t.category?.toLowerCase() === selectedCategory.toLowerCase()));
    }
    setCurrentTipIndex(0);
  }, [selectedCategory, allTips]);

  // Fetch admin stats
  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

  const fetchAdminStats = () => {
    setLoading(true);
    setLoadingText('Fetching admin stats...');
    fetch(`${API_BASE}/admin/stats`, {
      headers: { 'x-admin-password': 'MovimodaQC2026' }
    })
      .then(res => res.json())
      .then(data => {
        setAdminStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching stats:", err);
        setLoading(false);
      });
  };

  // Handle inspector login
  const handleLogin = (e) => {
    e.preventDefault();
    if (!employeeIdInput.trim()) return;

    setLoading(true);
    setLoadingText('Verifying employee ID...');
    setLoginError('');

    fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employeeIdInput })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Employee ID not registered');
        }
        return data;
      })
      .then(data => {
        localStorage.setItem('qc_user', JSON.stringify(data.user));
        setUser(data.user);
        setLoading(false);
        showToast('Login successful!');
      })
      .catch(err => {
        setLoginError(err.message);
        setLoading(false);
      });
  };

  // Handle inspector registration
  const handleRegister = (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmployeeId.trim() || !regMobile.trim()) return;
    
    // Check if ID is exactly 5 digits
    if (!/^\d{5}$/.test(regEmployeeId)) {
      setRegError('Employee ID must be exactly 5 digits.');
      return;
    }

    setLoading(true);
    setLoadingText('Submitting registration...');
    setRegError('');
    setRegSuccessMsg('');

    fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: regEmployeeId,
        name: regName,
        mobile_number: regMobile
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        return data;
      })
      .then(data => {
        setRegSuccessMsg(data.message);
        setRegName('');
        setRegEmployeeId('');
        setRegMobile('');
        setLoading(false);
      })
      .catch(err => {
        setRegError(err.message);
        setLoading(false);
      });
  };

  // Handle admin login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'MovimodaQC2026') {
      localStorage.setItem('qc_admin_token', 'MovimodaQC2026');
      setIsAdmin(true);
      setShowAdminLogin(false);
      showToast('Admin logged in ✓');
    } else {
      alert('Invalid admin password!');
    }
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem('qc_user');
    localStorage.removeItem('qc_admin_token');
    setUser(null);
    setIsAdmin(false);
    setShowAdminLogin(false);
    setIsRegistering(false);
    window.history.pushState({}, '', '/');
  };

  // Load random quiz
  const loadNextQuiz = () => {
    setLoading(true);
    setLoadingText('Searching Renner manuals...');
    setSelectedOption(null);
    setQuizSubmitted(false);
    fetch(`${API_BASE}/quiz/random`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching quiz:", err);
        setLoading(false);
      });
  };

  // Submit Answer & log in DB
  const submitAnswer = () => {
    if (!selectedOption || quizSubmitted) return;
    setQuizSubmitted(true);
    
    const isCorrect = selectedOption.toUpperCase() === quiz.answer?.toUpperCase();
    const newScore = {
      total: score.total + 1,
      correct: score.correct + (isCorrect ? 1 : 0)
    };
    setScore(newScore);

    // Save quiz result to Supabase
    fetch(`${API_BASE}/quiz-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: user.employee_id,
        employee_name: user.name,
        question_id: quiz.sl,
        is_correct: isCorrect,
        topic: quiz.topic,
        difficulty: quiz.difficulty
      })
    })
      .then(res => res.json())
      .then(() => {
        showToast('Score saved ✓');
      })
      .catch(err => console.error("Error saving quiz result:", err));
  };

  // Organize findings
  const handleOrganizeFinding = () => {
    if (!roughFinding.trim()) return;
    setLoading(true);
    setLoadingText('Organizing findings via AI...');
    setOrganizedFinding('');

    fetch(`${API_BASE}/organize-finding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: roughFinding, image: photoBase64 || null })
    })
      .then(res => res.json())
      .then(data => {
        setOrganizedFinding(data.text);
        setLoading(false);
        setPhotoBase64(null);
        setPhotoPreview(null);
      })
      .catch(err => {
        console.error("Error organizing finding:", err);
        setLoading(false);
      });
  };

  // Ask Renner QA assistant
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    const currentPhoto = photoBase64;
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setPhotoBase64(null);
    setPhotoPreview(null);
    setLoading(true);
    setLoadingText('Querying Renner manuals...');

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, image: currentPhoto || null })
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { sender: 'assistant', text: data.text || data.error }]);
    } catch (err) {
      setChatLog(prev => [...prev, { sender: 'assistant', text: `Failed to reach server: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Click user to view logs
  const handleViewUserLogs = (employeeId, name) => {
    setLoading(true);
    setLoadingText(`Loading logs for ${name}...`);
    setSelectedUserName(name);
    fetch(`${API_BASE}/admin/users/${employeeId}/logs`, {
      headers: { 'x-admin-password': 'MovimodaQC2026' }
    })
      .then(res => res.json())
      .then(data => {
        setSelectedUserLogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Admin add user
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserId.trim() || !newUserName.trim()) return;
    
    setLoading(true);
    setLoadingText('Adding new user...');
    fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-password': 'MovimodaQC2026'
      },
      body: JSON.stringify({ employee_id: newUserId, name: newUserName })
    })
      .then(res => res.json())
      .then(() => {
        setNewUserId('');
        setNewUserName('');
        fetchAdminStats();
        showToast('User added ✓');
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Admin approve user
  const handleApproveUser = (id) => {
    setLoading(true);
    setLoadingText('Approving inspector...');
    fetch(`${API_BASE}/admin/users/${id}/approve`, {
      method: 'POST',
      headers: { 'x-admin-password': 'MovimodaQC2026' }
    })
      .then(res => res.json())
      .then(() => {
        fetchAdminStats();
        showToast('Inspector approved ✓');
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Admin delete user
  const handleDeleteUser = (id) => {
    if (!confirm('Are you sure you want to remove this user and all their quiz history?')) return;
    setLoading(true);
    setLoadingText('Removing user...');
    fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': 'MovimodaQC2026' }
    })
      .then(res => res.json())
      .then(() => {
        fetchAdminStats();
        showToast('User deleted ✓');
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Export excel
  const handleExportExcel = () => {
    window.open(`${API_BASE}/admin/export?password=MovimodaQC2026`, '_blank');
  };

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied ✓');
  };

  // Nav loops for tips
  const nextTip = () => {
    setCurrentTipIndex(prev => (prev + 1) % filteredTips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex(prev => (prev - 1 + filteredTips.length) % filteredTips.length);
  };

  const handleOptionSelect = (option) => {
    if (quizSubmitted) return;
    setSelectedOption(option);
  };

  // -------------------------------------------------------------
  // RENDER INTERFACE
  // -------------------------------------------------------------

  const renderLoading = () => {
    if (!loading) return null;
    return (
      <div className="loader-overlay">
        <div className="spinner"></div>
        <div className="loading-text">{loadingText || 'Loading...'}</div>
      </div>
    );
  };

  const renderToast = () => {
    if (!toastMessage) return null;
    return <div className="toast">{toastMessage}</div>;
  };

  // Login Form
  if (!user && !isAdmin && !showAdminLogin && !isRegistering) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '90vh', justifyContent: 'center' }}>
        {renderLoading()}
        {renderToast()}
        <div className="header">
          <h1>RENNER QC ACADEMY</h1>
          <p>Movimoda Asia-Pacific Bangladesh</p>
        </div>

        <div className="glass-card login-card">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Inspector Login</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#95a5a6' }}>Employee ID</label>
              <input 
                type="number" 
                placeholder="Enter your employee ID (e.g. 10197)" 
                value={employeeIdInput}
                onChange={e => setEmployeeIdInput(e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '16px' }}
                required
              />
            </div>
            {loginError && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>❌ {loginError}</p>}
            <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}>
              Sign In
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 0.5rem' }}>
          <button onClick={() => setIsRegistering(true)} className="text-btn">
            Create Account (Register)
          </button>
          <button 
            onClick={() => {
              setShowAdminLogin(true);
              window.history.pushState({}, '', '/admin');
            }} 
            className="text-btn"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Registration Form
  if (isRegistering && !user) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '90vh', justifyContent: 'center' }}>
        {renderLoading()}
        {renderToast()}
        <div className="header">
          <h1>RENNER QC ACADEMY</h1>
          <p>Movimoda Asia-Pacific Bangladesh</p>
        </div>

        <div className="glass-card login-card">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--accent-amber)' }}>Inspector Registration</h2>
          {regSuccessMsg ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: 'var(--accent-green)', fontWeight: 'bold', marginBottom: '1.5rem' }}>✓ {regSuccessMsg}</p>
              <button onClick={() => setIsRegistering(false)} className="primary-btn" style={{ padding: '0.6rem 1.5rem' }}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#95a5a6' }}>Full Name (Text)</label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '16px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#95a5a6' }}>Employee ID (5 digit number)</label>
                <input 
                  type="number" 
                  placeholder="Enter 5-digit ID (e.g. 10205)" 
                  value={regEmployeeId}
                  onChange={e => setRegEmployeeId(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '16px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#95a5a6' }}>Mobile Number</label>
                <input 
                  type="number" 
                  placeholder="Enter your mobile number" 
                  value={regMobile}
                  onChange={e => setRegMobile(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', fontSize: '16px' }}
                  required
                />
              </div>
              
              {regError && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>❌ {regError}</p>}
              
              <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}>
                Register Account
              </button>
            </form>
          )}
        </div>

        {!regSuccessMsg && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button onClick={() => setIsRegistering(false)} className="text-btn">
              Already have an account? Sign In
            </button>
          </div>
        )}
      </div>
    );
  }

  // Admin Login View
  if (showAdminLogin && !isAdmin) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '90vh', justifyContent: 'center' }}>
        {renderLoading()}
        {renderToast()}
        <div className="header">
          <h1>RENNER QC ACADEMY</h1>
          <p>Movimoda Asia-Pacific Bangladesh</p>
        </div>

        <div className="glass-card login-card">
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--accent-amber)' }}>Admin Panel Entry</h2>
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', color: '#95a5a6' }}>Password</label>
              <input 
                type="password" 
                placeholder="Enter admin password" 
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="search-input"
                style={{ width: '100%', fontSize: '16px' }}
                required
              />
            </div>
            <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem', background: 'var(--accent-amber)', color: '#000' }}>
              Access Dashboard
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            onClick={() => {
              setShowAdminLogin(false);
              window.history.pushState({}, '', '/');
            }} 
            className="text-btn"
          >
            Back to Inspector Login
          </button>
        </div>
      </div>
    );
  }

  // Admin Dashboard View (Tokyo pooler schema integration)
  if (isAdmin) {
    return (
      <div className="app-container admin-container" style={{ maxWidth: '950px' }}>
        {renderLoading()}
        {renderToast()}
        
        {apiStatus && (
          <div style={{
            padding: 16, borderRadius: 8,
            marginBottom: 20,
            background:
              apiStatus.status==='healthy'
                ? '#1a3a1a'
              : apiStatus.status==='fallback'
                ? '#3a2a00'
                : '#3a0000',
            border: `1px solid ${
              apiStatus.status==='healthy'
                ? '#2d6a2d'
              : apiStatus.status==='fallback'
                ? '#b8860b'
                : '#8b0000'}`
          }}>
            {apiStatus.status === 'healthy' && (
              <p style={{color:'#90ee90',margin:0}}>
                ✅ AI Engine: Anthropic Claude Active — Status: Healthy
              </p>
            )}
            {apiStatus.status === 'fallback' && (
              <>
                <p style={{color:'#ffa500', fontWeight:'bold',margin:'0 0 8px'}}>
                  ⚠️ AI Engine: FALLBACK — Google Gemini
                </p>
                <p style={{color:'#ffcc80',margin:'0 0 4px'}}>
                  Anthropic quota exceeded or failed.
                </p>
                <p style={{color:'#ffcc80',margin:'0 0 4px'}}>
                  Failed at: {new Date(apiStatus.anthropic_failed_at).toLocaleString()}
                </p>
                <p style={{color:'#ffcc80',margin:'0 0 4px'}}>
                  Error: {apiStatus.error_message}
                </p>
                <p style={{color:'#fff3cd',margin:0}}>
                  Action: Top up Anthropic credits at console.anthropic.com — App running normally on Gemini backup.
                </p>
              </>
            )}
            {apiStatus.status === 'error' && (
              <p style={{color:'#ff6b6b', fontWeight:'bold',margin:0}}>
                🔴 BOTH AI SERVICES UNAVAILABLE — Check Anthropic and Gemini API keys in Render environment variables.
              </p>
            )}
          </div>
        )}
        
        {/* Sticky top bar */}
        <div className="sticky-bar">
          <div className="bar-info">
            <span className="user-icon">🛡️</span>
            <strong>Admin Dashboard</strong>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout admin">
            🚪 Logout
          </button>
        </div>

        <div className="header" style={{ marginTop: '5rem' }}>
          <h1>RENNER QC ACADEMY</h1>
          <p style={{ color: 'var(--accent-amber)' }}>Admin Administration Hub</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button onClick={handleExportExcel} className="primary-btn" style={{ background: 'var(--accent-green)', color: '#000', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
            📥 Export All Quiz Results (.xlsx)
          </button>
        </div>

        {/* Add user card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Register New Inspector</h3>
          <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#bdc3c7', marginBottom: '0.2rem' }}>Employee ID (5-digit)</label>
              <input 
                type="text" 
                value={newUserId} 
                onChange={e => setNewUserId(e.target.value)} 
                placeholder="ID (e.g. 10205)"
                className="search-input"
                style={{ width: '100%' }}
                required
              />
            </div>
            <div style={{ flex: '1 1 250px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#bdc3c7', marginBottom: '0.2rem' }}>Full Name</label>
              <input 
                type="text" 
                value={newUserName} 
                onChange={e => setNewUserName(e.target.value)} 
                placeholder="Inspector Name"
                className="search-input"
                style={{ width: '100%' }}
                required
              />
            </div>
            <button type="submit" className="primary-btn" style={{ height: '42px', padding: '0 1.5rem', flex: '0 0 auto' }}>
              ➕ Add User
            </button>
          </form>
        </div>

        {/* User Stats Card */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Inspector Performance & Approvals</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Mobile Number</th>
                  <th>Approved</th>
                  <th>Total Quiz</th>
                  <th>Correct %</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminStats.map(stat => (
                  <tr key={stat.id}>
                    <td 
                      onClick={() => handleViewUserLogs(stat.employee_id, stat.name)} 
                      style={{ cursor: 'pointer', color: 'var(--accent-blue)', textDecoration: 'underline' }}
                    >
                      {stat.name}
                    </td>
                    <td>{stat.employee_id}</td>
                    <td>{stat.mobile_number}</td>
                    <td style={{ fontWeight: 'bold', color: stat.is_approved ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                      {stat.is_approved ? '✓ Approved' : '⌛ Pending'}
                    </td>
                    <td>{stat.total_questions}</td>
                    <td style={{ fontWeight: 'bold', color: stat.correct_percentage >= 80 ? 'var(--accent-green)' : stat.correct_percentage >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                      {stat.correct_percentage}%
                    </td>
                    <td>{stat.last_active ? new Date(stat.last_active).toLocaleString() : 'Never'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {!stat.is_approved && (
                          <button 
                            onClick={() => handleApproveUser(stat.id)} 
                            className="primary-btn"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: 'auto', background: 'var(--accent-green)', color: '#000', boxShadow: 'none' }}
                          >
                            ✓ Approve
                          </button>
                        )}
                        <button onClick={() => handleDeleteUser(stat.id)} className="delete-btn">
                          ❌ Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail log card */}
        {selectedUserLogs && (
          <div className="glass-card" style={{ border: '2px solid var(--accent-amber)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Activity Details: {selectedUserName}</h3>
              <button onClick={() => setSelectedUserLogs(null)} className="delete-btn" style={{ padding: '0.2rem 0.5rem', background: '#34495e', color: '#fff' }}>
                Close Logs
              </button>
            </div>
            {selectedUserLogs.length === 0 ? (
              <p style={{ color: '#95a5a6' }}>No quiz answers registered for this inspector.</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Q_SL</th>
                      <th>Topic</th>
                      <th>Difficulty</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserLogs.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.answered_at).toLocaleString()}</td>
                        <td>#{log.question_id}</td>
                        <td>{log.topic}</td>
                        <td>{log.difficulty}</td>
                        <td style={{ color: log.is_correct ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold' }}>
                          {log.is_correct ? '✓ Correct' : '✗ Incorrect'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const renderMediaControls = (target, type) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isMicSupported = !!SpeechRecognition;

    const isCurrentListening = activeMic === target;
    const isCurrentProcessing = processingMic === target;

    let micButtonText = '🎤';
    let micTitle = 'Tap to speak';
    let micBtnClass = '';
    let micBtnStyle = {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '1px solid var(--border-color)',
      background: 'rgba(255, 255, 255, 0.05)',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem',
      transition: 'all 0.2s ease',
      padding: 0
    };

    if (isCurrentListening) {
      micButtonText = '🔴';
      micTitle = 'Tap to stop';
      micBtnClass = 'mic-btn-recording';
    } else if (isCurrentProcessing) {
      micButtonText = '⏳';
      micTitle = 'Processing...';
      micBtnStyle.background = 'rgba(255, 255, 255, 0.2)';
    }

    let containerStyle = {
      position: 'absolute',
      right: '10px',
      bottom: '10px',
      zIndex: 10,
      display: 'flex',
      gap: '6px',
      alignItems: 'center'
    };

    if (type === 'input') {
      containerStyle = {
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: '6px',
        alignItems: 'center'
      };
    }

    const handleMicInteraction = (e) => {
      e.preventDefault();
      toggleVoice(target);
    };

    const isMicActiveAnywhere = activeMic !== null;

    return (
      <div style={containerStyle}>
        {isMicSupported && (
          <button
            type="button"
            title={micTitle}
            className={micBtnClass}
            style={micBtnStyle}
            onClick={handleMicInteraction}
            onTouchStart={handleMicInteraction}
          >
            {micButtonText}
          </button>
        )}
        <button
          type="button"
          onClick={() => document.getElementById('cameraInput').click()}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            cursor: isMicActiveAnywhere ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isMicActiveAnywhere ? 0.4 : 1,
            transition: 'all 0.2s ease',
            padding: 0
          }}
          disabled={isMicActiveAnywhere}
          title="Take photo or upload image"
        >
          📷
        </button>
      </div>
    );
  };

  const renderVoiceControls = (target) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const isCurrentListening = activeMic === target;
    const isCurrentProcessing = processingMic === target;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.4rem', marginBottom: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setVoiceLang('en-US')}
              style={{
                height: '28px',
                fontSize: '10px',
                padding: '0 0.8rem',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                background: voiceLang === 'en-US' ? 'var(--accent-amber)' : 'rgba(0, 0, 0, 0.4)',
                color: voiceLang === 'en-US' ? '#0b1329' : '#bdc3c7',
                transition: 'all 0.2s'
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setVoiceLang('bn-BD')}
              style={{
                height: '28px',
                fontSize: '10px',
                padding: '0 0.8rem',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                background: voiceLang === 'bn-BD' ? 'var(--accent-amber)' : 'rgba(0, 0, 0, 0.4)',
                color: voiceLang === 'bn-BD' ? '#0b1329' : '#bdc3c7',
                transition: 'all 0.2s'
              }}
            >
              বাংলা
            </button>
          </div>

          {isCurrentListening && (
            <div className="listening-text" style={{ margin: 0, fontWeight: 'bold' }}>
              🔴 Listening... speak now
            </div>
          )}
          {isCurrentProcessing && (
            <div style={{ color: '#bdc3c7', fontSize: '12px' }}>
              ⏳ Processing...
            </div>
          )}
        </div>

        {micError && activeMic === target && (
          <div style={{ color: '#FFA500', fontSize: '12px', marginTop: '6px', textAlign: 'left', fontWeight: '500' }}>
            ⚠️ {micError}
          </div>
        )}
      </div>
    );
  };

  const handleNewFinding = () => {
    setRoughFinding('');
    setOrganizedFinding('');
  };

  const handleNewQuestion = () => {
    setChatInput('');
    setChatLog([]);
  };

  const parseOrganizedFinding = (text) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return lines.map((line, idx) => {
      if (line.toUpperCase().includes('INSPECTION FINDING SUMMARY')) {
        return (
          <div key={idx} style={{ fontWeight: 'bold', color: 'var(--accent-amber)', fontSize: '15px', marginBottom: '0.8rem', marginTop: '0.4rem' }}>
            {line}
          </div>
        );
      }
      if (line.toUpperCase().startsWith('ACTION REQUIRED:')) {
        const cleanLine = line.replace(/^ACTION REQUIRED:?\s*⚠️?/i, '').trim();
        return (
          <div key={idx} style={{ color: '#FFA500', fontSize: '14px', lineHeight: '1.6', marginBottom: '0.8rem', fontWeight: '500' }}>
            ⚠️ <strong>ACTION REQUIRED:</strong> {cleanLine}
          </div>
        );
      }
      if (line.toUpperCase().startsWith('AQL IMPACT:')) {
        const cleanLine = line.replace(/^AQL IMPACT:?\s*/i, '').trim();
        return (
          <div key={idx} style={{ color: 'var(--accent-red)', fontSize: '14px', lineHeight: '1.6', marginBottom: '0.8rem', fontWeight: 'bold' }}>
            <strong>AQL IMPACT:</strong> {cleanLine}
          </div>
        );
      }
      const findingMatch = line.match(/^(Finding\s+\d+:)(.*)/i);
      if (findingMatch) {
        return (
          <p key={idx} style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '0.8rem', fontFamily: 'Arial, sans-serif' }}>
            <strong>{findingMatch[1]}</strong>{findingMatch[2]}
          </p>
        );
      }
      return (
        <p key={idx} style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '0.8rem', fontFamily: 'Arial, sans-serif' }}>
          {line}
        </p>
      );
    });
  };

  // Active user variables
  const currentTip = filteredTips[currentTipIndex];

  return (
    <div className="app-container" style={{ marginTop: '4.5rem' }}>
      {renderLoading()}
      {renderToast()}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        id="cameraInput"
        style={{ display: 'none' }}
        onChange={handlePhotoCapture}
      />

      {/* Sticky top bar */}
      <div className="sticky-bar">
        <div className="bar-info">
          <span className="user-icon">👤</span>
          <div>
            <strong>
              {user.name}
              {apiFallback && (
                <span
                  title="AI running on backup service"
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#FFA500',
                    marginLeft: '8px',
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
            </strong>
            <div style={{ fontSize: '0.75rem', color: '#bdc3c7' }}>ID: {user.employee_id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div className="score-badge" style={{ margin: 0 }}>
            Score: {score.correct}/{score.total}
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout inspector">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="tabs">
        <button 
          onClick={() => setActiveTab('tip')} 
          className={`tab-btn ${activeTab === 'tip' ? 'active' : ''}`}
        >
          Daily Tips
        </button>
        <button 
          onClick={() => setActiveTab('quiz')} 
          className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
        >
          Daily Quiz
        </button>
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
        >
          QC Assistant
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DAILY TIPS PANEL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'tip' && (
        <div>
          <div className="category-filter-card glass-card" style={{ padding: '0.8rem 1.2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#bdc3c7', fontWeight: '500' }}>Filter Category:</span>
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="category-dropdown"
            >
              <option value="All">All Categories</option>
              <option value="Garments">Garments</option>
              <option value="Children Safety">Children Safety</option>
              <option value="Footwear">Footwear</option>
              <option value="Bags & Belts">Bags & Belts</option>
              <option value="Jewelry & Hair">Jewelry & Hair</option>
              <option value="Eyeglasses">Eyeglasses</option>
            </select>
          </div>

          {filteredTips.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <h3 style={{ color: '#95a5a6' }}>No tips found matching category.</h3>
            </div>
          ) : (
            currentTip && (
              <div className="glass-card animation-fade">
                <div className="tip-header">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <h2>💡 Daily QC Tip</h2>
                    <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>Tip number {currentTip.tip_number}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setTipLanguage('EN')} 
                      className={`lang-toggle ${tipLanguage === 'EN' ? 'active' : ''}`}
                    >
                      EN
                    </button>
                    <button 
                      onClick={() => setTipLanguage('BN')} 
                      className={`lang-toggle ${tipLanguage === 'BN' ? 'active' : ''}`}
                    >
                      বাংলা
                    </button>
                  </div>
                </div>

                <div className="tip-title">{currentTip.tip_title}</div>
                
                <div className="tip-body" style={{ minHeight: '110px' }}>
                  {tipLanguage === 'EN' ? currentTip.tip_english : (currentTip.tip_bangla || currentTip.tip_banglish)}
                </div>
                
                <div className="tip-meta-tags">
                  <span className="step-badge" style={{ background: 'rgba(58,134,200,0.15)', color: 'var(--accent-blue)', borderColor: 'rgba(58,134,200,0.2)' }}>
                    Pillar: {currentTip.inspection_step}
                  </span>
                  <span className="step-badge" style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--accent-green)', borderColor: 'rgba(46,204,113,0.2)' }}>
                    Category: {currentTip.category}
                  </span>
                  <span className="step-badge" style={{ background: 'rgba(243,156,18,0.15)', color: 'var(--accent-amber)', borderColor: 'rgba(243,156,18,0.2)' }}>
                    Priority: {currentTip.priority === 1 ? 'Critical' : currentTip.priority === 2 ? 'Major' : 'Standard'}
                  </span>
                </div>
                
                <div className="tip-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', marginTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>
                    <strong>Ref:</strong> {currentTip.source || 'Lojas Renner Rules'}
                  </span>
                  {currentTip.source && (
                    <button 
                      onClick={() => copyToClipboard(currentTip.source)} 
                      className="copy-badge-btn"
                    >
                      📋 Copy Ref
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {filteredTips.length > 0 && (
            <div className="tips-navigation">
              <button onClick={prevTip} className="nav-arrow-btn" title="Previous tip">
                ←
              </button>
              <div className="tips-nav-counter">
                Tip {currentTipIndex + 1} of {filteredTips.length}
              </div>
              <button onClick={nextTip} className="nav-arrow-btn" title="Next tip">
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DAILY QUIZ PANEL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'quiz' && quiz && (
        <div className="glass-card">
          <div className="quiz-meta">
            <span className="step-badge">SL: #{quiz.sl} | {quiz.topic}</span>
            <span className="step-badge" style={{
              background: quiz.priority === 1 ? 'rgba(231,76,60,0.15)' : quiz.priority === 2 ? 'rgba(243,156,18,0.15)' : 'rgba(58,134,200,0.15)',
              color: quiz.priority === 1 ? '#e74c3c' : quiz.priority === 2 ? '#f39c12' : '#3a86c8',
              borderColor: 'transparent'
            }}>
              Priority: {quiz.priority === 1 ? 'Critical' : quiz.priority === 2 ? 'Major' : 'Standard'}
            </span>
          </div>
          
          <div className="quiz-question">{quiz.question}</div>
          
          <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', margin: '1.5rem 0' }}>
            {['A', 'B', 'C', 'D'].map(optKey => {
              const optionText = quiz[optKey.toLowerCase()];
              let optClass = '';
              let mark = '';
              
              if (quizSubmitted) {
                if (optKey.toUpperCase() === quiz.answer?.toUpperCase()) {
                  optClass = 'correct';
                  mark = '✓';
                } else if (selectedOption === optKey) {
                  optClass = 'wrong';
                  mark = '✗';
                }
              } else if (selectedOption === optKey) {
                optClass = 'selected';
              }
              
              return (
                <button 
                  key={optKey} 
                  onClick={() => handleOptionSelect(optKey)}
                  className={`option-btn ${optClass}`}
                  disabled={quizSubmitted}
                  style={{ 
                    minHeight: '48px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0 1rem',
                    textAlign: 'left'
                  }}
                >
                  <span>
                    <strong>{optKey}.</strong> {optionText}
                  </span>
                  {mark && <span style={{ fontWeight: 'bold', fontSize: '1.2rem', marginLeft: '0.5rem' }}>{mark}</span>}
                </button>
              );
            })}
          </div>

          {quizSubmitted && (
            <div className="explanation-box animation-fade" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--accent-amber)', marginBottom: '0.4rem' }}>🎯 Explanation</h4>
              <p style={{ fontSize: '0.9rem', color: '#e0e1dd', lineHeight: '1.4' }}>{quiz.explanation}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#95a5a6' }}>
                <strong>Source Manual:</strong> {quiz.source}
              </p>
            </div>
          )}

          <div className="quiz-action-bar">
            {!quizSubmitted ? (
              <button 
                onClick={submitAnswer} 
                className="primary-btn"
                disabled={!selectedOption}
                style={{ width: '100%', height: '48px', opacity: !selectedOption ? 0.5 : 1, cursor: !selectedOption ? 'not-allowed' : 'pointer' }}
              >
                Submit Answer
              </button>
            ) : (
              <button 
                onClick={loadNextQuiz} 
                className="primary-btn" 
                style={{ width: '100%', height: '48px', background: 'var(--accent-blue)', color: '#fff' }}
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* QC ASSISTANT PANEL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="qc-action-row">
            <button 
              type="button" 
              onClick={handleNewFinding}
              className="qc-reset-btn finding-reset-btn"
            >
              📝 New Finding
            </button>
            <button 
              type="button" 
              onClick={handleNewQuestion}
              className="qc-reset-btn question-reset-btn"
            >
              💬 New Question
            </button>
          </div>
          
          <div className="glass-card">
            <h3 style={{ marginBottom: '0.8rem', color: 'var(--accent-amber)' }}>📝 Report Finding Organizer</h3>
            <p style={{ fontSize: '0.8rem', color: '#bdc3c7', marginBottom: '0.8rem' }}>
              Paste your rough comments (in English/Bangla) below to generate structured AQL defect tables.
            </p>
            <div style={{ position: 'relative' }}>
              <textarea
                className="search-input"
                style={{ width: '100%', minHeight: '80px', maxHeight: '180px', resize: 'vertical', fontSize: '15px', padding: '0.6rem 5.5rem 0.6rem 0.6rem', marginBottom: '0.8rem', fontFamily: 'inherit' }}
                placeholder="Type or speak your rough inspection findings here (English or Bangla). Include: what was found, where, how many pieces, comparison with sealed sample or PO. AI will organize it into a clean professional finding summary."
                value={roughFinding}
                onChange={e => setRoughFinding(e.target.value)}
              />
              {renderMediaControls('rough', 'textarea')}
            </div>
            {renderVoiceControls('rough')}
            {photoPreview && (
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '8px', marginBottom: '8px' }}>
                <img src={photoPreview} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                <button
                  type="button"
                  onClick={() => { setPhotoBase64(null); setPhotoPreview(null); }}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  X
                </button>
              </div>
            )}
            <button 
              onClick={handleOrganizeFinding} 
              className="primary-btn" 
              style={{ width: '100%', height: '42px' }}
              disabled={!roughFinding.trim() || loading}
            >
              Organize Finding
            </button>

            {organizedFinding && (
              <div className="glass-card animation-fade" style={{ background: 'rgba(7, 11, 25, 0.4)', padding: '1.2rem', borderRadius: '12px', marginTop: '1rem', border: '1px solid var(--border-color)', margin: '1rem 0 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>SUMMARY READY</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(organizedFinding)
                        .then(() => {
                          setCopyText('✅ Copied!');
                          setTimeout(() => setCopyText('📋 Copy to Clipboard'), 2000);
                        });
                    }}
                    style={{
                      background: '#FFA500', color: 'white',
                      border: 'none', borderRadius: 8,
                      padding: '8px 16px', cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {copyText}
                  </button>
                </div>
                <div style={{ fontFamily: 'Arial, sans-serif', color: 'var(--text-primary)' }}>
                  {parseOrganizedFinding(organizedFinding)}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="tip-header" style={{ marginBottom: '0.8rem' }}>
              <h2>🤖 Renner Manual AI Assistant</h2>
              <span className="step-badge">RAG Context: Active</span>
            </div>

            <div className="chat-log" style={{ minHeight: '220px', maxHeight: '350px', overflowY: 'auto' }}>
              {chatLog.length === 0 ? (
                <div style={{ color: '#95a5a6', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 1rem' }}>
                  Chat history cleared. Ask a new Renner QC question below.
                </div>
              ) : (
                chatLog.map((msg, index) => (
                  <div key={index} className={`chat-bubble ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="search-input-wrapper" style={{ marginTop: '0.5rem', flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ position: 'relative', display: 'flex', width: '100%' }}>
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  placeholder={chatLog.length === 0 ? "Ask a new QC question..." : "Ask anything (e.g. what is VG34? or RFID rule...)"} 
                  className="search-input"
                  style={{ fontSize: '16px', paddingRight: '5.5rem', width: '100%' }}
                  disabled={loading}
                />
                {renderMediaControls('chat', 'input')}
              </div>
              {renderVoiceControls('chat')}
              {photoPreview && (
                <div style={{ position: 'relative', display: 'inline-block', marginTop: '8px', marginBottom: '8px' }}>
                  <img src={photoPreview} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button
                    type="button"
                    onClick={() => { setPhotoBase64(null); setPhotoPreview(null); }}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    X
                  </button>
                </div>
              )}
              <button type="submit" className="search-btn" style={{ height: '42px', marginTop: '0.4rem' }} disabled={loading}>
                Send Question
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
