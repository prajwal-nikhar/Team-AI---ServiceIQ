import React, { useState } from 'react';

export default function RiskHeatmap({ data, navigateTo }) {
  const { heatmap } = data;
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoverCellData, setHoverCellData] = useState(null);

  const getWeekLabel = (wIdx) => {
    if (wIdx === 5) return 'Current Week';
    return `Week -${5 - wIdx}`;
  };

  const getScoreGroupClass = (val) => {
    if (val >= 85) return 'risk-val-6';
    if (val >= 70) return 'risk-val-5';
    if (val >= 60) return 'risk-val-4';
    if (val >= 46) return 'risk-val-3';
    if (val >= 36) return 'risk-val-2';
    return 'risk-val-1';
  };

  const generateHeatmapNarrative = (plantName, week, risk) => {
    const plantShort = plantName.split(' — ')[1] || plantName;
    const weekLabel = getWeekLabel(week);
    
    let narrative = '';
    if (risk >= 70) {
      narrative = `During ${weekLabel}, analytics engines processed telemetry anomalies at ${plantName}, resulting in a critical risk rating of ${risk}%. RAPIDS acceleration identified thermal degradation within Conveyor and Gearbox bearings. Immediate dispatch of critical bearing and seal units was authorized to mitigate a predicted 14-hour breakdown window.`;
    } else if (risk >= 45) {
      narrative = `Operational indexes at ${plantName} recorded an elevated risk score of ${risk}% during ${weekLabel}. Vertex AI anomaly filters detected moderate vibration harmonics in drive motors and hydraulic flow loops. Parts inventory levels for fans and hydraulic kits were flagged as watch assets, keeping backup stock on guard.`;
    } else {
      narrative = `Plant analytics at ${plantName} for ${weekLabel} confirmed an optimal, stable health index of ${risk}%. Telemetry parameters (Bearing Temp, Vibration RMS, Current Draw) remained within the safe green baseline. Regular automated reports were updated in BigQuery without triggering reorder tickets.`;
    }
    
    return {
      title: `${plantShort} Risk Analytics — ${weekLabel} (${risk}% Score)`,
      text: narrative
    };
  };

  const activeNarrative = selectedCell 
    ? generateHeatmapNarrative(selectedCell.plantName, selectedCell.week, selectedCell.val)
    : hoverCellData 
      ? generateHeatmapNarrative(hoverCellData.plantName, hoverCellData.week, hoverCellData.val)
      : null;

  return (
    <div className="heatmap-layout">
      <div className="glass-card heatmap-grid-card">
        <div className="panel-header">
          <h3 className="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
            6-Week Predictive Failure-Risk Trend Grid
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hover or click cells for pipeline narratives</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="heatmap-table">
            <thead>
              <tr>
                <th className="plant-header-col">Production Facility</th>
                <th>Wk -5</th>
                <th>Wk -4</th>
                <th>Wk -3</th>
                <th>Wk -2</th>
                <th>Wk -1</th>
                <th>Current</th>
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row) => (
                <tr key={row.plantId}>
                  <td className="heatmap-plant-label">
                    <span 
                      className="link" 
                      onClick={() => navigateTo('fleet', { plantId: row.plantId })}
                      style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {row.plantName}
                    </span>
                  </td>
                  {row.weeks.map((val, wIdx) => {
                    const isSelected = selectedCell && selectedCell.plantId === row.plantId && selectedCell.week === wIdx;
                    return (
                      <td 
                        key={wIdx}
                        className={`heatmap-cell ${getScoreGroupClass(val)}`}
                        style={{
                          outline: isSelected ? '2px solid var(--nvidia-green)' : 'none',
                          outlineOffset: isSelected ? '-2px' : 'none'
                        }}
                        onClick={() => setSelectedCell({ plantId: row.plantId, plantName: row.plantName, week: wIdx, val })}
                        onMouseEnter={() => !selectedCell && setHoverCellData({ plantName: row.plantName, week: wIdx, val })}
                        onMouseLeave={() => setHoverCellData(null)}
                      >
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="heatmap-legend">
          <span>Risk Color Code Index:</span>
          <div className="legend-item">
            <div className="legend-box risk-val-1"></div>
            <span>Low (&lt;36)</span>
          </div>
          <div className="legend-item">
            <div className="legend-box risk-val-2"></div>
            <span>Stable (36-45)</span>
          </div>
          <div className="legend-item">
            <div className="legend-box risk-val-3"></div>
            <span>Guard (46-59)</span>
          </div>
          <div className="legend-item">
            <div className="legend-box risk-val-4"></div>
            <span>Watch (60-69)</span>
          </div>
          <div className="legend-item">
            <div className="legend-box risk-val-5"></div>
            <span>High (70-84)</span>
          </div>
          <div className="legend-item">
            <div className="legend-box risk-val-6"></div>
            <span>Critical (&ge;85)</span>
          </div>
        </div>
      </div>
      
      {/* Detail Narrative Box */}
      <div className="glass-card heatmap-detail-box">
        {activeNarrative ? (
          <div className="heatmap-detail-content">
            <h4>{activeNarrative.title}</h4>
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {activeNarrative.text}
            </p>
          </div>
        ) : (
          <div className="heatmap-detail-empty">
            Click on any week's grid cell above to extract GKE pipeline analysis and Vertex AI grounded details.
          </div>
        )}
      </div>
    </div>
  );
}
