import { motion } from 'framer-motion';
import { VideoSegment } from '@/types/video';
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { formatTime } from '@/lib/videoProcessing';

interface SegmentGridProps {
  segments: VideoSegment[];
  isProcessing: boolean;
}

export const SegmentGrid = ({ segments, isProcessing }: SegmentGridProps) => {
  const getStatusIcon = (status: VideoSegment['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusColor = (status: VideoSegment['status']) => {
    switch (status) {
      case 'pending':
        return 'border-border bg-muted/20';
      case 'processing':
        return 'border-primary bg-primary/10 neon-border-cyan segment-processing';
      case 'completed':
        return 'border-success bg-success/10';
      case 'error':
        return 'border-destructive bg-destructive/10';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Segment Processing</h3>
        <span className="text-sm text-muted-foreground">
          {segments.filter(s => s.status === 'completed').length} / {segments.length} completed
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {segments.map((segment, index) => (
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative p-3 rounded-lg border transition-all
              ${getStatusColor(segment.status)}
            `}
          >
            {/* Progress bar */}
            {segment.status === 'processing' && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-primary rounded-b-lg"
                initial={{ width: 0 }}
                animate={{ width: `${segment.progress}%` }}
                transition={{ duration: 0.1 }}
              />
            )}
            
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-muted-foreground">
                #{segment.id + 1}
              </span>
              {getStatusIcon(segment.status)}
            </div>
            
            <div className="text-sm font-medium">
              {segment.startTime}s - {segment.endTime}s
            </div>
            
            {segment.status === 'processing' && (
              <div className="mt-1 text-xs text-primary">
                {Math.round(segment.progress)}%
              </div>
            )}
            
            {segment.processingTime && (
              <div className="mt-1 text-xs text-muted-foreground">
                {formatTime(segment.processingTime)}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
