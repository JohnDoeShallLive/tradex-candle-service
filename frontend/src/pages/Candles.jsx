import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import ChartWidget from '../components/ChartWidget';
import { Search } from 'lucide-react';

const Candles = () => {
  const [instrumentToken, setInstrumentToken] = useState('738561'); // Example RELIANCE token
  const [fromDate, setFromDate] = useState('2024-05-24T09:15:00');
  const [toDate, setToDate] = useState('2024-05-24T15:30:00');
  const [resolution, setResolution] = useState('1min');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  // Mock data for initial render or fallback
  const mockData = [
    { time: '2024-05-24', open: 120.5, high: 121.2, low: 119.8, close: 120.8 },
    { time: '2024-05-25', open: 120.8, high: 122.5, low: 120.2, close: 122.1 },
    { time: '2024-05-26', open: 122.1, high: 123.0, low: 121.5, close: 122.8 },
  ];

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    try {
      // Assuming an integration with fetchCandles here. 
      // For now we'll simulate a network request.
      await new Promise(resolve => setTimeout(resolve, 800));
      setChartData(mockData);
    } catch (err) {
      setError("No market data available for the selected range.");
    } finally {
      setLoading(false);
    }
  };

  const currentCandle = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <GlassCard className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Instrument Token</label>
            <input type="text" className="input" value={instrumentToken} onChange={(e) => setInstrumentToken(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-secondary" style={{ fontSize: '0.875rem' }}>From Date</label>
            <input type="datetime-local" className="input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-secondary" style={{ fontSize: '0.875rem' }}>To Date</label>
            <input type="datetime-local" className="input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Resolution</label>
            <select className="select" value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <option value="1min">1 Minute</option>
              <option value="daily">Daily</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 justify-end h-full mt-6">
            <button className="btn btn-primary" onClick={handleQuery} disabled={loading}>
              <Search size={16} className="mr-2" /> Query
            </button>
          </div>
        </div>
      </GlassCard>

      {error && (
        <GlassCard className="p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--status-error)' }}>
          <p className="text-error" style={{ margin: 0 }}>{error}</p>
        </GlassCard>
      )}

      <div className="flex gap-6 flex-1">
        <GlassCard className="p-6 flex-[3]">
          <h3 className="mb-4 text-secondary">OHLCV Chart</h3>
          {loading ? (
             <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '400px' }}>
                <div style={{ width: 40, height: 40, border: '3px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
             </div>
          ) : (
            chartData.length > 0 ? (
              <ChartWidget data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-full text-secondary" style={{ minHeight: '400px' }}>
                Enter parameters and click Query to view data.
              </div>
            )
          )}
        </GlassCard>

        <GlassCard className="p-6 flex-1 flex flex-col gap-4">
          <h3 className="mb-4 text-secondary">Candle Summary</h3>
          {currentCandle ? (
            <div className="flex flex-col gap-4">
               <div className="flex justify-between border-b" style={{ borderColor: 'var(--glass-border)', paddingBottom: '0.5rem' }}>
                 <span className="text-secondary">Open</span>
                 <span className="font-mono">{currentCandle.open}</span>
               </div>
               <div className="flex justify-between border-b" style={{ borderColor: 'var(--glass-border)', paddingBottom: '0.5rem' }}>
                 <span className="text-secondary">High</span>
                 <span className="text-healthy font-mono">{currentCandle.high}</span>
               </div>
               <div className="flex justify-between border-b" style={{ borderColor: 'var(--glass-border)', paddingBottom: '0.5rem' }}>
                 <span className="text-secondary">Low</span>
                 <span className="text-error font-mono">{currentCandle.low}</span>
               </div>
               <div className="flex justify-between border-b" style={{ borderColor: 'var(--glass-border)', paddingBottom: '0.5rem' }}>
                 <span className="text-secondary">Close</span>
                 <span className="font-mono">{currentCandle.close}</span>
               </div>
               <div className="flex justify-between border-b" style={{ borderColor: 'var(--glass-border)', paddingBottom: '0.5rem' }}>
                 <span className="text-secondary">Volume</span>
                 <span className="font-mono">15,430</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-secondary">Ticks Used</span>
                 <span className="font-mono text-accent-cyan">142</span>
               </div>
            </div>
          ) : (
            <div className="text-secondary text-center py-8">No candle selected</div>
          )}
        </GlassCard>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Candles;
