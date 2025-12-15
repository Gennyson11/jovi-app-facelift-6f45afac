import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Video, Download, Loader2, User, Bot, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AspectRatio = '16:9' | '9:16';

interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  icon: string;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { value: '16:9', label: 'Paisagem (16:9)', icon: '🖥️' },
];

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  videoUrl?: string;
  isLoading?: boolean;
  uuid?: string;
  status?: number;
}

const SUGGESTIONS = [
  "Um pôr do sol em uma praia tropical com ondas suaves",
  "Uma cidade futurística à noite com luzes neon",
  "Uma floresta mágica com partículas brilhantes",
  "Um astronauta flutuando no espaço com a Terra ao fundo",
];

export function Veo3Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  const checkVideoStatus = async (uuid: string, messageId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-video-status', {
        body: { uuid },
      });

      if (error) {
        console.error('Error checking video status:', error);
        return;
      }

      if (data.status === 2 && data.videoUrl) {
        // Video completed
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isLoading: false, videoUrl: data.videoUrl, status: 2, content: '✅ Vídeo gerado com sucesso!' }
            : msg
        ));
        
        // Clear polling interval
        const interval = pollingIntervals.current.get(messageId);
        if (interval) {
          clearInterval(interval);
          pollingIntervals.current.delete(messageId);
        }
        
        toast.success('Vídeo gerado com sucesso!');
      } else if (data.status === 3) {
        // Video failed
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isLoading: false, status: 3, content: `❌ ${data.errorMessage || 'Erro ao gerar vídeo'}` }
            : msg
        ));
        
        // Clear polling interval
        const interval = pollingIntervals.current.get(messageId);
        if (interval) {
          clearInterval(interval);
          pollingIntervals.current.delete(messageId);
        }
        
        toast.error(data.errorMessage || 'Erro ao gerar vídeo');
      } else {
        // Still processing - update progress
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: `⏳ Gerando vídeo... ${data.statusPercentage || 0}%` }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error polling video status:', error);
    }
  };

  const handleSubmit = async (inputPrompt?: string) => {
    const messageText = inputPrompt || prompt;
    if (!messageText.trim() || isLoading) return;

    const userMessageId = Date.now().toString();
    const assistantMessageId = (Date.now() + 1).toString();

    // Add user message
    setMessages(prev => [...prev, {
      id: userMessageId,
      content: messageText,
      role: 'user',
    }]);

    // Add loading assistant message
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      content: '⏳ Iniciando geração do vídeo...',
      role: 'assistant',
      isLoading: true,
    }]);

    setPrompt('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: { 
          prompt: messageText,
          aspectRatio: selectedRatio,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Update message with UUID and start polling
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, uuid: data.uuid, content: '⏳ Gerando vídeo... 0%' }
          : msg
      ));

      // Start polling for video status
      const interval = setInterval(() => {
        checkVideoStatus(data.uuid, assistantMessageId);
      }, 5000); // Poll every 5 seconds

      pollingIntervals.current.set(assistantMessageId, interval);

    } catch (error) {
      console.error('Error generating video:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isLoading: false, content: `❌ Erro: ${error instanceof Error ? error.message : 'Falha ao gerar vídeo'}` }
          : msg
      ));
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar vídeo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDownload = async (videoUrl: string, messageId: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `veo3-video-${messageId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Vídeo baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading video:', error);
      toast.error('Erro ao baixar vídeo');
    }
  };

  const getAspectRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9':
        return 'aspect-video';
      case '9:16':
        return 'aspect-[9/16]';
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm rounded-2xl border border-border/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Video className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Veo3</h2>
          <p className="text-xs text-muted-foreground">Gerador de Vídeos com IA</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Olá! Eu sou o Veo3
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              Descreva o vídeo que você quer criar e eu vou gerá-lo para você usando inteligência artificial.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmit(suggestion)}
                  disabled={isLoading}
                  className="p-3 text-left text-sm rounded-xl border border-border/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-200 text-muted-foreground hover:text-foreground"
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
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted/50 text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.isLoading && !message.videoUrl && (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        <span className="text-xs text-muted-foreground">Processando...</span>
                      </div>
                    )}
                  </div>

                  {message.videoUrl && (
                    <div className="mt-3 space-y-2">
                      <div className={`relative rounded-xl overflow-hidden border border-border/30 ${getAspectRatioClass(selectedRatio)} max-w-md`}>
                        <video
                          src={message.videoUrl}
                          controls
                          className="w-full h-full object-cover"
                          playsInline
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(message.videoUrl!, message.id)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Baixar Vídeo
                      </Button>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/30 bg-background/80">
        {/* Aspect Ratio Selection */}
        <div className="flex gap-2 mb-3">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => setSelectedRatio(ratio.value)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                selectedRatio === ratio.value
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-muted/30 text-muted-foreground border border-transparent hover:border-border/50'
              }`}
            >
              <span>{ratio.icon}</span>
              <span>{ratio.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o vídeo que você quer criar..."
            disabled={isLoading}
            className="min-h-[60px] max-h-[120px] resize-none bg-muted/30 border-border/50 focus:border-purple-500/50"
          />
          <Button
            onClick={() => handleSubmit()}
            disabled={!prompt.trim() || isLoading}
            className="px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          ⏱️ A geração de vídeo pode levar alguns minutos
        </p>
      </div>
    </div>
  );
}
