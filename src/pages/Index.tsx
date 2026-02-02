import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoUploadZone } from '@/components/VideoUploadZone';
import { SegmentGrid } from '@/components/SegmentGrid';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { SegmentDownload } from '@/components/SegmentDownload';
import { 
  VideoJob, 
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
import { Cpu, Layers, Zap, RotateCcw } from 'lucide-react';

const Index = () => {
  const [job, setJob] = useState<VideoJob | null>(null);
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

  const startProcessing = async (selectedMode: ProcessingMode) => {
    if (!job) return;

    setMode(selectedMode);
    setJob(prev => prev ? { ...prev, status: 'converting', mode: selectedMode } : prev);
    setElapsedTime(0);

    // Simulate conversion delay
    await new Promise(r => setTimeout(r, 800));
    setJob(prev => prev ? { ...prev, status: 'splitting' } : prev);
    
    // Simulate splitting delay
    await new Promise(r => setTimeout(r, 600));
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
      
      if (selectedMode === 'sequential') {
        segmentTimes = await processSequentially(job.segments, updateSegment);
      } else {
        segmentTimes = await processParallel(job.segments, updateSegment);
      }

      // Simulate merging
      setJob(prev => prev ? { ...prev, status: 'merging' } : prev);
      await new Promise(r => setTimeout(r, 400));

      // Calculate stats
      const stats = calculateStats(segmentTimes, selectedMode);
      
      setJob(prev => prev ? {
        ...prev,
        status: 'completed',
        processedUrl: prev.originalUrl,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-sm text-primary mb-4">
            <Cpu className="w-4 h-4" />
            Hackathon Demo
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
            TEAM IGNITERS
          </h1>
          
          <p className="text-muted-foreground max-w-xl mx-auto">
            Grayscale Render Performance Demo — Compare sequential vs parallel video processing
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Cpu className="w-4 h-4" />
            <span>{navigator.hardwareConcurrency || 4} CPU cores detected</span>
          </div>
        </motion.header>

        {/* Main content */}
        <div className="space-y-6">
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
                className="space-y-6"
              >
                {/* Filter label and mode buttons */}
                <div className="p-6 rounded-lg bg-card border border-border">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Filter Applied</p>
                    <p className="text-lg font-semibold text-foreground">Grayscale Render (Performance Demo)</p>
                  </div>

                  {/* Mode buttons */}
                  {job.status === 'idle' && (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => startProcessing('sequential')}
                        className="flex flex-col items-center gap-2 p-6 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all"
                      >
                        <Layers className="w-8 h-8 text-muted-foreground" />
                        <span className="font-semibold text-foreground">⚙️ Sequential</span>
                        <span className="text-xs text-muted-foreground">One segment at a time</span>
                      </button>
                      
                      <button
                        onClick={() => startProcessing('parallel')}
                        className="flex flex-col items-center gap-2 p-6 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all"
                      >
                        <Zap className="w-8 h-8 text-primary" />
                        <span className="font-semibold text-foreground">🚀 Parallel</span>
                        <span className="text-xs text-muted-foreground">All cores simultaneously</span>
                      </button>
                    </div>
                  )}

                  {/* Reprocess / New Video buttons */}
                  {job.status === 'completed' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => startProcessing('sequential')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Run Sequential
                      </button>
                      <button
                        onClick={() => startProcessing('parallel')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Run Parallel
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
                      >
                        New Video
                      </button>
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-3 py-3 rounded-lg bg-primary/10 border border-primary/30"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-foreground capitalize">{job.status}...</span>
                  </motion.div>
                )}

                {/* Segment Grid */}
                <div className="p-6 rounded-lg bg-card border border-border">
                  <SegmentGrid
                    segments={job.segments}
                    isProcessing={isProcessing}
                  />
                </div>

                {/* Performance Dashboard */}
                <div className="p-6 rounded-lg bg-card border border-border">
                  <PerformanceDashboard
                    stats={job.stats || null}
                    mode={job.mode}
                    elapsedTime={elapsedTime}
                    isProcessing={isProcessing}
                  />
                </div>

                {/* Segment Download */}
                {job.status === 'completed' && (
                  <div className="p-6 rounded-lg bg-card border border-border">
                    <SegmentDownload
                      originalFile={job.originalFile}
                      segments={job.segments}
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
          transition={{ delay: 0.3 }}
          className="text-center mt-12 pt-6 border-t border-border"
        >
          <p className="text-sm text-muted-foreground">
            TEAM IGNITERS — Parallel Processing Performance Demo
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
