import React from 'react';
import GlassCard from '../components/GlassCard';
import { TrendingUp, TrendingDown, Maximize2, Minimize2, BarChart2 } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl mb-2">Statistical Insights</h2>
      
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary">Highest Price</span>
            <TrendingUp size={20} className="text-healthy" />
          </div>
          <div className="text-2xl font-semibold">2,984.50</div>
          <div className="text-xs text-secondary mt-2">RELIANCE (All-time)</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary">Lowest Price</span>
            <TrendingDown size={20} className="text-error" />
          </div>
          <div className="text-2xl font-semibold">840.10</div>
          <div className="text-xs text-secondary mt-2">RELIANCE (All-time)</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary">Avg Volume</span>
            <BarChart2 size={20} className="text-accent-blue" />
          </div>
          <div className="text-2xl font-semibold">4.2M</div>
          <div className="text-xs text-secondary mt-2">Daily Average</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary">Avg Daily Range</span>
            <Maximize2 size={20} className="text-accent-purple" />
          </div>
          <div className="text-2xl font-semibold">42.50</div>
          <div className="text-xs text-secondary mt-2">Points spread</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-secondary">Total Candles</span>
            <Minimize2 size={20} className="text-accent-cyan" />
          </div>
          <div className="text-2xl font-semibold">2.4M</div>
          <div className="text-xs text-secondary mt-2">1min Resolution</div>
        </GlassCard>
      </div>

      <h2 className="text-xl mt-4 mb-2">Trend Analysis</h2>
      <div className="flex gap-6">
        <GlassCard className="p-6 flex-1" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-secondary">Price Movement Trends Visualization Placeholder</p>
        </GlassCard>
        <GlassCard className="p-6 flex-1" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-secondary">Volume Distribution Heatmap Placeholder</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default Analytics;
