import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Terminal, Play, Copy, Check } from 'lucide-react';

const ApiExplorer = () => {
  const [endpoint, setEndpoint] = useState('/ohlcv/1min');
  const [instrumentToken, setInstrumentToken] = useState('738561');
  const [fromDate, setFromDate] = useState('2024-05-24T09:15:00');
  const [toDate, setToDate] = useState('2024-05-24T15:30:00');
  
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);

  const handleExecute = async () => {
    setLoading(true);
    setResponse(null);
    setStatusInfo(null);
    const start = performance.now();
    
    try {
      // Simulate API call to showcase loading state and response formatting
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const end = performance.now();
      setStatusInfo({ code: 200, time: `${(end - start).toFixed(0)}ms` });
      
      if (endpoint === '/health') {
        setResponse({ status: "healthy", db_connected: true, timestamp: new Date().toISOString() });
      } else {
        setResponse([
          { time: '2024-05-24T09:15:00Z', open: 120.5, high: 121.2, low: 119.8, close: 120.8, volume: 15430 },
          { time: '2024-05-24T09:16:00Z', open: 120.8, high: 122.5, low: 120.2, close: 122.1, volume: 18200 }
        ]);
      }
    } catch (err) {
      setStatusInfo({ code: 500, time: '12ms' });
      setResponse({ detail: "Internal Server Error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <h2 className="text-xl mb-2">Interactive API Explorer</h2>
      
      <div className="flex gap-4">
        {['/ohlcv/1min', '/ohlcv/daily', '/health'].map(ep => (
          <GlassCard 
            key={ep} 
            className={`p-4 cursor-pointer transition-all ${endpoint === ep ? 'border-accent-blue bg-card-hover' : ''}`}
            onClick={() => setEndpoint(ep)}
            style={endpoint === ep ? { borderColor: 'var(--accent-blue)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' } : {}}
          >
            <div className="font-mono text-sm">GET</div>
            <div className={endpoint === ep ? "text-accent-blue" : ""}>{ep}</div>
          </GlassCard>
        ))}
      </div>

      <div className="flex gap-6 mt-4">
        {/* Request Builder */}
        <GlassCard className="p-6 flex-1 flex flex-col gap-4 h-fit">
          <h3 className="flex items-center gap-2 m-0 text-lg border-b pb-4" style={{ borderColor: 'var(--glass-border)' }}>
            <Terminal size={18} /> Request Builder
          </h3>

          {endpoint !== '/health' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-secondary text-sm">instrument_token</label>
                <input type="text" className="input font-mono" value={instrumentToken} onChange={e => setInstrumentToken(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-secondary text-sm">start_time</label>
                <input type="datetime-local" className="input font-mono" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-secondary text-sm">end_time</label>
                <input type="datetime-local" className="input font-mono" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </>
          )}

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <button className="btn btn-primary w-full flex justify-center gap-2" onClick={handleExecute} disabled={loading}>
              {loading ? (
                 <div style={{ width: 16, height: 16, border: '2px solid rgba(255, 255, 255, 0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              ) : <Play size={16} />}
              Execute Request
            </button>
          </div>
        </GlassCard>

        {/* Response Viewer */}
        <GlassCard className="p-6 flex-[2] flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b pb-4" style={{ borderColor: 'var(--glass-border)' }}>
            <h3 className="m-0 text-lg">Response</h3>
            
            {statusInfo && (
              <div className="flex gap-4">
                <span className={`text-sm ${statusInfo.code === 200 ? 'text-healthy' : 'text-error'}`}>Status: {statusInfo.code}</span>
                <span className="text-sm text-secondary">Time: {statusInfo.time}</span>
              </div>
            )}
          </div>
          
          <div className="relative flex-1 bg-black/40 rounded-lg p-4 font-mono text-sm overflow-auto" style={{ border: '1px solid var(--glass-border)', minHeight: '300px' }}>
            {response ? (
              <>
                <button 
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 bg-card rounded-md hover:bg-card-hover transition-colors border border-transparent hover:border-gray-700"
                >
                  {copied ? <Check size={16} className="text-healthy" /> : <Copy size={16} className="text-secondary" />}
                </button>
                <pre className="text-green-400 m-0" style={{ color: '#10b981' }}>
                  {JSON.stringify(response, null, 2)}
                </pre>
              </>
            ) : (
              <div className="text-secondary h-full flex items-center justify-center">
                Execute a request to view the response.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ApiExplorer;
