import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Activity, Database, Terminal } from 'lucide-react';
import GlassCard from './GlassCard';

const Layout = () => {
  return (
    <div className="flex" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar Navigation */}
      <GlassCard className="w-64 p-6 flex-col" style={{ borderRadius: 0, borderRight: '1px solid var(--glass-border)', zIndex: 10 }}>
        <div className="flex items-center gap-4 mb-8">
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', borderRadius: 8 }}></div>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>TradeX</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink to="/" className={({ isActive }) => `flex items-center gap-4 p-4 glass-panel ${isActive ? 'bg-card-hover' : ''}`} style={({ isActive }) => isActive ? { borderColor: 'rgba(255,255,255,0.2)', color: 'var(--accent-cyan)' } : {}}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/candles" className={({ isActive }) => `flex items-center gap-4 p-4 glass-panel`} style={({ isActive }) => isActive ? { borderColor: 'rgba(255,255,255,0.2)', color: 'var(--accent-cyan)' } : {}}>
            <BarChart2 size={20} /> Candles
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `flex items-center gap-4 p-4 glass-panel`} style={({ isActive }) => isActive ? { borderColor: 'rgba(255,255,255,0.2)', color: 'var(--accent-cyan)' } : {}}>
            <Activity size={20} /> Analytics
          </NavLink>
          <NavLink to="/health" className={({ isActive }) => `flex items-center gap-4 p-4 glass-panel`} style={({ isActive }) => isActive ? { borderColor: 'rgba(255,255,255,0.2)', color: 'var(--accent-cyan)' } : {}}>
            <Database size={20} /> Data Health
          </NavLink>
          <NavLink to="/api" className={({ isActive }) => `flex items-center gap-4 p-4 glass-panel`} style={({ isActive }) => isActive ? { borderColor: 'rgba(255,255,255,0.2)', color: 'var(--accent-cyan)' } : {}}>
            <Terminal size={20} /> API Explorer
          </NavLink>
        </nav>
      </GlassCard>

      {/* Main Content Area */}
      <div className="flex flex-col w-full" style={{ overflowY: 'auto' }}>
        {/* Top Header */}
        <header className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--glass-border)', zIndex: 10 }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Market Data Infrastructure</h2>
          
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--status-healthy)' }}></div>
              <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Environment: Prod</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--status-healthy)' }}></div>
              <span className="text-secondary" style={{ fontSize: '0.875rem' }}>DB Connected</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
