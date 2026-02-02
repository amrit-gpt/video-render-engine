import { motion } from 'framer-motion';
import { ProcessingStats, ProcessingMode } from '@/types/video';
import { formatTime } from '@/lib/videoProcessing';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Cpu, Clock, Zap, TrendingUp } from 'lucide-react';

interface PerformanceDashboardProps {
  stats: ProcessingStats | null;
  mode: ProcessingMode;
  elapsedTime: number;
  isProcessing: boolean;
}

export const PerformanceDashboard = ({
  stats,
  mode,
  elapsedTime,
  isProcessing,
}: PerformanceDashboardProps) => {
  const chartData = stats?.perSegmentTimes.map((time, index) => ({
    name: `Seg ${index + 1}`,
    time: time,
  })) || [];

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subValue,
    color = 'primary'
  }: { 
    icon: React.ComponentType<{ className?: string }>; 
    label: string; 
    value: string;
    subValue?: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning';
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        glass-card rounded-xl p-4 border
        ${color === 'primary' ? 'border-primary/30' : ''}
        ${color === 'secondary' ? 'border-secondary/30' : ''}
        ${color === 'success' ? 'border-success/30' : ''}
        ${color === 'warning' ? 'border-warning/30' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg
          ${color === 'primary' ? 'bg-primary/20 text-primary' : ''}
          ${color === 'secondary' ? 'bg-secondary/20 text-secondary' : ''}
          ${color === 'success' ? 'bg-success/20 text-success' : ''}
          ${color === 'warning' ? 'bg-warning/20 text-warning' : ''}
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold font-mono">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Performance Dashboard
        </h3>
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Processing...
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Total Time"
          value={formatTime(stats?.totalTime || elapsedTime)}
          color="primary"
        />
        <StatCard
          icon={Cpu}
          label="CPU Cores"
          value={String(stats?.cpuCores || navigator.hardwareConcurrency || 4)}
          subValue={mode === 'parallel' ? 'All utilized' : '1 active'}
          color="secondary"
        />
        <StatCard
          icon={Zap}
          label="Speedup Factor"
          value={stats?.speedupFactor ? `${stats.speedupFactor}x` : '—'}
          subValue={mode === 'parallel' ? 'vs sequential' : 'Baseline'}
          color="success"
        />
        <StatCard
          icon={TrendingUp}
          label="Mode"
          value={mode === 'parallel' ? 'Parallel' : 'Sequential'}
          subValue={mode === 'parallel' ? 'Multi-threaded' : 'Single-threaded'}
          color="warning"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 border border-border"
        >
          <h4 className="font-medium mb-4">Per-Segment Processing Time</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value}ms`, 'Time']}
                />
                <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={`hsl(${175 + index * 10}, 70%, 50%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Comparison */}
      {stats?.sequentialTime && stats?.parallelTime && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 border border-success/30"
        >
          <h4 className="font-medium mb-3">Sequential vs Parallel Comparison</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Sequential</span>
                <span className="font-mono">{formatTime(stats.sequentialTime)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-muted-foreground rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Parallel</span>
                <span className="font-mono text-success">{formatTime(stats.parallelTime)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-success rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.parallelTime / stats.sequentialTime) * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
