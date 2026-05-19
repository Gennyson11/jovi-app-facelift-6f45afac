import { useState } from 'react';
import { Lock, Package, Film, Zap, Play, LucideIcon, PlayCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TutorialTag {
  label: string;
  variant?: 'primary' | 'neutral';
}

interface Tutorial {
  id: string;
  title: string;
  youtubeId: string;
  description?: string;
  tags?: TutorialTag[];
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
        description: 'Passo a passo completo para entrar no Flow Ultra utilizando o DiCloak com segurança.',
        tags: [
          { label: 'IMPORTANTE', variant: 'primary' },
          { label: 'DICLOAK', variant: 'neutral' },
        ],
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
        description: 'Tutorial completo do portal mostrando como acessar todas as IAs em um único lugar.',
        tags: [
          { label: 'COMBO', variant: 'primary' },
          { label: 'PORTAL', variant: 'neutral' },
        ],
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
        description: 'Aprenda a usar Seedance e Kling de forma ilimitada e sem bloqueios.',
        tags: [
          { label: 'VÍDEO IA', variant: 'primary' },
          { label: 'AVANÇADO', variant: 'neutral' },
        ],
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
  const [playing, setPlaying] = useState<Record<string, boolean>>({});

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
                        className="group overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card/70 to-card/30 hover:border-emerald-500/40 transition-colors flex flex-col"
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-black">
                          {playing[t.id] ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${t.youtubeId}?autoplay=1`}
                              title={t.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 w-full h-full"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPlaying((p) => ({ ...p, [t.id]: true }))}
                              className="absolute inset-0 w-full h-full"
                              aria-label={`Assistir ${t.title}`}
                            >
                              <img
                                src={`https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg`}
                                alt={t.title}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full bg-background/70 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-emerald-500/80 group-hover:border-emerald-300 transition-colors">
                                  <PlayCircle className="w-8 h-8 text-white" strokeWidth={1.5} />
                                </div>
                              </div>
                            </button>
                          )}
                        </div>

                        <div className="p-5 flex flex-col gap-3 flex-1">
                          {t.tags && t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {t.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className={
                                    tag.variant === 'primary'
                                      ? 'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                                      : 'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide bg-background/50 text-muted-foreground border border-border/70'
                                  }
                                >
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                          )}

                          <h4 className="font-display font-bold text-foreground text-base sm:text-lg leading-snug">
                            {t.title}
                          </h4>

                          {t.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {t.description}
                            </p>
                          )}

                          <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                            <span className="text-xs text-muted-foreground">
                              Player disponível
                            </span>
                            <Button
                              size="sm"
                              onClick={() => setPlaying((p) => ({ ...p, [t.id]: true }))}
                              className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-background font-semibold"
                            >
                              Assistir aqui
                            </Button>
                          </div>
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
