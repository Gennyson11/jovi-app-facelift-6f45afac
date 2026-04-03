import { Check } from "lucide-react";

const aiTools = [
  "VEO 3.1 ULTRA", "NANO BANANA 2 / PRO", "GEMINI PRO", "HEYGEN PRO", "DIGEN ULTRA MAX", "PERPLEXITY PRO",
  "CANVA PRO", "EPIDEMIC SOUND", "LEONARDO AI", "PHOTOROOM MAX",
  "GAMMA APP PRO", "CSVGEN ILIMITADO", "CHATGPT", "SORA",
  "SUPER GROK", "DREAM FACE PRO", "IDEOGRAM PLUS", "FREEPIK PREMIUM+", "ENVATO ELEMENTS", "DESIGNRR", "CAPTIONS AI"
];


const seoTools = [
  "SPYFU", "ADSPARO", "SPINNER PT/BR", "WOORANK"
];

const streamingTools = [
  "JOVIFLIX FILMES & SÉRIES", "CINDIE TV", "JOVI IPTV"
];

const ToolsList = ({ tools }: { tools: string[] }) => (
  <ul className="space-y-3">
    {tools.map((tool) => (
      <li 
        key={tool} 
        className="text-sm text-muted-foreground flex items-start gap-3"
      >
        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        {tool}
      </li>
    ))}
  </ul>
);

const ToolsSection = () => {
  return (
    <section className="py-12 md:py-20 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="rounded-xl border border-primary/20 bg-card/30 p-6 md:p-8 lg:p-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {/* AI Tools */}
            <div>
              <h3 className="text-base md:text-lg font-display font-bold text-primary mb-6 md:mb-8">
                INTELIGÊNCIAS ARTIFICIAIS
              </h3>
              <ToolsList tools={aiTools} />
            </div>


            {/* SEO Tools */}
            <div>
              <h3 className="text-base md:text-lg font-display font-bold text-primary mb-6 md:mb-8">
                SEO
              </h3>
              <ToolsList tools={seoTools} />
            </div>

            {/* Streaming Tools */}
            <div>
              <h3 className="text-base md:text-lg font-display font-bold text-primary mb-6 md:mb-8">
                STREAMINGS
              </h3>
              <ToolsList tools={streamingTools} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
