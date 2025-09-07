import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload as UploadIcon, Video, Play, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const navigate = useNavigate();
  const [uploadStep, setUploadStep] = useState<'select' | 'uploading' | 'processing' | 'complete'>('select');
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadStep('uploading');
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setUploadStep('processing');
            
            // Simulate processing
            setTimeout(() => {
              setUploadStep('complete');
              setTimeout(() => {
                navigate('/analysis');
              }, 2000);
            }, 3000);
            
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white"
            onClick={() => navigate("/onboarding")}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-white font-medium">
            Upload de Vídeo
          </div>
        </div>

        <Card className="p-6 bg-white shadow-strong border-0 animate-fade-in">
          {uploadStep === 'select' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Envie seu vídeo</h2>
                <p className="text-muted-foreground mb-8">
                  Faça upload de um vídeo da sua partida ou melhores momentos (máximo 10 minutos)
                </p>
              </div>

              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary transition-colors">
                <label htmlFor="video-upload" className="cursor-pointer">
                  <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Clique para enviar</p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: MP4, MOV, AVI
                  </p>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-accent/10 rounded-lg p-4">
                <h3 className="font-medium mb-2">💡 Dicas para o melhor resultado:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vídeo com boa qualidade e iluminação</li>
                  <li>• Moste suas principais jogadas</li>
                  <li>• Inclua momentos defensivos e ofensivos</li>
                </ul>
              </div>
            </div>
          )}

          {uploadStep === 'uploading' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                <UploadIcon className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold">Enviando vídeo...</h2>
              <Progress value={progress} className="w-full" />
              <p className="text-muted-foreground">{progress}% concluído</p>
            </div>
          )}

          {uploadStep === 'processing' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center mx-auto">
                <Play className="w-10 h-10 text-white animate-pulse-slow" />
              </div>
              <h2 className="text-2xl font-bold">Analisando seu vídeo...</h2>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <p className="text-muted-foreground">
                Nossos especialistas estão avaliando sua performance
              </p>
            </div>
          )}

          {uploadStep === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-success">Análise concluída!</h2>
              <p className="text-muted-foreground">
                Redirecionando para seus resultados...
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Upload;