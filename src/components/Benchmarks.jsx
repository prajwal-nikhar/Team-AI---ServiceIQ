import React, { useEffect, useState } from 'react';

export default function Benchmarks({ data }) {
  const { benchmarks } = data;
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger bar fill animation
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {/* Metrics Panel */}
      <div className="benchmark-summary-grid">
        <div className="glass-card kpi-card" style={{ borderColor: 'rgba(118, 185, 0, 0.3)' }}>
          <span className="kpi-title">Avg Pipeline Speedup</span>
          <div className="kpi-value-container">
            <span className="kpi-value mono-val" style={{ color: 'var(--nvidia-green)' }}>72.2x</span>
            <span className="kpi-trend trend-down" style={{ color: 'var(--nvidia-green)' }}>GPU Native</span>
          </div>
          <span className="kpi-meta">RAPIDS cuDF vs pandas/PySpark</span>
        </div>

        <div className="glass-card kpi-card">
          <span className="kpi-title">Reprocess Time (Full Fleet)</span>
          <div className="kpi-value-container">
            <span className="kpi-value mono-val" style={{ color: 'var(--red)' }}>6.4 Hrs</span>
            <span className="kpi-trend trend-down" style={{ color: 'var(--nvidia-green)' }}>
              &rarr; 5.2 Mins
            </span>
          </div>
          <span className="kpi-meta">NVIDIA GKE GPU Cluster</span>
        </div>

        <div className="glass-card kpi-card">
          <span className="kpi-title">GKE GPU fleet Used</span>
          <div className="kpi-value-container">
            <span className="kpi-value mono-val" style={{ color: 'var(--google-blue)' }}>16x A100</span>
            <span className="kpi-trend trend-neutral">A100 Tensor Core</span>
          </div>
          <span className="kpi-meta">Managed Google Kubernetes Engine</span>
        </div>
      </div>
      
      {/* Paired Bar Charts */}
      <div className="glass-card">
        <div className="panel-header" style={{ marginBottom: '24px' }}>
          <h3 className="panel-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Execution Runtime: CPU Cluster vs GPU GKE Cluster
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Unit: Seconds (Lower is better)</span>
        </div>
        
        <div className="benchmark-row-container">
          {benchmarks.map((b, idx) => {
            const maxVal = 14700; // Match CPU training time
            const cpuPct = Math.max(10, Math.round((b.cpu / maxVal) * 100));
            const gpuPct = Math.max(2, Math.round((b.gpu / maxVal) * 100));
            
            return (
              <div key={idx} className="benchmark-item-card">
                <div className="benchmark-item-header">
                  <span className="benchmark-stage-name">{b.stage}</span>
                  <span className="benchmark-speedup-multiplier">{b.speedup}x Faster</span>
                </div>
                
                <div className="bar-comparison-visual">
                  {/* CPU Row */}
                  <div className="bar-line-wrapper">
                    <span className="bar-label">CPU</span>
                    <div className="bar-track">
                      <div 
                        className="bar-fill-cpu" 
                        style={{ width: animate ? `${cpuPct}%` : '0%' }}
                      >
                        <span className="bar-inner-label">{b.cpuFormatted}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* GPU Row */}
                  <div className="bar-line-wrapper">
                    <span className="bar-label" style={{ color: 'var(--nvidia-green)' }}>GPU</span>
                    <div className="bar-track">
                      <div 
                        className="bar-fill-gpu" 
                        style={{ width: animate ? `${gpuPct}%` : '0%' }}
                      >
                        <span className="bar-inner-label" style={{ color: 'var(--nvidia-green)', fontWeight: 700 }}>
                          {b.gpuFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Attribution */}
        <div className="tech-attribution-banner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--nvidia-green)', flexShrink: 0 }}><path d="M12 2L2 22h20L12 2z"/></svg>
          <div>
            <strong style={{ color: 'white', display: 'block', marginBottom: '2px' }}>NVIDIA RAPIDS On Google Cloud</strong>
            Predictive models utilize RAPIDS cuDF for GPU-accelerated dataframe feature engineering and XGBoost cuML for time-series forecasting. Real-time inference pipelines execute inside Google Kubernetes Engine (GKE) A100 GPU pools, bypassing legacy CPU disk-paging bottlenecks.
          </div>
        </div>
      </div>
    </div>
  );
}
