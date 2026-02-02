import { motion } from 'framer-motion';
import { Play, Pause, Download, Clock, FileVideo } from 'lucide-react';
import { VideoSegment } from '@/types/video';
import { useState, useRef, useEffect } from 'react';
import { formatTime } from '@/lib/videoProcessing';

interface SegmentVideoGridProps {
  originalFile: File;
  segments: VideoSegment[];
}

interface SegmentVideoData {
  id: number;
  startTime: number;
  endTime: number;
  duration: number;
  isPlaying: boolean;
}

export const SegmentVideoGrid = ({ originalFile, segments }: SegmentVideoGridProps) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [playingSegment, setPlayingSegment] = useState<number | null>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  useEffect(() => {
    const url = URL.createObjectURL(originalFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalFile]);

  const handlePlayPause = (segmentId: number, startTime: number, endTime: number) => {
    const video = videoRefs.current[segmentId];
    if (!video) return;

    if (playingSegment === segmentId) {
      video.pause();
      setPlayingSegment(null);
    } else {
      // Pause any other playing segment
      if (playingSegment !== null && videoRefs.current[playingSegment]) {
        videoRefs.current[playingSegment]?.pause();
      }
      
      video.currentTime = startTime;
      video.play();
      setPlayingSegment(segmentId);

      // Set up time check to stop at end time
      const checkTime = () => {
        if (video.currentTime >= endTime) {
          video.pause();
          video.currentTime = startTime;
          setPlayingSegment(null);
        }
      };

      video.ontimeupdate = checkTime;
    }
  };

  const handleVideoEnded = (segmentId: number) => {
    if (playingSegment === segmentId) {
      setPlayingSegment(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <FileVideo className="w-5 h-5 text-primary" />
          After — Grayscale Segments ({segments.length} × 10s)
        </h3>
        <span className="text-sm text-muted-foreground">
          Click to preview each segment
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {segments.map((segment, index) => (
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group rounded-lg overflow-hidden border border-border bg-card"
          >
            {/* Video player for segment */}
            <div className="relative aspect-video bg-muted">
              <video
                ref={(el) => { videoRefs.current[segment.id] = el; }}
                src={videoUrl}
                className="w-full h-full object-cover grayscale"
                muted
                playsInline
                onEnded={() => handleVideoEnded(segment.id)}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  video.currentTime = segment.startTime;
                }}
              />
              
              {/* Play/Pause overlay */}
              <button
                onClick={() => handlePlayPause(segment.id, segment.startTime, segment.endTime)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                  {playingSegment === segment.id ? (
                    <Pause className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Play className="w-5 h-5 text-primary-foreground ml-1" />
                  )}
                </div>
              </button>

              {/* Playing indicator */}
              {playingSegment === segment.id && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                  Playing
                </div>
              )}
            </div>

            {/* Segment info */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Segment {index + 1}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  #{String(index + 1).padStart(2, '0')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {segment.startTime.toFixed(1)}s — {segment.endTime.toFixed(1)}s
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                Duration: {(segment.endTime - segment.startTime).toFixed(1)}s
                {segment.processingTime && (
                  <span className="ml-2 text-primary">
                    • Processed in {formatTime(segment.processingTime)}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <FileVideo className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{originalFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {segments.length} segments • 10 seconds each
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Duration</p>
          <p className="font-semibold text-foreground">
            {segments.length > 0 ? segments[segments.length - 1].endTime.toFixed(1) : 0}s
          </p>
        </div>
      </div>
    </motion.div>
  );
};
