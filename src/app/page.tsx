import { Coffee, Menu, ShoppingCart, User } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-secondary/20">
        <div className="flex items-center gap-2">
          <Coffee className="w-8 h-8 text-secondary" />
          <span className="text-xl font-bold tracking-tight uppercase">Coorg Cafe</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
            <User className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-secondary/10 rounded-full transition-colors relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-[10px] flex items-center justify-center rounded-full">0</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-90">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter">
          Experience the Essence of <span className="text-secondary italic">Coorg</span>
        </h1>
        <p className="max-w-xl text-lg md:text-xl text-accent/80 mb-10">
          From the lush misty hills of Coorg to your cup. Premium, hand-picked coffee beans roasted to perfection.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-4 bg-primary hover:bg-primary/80 text-white rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-xl shadow-primary/20">
            <Menu className="w-5 h-5" />
            Explore Menu
          </button>
          <button className="px-8 py-4 border border-secondary text-secondary hover:bg-secondary/10 rounded-lg font-bold transition-all">
            Our Story
          </button>
        </div>
      </main>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-20 bg-card/30">
        {[
          { title: "Premium Beans", desc: "Sourced directly from the sustainable farms of Coorg." },
          { title: "Expert Roasting", desc: "Small-batch roasted to bring out unique flavor profiles." },
          { title: "QR Ordering", desc: "Modern, contactless ordering experience from your table." }
        ].map((feature, i) => (
          <div key={i} className="p-8 rounded-2xl bg-card border border-secondary/20 hover:border-secondary/50 transition-colors group">
            <h3 className="text-xl font-bold mb-3 group-hover:text-secondary transition-colors">{feature.title}</h3>
            <p className="text-accent/60">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-secondary/10 text-center text-accent/40 text-sm">
        <p>© 2026 Coorg Cafe. All rights reserved.</p>
      </footer>
    </div>
  );
}
