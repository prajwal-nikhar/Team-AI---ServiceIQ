import React, { useState, useEffect, useRef } from 'react';

export default function Copilot({ chatLog, submitQuery }) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [chatLog, isTyping]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleSend = () => {
    if (inputValue.trim() === '') return;
    const query = inputValue;
    setInputValue('');
    
    // Trigger parent submission
    submitQuery(query, setIsTyping);
  };

  const handleChipClick = (queryText) => {
    setInputValue('');
    submitQuery(queryText, setIsTyping);
  };

  const formatMarkdown = (text) => {
    // Escape HTML characters
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="mono-val" style="background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px; font-size:0.85em; color:var(--nvidia-green);">$1</code>')
      .replace(/\n\n/g, '<p></p>')
      .replace(/\n/g, '<br>');
      
    // List element parser
    html = html.replace(/<br>\*\s(.*)/g, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    // Markdown table parser
    if (html.includes('|')) {
      const lines = text.split('\n');
      let tableHtml = '<table><thead>';
      let bodyStarted = false;
      
      lines.forEach(line => {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const cells = line.split('|').slice(1, -1).map(c => c.trim());
          if (cells[0].includes('---')) return;
          
          if (!bodyStarted && line.includes('Stage')) {
            tableHtml += '<tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
            bodyStarted = true;
          } else {
            if (!bodyStarted) {
              tableHtml += '</thead><tbody>';
              bodyStarted = true;
            }
            const formattedCells = cells.map(c => {
              let cellVal = c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              cellVal = cellVal.replace(/`(.*?)`/g, '<code class="mono-val" style="color:var(--nvidia-green);">$1</code>');
              return `<td>${cellVal}</td>`;
            }).join('');
            tableHtml += `<tr>${formattedCells}</tr>`;
          }
        }
      });
      tableHtml += '</tbody></table>';
      html = html.replace(/(\|.*?\|.*\n)+/gs, tableHtml);
    }
    
    return { __html: html };
  };

  return (
    <div className="copilot-container">
      {/* Chat History */}
      <div className="chat-history" ref={feedRef}>
        {chatLog.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-gemini'}`}
          >
            {msg.sender === 'gemini' && (
              <div className="gemini-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
                  <line x1="12" y1="22" x2="12" y2="15.5"></line>
                  <polyline points="22 8.5 12 15.5 2 8.5"></polyline>
                </svg>
              </div>
            )}
            <div 
              style={{ flexGrow: 1 }} 
              dangerouslySetInnerHTML={formatMarkdown(msg.text)}
            />
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-bubble bubble-gemini">
            <div className="gemini-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
                <line x1="12" y1="22" x2="12" y2="15.5"></line>
                <polyline points="22 8.5 12 15.5 2 8.5"></polyline>
              </svg>
            </div>
            <div className="typing-indicator">
              <span className="typing-dot" style={{ animationDelay: '0s' }}></span>
              <span className="typing-dot" style={{ animationDelay: '0.15s' }}></span>
              <span className="typing-dot" style={{ animationDelay: '0.3s' }}></span>
            </div>
          </div>
        )}
      </div>
      
      {/* Suggestions and Inputs */}
      <div className="copilot-input-area">
        <div className="chat-suggestion-row">
          <span className="suggestion-chip" onClick={() => handleChipClick('Which parts should I reorder for Plant 3 this week, and why?')}>
            Which parts should I reorder for Plant 3 this week, and why?
          </span>
          <span className="suggestion-chip" onClick={() => handleChipClick('Which plant has the highest overall machine failure risk right now?')}>
            Which plant has the highest overall machine failure risk right now?
          </span>
          <span className="suggestion-chip" onClick={() => handleChipClick('Compare GPU vs CPU acceleration for our analytics pipelines.')}>
            Compare GPU vs CPU acceleration for our analytics pipelines.
          </span>
          <span className="suggestion-chip" onClick={() => handleChipClick('List the recent critical anomalies across the fleet.')}>
            List the recent critical anomalies across the fleet.
          </span>
        </div>
        
        <div className="chat-input-row">
          <input 
            type="text" 
            className="chat-text-input" 
            placeholder="Ask Gemini about failure risks, stock lead times, or GPU runtime benchmarks..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className="chat-send-btn" onClick={handleSend}>Ask Gemini</button>
        </div>
      </div>
    </div>
  );
}
