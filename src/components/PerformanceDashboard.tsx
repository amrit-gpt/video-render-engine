import { motion } from 'framer-motion';
import { ProcessingStats, ProcessingMode } from '@/types/video';
import { formatTime } from '@/lib/videoProcessing';
import { Clock, Cpu, Zap, TrendingUp } from 'lucide-react';

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
  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-foreground">Performance Metrics</h3>

      {/* Live timer during processing */}
      {isProcessing && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <p className="text-sm text-muted-foreground">Processing ({mode})</p>
              <p className="text-2xl font-bold text-primary font-mono">
                {formatTime(elapsedTime)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats after completion */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Speedup highlight */}
          <div className="p-6 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Speedup Factor</span>
            </div>
            <p className="text-5xl font-bold text-primary">
              {stats.speedupFactor.toFixed(1)}×
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Faster with parallel processing
            </p>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Clock className="w-4 h-4" />}
              label="Sequential Time"
              value={formatTime(stats.sequentialTime)}
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Parallel Time"
              value={formatTime(stats.parallelTime)}
              highlight
            />
            <MetricCard
              icon={<Cpu className="w-4 h-4" />}
              label="CPU Cores"
              value={stats.cpuCores.toString()}
            />
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Segments"
              value={stats.segmentCount.toString()}
            />
          </div>

          {/* Comparison bar */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm font-medium text-foreground mb-3">Sequential vs Parallel</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Sequential</span>
                  <span className="font-mono">{formatTime(stats.sequentialTime)}</span>
                </div>
                <div className="h-3 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-muted-foreground rounded" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Parallel</span>
                  <span className="font-mono text-primary">{formatTime(stats.parallelTime)}</span>
                </div>
                <div className="h-3 bg-muted rounded overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.parallelTime / stats.sequentialTime) * 100}%` }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Per-segment times */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm font-medium text-foreground mb-3">Per-Segment Times</p>
            <div className="flex flex-wrap gap-2">
              {stats.perSegmentTimes.map((time, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded bg-secondary text-xs font-mono text-secondary-foreground"
                >
                  #{i + 1}: {formatTime(time)}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!stats && !isProcessing && (
        <div className="p-8 text-center text-muted-foreground">
          <p>Process a video to see performance metrics</p>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className={`p-4 rounded-lg border ${highlight ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border'}`}>
    <div className={`flex items-center gap-2 mb-1 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className={`text-xl font-bold font-mono ${highlight ? 'text-primary' : 'text-foreground'}`}>
      {value}
    </p>
  </div>
);
