import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Download, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  description: string;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { value: '1:1', label: '1:1', description: 'Quadrado (padrão)' },
  { value: '16:9', label: '16:9', description: 'Tela ampla' },
  { value: '9:16', label: '9:16', description: 'Retrato' },
  { value: '4:3', label: '4:3', description: 'Padrão' },
  { value: '3:4', label: '3:4', description: 'Padrão retrato' },
];

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  aspectRatio: AspectRatio;
  timestamp: Date;
}

export default function JoviAIChat() {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Digite uma descrição",
        description: "Descreva a imagem que você deseja criar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            aspectRatio: selectedRatio,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar imagem');
      }

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        prompt: prompt.trim(),
        imageUrl: data.imageUrl,
        aspectRatio: selectedRatio,
        timestamp: new Date(),
      };

      setGeneratedImages((prev) => [newImage, ...prev]);
      setPrompt('');

      toast({
        title: "Imagem gerada!",
        description: "Sua imagem foi criada com sucesso.",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Erro ao gerar imagem",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jovi-ia-${prompt.slice(0, 30).replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const getAspectRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '1:1':
        return 'aspect-square';
      case '16:9':
        return 'aspect-video';
      case '9:16':
        return 'aspect-[9/16]';
      case '4:3':
        return 'aspect-[4/3]';
      case '3:4':
        return 'aspect-[3/4]';
      default:
        return 'aspect-square';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Jovi.ia</h2>
        </div>
        <p className="text-muted-foreground">
          Crie imagens incríveis com inteligência artificial. Descreva o que você imagina!
        </p>
      </div>

      {/* Input Section */}
      <Card className="border-border">
        <CardContent className="pt-6 space-y-4">
          {/* Prompt Input */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Descreva sua imagem
            </label>
            <Textarea
              placeholder="Ex: Um gato astronauta flutuando no espaço com a Terra ao fundo..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] bg-background/50 border-border resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Aspect Ratio Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Proporção da imagem
            </label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setSelectedRatio(ratio.value)}
                  disabled={isLoading}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-all text-sm font-medium",
                    selectedRatio === ratio.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background/50 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <span className="block">{ratio.label}</span>
                  <span className="text-xs opacity-70">{ratio.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando imagem...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gerar Imagem
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Imagens Geradas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedImages.map((image) => (
              <Card key={image.id} className="border-border overflow-hidden group">
                <div className={cn("relative", getAspectRatioClass(image.aspectRatio))}>
                  <img
                    src={image.imageUrl}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(image.imageUrl, image.prompt)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                  {/* Aspect ratio badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                    {image.aspectRatio}
                  </div>
                </div>
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{image.prompt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {generatedImages.length === 0 && !isLoading && (
        <Card className="border-border border-dashed">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              Nenhuma imagem gerada
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Descreva a imagem que você deseja criar e clique em "Gerar Imagem" para começar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
