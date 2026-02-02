import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoUploadZone } from '@/components/VideoUploadZone';
import { ProcessingControls } from '@/components/ProcessingControls';
import { SegmentGrid } from '@/components/SegmentGrid';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { VideoComparison } from '@/components/VideoComparison';
import { 
  VideoJob, 
  VideoFilter, 
  ProcessingMode, 
  VideoSegment 
} from '@/types/video';
import {
  generateJobId,
  createVideoSegments,
  getVideoDuration,
  processSequentially,
  processParallel,
  calculateStats,
} from '@/lib/videoProcessing';
import { Cpu, Zap, GitBranch, Play, RotateCcw } from 'lucide-react';

const Index = () => {
  const [job, setJob] = useState<VideoJob | null>(null);
  const [filter, setFilter] = useState<VideoFilter>('grayscale');
  const [mode, setMode] = useState<ProcessingMode>('parallel');
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isProcessing = job?.status === 'processing' || job?.status === 'converting' || job?.status === 'splitting' || job?.status === 'merging';

  useEffect(() => {
    if (isProcessing) {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isProcessing]);

  const handleFileSelect = async (file: File) => {
    try {
      const duration = await getVideoDuration(file);
      const segments = createVideoSegments(duration);
      
      const newJob: VideoJob = {
        id: generateJobId(),
        originalFile: file,
        originalUrl: URL.createObjectURL(file),
        filter,
        mode,
        segments,
        status: 'idle',
      };
      
      setJob(newJob);
    } catch (error) {
      console.error('Failed to load video:', error);
    }
  };

  const updateSegment = useCallback((updatedSegment: VideoSegment) => {
    setJob(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        segments: prev.segments.map(s => 
          s.id === updatedSegment.id ? updatedSegment : s
        ),
      };
    });
  }, []);

  const startProcessing = async () => {
    if (!job) return;

    setJob(prev => prev ? { ...prev, status: 'converting', mode, filter } : prev);
    setElapsedTime(0);

    // Simulate conversion delay
    await new Promise(r => setTimeout(r, 1000));
    setJob(prev => prev ? { ...prev, status: 'splitting' } : prev);
    
    // Simulate splitting delay
    await new Promise(r => setTimeout(r, 800));
    setJob(prev => prev ? { ...prev, status: 'processing' } : prev);

    // Reset segments
    setJob(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        segments: prev.segments.map(s => ({
          ...s,
          status: 'pending' as const,
          progress: 0,
          processingTime: undefined,
        })),
      };
    });

    try {
      let segmentTimes: number[];
      
      if (mode === 'sequential') {
        segmentTimes = await processSequentially(job.segments, filter, updateSegment);
      } else {
        segmentTimes = await processParallel(job.segments, filter, updateSegment);
      }

      // Simulate merging
      setJob(prev => prev ? { ...prev, status: 'merging' } : prev);
      await new Promise(r => setTimeout(r, 600));

      // Calculate stats
      const stats = calculateStats(segmentTimes, mode);
      
      setJob(prev => prev ? {
        ...prev,
        status: 'completed',
        processedUrl: prev.originalUrl, // In a real app, this would be the processed video
        stats,
      } : prev);
    } catch (error) {
      console.error('Processing failed:', error);
      setJob(prev => prev ? { ...prev, status: 'error', error: 'Processing failed' } : prev);
    }
  };

  const handleReset = () => {
    if (job?.originalUrl) {
      URL.revokeObjectURL(job.originalUrl);
    }
    setJob(null);
    setElapsedTime(0);
  };

  const handleDownload = () => {
    // In a real app, this would download the processed video
    if (job?.processedUrl) {
      const a = document.createElement('a');
      a.href = job.processedUrl;
      a.download = `processed_${job.originalFile.name}`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div className="relative container py-8 max-w-6xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm text-primary mb-4">
            <Cpu className="w-4 h-4" />
            Hackathon Project
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">TEAM IGNITERS</span>
          </h1>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience parallel processing power. Upload a video, apply filters, and watch as multiple CPU cores 
            process segments simultaneously for dramatic speedups.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { icon: Zap, label: 'Multi-core Processing' },
              { icon: GitBranch, label: 'Segment Parallelization' },
              { icon: Cpu, label: 'Real-time Metrics' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-sm"
              >
                <Icon className="w-4 h-4 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </motion.header>

        {/* Main content */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {!job ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VideoUploadZone onFileSelect={handleFileSelect} />
              </motion.div>
            ) : (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Controls */}
                <div className="glass-card rounded-xl p-6 border border-border">
                  <ProcessingControls
                    filter={filter}
                    mode={mode}
                    onFilterChange={setFilter}
                    onModeChange={setMode}
                    disabled={isProcessing || job.status === 'completed'}
                  />

                  <div className="flex gap-3 mt-6">
                    {job.status === 'idle' && (
                      <button
                        onClick={startProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors pulse-glow"
                      >
                        <Play className="w-5 h-5" />
                        Start Processing
                      </button>
                    )}
                    
                    {job.status === 'completed' && (
                      <button
                        onClick={startProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Reprocess
                      </button>
                    )}
                    
                    <button
                      onClick={handleReset}
                      disabled={isProcessing}
                      className="px-6 py-3 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                    >
                      New Video
                    </button>
                  </div>
                </div>

                {/* Status indicator */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-3 py-3 rounded-lg bg-primary/10 border border-primary/30"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium capitalize">{job.status}...</span>
                  </motion.div>
                )}

                {/* Segment Grid */}
                <div className="glass-card rounded-xl p-6 border border-border">
                  <SegmentGrid
                    segments={job.segments}
                    isProcessing={isProcessing}
                  />
                </div>

                {/* Performance Dashboard */}
                <div className="glass-card rounded-xl p-6 border border-border">
                  <PerformanceDashboard
                    stats={job.stats || null}
                    mode={job.mode}
                    elapsedTime={elapsedTime}
                    isProcessing={isProcessing}
                  />
                </div>

                {/* Video Comparison */}
                {job.status === 'completed' && job.processedUrl && (
                  <div className="glass-card rounded-xl p-6 border border-border">
                    <VideoComparison
                      originalUrl={job.originalUrl}
                      processedUrl={job.processedUrl}
                      onDownload={handleDownload}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 pt-8 border-t border-border"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">TEAM IGNITERS</span>
            <br />
            <span className="text-xs">Demonstrating parallel processing performance improvements</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <Cpu className="w-3 h-3" />
            <span>{navigator.hardwareConcurrency || 4} CPU cores detected</span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
