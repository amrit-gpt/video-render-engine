export type VideoFilter = 'grayscale' | 'blur' | 'edge' | 'colorboost';
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
  sequentialTime?: number;
  parallelTime?: number;
}

export interface VideoJob {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl?: string;
  filter: VideoFilter;
  mode: ProcessingMode;
  segments: VideoSegment[];
  stats?: ProcessingStats;
  status: 'idle' | 'uploading' | 'converting' | 'splitting' | 'processing' | 'merging' | 'completed' | 'error';
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

export const FILTER_OPTIONS: { value: VideoFilter; label: string; description: string }[] = [
  { value: 'grayscale', label: 'Grayscale', description: 'Convert to black & white' },
  { value: 'blur', label: 'Blur', description: 'Apply gaussian blur effect' },
  { value: 'edge', label: 'Edge Detection', description: 'Highlight edges and contours' },
  { value: 'colorboost', label: 'Color Boost', description: 'Enhance saturation and vibrance' },
];
