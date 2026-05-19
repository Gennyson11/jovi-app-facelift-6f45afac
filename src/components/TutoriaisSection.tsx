import { Lock, Package, Film, Zap, Play, LucideIcon } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

interface Tutorial {
  id: string;
  title: string;
  youtubeId: string;
  description?: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient: string;
  iconColor: string;
  tutorials: Tutorial[];
}

const CATEGORIES: Category[] = [
  {
    id: 'comece',
    title: 'Comece por aqui',
    description: 'Os vídeos mais importantes para ativação e primeiros passos.',
    icon: Lock,
    iconGradient: 'from-amber-500/20 to-yellow-600/20 border-amber-500/30',
    iconColor: 'text-amber-400',
    tutorials: [
      {
        id: 'c1',
        title: 'COMO FAZER LOGIN NO FLOW ULTRA PELO DICLOAK',
        youtubeId: 'OWBC4sirtKQ',
      },
    ],
  },
  {
    id: 'jovitools',
    title: 'JoviTools',
    description: 'Tutorial de uso do portal principal e recursos da conta.',
    icon: Package,
    iconGradient: 'from-orange-500/20 to-red-600/20 border-orange-500/30',
    iconColor: 'text-orange-400',
    tutorials: [
      {
        id: 'j1',
        title: 'COMO TER ACESSO AO COMBO DE IAs EM UM SÓ LUGAR',
        youtubeId: 'naSd57R3H68',
      },
    ],
  },
  {
    id: 'veo3',
    title: 'VEO3',
    description: 'Acesso, uso correto da conta e melhores práticas para evitar bloqueios.',
    icon: Film,
    iconGradient: 'from-violet-500/20 to-purple-600/20 border-violet-500/30',
    iconColor: 'text-violet-400',
    tutorials: [
      {
        id: 'v1',
        title: 'COMO USAR O SEEDANCE E O KLING ILIMITADO',
        youtubeId: 'f1jbzABkt18',
      },
    ],
  },
  {
    id: 'grok',
    title: 'Grok & ChatGPT',
    description: 'Tutoriais de IA conversacional, login e uso prático.',
    icon: Zap,
    iconGradient: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30',
    iconColor: 'text-cyan-400',
    tutorials: [],
  },
];

export default function TutoriaisSection() {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Selecione uma categoria e toque no tutorial para assistir sem sair do portal.
        </p>
        <Badge
          variant="outline"
          className="border-emerald-500/40 text-emerald-400 bg-emerald-500/5 gap-2 px-3 py-1 rounded-full font-semibold tracking-wide"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          TUTORIAIS POR PRODUTO
        </Badge>
      </div>

      <Accordion type="single" collapsible className="space-y-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = cat.tutorials.length;
          return (
            <AccordionItem
              key={cat.id}
              value={cat.id}
              className="border border-border/60 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur px-4 sm:px-5 data-[state=open]:border-primary/40 transition-colors"
            >
              <AccordionTrigger className="hover:no-underline py-4 gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${cat.iconGradient} border flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 className="font-display font-bold text-foreground text-base sm:text-lg truncate">
                      {cat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {cat.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-border/80 text-muted-foreground bg-background/40 shrink-0"
                >
                  {count} {count === 1 ? 'aula' : 'aulas'}
                </Badge>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                {count === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border/50 rounded-xl">
                    <Play className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Em breve novos tutoriais nesta categoria
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {cat.tutorials.map((t) => (
                      <div
                        key={t.id}
                        className="overflow-hidden rounded-xl border border-border/60 bg-background/40"
                      >
                        <div className="aspect-video w-full">
                          <iframe
                            src={`https://www.youtube.com/embed/${t.youtubeId}`}
                            title={t.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="font-semibold text-foreground text-sm leading-snug">
                            {t.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
