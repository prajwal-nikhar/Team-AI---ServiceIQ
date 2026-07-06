import React, { useEffect, useRef, useState } from 'react';

export default function Dashboard({ data, navigateTo, placeOrder, askCopilotAboutPart }) {
  const { plants, reorderQueue, anomalies, benchmarks } = data;
  
  // Calculate average risk across fleet
  const allRisks = plants.map(p => p.averageRisk);
  const fleetAvgRisk = Math.round(allRisks.reduce((a, b) => a + b, 0) / allRisks.length);
  const criticalReordersCount = reorderQueue.filter(x => x.urgency === 'Critical').length;
  
  // Carousel Autoplay state
  const scrollerRef = useRef(null);
  const [activeDot, setActiveDot] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const directionRef = useRef(1); // 1 = forward, -1 = backward

  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      
      const card = scroller.querySelector('.carousel-card');
      if (!card) return;
      
      const cardWidth = card.offsetWidth + 16; // width + gap
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      
      let targetScroll = scroller.scrollLeft + (cardWidth * directionRef.current);
      
      if (targetScroll >= maxScroll + 5) {
        directionRef.current = -1;
        targetScroll = scroller.scrollLeft + (cardWidth * directionRef.current);
      } else if (targetScroll <= 5) {
        directionRef.current = 1;
        targetScroll = 0;
      }
      
      scroller.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }, 4000);
    
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    
    const card = scroller.querySelector('.carousel-card');
    if (!card) return;
    
    const cardWidth = card.offsetWidth + 16;
    const index = Math.round(scroller.scrollLeft / cardWidth);
    setActiveDot(index);
  };

  const handleArrow = (dir) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector('.carousel-card');
    if (!card) return;
    
    const cardWidth = card.offsetWidth + 16;
    scroller.scrollBy({ left: cardWidth * dir, behavior: 'smooth' });
  };

  const jumpToSlide = (idx) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector('.carousel-card');
    if (!card) return;
    
    const cardWidth = card.offsetWidth + 16;
    scroller.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
  };

  // Helper for Urgency colors
  const getUrgencyBadgeClass = (urgency) => {
    if (urgency === 'Critical') return 'badge-critical';
    if (urgency === 'High') return 'badge-high';
    return 'badge-watch';
  };

  // Helper for risk score thresholds
  const getRiskColor = (score) => {
    if (score < 45) return 'var(--nvidia-green)';
    if (score < 70) return 'var(--amber)';
    return 'var(--red)';
  };

  const getRiskStatus = (score) => {
    if (score < 45) return 'HEALTHY';
    if (score < 70) return 'ELEVATED';
    return 'CRITICAL';
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h3 className="hero-title">ServiceIQ Operations Command Center</h3>
          <p className="hero-subtitle">
            GPU-accelerated predictive failure modeling and parts distribution forecasting in GKE. Vertex AI Agentic Copilot is loaded with current telemetry and grounded parameters.
          </p>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-label">Fleet Avg Risk</span>
          <span className="hero-stat-val">{fleetAvgRisk}%</span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <span className="kpi-title">Fleet Average Risk</span>
          <div className="kpi-value-container">
            <span className="kpi-value mono-val" style={{ color: getRiskColor(fleetAvgRisk) }}>{fleetAvgRisk}%</span>
            <span className="kpi-trend trend-down">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
              -4.2%
            </span>
          </div>
          <span className="kpi-meta">6 plants actively telemetry-monitored</span>
        </div>
        
        <div className="glass-card kpi-card">
          <span className="kpi-title">Critical Reorders</span>
          <div className="kpi-value-container">
            <span className="kpi-value mono-val" style={{ color: 'var(--red)' }}>{criticalReordersCount}</span>
            <span className="kpi-trend trend-up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              +2 items
            </span>
          </div>
          <span className="kpi-meta">Forecast confidence &gt;85%</span>
        </div>

        <div className="glass-card kpi-card">
          <span className="kpi-title">Active Anomaly Alerts</span>
          <div className="kpi-value-container">
            <span className="kpi-value mono-val" style={{ color: 'var(--amber)' }}>{anomalies.length}</span>
            <span className="kpi-trend trend-neutral">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Stable
            </span>
          </div>
          <span className="kpi-meta">Updated 30 seconds ago</span>
        </div>

        <div className="glass-card kpi-card">
          <span className="kpi-title">Avg Pipeline Runtime</span>
          <div className="kpi-value-container">
            <span className="kpi-value mono-val" style={{ color: 'var(--nvidia-green)' }}>5.2 Min</span>
            <span className="kpi-trend trend-down" style={{ color: 'var(--nvidia-green)' }}>
              72.2x Fast
            </span>
          </div>
          <span className="kpi-meta">RAPIDS on NVIDIA A100 GPUs</span>
        </div>
      </div>

      {/* Split Grid */}
      <div className="split-grid">
        {/* Reorders Summary Table */}
        <div className="glass-card">
          <div className="panel-header">
            <h3 className="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
              Critical Reorder Queue (Top 5)
            </h3>
            <span className="panel-action" onClick={() => navigateTo('reorders')}>View All Queue</span>
          </div>
          
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Part Details</th>
                  <th>Plant</th>
                  <th>Urgency</th>
                  <th>Confidence</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {reorderQueue.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'white' }}>{item.partName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.machineName}</div>
                    </td>
                    <td className="mono-val">{item.plantName.split(' — ')[1]}</td>
                    <td><span className={`badge ${getUrgencyBadgeClass(item.urgency)}`}>{item.urgency}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', width: '90px' }}>
                        <div className="confidence-bar-container">
                          <div className="confidence-bar-fill" style={{ width: `${item.confidence}%`, backgroundColor: getRiskColor(item.confidence) }}></div>
                        </div>
                        <span className="mono-val">{item.confidence}%</span>
                      </div>
                    </td>
                    <td className="mono-val">{item.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Anomaly Alerts List */}
        <div className="glass-card">
          <div className="panel-header">
            <h3 className="panel-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Streaming Anomaly Alerts
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="pulse-dot pulse-dot-red" style={{ margin: 0 }}></span> Streaming Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {anomalies.map(a => (
              <div 
                key={a.id} 
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: `3px solid ${a.severity === 'Critical' ? 'var(--red)' : 'var(--amber)'}`,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => navigateTo('fleet', { plantId: a.plantId, machineId: a.machineId })}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{a.machineName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {a.plantName.split(' — ')[1]} — Dev: <span className="mono-val" style={{ color: a.severity === 'Critical' ? 'var(--red)' : 'var(--amber)', fontWeight: 700 }}>{a.deviation}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span className={`badge ${a.severity === 'Critical' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{a.severity}</span>
                  <span className="mono-val" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{a.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-playing Plant Risk Carousel */}
      <div className="carousel-section">
        <div className="panel-header">
          <h3 className="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            Auto-Track: Regional Failure Risk Index
          </h3>
          <div className="carousel-header-controls">
            <button className="carousel-arrow" onClick={() => handleArrow(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button className="carousel-arrow" onClick={() => handleArrow(1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
        
        <div 
          className="carousel-viewport" 
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="carousel-scroller" 
            ref={scrollerRef} 
            onScroll={handleScroll}
          >
            {plants.map(p => {
              const sortedMachines = [...p.machines].sort((a, b) => b.riskScore - a.riskScore);
              const worstMac = sortedMachines[0];
              
              const radius = 22;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (p.averageRisk / 100) * circumference;
              
              return (
                <div 
                  key={p.id} 
                  className="glass-card carousel-card carousel-plant-card" 
                  onClick={() => navigateTo('fleet', { plantId: p.id })}
                >
                  <div className="plant-card-header">
                    <span className="plant-name">{p.name}</span>
                    <span className={`badge ${p.averageRisk >= 70 ? 'badge-critical' : p.averageRisk >= 45 ? 'badge-high' : 'badge-green'}`}>
                      {getRiskStatus(p.averageRisk)}
                    </span>
                  </div>
                  
                  <div className="plant-risk-gauge">
                    <div className="ring-wrapper">
                      <svg width="50" height="50" viewBox="0 0 50 50">
                        <circle className="ring-bg" cx="25" cy="25" r={radius}></circle>
                        <circle className="ring-fill" cx="25" cy="25" r={radius} stroke={getRiskColor(p.averageRisk)} strokeDasharray={circumference} strokeDashoffset={offset}></circle>
                      </svg>
                      <div className="ring-text">{p.averageRisk}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Avg Failure Index</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>BigQuery Telemetry</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="plant-detail-row">
                      <span>Total Active Equipment</span>
                      <span className="mono-val" style={{ color: 'white' }}>{p.machinesCount} Units</span>
                    </div>
                    <div className="plant-detail-row">
                      <span>Critical Risk Node</span>
                      <span style={{ color: 'var(--red)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {worstMac.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="carousel-dots">
          {plants.map((_, index) => (
            <span 
              key={index}
              className={`carousel-dot ${index === activeDot ? 'active' : ''}`} 
              onClick={() => jumpToSlide(index)}
            ></span>
          ))}
        </div>
      </div>
    </div>
  );
}
