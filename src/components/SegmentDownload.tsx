import { motion } from 'framer-motion';
import { Download, FileVideo, Package, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { VideoSegment } from '@/types/video';
import { useState, useRef } from 'react';

interface SegmentDownloadProps {
  originalFile: File;
  segments: VideoSegment[];
}

export const SegmentDownload = ({ originalFile, segments }: SegmentDownloadProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });

  const captureSegmentAsVideo = async (
    videoUrl: string,
    startTime: number,
    endTime: number,
    segmentIndex: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 1280);
        canvas.height = Math.min(video.videoHeight, 720);
        const ctx = canvas.getContext('2d')!;

        // Seek to start
        video.currentTime = startTime;

        await new Promise<void>((res) => {
          video.onseeked = () => res();
        });

        // Apply grayscale filter
        ctx.filter = 'grayscale(100%)';

        // Set up MediaRecorder
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2500000,
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };

        mediaRecorder.onerror = () => reject(new Error('Recording failed'));

        // Start recording and playing
        mediaRecorder.start();
        video.play();

        const drawFrame = () => {
          if (video.currentTime >= endTime || video.ended) {
            video.pause();
            mediaRecorder.stop();
            return;
          }
          
          // Draw frame in original color
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };

        drawFrame();
      };

      video.onerror = () => reject(new Error('Failed to load video'));
    });
  };

  const handleDownloadZip = async () => {
    setIsGenerating(true);
    setProgress({ current: 0, total: segments.length, status: 'Preparing...' });

    try {
      const zip = new JSZip();
      const videoUrl = URL.createObjectURL(originalFile);

      // Capture each segment as a video
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        setProgress({ 
          current: i + 1, 
          total: segments.length, 
          status: `Recording segment ${i + 1}...` 
        });

        try {
          const videoBlob = await captureSegmentAsVideo(
            videoUrl,
            seg.startTime,
            seg.endTime,
            i
          );
          
          const filename = `segment_${String(i + 1).padStart(3, '0')}_${seg.startTime.toFixed(0)}s-${seg.endTime.toFixed(0)}s.webm`;
          zip.file(filename, videoBlob);
        } catch (err) {
          console.error(`Failed to capture segment ${i + 1}:`, err);
        }
      }

      // Add manifest
      setProgress({ current: segments.length, total: segments.length, status: 'Creating manifest...' });
      
      const manifest = {
        originalFile: originalFile.name,
        segmentCount: segments.length,
        segmentDuration: 10,
        segments: segments.map((seg, i) => ({
          id: i + 1,
          filename: `segment_${String(i + 1).padStart(3, '0')}_${seg.startTime.toFixed(0)}s-${seg.endTime.toFixed(0)}s.webm`,
          startTime: seg.startTime,
          endTime: seg.endTime,
          duration: seg.endTime - seg.startTime,
        })),
        processedAt: new Date().toISOString(),
        filter: 'Original Color',
        team: 'TEAM IGNITERS'
      };

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));

      // Generate and download
      setProgress({ current: segments.length, total: segments.length, status: 'Compressing ZIP...' });
      
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${originalFile.name.replace(/\.[^/.]+$/, '')}_segments.zip`;
      a.click();

      URL.revokeObjectURL(url);
      URL.revokeObjectURL(videoUrl);
    } catch (error) {
      console.error('Failed to generate ZIP:', error);
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0, status: '' });
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
          <Package className="w-5 h-5 text-primary" />
          Download Video Segments
        </h3>
      </div>

      <div className="p-6 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-primary/20">
            <FileVideo className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{originalFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {segments.length} video segments (10 seconds each)
            </p>
          </div>
        </div>

        {/* Segment preview list */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
          {segments.map((seg, i) => (
            <div key={seg.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
              <FileVideo className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-foreground font-medium">Segment {i + 1}</span>
                <span className="text-muted-foreground text-xs block">
                  {seg.startTime.toFixed(0)}s — {seg.endTime.toFixed(0)}s
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicator */}
        {isGenerating && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">{progress.status}</span>
              <span className="text-foreground font-medium">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={handleDownloadZip}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Recording Segments...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download All Segments (.zip)
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Each segment is a separate .webm video file in original color
      </p>
    </motion.div>
  );
};
