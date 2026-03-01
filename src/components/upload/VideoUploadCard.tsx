import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle2, AlertTriangle, XCircle, Camera, Scissors, Clock, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";

export interface VideoFile {
  file: File | null;
  status: 'empty' | 'uploading' | 'validating' | 'ok' | 'warning' | 'error';
  previewUrl?: string;
  comment?: string;
  bestMoment?: string;
  errorMessage?: string;
  warningMessage?: string;
}

interface VideoUploadCardProps {
  title: string;
  subtitle?: string;
  description: string;
  duration: string;
  example?: string;
  maxDurationSec: number;
  maxSizeMB: number;
  suggestedName: string;
  video: VideoFile;
  onChange: (video: VideoFile) => void;
  showCapture?: boolean;
}

const VideoUploadCard = ({
  title, subtitle, description, duration, example, maxDurationSec, maxSizeMB,
  suggestedName, video, onChange, showCapture = true
}: VideoUploadCardProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): { status: VideoFile['status']; errorMessage?: string; warningMessage?: string } => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|mkv)$/i)) {
      return { status: 'error', errorMessage: 'Formato inválido. Aceitos: MP4, MOV, MKV.' };
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { status: 'warning', warningMessage: `Este arquivo excede ${maxSizeMB} MB. Podemos comprimir automaticamente para você.` };
    }
    return { status: 'ok' };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const previewUrl = URL.createObjectURL(file);
    const validation = validateFile(file);
    onChange({ ...video, file, previewUrl, status: 'uploading' });
    setTimeout(() => {
      onChange({ ...video, file, previewUrl, status: validation.status, errorMessage: validation.errorMessage, warningMessage: validation.warningMessage });
      setUploading(false);
    }, 1500);
  };

  const statusBadge = () => {
    switch (video.status) {
      case 'ok': return <Badge className="bg-primary/10 text-primary border-0 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>;
      case 'warning': return <Badge className="bg-accent/10 text-accent border-0 text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Aviso</Badge>;
      case 'error': return <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />Falha</Badge>;
      case 'uploading': case 'validating': return <Badge className="bg-muted text-muted-foreground border-0 text-xs">Processando...</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="p-4 border-border bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            {subtitle && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{subtitle}</span>}
            {statusBadge()}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />{duration}
          </div>
          {example && <p className="text-xs text-muted-foreground mt-1 italic">Ex: {example}</p>}
        </div>
      </div>

      {video.previewUrl ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
            <video src={video.previewUrl} controls className="w-full h-full object-cover" />
          </div>

          {video.errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive">
              {video.errorMessage}
            </div>
          )}
          {video.warningMessage && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-xs text-muted-foreground">
              {video.warningMessage}
              <Button size="sm" variant="outline" className="mt-2 w-full text-xs border-border" onClick={() => onChange({ ...video, status: 'ok', warningMessage: undefined })}>
                Comprimir automaticamente
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs border-border" onClick={() => onChange({ ...video, bestMoment: video.bestMoment ? '' : 'marcado' })}>
              <Scissors className="w-3 h-3 mr-1" />
              {video.bestMoment ? 'Trecho marcado ✓' : 'Marcar melhor trecho'}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => {
              if (video.previewUrl) URL.revokeObjectURL(video.previewUrl);
              onChange({ file: null, status: 'empty' });
            }}>
              <RotateCcw className="w-3 h-3 mr-1" />Refazer
            </Button>
          </div>

          <Textarea placeholder="Comentário opcional (máx. 200 chars)" maxLength={200}
            value={video.comment || ''} onChange={(e) => onChange({ ...video, comment: e.target.value })}
            className="text-xs bg-muted border-border" rows={2} />

          <p className="text-xs text-muted-foreground">Arquivo: <code className="text-primary">{suggestedName}</code></p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="border border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Enviando...</p>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">Clique para enviar</p>
                <p className="text-xs text-muted-foreground">MP4, MOV, MKV — máx. {maxSizeMB} MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="video/*,.mkv" onChange={handleFileChange} className="hidden" />
          {showCapture && (
            <Button variant="outline" className="w-full text-xs border-border" onClick={() => fileRef.current?.click()}>
              <Camera className="w-3.5 h-3.5 mr-1.5" />Gravar agora
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default VideoUploadCard;
