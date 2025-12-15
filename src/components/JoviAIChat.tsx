import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Download, Sparkles, Image as ImageIcon, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  description: string;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { value: '1:1', label: '1:1', description: 'Quadrado' },
  { value: '16:9', label: '16:9', description: 'Tela ampla' },
  { value: '9:16', label: '9:16', description: 'Retrato' },
  { value: '4:3', label: '4:3', description: 'Padrão' },
  { value: '3:4', label: '3:4', description: 'Retrato padrão' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  aspectRatio?: AspectRatio;
  isLoading?: boolean;
  timestamp: Date;
}

export default function JoviAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.trim(),
      aspectRatio: selectedRatio,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setPrompt('');
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
            prompt: userMessage.content,
            aspectRatio: selectedRatio,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar imagem');
      }

      const assistantMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: 'Aqui está sua imagem gerada:',
        imageUrl: data.imageUrl,
        aspectRatio: selectedRatio,
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === loadingMessage.id ? assistantMessage : msg))
      );
    } catch (error) {
      console.error('Error generating image:', error);
      
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessage.id));
      
      toast({
        title: "Erro ao gerar imagem",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const getAspectRatioClass = (ratio?: AspectRatio) => {
    switch (ratio) {
      case '16:9':
        return 'aspect-video';
      case '9:16':
        return 'aspect-[9/16] max-w-[300px]';
      case '4:3':
        return 'aspect-[4/3]';
      case '3:4':
        return 'aspect-[3/4] max-w-[350px]';
      default:
        return 'aspect-square max-w-[400px]';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-background rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Jovi.ia</h2>
          <p className="text-xs text-muted-foreground">Gerador de imagens com IA</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
              <ImageIcon className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Crie imagens incríveis
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Descreva a imagem que você imagina e deixe a IA criar para você. 
              Seja criativo e específico para melhores resultados!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Um gato astronauta', 'Cidade futurista', 'Floresta mágica', 'Arte abstrata'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="px-3 py-1.5 text-sm bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={cn(
                    "flex flex-col gap-2 max-w-[80%]",
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-md'
                        : 'bg-secondary text-foreground rounded-tl-md'
                    )}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Gerando imagem...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.role === 'user' && message.aspectRatio && (
                          <span className="text-xs opacity-70 mt-1 block">
                            Proporção: {message.aspectRatio}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Generated Image */}
                  {message.imageUrl && (
                    <div className={cn("relative group rounded-xl overflow-hidden", getAspectRatioClass(message.aspectRatio))}>
                      <img
                        src={message.imageUrl}
                        alt="Imagem gerada"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(message.imageUrl!, message.content)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4">
        {/* Aspect Ratio Selection */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Proporção:</span>
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => setSelectedRatio(ratio.value)}
              disabled={isLoading}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                selectedRatio === ratio.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Descreva a imagem que você quer criar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="min-h-[44px] max-h-[120px] bg-background border-border resize-none flex-1"
            rows={1}
          />
          <Button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            size="icon"
            className="h-[44px] w-[44px] flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
