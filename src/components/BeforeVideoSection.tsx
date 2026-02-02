import { motion } from 'framer-motion';
import { Play, Pause, Film } from 'lucide-react';
import { useState, useRef } from 'react';

interface BeforeVideoSectionProps {
  videoUrl: string;
  fileName: string;
}

export const BeforeVideoSection = ({ videoUrl, fileName }: BeforeVideoSectionProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
          <Film className="w-5 h-5 text-primary" />
          Before — Original Video
        </h3>
        <span className="text-sm text-muted-foreground px-2 py-1 rounded bg-muted">
          Full Color
        </span>
      </div>

      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-border">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Original label */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
          ORIGINAL
        </div>

        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
          <span className="text-white text-sm font-medium">
            {isPlaying ? 'Pause' : 'Play'}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{fileName}</span>
        <span>Click to play original video</span>
      </div>
    </motion.div>
  );
};
