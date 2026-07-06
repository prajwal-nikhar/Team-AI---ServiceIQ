import React, { useState, useEffect } from 'react';
import { generateMockData, getCopilotResponse } from './data';
import Dashboard from './components/Dashboard';
import ReorderQueue from './components/ReorderQueue';
import RiskHeatmap from './components/RiskHeatmap';
import FleetDrillDown from './components/FleetDrillDown';
import Copilot from './components/Copilot';
import Benchmarks from './components/Benchmarks';

export default function App() {
  const [data, setData] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [drillDown, setDrillDown] = useState({ plantId: null, machineId: null });
  const [toasts, setToasts] = useState([]);
  const [clockTime, setClockTime] = useState('');
  
  // Centralised Chat state
  const [chatLog, setChatLog] = useState([
    {
      sender: 'gemini',
      text: `Hello! I am the **ServiceIQ Conversational Copilot**, powered by **Vertex AI** and **NVIDIA RAPIDS**-accelerated analytical agents. \n\nI am grounded in current fleet diagnostics, supplier contracts, and spare-parts forecast queues. How can I help you optimize your stocking levels today?`
    }
  ]);

  // Generate data once on mount
  useEffect(() => {
    setData(generateMockData());
    
    // Header Clock
    const timer = setInterval(() => {
      const now = new Date();
      setClockTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  if (!data) return <div style={{ color: 'white', padding: '40px' }}>Loading ServiceIQ Engine...</div>;

  // Toast handler
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, show: true }]);
    
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 400);
    }, 3200);
  };

  const navigateTo = (view, subParams = {}) => {
    setCurrentView(view);
    if (view === 'fleet') {
      setDrillDown({
        plantId: subParams.plantId || null,
        machineId: subParams.machineId || null
      });
    } else {
      setDrillDown({ plantId: null, machineId: null });
    }
  };

  // Order action handler
  const placeOrder = (partName, qty, eta) => {
    showToast(`Automated Procurement dispatched for ${qty}x ${partName}. ETA: ${eta}.`, 'success');
  };

  // Copilot integration from tables
  const askCopilotAboutPart = (partName, plantName, machineName) => {
    const pNameShort = plantName.split(' — ')[1] || plantName;
    const question = `Why does the ${machineName} in ${pNameShort} need a ${partName} replacement?`;
    
    navigateTo('copilot');
    submitQueryDirectly(question);
  };

  const askCopilotAboutMachine = (machineName, locationName, partName) => {
    askCopilotAboutPart(partName, locationName, machineName);
  };

  // Direct chat submit helper
  const submitQueryDirectly = (query) => {
    setChatLog(prev => [...prev, { sender: 'user', text: query }]);
    
    // Simulate typing delay in Copilot component context
    setTimeout(() => {
      const responseText = getCopilotResponse(query, data);
      setChatLog(prev => [...prev, { sender: 'gemini', text: responseText }]);
    }, 1500);
  };

  const handleCopilotQuery = (query, setIsTyping) => {
    setChatLog(prev => [...prev, { sender: 'user', text: query }]);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const responseText = getCopilotResponse(query, data);
      setChatLog(prev => [...prev, { sender: 'gemini', text: responseText }]);
    }, 1500);
  };

  // Render Page Content
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            data={data} 
            navigateTo={navigateTo} 
            placeOrder={placeOrder} 
            askCopilotAboutPart={askCopilotAboutPart} 
          />
        );
      case 'reorders':
        return (
          <ReorderQueue 
            data={data} 
            navigateTo={navigateTo} 
            placeOrder={placeOrder} 
            askCopilotAboutPart={askCopilotAboutPart} 
          />
        );
      case 'heatmap':
        return <RiskHeatmap data={data} navigateTo={navigateTo} />;
      case 'fleet':
        return (
          <FleetDrillDown 
            data={data} 
            navigateTo={navigateTo} 
            drillDown={drillDown} 
            askCopilotAboutMachine={askCopilotAboutMachine} 
          />
        );
      case 'copilot':
        return <Copilot chatLog={chatLog} submitQuery={handleCopilotQuery} />;
      case 'benchmarks':
        return <Benchmarks data={data} />;
      default:
        return <div style={{ color: 'white' }}>View Not Found</div>;
    }
  };

  // Breadcrumbs generator
  const getHeaderBreadcrumbs = () => {
    if (currentView === 'dashboard') {
      return <span className="breadcrumb-active">Command Dashboard</span>;
    }
    if (currentView === 'reorders') {
      return <span className="breadcrumb-active">Reorder Queue</span>;
    }
    if (currentView === 'heatmap') {
      return <span className="breadcrumb-active">Risk Heatmap</span>;
    }
    if (currentView === 'copilot') {
      return <span className="breadcrumb-active">Gemini Copilot</span>;
    }
    if (currentView === 'benchmarks') {
      return <span className="breadcrumb-active">Acceleration Benchmark</span>;
    }
    if (currentView === 'fleet') {
      if (drillDown.plantId && drillDown.machineId) {
        const p = data.plants.find(x => x.id === drillDown.plantId);
        const m = p.machines.find(x => x.id === drillDown.machineId);
        return (
          <>
            <span className="link" onClick={() => navigateTo('fleet')}>Fleet</span>
            <span className="breadcrumb-separator">&gt;</span>
            <span className="link" onClick={() => navigateTo('fleet', { plantId: p.id })}>{p.location}</span>
            <span className="breadcrumb-separator">&gt;</span>
            <span className="breadcrumb-active">{m.name}</span>
          </>
        );
      }
      if (drillDown.plantId) {
        const p = data.plants.find(x => x.id === drillDown.plantId);
        return (
          <>
            <span className="link" onClick={() => navigateTo('fleet')}>Fleet</span>
            <span className="breadcrumb-separator">&gt;</span>
            <span className="breadcrumb-active">{p.location}</span>
          </>
        );
      }
      return <span className="breadcrumb-active">Fleet Overview</span>;
    }
    return null;
  };

  const getHeaderTitle = () => {
    if (currentView === 'dashboard') return 'Command Dashboard';
    if (currentView === 'reorders') return 'Reorder Priority Queue';
    if (currentView === 'heatmap') return 'Failure-Risk Heatmap';
    if (currentView === 'copilot') return 'Gemini Conversational Copilot';
    if (currentView === 'benchmarks') return 'Acceleration Benchmark';
    if (currentView === 'fleet') {
      if (drillDown.plantId && drillDown.machineId) {
        const p = data.plants.find(x => x.id === drillDown.plantId);
        const m = p.machines.find(x => x.id === drillDown.machineId);
        return m.name;
      }
      if (drillDown.plantId) {
        const p = data.plants.find(x => x.id === drillDown.plantId);
        return `${p.location} Plant Assets`;
      }
      return 'Fleet Overview';
    }
    return '';
  };

  return (
    <>
      {/* Background glow filters */}
      <div className="glow-sphere glow-blue"></div>
      <div className="glow-sphere glow-green"></div>
      <div className="glow-sphere glow-purple"></div>

      {/* Sidebar navigation */}
      <aside className="app-sidebar">
        <div className="brand-area">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 className="brand-name">ServiceIQ</h1>
        </div>

        <nav className="nav-list">
          <li className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}>
            <a onClick={() => navigateTo('dashboard')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect>
                <rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect>
                <rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              Command Dashboard
            </a>
          </li>
          <li className={`nav-item ${currentView === 'reorders' ? 'active' : ''}`}>
            <a onClick={() => navigateTo('reorders')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="18" x2="20" y2="18"></line>
              </svg>
              Reorder Queue
            </a>
          </li>
          <li className={`nav-item ${currentView === 'heatmap' ? 'active' : ''}`}>
            <a onClick={() => navigateTo('heatmap')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
              </svg>
              Risk Heatmap
            </a>
          </li>
          <li className={`nav-item ${currentView === 'fleet' ? 'active' : ''}`}>
            <a onClick={() => navigateTo('fleet')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Fleet Drill-Down
            </a>
          </li>
          <li className={`nav-item ${currentView === 'copilot' ? 'active' : ''}`}>
            <a onClick={() => navigateTo('copilot')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Gemini Copilot
            </a>
          </li>
          <li className={`nav-item ${currentView === 'benchmarks' ? 'active' : ''}`}>
            <a onClick={() => navigateTo('benchmarks')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Acceleration Benchmark
            </a>
          </li>
        </nav>

        <div className="sidebar-footer">
          <div className="stack-title">Analytics Engine</div>
          <div className="badge-grid">
            <div className="tech-badge gcp">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '10px', height: '10px' }}><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
              Vertex AI
            </div>
            <div className="tech-badge nvidia">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '10px', height: '10px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
              cuDF/cuML
            </div>
            <div className="tech-badge gcp">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '10px', height: '10px' }}><path d="M12 2L2 22h20L12 2z"/></svg>
              BigQuery
            </div>
            <div className="tech-badge nvidia">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '10px', height: '10px' }}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-4v2h4v2h-4v2h4v2H9V7h6v2z"/></svg>
              NVIDIA GPU
            </div>
          </div>
        </div>
      </aside>

      {/* Main View Container */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-left">
            <div className="breadcrumb-trail">
              {getHeaderBreadcrumbs()}
            </div>
            <h2 className="page-title">{getHeaderTitle()}</h2>
          </div>

          <div className="header-right">
            <div className="status-panel">
              <span className="pulse-dot"></span>
              <span>SYSTEM ACTIVE (LIVE FEED)</span>
              <span className="time-telemetry">{clockTime}</span>
            </div>
          </div>
        </header>

        <div className="main-viewport">
          <div className="view-panel">
            {renderActiveView()}
          </div>
        </div>
      </main>

      {/* Toasts overlay */}
      <div className="toast-container">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`toast ${t.show ? 'show' : ''} ${t.type === 'success' ? 'success' : t.type === 'warning' ? 'warning' : ''}`}
          >
            {t.type === 'success' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
