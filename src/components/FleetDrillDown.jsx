import React, { useState, useEffect, useRef } from 'react';
import { seededRandom } from '../data';

export default function FleetDrillDown({ data, navigateTo, drillDown, askCopilotAboutMachine }) {
  const { plants } = data;
  const { plantId, machineId } = drillDown;
  
  // Track selected items
  const selectedPlant = plants.find(p => p.id === plantId);
  const selectedMachine = selectedPlant ? selectedPlant.machines.find(m => m.id === machineId) : null;

  // Local state for ticking telemetry values of selected machine
  const [machineTelemetry, setMachineTelemetry] = useState(null);
  const telemetryTimerRef = useRef(null);

  useEffect(() => {
    if (selectedMachine) {
      // Load current history
      setMachineTelemetry({ ...selectedMachine });
      
      // Start ticking loop
      if (telemetryTimerRef.current) clearInterval(telemetryTimerRef.current);
      telemetryTimerRef.current = setInterval(() => {
        setMachineTelemetry(prev => {
          if (!prev) return null;
          
          const historyCopy = [...prev.history];
          historyCopy.shift();
          
          const lastTick = historyCopy[historyCopy.length - 1];
          const noiseVib = (seededRandom() * 0.14 - 0.07);
          const noiseTemp = Math.round(seededRandom() * 4 - 2);
          const noiseCur = (seededRandom() * 0.8 - 0.4);
          
          const nextVib = Math.max(0.2, +(lastTick.vib + noiseVib).toFixed(2));
          const nextTemp = Math.max(20, Math.round(lastTick.temp + noiseTemp));
          const nextCur = Math.max(1.0, +(lastTick.current + noiseCur).toFixed(1));
          
          const newTick = { vib: nextVib, temp: nextTemp, current: nextCur };
          historyCopy.push(newTick);
          
          // Modify selectedMachine in global structure so state persists
          selectedMachine.history = historyCopy;
          selectedMachine.sensors.vib.current = nextVib;
          selectedMachine.sensors.temp.current = nextTemp;
          selectedMachine.sensors.current.current = nextCur;
          
          return {
            ...prev,
            sensors: {
              ...prev.sensors,
              vib: { ...prev.sensors.vib, current: nextVib },
              temp: { ...prev.sensors.temp, current: nextTemp },
              current: { ...prev.sensors.current, current: nextCur }
            },
            history: historyCopy
          };
        });
      }, 1000);
    }
    
    return () => {
      if (telemetryTimerRef.current) clearInterval(telemetryTimerRef.current);
    };
  }, [selectedMachine]);

  // Helpers
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

  const getUrgencyBadgeClass = (score) => {
    if (score >= 70) return 'badge-critical';
    if (score >= 45) return 'badge-high';
    return 'badge-green';
  };

  // Generate SVG path coordinate points
  const getSvgPaths = () => {
    if (!machineTelemetry || !machineTelemetry.history) return { vib: '', temp: '', current: '' };
    
    const width = 600; // Expected design width
    const height = 140;
    const historyCount = machineTelemetry.history.length;
    
    const pointsVib = [];
    const pointsTemp = [];
    const pointsCurrent = [];
    
    machineTelemetry.history.forEach((tick, idx) => {
      const x = (idx / (historyCount - 1)) * width;
      // Vibration (0.5 to 5.0 mapped to 120 -> 20 y)
      const yVib = height - 10 - ((tick.vib / 5.0) * (height - 30));
      // Temp (30 to 110 mapped to 125 -> 15 y)
      const yTemp = height - 15 - (((tick.temp - 30) / 80) * (height - 30));
      // Current (5 to 150 mapped to 120 -> 20 y)
      const yCurrent = height - 10 - ((tick.current / 150.0) * (height - 30));
      
      pointsVib.push(`${x},${Math.max(5, Math.min(height-5, yVib))}`);
      pointsTemp.push(`${x},${Math.max(5, Math.min(height-5, yTemp))}`);
      pointsCurrent.push(`${x},${Math.max(5, Math.min(height-5, yCurrent))}`);
    });
    
    return {
      vib: `M ${pointsVib.join(' L ')}`,
      temp: `M ${pointsTemp.join(' L ')}`,
      current: `M ${pointsCurrent.join(' L ')}`
    };
  };

  const svgPaths = getSvgPaths();

  // LEVEL 1: Fleet Overview Grid
  if (!plantId) {
    return (
      <div className="drilldown-grid">
        {plants.map(p => {
          const criticalCount = p.machines.filter(m => m.riskScore >= 70).length;
          
          const radius = 24;
          const circum = 2 * Math.PI * radius;
          const offset = circum - (p.averageRisk / 100) * circum;
          
          return (
            <div 
              key={p.id} 
              className="glass-card drilldown-card" 
              onClick={() => navigateTo('fleet', { plantId: p.id })}
            >
              <div className="plant-card-header">
                <span className="plant-name" style={{ fontSize: '1.05rem' }}>{p.name}</span>
                <span className={`badge ${p.averageRisk >= 70 ? 'badge-critical' : p.averageRisk >= 45 ? 'badge-high' : 'badge-green'}`}>
                  {getRiskStatus(p.averageRisk)}
                </span>
              </div>
              
              <div className="plant-risk-gauge" style={{ marginTop: '14px' }}>
                <div className="ring-wrapper" style={{ width: '58px', height: '58px' }}>
                  <svg width="58" height="58" viewBox="0 0 58 58">
                    <circle className="ring-bg" cx="29" cy="29" r={radius}></circle>
                    <circle className="ring-fill" cx="29" cy="29" r={radius} stroke={getRiskColor(p.averageRisk)} strokeDasharray={circum} strokeDashoffset={offset}></circle>
                  </svg>
                  <div className="ring-text" style={{ fontSize: '0.85rem' }}>{p.averageRisk}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Plant Health Index</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>RAPIDS cuML Failure Index</div>
                </div>
              </div>
              
              <div className="drilldown-card-footer">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <strong>{p.machinesCount}</strong> Monitored Machines
                </span>
                {criticalCount > 0 ? (
                  <span className="badge badge-critical" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{criticalCount} Critical</span>
                ) : (
                  <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Stable</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // LEVEL 2: Plant Machines Grid
  if (plantId && !machineId) {
    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <button className="btn-drill" onClick={() => navigateTo('fleet')}>
            &larr; Back to Fleet Overview
          </button>
        </div>
        
        <div className="drilldown-grid">
          {selectedPlant.machines.map(m => {
            const radius = 20;
            const circum = 2 * Math.PI * radius;
            const offset = circum - (m.riskScore / 100) * circum;
            
            return (
              <div 
                key={m.id} 
                className="glass-card drilldown-card" 
                onClick={() => navigateTo('fleet', { plantId: selectedPlant.id, machineId: m.id })}
              >
                <div className="plant-card-header">
                  <span className="plant-name" style={{ fontSize: '0.95rem' }}>{m.name}</span>
                  <span className={`badge ${m.riskScore >= 70 ? 'badge-critical' : m.riskScore >= 45 ? 'badge-high' : 'badge-green'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    Risk: {m.riskScore}%
                  </span>
                </div>
                
                <div className="plant-risk-gauge" style={{ marginTop: '10px' }}>
                  <div className="ring-wrapper" style={{ width: '46px', height: '46px' }}>
                    <svg width="46" height="46" viewBox="0 0 46 46">
                      <circle className="ring-bg" cx="23" cy="23" r={radius}></circle>
                      <circle className="ring-fill" cx="23" cy="23" r={radius} stroke={getRiskColor(m.riskScore)} strokeDasharray={circum} strokeDashoffset={offset}></circle>
                    </svg>
                    <div className="ring-text" style={{ fontSize: '0.7rem' }}>{m.riskScore}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Node Failure Probability</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>Primary Part: {m.primaryPart.split(' ')[0]}</div>
                  </div>
                </div>
                
                <div className="drilldown-card-footer">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                    Spare Part: <strong>{m.primaryPart}</strong>
                  </span>
                  <button className="btn-drill" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>Analyze Sensors</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LEVEL 3: Machine Details Panel
  if (plantId && machineId && machineTelemetry) {
    const vibDev = Math.round(((machineTelemetry.sensors.vib.current - machineTelemetry.sensors.vib.base) / machineTelemetry.sensors.vib.base) * 100);
    const tempDev = Math.round(((machineTelemetry.sensors.temp.current - machineTelemetry.sensors.temp.base) / machineTelemetry.sensors.temp.base) * 100);
    const curDev = Math.round(((machineTelemetry.sensors.current.current - machineTelemetry.sensors.current.base) / machineTelemetry.sensors.current.base) * 100);

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <button className="btn-drill" onClick={() => navigateTo('fleet', { plantId: selectedPlant.id })}>
            &larr; Back to {selectedPlant.location} Assets
          </button>
        </div>
        
        <div className="machine-detail-layout">
          {/* Left Panel: Live sensor metrics and charts */}
          <div className="glass-card">
            <div className="machine-status-hero">
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '4px' }}>{machineTelemetry.name} Diagnostics</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Asset Class: {machineTelemetry.type} | ID: {machineTelemetry.id}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${getUrgencyBadgeClass(machineTelemetry.riskScore)}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                  Risk Score: {machineTelemetry.riskScore}%
                </span>
              </div>
            </div>
            
            {/* Sensor grids */}
            <div className="machine-sensors-grid">
              <div className="sensor-card">
                <span className="sensor-label">{machineTelemetry.sensors.vib.name}</span>
                <span className="sensor-value mono-val">{machineTelemetry.sensors.vib.current}</span>
                <span className="sensor-baseline mono-val">Base: {machineTelemetry.sensors.vib.base} {machineTelemetry.sensors.vib.unit}</span>
                <span className={`sensor-deviation mono-val ${vibDev > 10 ? 'trend-up' : 'trend-down'}`}>
                  {vibDev >= 0 ? '+' : ''}{vibDev}% vs baseline
                </span>
              </div>
              
              <div className="sensor-card">
                <span className="sensor-label">{machineTelemetry.sensors.temp.name}</span>
                <span className="sensor-value mono-val">{machineTelemetry.sensors.temp.current}</span>
                <span className="sensor-baseline mono-val">Base: {machineTelemetry.sensors.temp.base} {machineTelemetry.sensors.temp.unit}</span>
                <span className={`sensor-deviation mono-val ${tempDev > 10 ? 'trend-up' : 'trend-down'}`}>
                  {tempDev >= 0 ? '+' : ''}{tempDev}% vs baseline
                </span>
              </div>

              <div className="sensor-card">
                <span className="sensor-label">{machineTelemetry.sensors.current.name}</span>
                <span className="sensor-value mono-val">{machineTelemetry.sensors.current.current}</span>
                <span className="sensor-baseline mono-val">Base: {machineTelemetry.sensors.current.base} {machineTelemetry.sensors.current.unit}</span>
                <span className={`sensor-deviation mono-val ${curDev > 10 ? 'trend-up' : 'trend-down'}`}>
                  {curDev >= 0 ? '+' : ''}{curDev}% vs baseline
                </span>
              </div>
            </div>
            
            {/* SVG Telemetry Chart */}
            <div className="live-chart-container">
              <div className="chart-header">
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-dot"></span> Live Telemetry Waveforms (20s Window)
                </span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: 'var(--nvidia-green)' }}>● Vibration</span>
                  <span style={{ color: 'var(--amber)' }}>● Thermal</span>
                  <span style={{ color: 'var(--google-blue)' }}>● Electrical</span>
                </div>
              </div>
              
              <svg className="svg-chart" viewBox="0 0 600 140" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line className="chart-grid-line" x1="0" y1="20" x2="600" y2="20" />
                <line className="chart-grid-line" x1="0" y1="55" x2="600" y2="55" />
                <line className="chart-grid-line" x1="0" y1="90" x2="600" y2="90" />
                <line className="chart-grid-line" x1="0" y1="120" x2="600" y2="120" />
                
                {/* SVG Paths */}
                <path className="chart-path chart-path-vib" d={svgPaths.vib} />
                <path className="chart-path chart-path-temp" d={svgPaths.temp} />
                <path className="chart-path chart-path-current" d={svgPaths.current} />
              </svg>
            </div>
          </div>
          
          {/* Right Panel: Reorder info & Copilot link */}
          <div className="recommendation-panel">
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                AI Spare Parts Recommendation
              </h3>
              
              <div className="rec-part-box">
                <span className="rec-label">Recommended Spare Part</span>
                <span className="rec-val">{machineTelemetry.primaryPart}</span>
              </div>

              <div className="rec-part-box">
                <span className="rec-label">Demand Confidence Score</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <div className="confidence-bar-container" style={{ flexGrow: 1, margin: 0, height: '8px' }}>
                    <div className="confidence-bar-fill" style={{ width: `${machineTelemetry.riskScore}%`, backgroundColor: getRiskColor(machineTelemetry.riskScore) }}></div>
                  </div>
                  <span className="mono-val" style={{ fontWeight: 700, color: getRiskColor(machineTelemetry.riskScore) }}>{machineTelemetry.riskScore}%</span>
                </div>
              </div>

              <div className="rec-part-box">
                <span className="rec-label">Supplier SLA / Lead Time</span>
                <span className="rec-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--google-blue)' }}>
                  {machineTelemetry.riskScore >= 70 ? '1-2 Days (Priority dispatch)' : '3-5 Days'}
                </span>
              </div>
              
              <button 
                className="ask-copilot-cta" 
                onClick={() => askCopilotAboutMachine(machineTelemetry.name, selectedPlant.location, machineTelemetry.primaryPart)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Ask Copilot About This Part
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
