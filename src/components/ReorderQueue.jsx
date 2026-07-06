import React, { useState } from 'react';

export default function ReorderQueue({ data, navigateTo, placeOrder, askCopilotAboutPart }) {
  const { reorderQueue } = data;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ column: 'urgency', direction: 'asc' });

  const getUrgencyBadgeClass = (urgency) => {
    if (urgency === 'Critical') return 'badge-critical';
    if (urgency === 'High') return 'badge-high';
    return 'badge-watch';
  };

  const getRiskColor = (score) => {
    if (score < 45) return 'var(--nvidia-green)';
    if (score < 70) return 'var(--amber)';
    return 'var(--red)';
  };

  const handleSort = (col) => {
    let direction = 'asc';
    if (sortConfig.column === col && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column: col, direction });
  };

  const getSortArrow = (col) => {
    if (sortConfig.column !== col) return '';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // Filter items
  let filteredItems = [...reorderQueue];
  if (urgencyFilter !== 'ALL') {
    filteredItems = filteredItems.filter(x => x.urgency === urgencyFilter);
  }
  if (searchTerm.trim() !== '') {
    const q = searchTerm.toLowerCase();
    filteredItems = filteredItems.filter(x => 
      x.partName.toLowerCase().includes(q) ||
      x.plantName.toLowerCase().includes(q) ||
      x.machineName.toLowerCase().includes(q)
    );
  }

  // Sort items
  filteredItems.sort((a, b) => {
    const col = sortConfig.column;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    
    if (col === 'urgency') {
      const weight = { 'Critical': 3, 'High': 2, 'Watch': 1 };
      return (weight[a.urgency] - weight[b.urgency]) * dir;
    }
    if (col === 'confidence' || col === 'quantity') {
      return (a[col] - b[col]) * dir;
    }
    return a[col].localeCompare(b[col]) * dir;
  });

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Controls */}
      <div className="search-filter-row">
        <div className="search-input-wrapper">
          <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by spare part, machine name, or plant location..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select" 
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
        >
          <option value="ALL">All Urgencies</option>
          <option value="Critical">Critical Only</option>
          <option value="High">High Only</option>
          <option value="Watch">Watch Only</option>
        </select>
      </div>
      
      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('partName')} className={sortConfig.column === 'partName' ? 'sort-active' : ''}>Part Name{getSortArrow('partName')}</th>
              <th onClick={() => handleSort('plantName')} className={sortConfig.column === 'plantName' ? 'sort-active' : ''}>Plant{getSortArrow('plantName')}</th>
              <th onClick={() => handleSort('machineName')} className={sortConfig.column === 'machineName' ? 'sort-active' : ''}>Asset Node{getSortArrow('machineName')}</th>
              <th onClick={() => handleSort('quantity')} className={sortConfig.column === 'quantity' ? 'sort-active' : ''}>Qty{getSortArrow('quantity')}</th>
              <th onClick={() => handleSort('urgency')} className={sortConfig.column === 'urgency' ? 'sort-active' : ''}>Urgency{getSortArrow('urgency')}</th>
              <th onClick={() => handleSort('confidence')} className={sortConfig.column === 'confidence' ? 'sort-active' : ''}>AI Confidence{getSortArrow('confidence')}</th>
              <th>ETA</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No reorder recommendations found matching your filter parameters.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'white' }}>{item.partName}</td>
                  <td className="mono-val">{item.plantName.split(' — ')[1]}</td>
                  <td>
                    <span 
                      className="link" 
                      style={{ textDecoration: 'underline', cursor: 'pointer' }} 
                      onClick={() => navigateTo('fleet', { plantId: item.plantId, machineId: item.machineId })}
                    >
                      {item.machineName}
                    </span>
                  </td>
                  <td className="mono-val" style={{ fontWeight: 600 }}>{item.quantity}</td>
                  <td><span className={`badge ${getUrgencyBadgeClass(item.urgency)}`}>{item.urgency}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100px' }}>
                      <div className="confidence-bar-container">
                        <div className="confidence-bar-fill" style={{ width: `${item.confidence}%`, backgroundColor: getRiskColor(item.confidence) }}></div>
                      </div>
                      <span className="mono-val">{item.confidence}%</span>
                    </div>
                  </td>
                  <td className="mono-val">{item.eta}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button className="order-action-btn" onClick={() => placeOrder(item.partName, item.quantity, item.eta)}>Order</button>
                    <button className="copilot-action-btn" onClick={() => askCopilotAboutPart(item.partName, item.plantName, item.machineName)}>Ask AI</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
