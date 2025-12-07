const aiTools = [
  "CHATGPT 5.0", "IDEOGRAM", "MIDJOURNEY", "GAMMA APP", "HEY GEN",
  "DREAMFACE", "RUNWAY", "LEONARDO IA", "SUBMAGIC IA", "SORA IA",
  "HAILUO IA", "VOICE CLONE", "PERPLEXITY", "COPILOT IA", "TURBOSCRIBE",
  "RENDERFOREST", "FISH AUDIO", "YOU.COM", "FIGMA", "EPIDEMIC SOUND"
];

const editingTools = [
  "VEED IO", "CAPCUT PRO", "ENVATO ELEMENTS", "FREELAHUB", "FREEPIK",
  "PACK EDITOR", "EPIDEMIC SOUND", "JBFLIX (CONTEÚDOS MAIS DE 1000 FILMES)",
  "METODOS ÚNICOS", "ZDM PRIME (ECONOMIZA MAIS DE R$ 20K EM CURSOS PAGOS)"
];

const seoTools = [
  "ADS PARO", "SEM RUSH", "DROPTOOL", "E MUITO MAIS"
];

const ToolsList = ({ tools, color }: { tools: string[]; color: 'cyan' | 'magenta' }) => (
  <ul className="space-y-2">
    {tools.map((tool) => (
      <li 
        key={tool} 
        className={`text-sm ${color === 'cyan' ? 'text-primary' : 'text-accent'} flex items-center gap-2`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${color === 'cyan' ? 'bg-primary' : 'bg-accent'}`} />
        {tool}
      </li>
    ))}
  </ul>
);

const ToolsSection = () => {
  return (
    <section className="py-20 px-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* AI Tools */}
          <div className="p-6 rounded-2xl card-glass border border-primary/20">
            <h3 className="text-lg font-display font-bold text-primary mb-6 pb-3 border-b border-primary/20">
              INTELIGÊNCIAS ARTIFICIAIS
            </h3>
            <ToolsList tools={aiTools} color="cyan" />
          </div>

          {/* Editing Tools */}
          <div className="p-6 rounded-2xl card-glass border border-accent/20">
            <h3 className="text-lg font-display font-bold text-accent mb-6 pb-3 border-b border-accent/20">
              EDIÇÕES / DISTRAÇÕES
            </h3>
            <ToolsList tools={editingTools} color="magenta" />
          </div>

          {/* SEO Tools */}
          <div className="p-6 rounded-2xl card-glass border border-primary/20">
            <h3 className="text-lg font-display font-bold text-primary mb-6 pb-3 border-b border-primary/20">
              SEO/MINERAÇÃO
            </h3>
            <ToolsList tools={seoTools} color="cyan" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
