import { Shield, Layout, Zap } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Seguro",
    description: "Suas credenciais protegidas com a mais alta segurança",
    badge: "Protegido",
  },
  {
    icon: Layout,
    title: "Organizado",
    description: "Todas as plataformas em um único painel intuitivo",
    badge: "Intuitivo",
  },
  {
    icon: Zap,
    title: "Rápido",
    description: "Acesso instantâneo às suas credenciais quando precisar",
    badge: "Instantâneo",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-12 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-center mb-10 md:mb-16">
          <span className="text-primary">RECURSOS</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 md:p-8 rounded-2xl card-glass border border-primary/20 hover:border-primary/50 transition-all duration-500 hover:glow-cyan"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Icon */}
              <div className="mb-4 md:mb-6 inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl bg-primary/10 border border-primary/30 group-hover:bg-primary/20 transition-all duration-300">
                <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-display font-bold text-foreground mb-2 md:mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                {feature.description}
              </p>

              {/* Badge */}
              <span className="inline-block px-3 md:px-4 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
                {feature.badge}
              </span>

              {/* Hover effect line */}
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-500 rounded-b-2xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
