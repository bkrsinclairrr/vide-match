import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Video, CheckCircle2, AlertTriangle, XCircle, Camera, Scissors, Clock, RotateCcw } from "lucide-react";
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
  title, description, duration, example, maxDurationSec, maxSizeMB,
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

    // Simulate upload + validation delay
    onChange({ ...video, file, previewUrl, status: 'uploading' });

    setTimeout(() => {
      onChange({
        ...video,
        file,
        previewUrl,
        status: validation.status,
        errorMessage: validation.errorMessage,
        warningMessage: validation.warningMessage,
      });
      setUploading(false);
    }, 1500);
  };

  const statusBadge = () => {
    switch (video.status) {
      case 'ok': return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="w-3 h-3 mr-1" />OK</Badge>;
      case 'warning': return <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="w-3 h-3 mr-1" />Aviso</Badge>;
      case 'error': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falha</Badge>;
      case 'uploading':
      case 'validating':
        return <Badge variant="secondary">Processando...</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="p-4 border bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{title}</h4>
            {statusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{duration}</span>
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
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
              {video.errorMessage}
            </div>
          )}
          {video.warningMessage && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm">
              {video.warningMessage}
              <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => onChange({ ...video, status: 'ok', warningMessage: undefined })}>
                Comprimir automaticamente
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onChange({ ...video, bestMoment: video.bestMoment ? '' : 'marcado' })}>
              <Scissors className="w-3 h-3 mr-1" />
              {video.bestMoment ? 'Trecho marcado ✓' : 'Marcar melhor trecho'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              if (video.previewUrl) URL.revokeObjectURL(video.previewUrl);
              onChange({ file: null, status: 'empty' });
            }}>
              <RotateCcw className="w-3 h-3 mr-1" />Refazer
            </Button>
          </div>

          <Textarea
            placeholder="Comentário opcional (máx. 200 caracteres) — ex: 'melhor lance aos 1:12'"
            maxLength={200}
            value={video.comment || ''}
            onChange={(e) => onChange({ ...video, comment: e.target.value })}
            className="text-sm"
            rows={2}
          />

          <p className="text-xs text-muted-foreground">Arquivo sugerido: <code className="text-primary">{suggestedName}</code></p>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">Enviando...</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Clique para enviar</p>
                <p className="text-xs text-muted-foreground">MP4, MOV, MKV — máx. {maxSizeMB} MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="video/*,.mkv" onChange={handleFileChange} className="hidden" />

          {showCapture && (
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <Camera className="w-4 h-4 mr-2" />
              Gravar agora
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default VideoUploadCard;
