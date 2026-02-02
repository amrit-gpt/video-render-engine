import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Download, SplitSquareHorizontal } from 'lucide-react';

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
    // Sync both videos
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
        <h3 className="font-semibold flex items-center gap-2">
          <SplitSquareHorizontal className="w-5 h-5 text-primary" />
          Before vs After Comparison
        </h3>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Result
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-black cursor-col-resize neon-border-cyan"
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
          className="absolute top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
          style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <SplitSquareHorizontal className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-sm font-medium">
          Original
        </div>
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-primary/80 backdrop-blur-sm text-sm font-medium text-primary-foreground">
          Processed
        </div>

        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Drag the slider to compare • Click to play/pause
      </p>
    </motion.div>
  );
};
