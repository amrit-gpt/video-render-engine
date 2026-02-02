import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Video, X, AlertCircle } from 'lucide-react';
import { SUPPORTED_FORMATS } from '@/types/video';
import { formatFileSize } from '@/lib/videoProcessing';

interface VideoUploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const VideoUploadZone = ({ onFileSelect, disabled }: VideoUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  const validateFile = (file: File): boolean => {
    const isValidType = SUPPORTED_FORMATS.some(format => 
      file.type === format || file.name.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm|heic|hevc|m4v)$/)
    );
    
    if (!isValidType) {
      setError('Unsupported format. Please upload MP4, MOV, AVI, MKV, WebM, or HEIF/HEVC files.');
      return false;
    }
    
    if (file.size > 500 * 1024 * 1024) {
      setError('File too large. Maximum size is 500MB.');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      const url = URL.createObjectURL(file);
      setPreview({ file, url });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleConfirm = () => {
    if (preview) {
      onFileSelect(preview.file);
    }
  };

  const handleClear = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <label
              className={`
                relative flex flex-col items-center justify-center w-full h-64 
                rounded-lg border-2 border-dashed cursor-pointer transition-all
                ${isDragging 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="hidden"
                accept=".mp4,.mov,.avi,.mkv,.webm,.heic,.hevc,.m4v"
                onChange={handleChange}
                disabled={disabled}
              />
              
              <motion.div
                className="flex flex-col items-center gap-4"
                animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
              >
                <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {isDragging ? 'Drop your video here' : 'Drag & drop your video'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {['MP4', 'MOV', 'AVI', 'MKV', 'WebM'].map((format) => (
                    <span
                      key={format}
                      className="px-2 py-0.5 text-xs font-mono rounded bg-muted text-muted-foreground"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </motion.div>
            </label>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-lg p-4 bg-card border border-border"
          >
            <div className="flex items-start gap-4">
              <div className="relative w-48 h-32 rounded-lg overflow-hidden bg-black">
                <video
                  src={preview.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <Video className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{preview.file.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatFileSize(preview.file.size)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Type: {preview.file.type || 'video/*'}
                </p>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    Process Video
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-2 rounded-lg bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
