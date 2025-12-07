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
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
          <span className="text-primary">RECURSOS</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-2xl card-glass border border-primary/20 hover:border-primary/50 transition-all duration-500 hover:glow-cyan"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 group-hover:bg-primary/20 transition-all duration-300">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-display font-bold text-foreground mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground mb-4">
                {feature.description}
              </p>

              {/* Badge */}
              <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
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
