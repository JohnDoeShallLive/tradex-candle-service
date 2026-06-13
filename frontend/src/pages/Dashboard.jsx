import React from 'react';
import GlassCard from '../components/GlassCard';
import { Activity, Database, Clock, Layers } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="flex flex-col gap-6" style={{ position: 'relative' }}>
      
      {/* Hero Metrics Row */}
      <div className="flex gap-6">
        <GlassCard className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <Layers className="text-accent-purple" size={24} color="var(--accent-purple)" />
            <h3 className="text-secondary" style={{ margin: 0 }}>Total Ticks</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 600, margin: 0, textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}>
            15,432,129
          </p>
        </GlassCard>

        <GlassCard className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <Activity className="text-accent-blue" size={24} color="var(--accent-blue)" />
            <h3 className="text-secondary" style={{ margin: 0 }}>Instruments</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 600, margin: 0, textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>
            248
          </p>
        </GlassCard>

        <GlassCard className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <Clock className="text-accent-cyan" size={24} color="var(--accent-cyan)" />
            <h3 className="text-secondary" style={{ margin: 0 }}>Daily Candles</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 600, margin: 0, textShadow: '0 0 20px rgba(6, 182, 212, 0.5)' }}>
            18,432
          </p>
        </GlassCard>

        <GlassCard className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <Database className="text-healthy" size={24} color="var(--status-healthy)" />
            <h3 className="text-secondary" style={{ margin: 0 }}>Service Health</h3>
          </div>
          <p style={{ fontSize: '2.5rem', fontWeight: 600, margin: 0, color: 'var(--status-healthy)', textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
            Healthy
          </p>
        </GlassCard>
      </div>

      {/* Main floating central card */}
      <GlassCard className="p-8 w-full" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem',
          boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)'
        }}>
          <Activity size={40} color="white" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to TradeX</h2>
        <p style={{ maxWidth: '600px', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          A premium quantitative market data platform transforming raw exchange tick data into accurate OHLCV candles. 
          Navigate to the Candles tab to query interactive market visualizations.
        </p>
      </GlassCard>

    </div>
  );
};

export default Dashboard;
