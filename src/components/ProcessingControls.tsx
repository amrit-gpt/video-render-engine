import { motion } from 'framer-motion';
import { VideoFilter, FILTER_OPTIONS, ProcessingMode } from '@/types/video';
import { Cpu, Layers } from 'lucide-react';

interface ProcessingControlsProps {
  filter: VideoFilter;
  mode: ProcessingMode;
  onFilterChange: (filter: VideoFilter) => void;
  onModeChange: (mode: ProcessingMode) => void;
  disabled?: boolean;
}

export const ProcessingControls = ({
  filter,
  mode,
  onFilterChange,
  onModeChange,
  disabled,
}: ProcessingControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Filter Selection */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Video Filter
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              disabled={disabled}
              className={`
                p-3 rounded-lg border text-left transition-all
                ${filter === option.value
                  ? 'border-primary bg-primary/10 neon-border-cyan'
                  : 'border-border bg-muted/30 hover:border-primary/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="block font-medium text-sm">{option.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Processing Mode Toggle */}
      <div className="sm:w-64">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Processing Mode
        </label>
        <div className="glass-card rounded-lg p-1">
          <div className="relative flex">
            <motion.div
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-md bg-primary"
              initial={false}
              animate={{ x: mode === 'sequential' ? 4 : 'calc(100% + 4px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            
            <button
              onClick={() => onModeChange('sequential')}
              disabled={disabled}
              className={`
                relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md
                font-medium text-sm transition-colors z-10
                ${mode === 'sequential' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <Layers className="w-4 h-4" />
              Sequential
            </button>
            
            <button
              onClick={() => onModeChange('parallel')}
              disabled={disabled}
              className={`
                relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md
                font-medium text-sm transition-colors z-10
                ${mode === 'parallel' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <Cpu className="w-4 h-4" />
              Parallel
            </button>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {mode === 'sequential' 
            ? 'Process segments one at a time'
            : `Use all ${navigator.hardwareConcurrency || 4} CPU cores`
          }
        </p>
      </div>
    </div>
  );
};
