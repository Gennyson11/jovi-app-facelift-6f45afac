import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Download, Sparkles, Image as ImageIcon, User, Bot, Coins, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  enhancedPrompt?: string;
  isLoading?: boolean;
  timestamp: Date;
}

export default function JoviAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [coins, setCoins] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch user and coins on mount
  useEffect(() => {
    const fetchUserAndCoins = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Fetch coins
        const { data, error } = await supabase
          .from('user_coins')
          .select('coins')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setCoins(data.coins);
        } else if (error && error.code === 'PGRST116') {
          // No coins record, create one
          const { data: newData } = await supabase
            .from('user_coins')
            .insert({ user_id: user.id, coins: 20 })
            .select('coins')
            .single();
          if (newData) setCoins(newData.coins);
        }
      }
    };
    fetchUserAndCoins();
  }, []);

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
            userId: userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Update coins if returned in error response
        if (data.coins !== undefined) {
          setCoins(data.coins);
        }
        throw new Error(data.error || 'Erro ao processar mensagem');
      }

      // Update coins from response
      if (data.coins !== undefined) {
        setCoins(data.coins);
      }

      // Handle both chat and image responses
      const assistantMessage: Message = {
        id: loadingMessage.id,
        role: 'assistant',
        content: data.message || (data.type === 'image' ? 'Aqui está sua imagem! ✨' : 'Olá!'),
        imageUrl: data.type === 'image' ? data.imageUrl : undefined,
        aspectRatio: data.type === 'image' ? selectedRatio : undefined,
        enhancedPrompt: data.type === 'image' ? data.enhancedPrompt : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === loadingMessage.id ? assistantMessage : msg))
      );
    } catch (error) {
      console.error('Error generating image:', error);
      
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessage.id));
      
      toast({
        title: "Erro",
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

  const handleDownload = async (imageUrl: string, prompt: string, aspectRatio?: AspectRatio) => {
    try {
      // Create an image element to load the original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      // Get target dimensions based on aspect ratio
      const getDimensions = (ratio?: AspectRatio): { width: number; height: number } => {
        const baseSize = Math.max(img.naturalWidth, img.naturalHeight, 1024);
        switch (ratio) {
          case '16:9':
            return { width: baseSize, height: Math.round(baseSize * 9 / 16) };
          case '9:16':
            return { width: Math.round(baseSize * 9 / 16), height: baseSize };
          case '4:3':
            return { width: baseSize, height: Math.round(baseSize * 3 / 4) };
          case '3:4':
            return { width: Math.round(baseSize * 3 / 4), height: baseSize };
          default: // 1:1
            return { width: baseSize, height: baseSize };
        }
      };

      const { width, height } = getDimensions(aspectRatio);

      // Create canvas with the correct aspect ratio dimensions
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw image maintaining aspect ratio (cover)
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = width / height;
      
      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        // Image is wider - fit height, crop width
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        // Image is taller - fit width, crop height
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          window.open(imageUrl, '_blank');
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zara-${prompt.slice(0, 30).replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 'image/png');
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

  const MAX_COINS = 20;
  const coinPercentage = coins !== null ? (coins / MAX_COINS) * 100 : 0;
  const isLowCoins = coins !== null && coins <= 5;
  const isCriticalCoins = coins !== null && coins <= 2;
  
  const getStatus = () => {
    if (coins === null) return { text: '-', color: 'text-muted-foreground' };
    if (coins === 0) return { text: 'Esgotado', color: 'text-red-500' };
    if (coins <= 2) return { text: 'Crítico', color: 'text-red-500' };
    if (coins <= 5) return { text: 'Baixo', color: 'text-amber-500' };
    if (coins <= 10) return { text: 'Moderado', color: 'text-yellow-500' };
    return { text: 'Bom', color: 'text-emerald-500' };
  };

  const status = getStatus();

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-background rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Zara</h2>
            <p className="text-xs text-muted-foreground">Assistente IA da JoviTools</p>
          </div>
        </div>
        
        {/* Coins Display Card */}
        <div className={cn(
          "flex flex-col gap-2 px-4 py-3 rounded-xl border min-w-[200px]",
          isCriticalCoins 
            ? "bg-red-500/10 border-red-500/30" 
            : isLowCoins 
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-card border-border"
        )}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isCriticalCoins 
                  ? "bg-red-500/20" 
                  : isLowCoins 
                    ? "bg-amber-500/20"
                    : "bg-primary/20"
              )}>
                <Coins className={cn(
                  "w-4 h-4",
                  isCriticalCoins 
                    ? "text-red-500" 
                    : isLowCoins 
                      ? "text-amber-500"
                      : "text-primary"
                )} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Moedas</p>
                <p className={cn(
                  "text-xl font-bold leading-none",
                  isCriticalCoins 
                    ? "text-red-500" 
                    : isLowCoins 
                      ? "text-amber-500"
                      : "text-foreground"
                )}>
                  {coins !== null ? coins : '-'}
                </p>
              </div>
            </div>
            
            {isLowCoins && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium",
                isCriticalCoins 
                  ? "bg-red-500/20 text-red-500"
                  : "bg-amber-500/20 text-amber-500"
              )}>
                <AlertTriangle className="w-3 h-3" />
                {isCriticalCoins ? 'Crítico' : 'Baixo'}
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Progresso</span>
              <span>{Math.round(coinPercentage)}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isCriticalCoins 
                    ? "bg-red-500" 
                    : isLowCoins 
                      ? "bg-amber-500"
                      : coinPercentage > 50 
                        ? "bg-emerald-500"
                        : "bg-yellow-500"
                )}
                style={{ width: `${coinPercentage}%` }}
              />
            </div>
          </div>
          
          {/* Status */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Status
            </span>
            <span className={cn("font-medium", status.color)}>{status.text}</span>
          </div>
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
                        <span className="text-sm">Pensando...</span>
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
                    <div className="space-y-2">
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
                            onClick={() => handleDownload(message.imageUrl!, message.content, message.aspectRatio)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                      {/* Enhanced Prompt Display */}
                      {message.enhancedPrompt && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                            Ver prompt otimizado
                          </summary>
                          <div className="mt-2 p-3 bg-secondary/50 rounded-lg text-muted-foreground whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                            {message.enhancedPrompt}
                          </div>
                        </details>
                      )}
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
