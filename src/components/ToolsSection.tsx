import { CheckCircle2 } from "lucide-react";

const aiTools = [
  "CHATGPT 5.0", "IDEOGRAM", "MIDJOURNEY", "GAMMA APP", "HEY GEN",
  "DREAMFACE", "RUNWAY", "LEONARDO IA", "SUBMAGIC IA", "SORA IA",
  "HAILUO IA", "VOICE CLONE", "PERPLEXITY", "COPILOT IA", "TURBOSCRIBE",
  "RENDERFOREST", "FISH AUDIO", "YOU.COM", "FIGMA", "EPIDEMIC SOUND"
];

const editingTools = [
  "VEED IO", "CAPCUT PRO", "ENVATO ELEMENTS", "FREELAHUB", "FREEPIK",
  "PACK EDITOR", "EPIDEMIC SOUND", "JBFLIX (CONTEÚDOS MAIS DE 1000 FILMES)",
  "METODOS UNICOS", "ZDM PRIME (ECONOMIZA MAIS DE R$ 20K EM CURSOS PAGOS)"
];

const seoTools = [
  "ADS PARO", "SEM RUSH", "DROPTOOL", "E MUITO MAIS"
];

const ToolsList = ({ tools }: { tools: string[] }) => (
  <ul className="space-y-3">
    {tools.map((tool) => (
      <li 
        key={tool} 
        className="text-sm text-muted-foreground flex items-center gap-3"
      >
        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
        {tool}
      </li>
    ))}
  </ul>
);

const ToolsSection = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* AI Tools */}
          <div>
            <div className="inline-block mb-8">
              <h3 className="text-sm font-display font-bold text-primary px-6 py-2 rounded-full border-2 border-primary">
                INTELIGÊNCIAS ARTIFICIAIS
              </h3>
            </div>
            <ToolsList tools={aiTools} />
          </div>

          {/* Editing Tools */}
          <div>
            <div className="inline-block mb-8">
              <h3 className="text-sm font-display font-bold text-primary-foreground px-6 py-2 rounded-full bg-primary">
                EDIÇÕES / DISTRAÇÕES
              </h3>
            </div>
            <ToolsList tools={editingTools} />
          </div>

          {/* SEO Tools */}
          <div>
            <div className="inline-block mb-8">
              <h3 className="text-sm font-display font-bold text-foreground">
                SEO/MINERAÇÃO
              </h3>
            </div>
            <ToolsList tools={seoTools} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
