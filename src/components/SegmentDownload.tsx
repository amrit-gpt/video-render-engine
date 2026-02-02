import { motion } from 'framer-motion';
import { Download, FileVideo, Package } from 'lucide-react';
import JSZip from 'jszip';
import { VideoSegment } from '@/types/video';
import { useState } from 'react';

interface SegmentDownloadProps {
  originalFile: File;
  segments: VideoSegment[];
}

export const SegmentDownload = ({ originalFile, segments }: SegmentDownloadProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadZip = async () => {
    setIsGenerating(true);
    
    try {
      const zip = new JSZip();
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const videoUrl = URL.createObjectURL(originalFile);
      video.src = videoUrl;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      const duration = video.duration;
      const segmentDuration = 10;
      const segmentCount = Math.ceil(duration / segmentDuration);
      
      // Create a manifest file
      const manifest = {
        originalFile: originalFile.name,
        totalDuration: duration,
        segmentDuration: segmentDuration,
        segmentCount: segmentCount,
        segments: segments.map((seg, i) => ({
          id: i + 1,
          startTime: seg.startTime,
          endTime: seg.endTime,
          duration: seg.endTime - seg.startTime,
          filename: `segment_${String(i + 1).padStart(3, '0')}.txt`
        })),
        processedAt: new Date().toISOString(),
        note: "This demo simulates video splitting. In production, actual video segments would be included."
      };
      
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      
      // Add segment info files (simulation - in production these would be actual video files)
      segments.forEach((seg, i) => {
        const segmentInfo = `Segment ${i + 1}
-----------------
Start Time: ${seg.startTime.toFixed(2)}s
End Time: ${seg.endTime.toFixed(2)}s
Duration: ${(seg.endTime - seg.startTime).toFixed(2)}s
Processing Time: ${seg.processingTime ? `${seg.processingTime}ms` : 'N/A'}
Status: ${seg.status}

Note: This is a simulation file. 
In a production environment with FFmpeg backend, 
this would be the actual processed video segment.`;
        
        zip.file(`segment_${String(i + 1).padStart(3, '0')}.txt`, segmentInfo);
      });
      
      // Add a readme
      const readme = `TEAM IGNITERS - Video Segment Export
=====================================

This ZIP contains the split segments from your video processing demo.

Original File: ${originalFile.name}
Total Duration: ${duration.toFixed(2)} seconds
Number of Segments: ${segmentCount}
Segment Length: ${segmentDuration} seconds each

Files Included:
- manifest.json: Complete processing metadata
- segment_XXX.txt: Info for each segment

NOTE: This is a frontend simulation. With a real FFmpeg backend,
each segment_XXX.txt would be replaced with actual video files
(segment_XXX.mp4) containing the grayscale-processed video.

Processed with ❤️ by TEAM IGNITERS`;
      
      zip.file('README.txt', readme);
      
      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
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
          Download Segments
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
              Split into {segments.length} segments of 10 seconds each
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {segments.slice(0, 6).map((seg, i) => (
            <div key={seg.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">Segment {i + 1}</span>
              <span className="text-foreground ml-auto">{(seg.endTime - seg.startTime).toFixed(1)}s</span>
            </div>
          ))}
          {segments.length > 6 && (
            <div className="flex items-center justify-center p-2 rounded bg-muted/50 text-sm text-muted-foreground">
              +{segments.length - 6} more segments
            </div>
          )}
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Generating ZIP...
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
        ZIP includes manifest, segment info, and processing metadata
      </p>
    </motion.div>
  );
};
