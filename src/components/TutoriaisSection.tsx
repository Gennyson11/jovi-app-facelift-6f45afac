import { GraduationCap, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Tutorial {
  id: string;
  title: string;
  youtubeId: string;
  description?: string;
}

const TUTORIALS: Tutorial[] = [
  {
    id: '1',
    title: 'COMO TER ACESSO AO COMBO DE IAs EM UM SÓ LUGAR',
    youtubeId: 'naSd57R3H68',
  },
  {
    id: '2',
    title: 'COMO FAZER LOGIN NO FLOW ULTRA PELO DICLOAK',
    youtubeId: 'OWBC4sirtKQ',
  },
  {
    id: '3',
    title: 'TUTORIAL JOVITOOLS',
    youtubeId: 'f1jbzABkt18',
  },
];

export default function TutoriaisSection() {
  return (
    <div className="mb-10">
      {/* Category Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">
            Tutoriais
          </h2>
          <p className="text-sm text-muted-foreground">
            Aprenda a usar todas as ferramentas
          </p>
        </div>
      </div>

      {TUTORIALS.length === 0 ? (
        <div className="text-center py-12">
          <Play className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum tutorial disponível no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TUTORIALS.map((tutorial) => (
            <Card key={tutorial.id} className="overflow-hidden border-border bg-card hover:border-primary/30 transition-all">
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${tutorial.youtubeId}`}
                  title={tutorial.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground text-sm">{tutorial.title}</h3>
                {tutorial.description && (
                  <p className="text-xs text-muted-foreground mt-1">{tutorial.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
