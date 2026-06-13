import React from 'react';
import GlassCard from '../components/GlassCard';
import { Server, Database, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const DataHealth = () => {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl mb-2">Infrastructure Metrics</h2>
      
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Database Status */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-card rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <Database size={24} className="text-healthy" />
            </div>
            <div>
              <h3 className="m-0 text-lg">Database</h3>
              <span className="text-healthy text-sm">Connected</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="text-secondary">Latency</span>
              <span className="font-mono">12ms</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="text-secondary">Active Connections</span>
              <span className="font-mono">42</span>
            </div>
          </div>
        </GlassCard>

        {/* Tick Records */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-card rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <Server size={24} className="text-accent-blue" />
            </div>
            <div>
              <h3 className="m-0 text-lg">Tick Ingestion</h3>
              <span className="text-accent-blue text-sm">Processing</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="text-secondary">Total Tick Records</span>
              <span className="font-mono">15,432,129</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="text-secondary">Ingestion Rate</span>
              <span className="font-mono">~1,200/sec</span>
            </div>
          </div>
        </GlassCard>

        {/* Data Quality */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-card rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <ShieldAlert size={24} className="text-warning" />
            </div>
            <div>
              <h3 className="m-0 text-lg">Data Quality Detection</h3>
              <span className="text-warning text-sm">Monitoring Active</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="text-secondary">Duplicate Ticks</span>
              <span className="font-mono text-warning">14 detected</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="text-secondary">Out-of-Order Ticks</span>
              <span className="font-mono">0</span>
            </div>
          </div>
        </GlassCard>

        {/* Loader Status */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-card rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <CheckCircle2 size={24} className="text-healthy" />
            </div>
            <div>
              <h3 className="m-0 text-lg">Loader Status</h3>
              <span className="text-healthy text-sm">Success</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="text-secondary">Last Run</span>
              <span className="font-mono">2 mins ago</span>
            </div>
            <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
              <span className="text-secondary">Batches Failed</span>
              <span className="font-mono">0</span>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default DataHealth;
