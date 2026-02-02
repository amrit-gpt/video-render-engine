import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download } from 'lucide-react';

interface VideoComparisonProps {
  originalUrl: string;
  processedUrl: string;
  onDownload: () => void;
}

export const VideoComparison = ({ originalUrl, processedUrl, onDownload }: VideoComparisonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const originalRef = useRef<HTMLVideoElement>(null);
  const processedRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncVideos = () => {
      if (originalRef.current && processedRef.current) {
        processedRef.current.currentTime = originalRef.current.currentTime;
      }
    };

    originalRef.current?.addEventListener('timeupdate', syncVideos);
    return () => originalRef.current?.removeEventListener('timeupdate', syncVideos);
  }, []);

  const togglePlay = () => {
    if (originalRef.current && processedRef.current) {
      if (isPlaying) {
        originalRef.current.pause();
        processedRef.current.pause();
      } else {
        originalRef.current.play();
        processedRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.max(10, Math.min(90, x)));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Before vs After</h3>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-black cursor-col-resize border border-border"
        onMouseMove={handleMouseMove}
      >
        {/* Original Video (Left) */}
        <video
          ref={originalRef}
          src={originalUrl}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
        />

        {/* Processed Video (Right) with clip */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
        >
          <video
            ref={processedRef}
            src={processedUrl}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary"
          style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">⟷</span>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 text-xs font-medium text-white">
          Original
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-primary text-xs font-medium text-primary-foreground">
          Grayscale
        </div>

        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 p-2 rounded-full bg-black/70 hover:bg-black/90 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Drag slider to compare • Click center to play/pause
      </p>
    </motion.div>
  );
};
