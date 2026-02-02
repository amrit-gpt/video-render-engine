import { VideoJob, VideoSegment, ProcessingStats, ProcessingMode, VideoFilter } from '@/types/video';

const SEGMENT_DURATION = 10; // seconds
const SIMULATED_PROCESSING_BASE = 800; // ms per segment base time
const CPU_CORES = navigator.hardwareConcurrency || 4;

export const generateJobId = (): string => {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createVideoSegments = (duration: number): VideoSegment[] => {
  const segmentCount = Math.ceil(duration / SEGMENT_DURATION);
  return Array.from({ length: segmentCount }, (_, i) => ({
    id: i,
    status: 'pending' as const,
    progress: 0,
    startTime: i * SEGMENT_DURATION,
    endTime: Math.min((i + 1) * SEGMENT_DURATION, duration),
  }));
};

export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

const simulateSegmentProcessing = (
  segment: VideoSegment,
  filter: VideoFilter,
  onProgress: (progress: number) => void
): Promise<number> => {
  return new Promise((resolve) => {
    const baseTime = SIMULATED_PROCESSING_BASE;
    const filterMultiplier = filter === 'edge' ? 1.5 : filter === 'blur' ? 1.3 : 1;
    const segmentDuration = segment.endTime - segment.startTime;
    const totalTime = baseTime * filterMultiplier * (segmentDuration / 10);
    
    // Add some randomness
    const variance = Math.random() * 200 - 100;
    const finalTime = Math.max(500, totalTime + variance);
    
    const startTime = Date.now();
    const steps = 20;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      onProgress((currentStep / steps) * 100);
      
      if (currentStep >= steps) {
        clearInterval(interval);
        resolve(Date.now() - startTime);
      }
    }, finalTime / steps);
  });
};

export const processSequentially = async (
  segments: VideoSegment[],
  filter: VideoFilter,
  onSegmentUpdate: (segment: VideoSegment) => void
): Promise<number[]> => {
  const times: number[] = [];
  
  for (const segment of segments) {
    onSegmentUpdate({ ...segment, status: 'processing', progress: 0 });
    
    const time = await simulateSegmentProcessing(segment, filter, (progress) => {
      onSegmentUpdate({ ...segment, status: 'processing', progress });
    });
    
    times.push(time);
    onSegmentUpdate({ ...segment, status: 'completed', progress: 100, processingTime: time });
  }
  
  return times;
};

export const processParallel = async (
  segments: VideoSegment[],
  filter: VideoFilter,
  onSegmentUpdate: (segment: VideoSegment) => void
): Promise<number[]> => {
  const promises = segments.map(async (segment) => {
    // Stagger start slightly to simulate realistic parallel behavior
    await new Promise(r => setTimeout(r, segment.id * 50));
    
    onSegmentUpdate({ ...segment, status: 'processing', progress: 0 });
    
    const time = await simulateSegmentProcessing(segment, filter, (progress) => {
      onSegmentUpdate({ ...segment, status: 'processing', progress });
    });
    
    onSegmentUpdate({ ...segment, status: 'completed', progress: 100, processingTime: time });
    return time;
  });
  
  return Promise.all(promises);
};

export const calculateStats = (
  segmentTimes: number[],
  mode: ProcessingMode,
  sequentialTime?: number
): ProcessingStats => {
  const totalTime = mode === 'sequential' 
    ? segmentTimes.reduce((a, b) => a + b, 0)
    : Math.max(...segmentTimes) + 500; // Parallel takes max + merge overhead
  
  const estimatedSequential = sequentialTime || segmentTimes.reduce((a, b) => a + b, 0);
  const speedupFactor = mode === 'parallel' 
    ? estimatedSequential / totalTime 
    : 1;
  
  return {
    totalTime,
    perSegmentTimes: segmentTimes,
    cpuCores: CPU_CORES,
    speedupFactor: Math.round(speedupFactor * 100) / 100,
    sequentialTime: mode === 'sequential' ? totalTime : estimatedSequential,
    parallelTime: mode === 'parallel' ? totalTime : undefined,
  };
};

export const formatTime = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
