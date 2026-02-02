export type ProcessingMode = 'sequential' | 'parallel';
export type SegmentStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface VideoSegment {
  id: number;
  status: SegmentStatus;
  progress: number;
  startTime: number;
  endTime: number;
  processingTime?: number;
}

export interface ProcessingStats {
  totalTime: number;
  perSegmentTimes: number[];
  cpuCores: number;
  speedupFactor: number;
  sequentialTime: number;
  parallelTime: number;
  segmentCount: number;
}

export interface VideoJob {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl?: string;
  mode: ProcessingMode;
  segments: VideoSegment[];
  stats?: ProcessingStats;
  status: 'idle' | 'converting' | 'splitting' | 'processing' | 'merging' | 'completed' | 'error';
  error?: string;
}

export const SUPPORTED_FORMATS = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'video/hevc',
  'video/x-m4v',
];
