"use client";

import { useState, useEffect } from "react";
import { Coffee, X, Plus, Minus, MapPin, Clock, ArrowRight, ShoppingBag, Leaf, Zap, Heart, Star, ChevronLeft, ChevronRight, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, Variants } from "framer-motion";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

// Types
type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: "Coffee" | "Tea" | "Health Drinks" | "Milk Specials" | "Others";
  image: string;
};

type CartItem = MenuItem & { quantity: number };

// Data
const MENU_ITEMS: MenuItem[] = [
  // Coffee
  { id: "c1", name: "Black Coffee", price: 15, category: "Coffee", image: "/assets/indian_black_coffee.png" },
  { id: "c2", name: "S.P. Filter Coffee", price: 20, category: "Coffee", image: "/assets/indian_filter_coffee.png" },
  { id: "c3", name: "Jaggery Filter Coffee", price: 25, category: "Coffee", image: "/assets/indian_jaggery_filter_coffee.png" },

  // Tea
  { id: "t1", name: "Butter Tea", price: 15, category: "Tea", image: "/assets/indian_butter_tea.png" },
  { id: "t2", name: "Green Tea", price: 15, category: "Tea", image: "/assets/indian_green_tea.png" },
  { id: "t3", name: "Lemon Tea", price: 20, category: "Tea", image: "/assets/indian_lemon_tea.png" },
  { id: "t4", name: "Masala Tea", price: 25, category: "Tea", image: "/assets/indian_masala_chai.png" },
  { id: "t5", name: "Jaggery Tea", price: 25, category: "Tea", image: "/assets/indian_jaggery_tea.png" },
  { id: "t6", name: "Sukku Mani Tea", price: 20, category: "Tea", image: "/assets/indian_sukku_mani_tea.png" },
  
  // Health Drinks
  { id: "h1", name: "Boost", price: 25, category: "Health Drinks", image: "/assets/indian_boost.png" },
  { id: "h2", name: "Horlicks", price: 25, category: "Health Drinks", image: "/assets/indian_horlicks.png" },

  // Milk Specials
  { id: "m1", name: "Rose Milk", price: 25, category: "Milk Specials", image: "/assets/indian_rose_milk.png" },
  { id: "m2", name: "Jaggery Milk", price: 25, category: "Milk Specials", image: "/assets/indian_jaggery_milk.png" },
  { id: "m3", name: "Ragi Malt Milk", price: 25, category: "Milk Specials", image: "/assets/indian_ragi_malt.png" },

  // Others
  { id: "o1", name: "Citron Fruit Masala", price: 15, category: "Others", image: "/assets/indian_citron_fruit_masala.png" },
  { id: "o2", name: "Parcel Extra", price: 5, category: "Others", image: "/assets/indian_takeaway_bag.png" },
];

const CATEGORIES = ["Coffee", "Tea", "Health Drinks", "Milk Specials", "Others"];

const TESTIMONIALS = [
  { id: 1, name: "Arjun Reddy", text: "The authentic taste of Coorg right in Anekal. The Masala Chai is an absolute masterpiece.", rating: 5 },
  { id: 2, name: "Priya Sharma", text: "Stunning ambiance and the Rose Milk is to die for. Highly recommend visiting in the evening.", rating: 5 },
  { id: 3, name: "Vikram Singh", text: "Quick service, premium quality, and a very relaxing atmosphere. Best cafe in town.", rating: 5 },
  { id: 4, name: "Sneha Patel", text: "The Filter Coffee took me straight back to my childhood. Perfect blend and aroma.", rating: 5 },
];

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("Coffee");
  const [scrolled, setScrolled] = useState(false);

  // Embla Carousel hook with Autoplay
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax scroll hook
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Cart Functions
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    // Optional: bounce cart icon or show toast here
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  // Derived state
  const displayedItems = MENU_ITEMS.filter(item => item.category === activeCategory);
  // Featured drinks (hardcoded for impact)
  const featuredDrinks = [
    MENU_ITEMS.find(i => i.id === "c2"), // S.P. Filter Coffee
    MENU_ITEMS.find(i => i.id === "t4"), // Masala Tea
    MENU_ITEMS.find(i => i.id === "m1"), // Rose Milk
  ].filter(Boolean) as MenuItem[];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#1A100C] text-foreground overflow-x-hidden selection:bg-secondary/30 selection:text-white pb-0">
      
      {/* Sticky Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed w-full z-50 transition-all duration-500 border-b border-transparent ${
          scrolled ? "bg-[#2D1B15]/80 backdrop-blur-xl border-white/10 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]" : "bg-transparent py-5"
        } px-6 md:px-12`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-xl border border-white/10"
            >
              <Image 
                src="/assets/coorg_cafe_logo.png" 
                alt="Coorg Cafe Logo" 
                fill
                className="object-cover"
              />
            </motion.div>
            <span className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide drop-shadow-sm group-hover:text-secondary transition-colors">
              COORG CAFE
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {["Featured", "Menu", "About Us", "Visit"].map((link) => (
              <a 
                key={link}
                href={`#${link.toLowerCase().replace(" ", "-")}`} 
                className="text-xs font-bold uppercase tracking-[0.2em] text-secondary hover:text-white transition-all relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-secondary after:transition-all after:duration-300"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setIsCartOpen(true)}
               className="relative p-2.5 rounded-full glass hover:bg-white/10 transition-colors group flex items-center shadow-lg border border-white/10"
             >
               <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-secondary group-hover:text-white transition-colors" />
               <AnimatePresence>
                 {cartItemCount > 0 && (
                   <motion.span 
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0, opacity: 0 }}
                     className="absolute -top-1 -right-1 bg-red-600 border border-red-400 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md"
                   >
                     {cartItemCount}
                   </motion.span>
                 )}
               </AnimatePresence>
             </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Cart Side Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60]" 
              onClick={() => setIsCartOpen(false)} 
            />
            
            {/* Drawer panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-[70] w-full sm:w-[450px] h-full bg-[#2D1B15] shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col border-l border-white/10"
            >
               <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-black/20">
                  <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-secondary" /> Your Order
                  </h2>
                  <motion.button 
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsCartOpen(false)} 
                    className="p-2 rounded-full glass hover:bg-white/10 text-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                  {cart.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60"
                    >
                      <div className="w-24 h-24 rounded-full glass flex items-center justify-center mb-4">
                        <ShoppingBag className="w-10 h-10 text-secondary" />
                      </div>
                      <p className="text-secondary font-serif text-xl italic">Your cart is feeling a bit empty.</p>
                      <button onClick={() => setIsCartOpen(false)} className="text-sm font-bold uppercase tracking-widest text-white underline underline-offset-4 hover:text-secondary transition-colors">
                        Browse Menu
                      </button>
                    </motion.div>
                  ) : (
                    <AnimatePresence>
                      {cart.map(item => (
                        <motion.div 
                          key={item.id} 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, x: 50 }}
                          className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group"
                        >
                           {/* Subtle gradient background inside cart card */}
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                           
                           <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md border border-white/10">
                             <Image src={item.image} alt={item.name} fill className="object-cover" />
                           </div>
                           <div className="flex-1 z-10">
                              <h4 className="text-white font-serif font-bold text-lg leading-tight mb-1">{item.name}</h4>
                              <p className="text-secondary text-sm font-medium">₹{item.price.toFixed(2)}</p>
                              
                              <div className="flex items-center gap-4 mt-3">
                                 <div className="flex items-center bg-black/40 rounded-lg border border-white/10 shadow-inner">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-secondary hover:text-white transition-colors">
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-bold w-6 text-center text-white">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-secondary hover:text-white transition-colors">
                                      <Plus className="w-3 h-3" />
                                    </button>
                                 </div>
                                 <button onClick={() => removeItem(item.id)} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors ml-auto flex items-center gap-1 group/rmv">
                                   <X className="w-3 h-3 group-hover/rmv:scale-125 transition-transform" /> Remove
                                 </button>
                              </div>
                           </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
               </div>
               
               {cart.length > 0 && (
                 <motion.div 
                   initial={{ y: 50 }}
                   animate={{ y: 0 }}
                   className="p-6 md:p-8 bg-black/40 border-t border-white/10 backdrop-blur-xl relative"
                 >
                    {/* Glowing blur behind total */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-12 bg-secondary/10 blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-secondary/70 text-sm font-bold uppercase tracking-widest">Subtotal</span>
                      <span className="text-white font-bold text-xl font-serif">₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-secondary/50 text-xs font-bold uppercase tracking-widest">Taxes</span>
                      <span className="text-secondary/80 text-xs italic">Calculated at checkout</span>
                    </div>
                    
                    <Link href="/table/1/checkout" onClick={() => setIsCartOpen(false)}>
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-secondary to-[#EFEBE9] text-primary font-bold text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(215,204,200,0.3)] transition-all overflow-hidden relative group"
                      >
                        <span className="relative z-10 flex items-center gap-2">Proceed to Pay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                        {/* Button shine effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12" />
                      </motion.div>
                    </Link>
                 </motion.div>
               )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.header 
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative pt-32 pb-20 px-6 h-screen min-h-[700px] flex items-center justify-center overflow-hidden"
      >
        {/* Animated Background with Video & Heavy Gradients */}
        <div className="absolute inset-0 z-0 bg-black">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen mix-blend-luminosity"
          >
            <source src="/assets/introbackground.mp4" type="video/mp4" />
          </video>
          {/* Complex Premium Gradients Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A100C] via-transparent to-[#1A100C] z-10 opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(62,39,35,0.7)_0%,rgba(0,0,0,0.8)_80%,rgba(0,0,0,1)_100%)] z-10 mix-blend-multiply" />
          
          {/* Floating glowing orbs for depth */}
          <motion.div 
            animate={{ 
              x: [0, 50, -50, 0], 
              y: [0, -50, 50, 0],
              scale: [1, 1.2, 0.8, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] z-10 pointer-events-none" 
          />
          <motion.div 
            animate={{ 
              x: [0, -60, 60, 0], 
              y: [0, 60, -60, 0],
              scale: [1, 0.9, 1.1, 1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#4A332A]/20 rounded-full blur-[150px] z-10 pointer-events-none" 
          />
        </div>

        <div className="max-w-5xl mx-auto w-full relative z-20 flex flex-col items-center text-center">
           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-secondary/30 mb-8 backdrop-blur-xl shadow-2xl group cursor-pointer"
           >
             <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
             </span>
             <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white group-hover:text-secondary transition-colors">
               Experience The Premium Blend
             </span>
           </motion.div>
           
           <motion.h1 
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
             className="text-6xl sm:text-7xl md:text-8xl lg:text-[11rem] font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-secondary/50 leading-none tracking-tighter mb-6 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
           >
             COORG CAFE
           </motion.h1>
           
           <motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 1, delay: 0.8 }}
             className="text-xl md:text-3xl text-secondary/90 font-serif italic mb-14 max-w-2xl font-light drop-shadow-lg"
           >
             Authentic Taste. Cozy Vibes.
           </motion.p>
           
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 1 }}
             className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto"
           >
              <a href="#menu" className="w-full sm:w-auto px-10 py-5 rounded-full bg-gradient-to-r from-secondary to-[#EFEBE9] text-[#1A100C] font-bold uppercase tracking-[0.2em] text-xs md:text-sm hover:scale-105 transition-transform shadow-[0_10px_40px_rgba(215,204,200,0.25)] flex items-center justify-center gap-3 group">
                Explore Menu 
                <div className="w-6 h-6 rounded-full bg-[#1A100C] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3 text-secondary" />
                </div>
              </a>
              <a href="#visit" className="w-full sm:w-auto px-10 py-5 rounded-full glass border border-secondary/20 text-white font-bold uppercase tracking-[0.2em] text-xs md:text-sm hover:bg-white/10 transition-colors shadow-xl flex items-center justify-center backdrop-blur-md">
                Visit Us
              </a>
           </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20"
        >
          <span className="text-[9px] uppercase tracking-[0.3em] text-secondary/50 font-bold">Scroll to discover</span>
          <div className="w-px h-16 bg-gradient-to-b from-secondary/50 to-transparent relative overflow-hidden">
             <motion.div 
               animate={{ y: [0, 64] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               className="w-full h-4 bg-secondary absolute top-0" 
             />
          </div>
        </motion.div>
      </motion.header>

      {/* Featured Section */}
      <section id="featured" className="py-32 px-6 md:px-12 relative z-30 bg-[#1A100C] overflow-hidden">
        {/* Added custom coffee background with light brown overlay - increased visibility */}
        <div className="absolute inset-0 z-0">
          <Image src="/assets/coffee_background1.jpg" alt="Coffee Background" fill className="object-cover opacity-80 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[#3E2723]/50" /> {/* Ligher brown opacity overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A100C] via-transparent to-[#1A100C]" /> {/* Edge blending */}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
          >
            <div>
              <span className="text-secondary/60 text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Hand-picked for you</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight">Featured Blends</h2>
            </div>
            <a href="#menu" className="text-sm font-bold uppercase tracking-widest text-secondary hover:text-white flex items-center gap-2 group transition-colors">
              View Full Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredDrinks.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group relative h-[450px] rounded-[2rem] overflow-hidden cursor-pointer"
              >
                {/* Background Image */}
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                
                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                   <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                     <span className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 block">{item.category}</span>
                     <h3 className="text-3xl font-serif font-bold text-white mb-4">{item.name}</h3>
                     <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                       <span className="text-xl font-bold text-white">₹{item.price}</span>
                       <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:scale-110 transition-transform shadow-lg text-primary">
                         <Plus className="w-5 h-5" />
                       </button>
                     </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Split Section */}
      <section id="about" className="py-24 px-6 md:px-12 bg-[#2D1B15] relative overflow-hidden border-y border-white/5">
         {/* Background glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/30 rounded-full blur-[150px] pointer-events-none" />
         
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
            >
              <Image src="/assets/premium_interior.png" alt="Coorg Cafe Interior" fill className="object-cover" />
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none" />
              <div className="absolute top-6 left-6 glass px-6 py-3 rounded-full text-white font-bold text-sm tracking-widest uppercase flex items-center gap-2 border border-white/20">
                <Star className="w-4 h-4 text-secondary" fill="currentColor" /> Authentic
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
               <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-8 border border-white/10">
                 <Coffee className="w-8 h-8 text-secondary" />
               </div>
               <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-white mb-8 tracking-tight leading-tight">
                 The Art of <br/><span className="text-secondary italic">Perfect Brewing</span>
               </h2>
               <p className="text-lg text-secondary/80 leading-relaxed mb-6 font-light">
                 At Coorg Cafe, we believe that every cup tells a story. Sourced directly from the misty hills of Coorg, our beans are roasted to perfection to bring out the authentic, rich notes that define a premium coffee experience.
               </p>
               <p className="text-lg text-secondary/80 leading-relaxed mb-10 font-light">
                 Beyond coffee, we offer uniquely crafted health drinks, traditional teas, and refreshing milk specials, all served in an ambiance designed to let you unwind and savor the moment.
               </p>
               
               <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                 <div>
                   <h4 className="text-white font-bold text-3xl font-serif mb-2">100%</h4>
                   <p className="text-xs uppercase tracking-widest text-secondary/60 font-bold">Organic Beans</p>
                 </div>
                 <div>
                   <h4 className="text-white font-bold text-3xl font-serif mb-2">50+</h4>
                   <p className="text-xs uppercase tracking-widest text-secondary/60 font-bold">Daily Options</p>
                 </div>
               </div>
            </motion.div>
         </div>
      </section>

      {/* Full Menu Scroll Animation Section */}
      <section className="bg-[#1A100C] w-full flex flex-col items-center justify-center relative overflow-hidden -mt-16 sm:-mt-0 pb-12 pt-0 z-20 border-b border-white/5">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-white mb-4 tracking-tight leading-tight">
                Experience The <br />
                <span className="text-secondary italic 1">Complete Menu</span>
              </h1>
              <p className="text-secondary/60 text-lg md:text-xl font-light mb-8 max-w-2xl mx-auto">
                Scroll down to immerse yourself in our authentic offerings.
              </p>
            </>
          }
        >
          <Image
            src="/assets/coorg_cafe_complete_menu.png"
            alt="Coorg Cafe Complete Menu"
            height={1400}
            width={1200}
            className="w-full h-full object-cover object-top rounded-2xl"
            draggable={false}
          />
        </ContainerScroll>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-32 px-6 md:px-12 bg-[#1A100C] relative overflow-hidden">
         {/* Added custom coffee background with light brown overlay - increased visibility */}
         <div className="absolute inset-0 z-0">
           <Image src="/assets/coffee_background2.jpg" alt="Coffee Background 2" fill className="object-cover opacity-75 mix-blend-luminosity" />
           <div className="absolute inset-0 bg-[#4A332A]/55" /> {/* Lighter brown opacity overlay */}
           <div className="absolute inset-0 bg-gradient-to-b from-[#1A100C] via-transparent to-[#2D1B15]" /> {/* Edge blending */}
         </div>

         <div className="max-w-7xl mx-auto relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full border border-secondary/20 text-secondary font-bold uppercase tracking-[0.2em] text-[10px] mb-6 shadow-sm">
                Exquisite Selection
              </span>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tight">Our Menu</h2>
            </motion.div>
            
            {/* Category tabs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 mb-20 bg-black/40 w-fit mx-auto p-2 rounded-full border border-white/5 backdrop-blur-md shadow-2xl"
            >
               {CATEGORIES.map(category => (
                 <button
                   key={category}
                   onClick={() => setActiveCategory(category)}
                   className={`relative px-6 py-3 rounded-full text-xs lg:text-sm font-bold uppercase tracking-widest transition-all overflow-hidden ${
                     activeCategory === category 
                       ? 'text-primary'
                       : 'text-secondary/70 hover:text-white'
                   }`}
                 >
                   {activeCategory === category && (
                     <motion.div 
                       layoutId="activeCategory"
                       className="absolute inset-0 bg-secondary"
                       style={{ borderRadius: 9999 }}
                       transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     />
                   )}
                   <span className="relative z-10">{category}</span>
                 </button>
               ))}
            </motion.div>

            {/* Menu Grid */}
            <motion.div 
              key={activeCategory} // Force re-render animation on tab change
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
               {displayedItems.map((item) => (
                 <motion.div 
                   variants={fadeInUp}
                   key={item.id} 
                   className="glass-card rounded-[2rem] hover:-translate-y-3 transition-transform duration-500 group flex flex-col h-full border border-white/5 shadow-xl hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden bg-[#2D1B15]/40"
                 >
                    {/* Image Header */}
                    <div className="relative w-full h-64 overflow-hidden border-b border-white/5">
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B15] to-transparent opacity-80" />
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                        <span className="text-xl font-bold text-secondary font-serif">₹{item.price}</span>
                      </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                      <p className="text-[10px] text-secondary/50 uppercase tracking-[0.2em] mb-3 font-bold">{item.category}</p>
                      <h3 className="text-2xl font-serif font-bold text-white group-hover:text-secondary transition-colors leading-tight mb-6 flex-1">
                        {item.name}
                      </h3>
                      
                      <button 
                        onClick={() => addToCart(item)}
                        className="w-full py-4 rounded-xl relative overflow-hidden bg-primary/40 text-secondary border border-secondary/20 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 group/btn hover:border-secondary hover:shadow-[0_0_20px_rgba(215,204,200,0.2)]"
                      >
                        {/* Hover reveal background for button */}
                        <div className="absolute inset-0 bg-secondary translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out z-0" />
                        <span className="relative z-10 flex items-center gap-2 group-hover/btn:text-primary transition-colors duration-300">
                           Add To Order <Plus className="w-4 h-4" />
                        </span>
                      </button>
                    </div>
                 </motion.div>
               ))}
            </motion.div>
         </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-32 px-6 md:px-12 bg-[#2D1B15] relative overflow-hidden">
        {/* Background Coffee Theme with light brown overlay */}
        <div className="absolute inset-0 z-0">
          <Image src="/assets/coffee_background3.jpg" alt="Testimonials Background" fill className="object-cover opacity-75 mix-blend-overlay" />
          <div className="absolute inset-0 bg-[#3E2723]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2D1B15] via-transparent to-[#2D1B15]" />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-secondary/5 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full border border-secondary/20 text-secondary font-bold uppercase tracking-[0.2em] text-[10px] mb-6 shadow-sm">Reviews</span>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">What Our Patrons Say</h2>
        </div>

        <div className="relative z-10 w-full overflow-hidden">
           <div className="flex animate-marquee hover:[animation-play-state:paused] py-10">
              {/* Double the items for a gap-less transition */}
              {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, idx) => (
                <div 
                  key={`${testimonial.id}-${idx}`} 
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_40%] min-w-0 px-6"
                >
                  <div className="glass-card p-10 md:p-14 rounded-[3rem] border border-white/10 text-center relative shadow-2xl transition-all duration-500 hover:border-secondary/30 group">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-secondary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(215,204,200,0.5)] text-primary z-20">
                      <Star className="w-5 h-5" fill="currentColor" />
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[3rem] pointer-events-none" />

                    <p className="text-xl md:text-2xl text-white font-serif italic leading-relaxed mb-8 mt-4 font-light relative z-10">
                      "{testimonial.text}"
                    </p>
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-12 h-px bg-secondary/30 mb-4" />
                      <h4 className="text-secondary font-bold uppercase tracking-widest text-sm drop-shadow-sm">{testimonial.name}</h4>
                      <div className="flex items-center gap-1 mt-2 text-secondary/50">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 drop-shadow-lg" fill="currentColor" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Location / Visit Section */}
      <section id="visit" className="py-32 px-6 md:px-12 bg-[#1A100C] relative z-10 overflow-hidden">
         {/* Background Coffee Theme with light brown overlay */}
         <div className="absolute inset-0 z-0">
           <Image src="/assets/coffee_background1.jpg" alt="Visit Background" fill className="object-cover opacity-50 mix-blend-luminosity" />
           <div className="absolute inset-0 bg-[#3E2723]/75" />
           <div className="absolute inset-0 bg-gradient-to-b from-[#1A100C] via-transparent to-[#1A100C]" />
         </div>
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="order-2 lg:order-1 bg-[#2D1B15]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-10 md:p-14 rounded-[3rem]"
            >
               <span className="inline-block px-4 py-1.5 rounded-full border border-secondary/20 text-secondary font-bold uppercase tracking-[0.2em] text-[10px] mb-6 shadow-sm">
                 Location
               </span>
               <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-12 tracking-tight line-clamp-2">Drop By For A Cup</h2>
               
               <div className="flex items-start gap-6 mb-10 group">
                 <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:bg-secondary group-hover:border-secondary transition-all duration-300 shadow-xl">
                   <MapPin className="w-6 h-6 text-secondary group-hover:text-primary transition-colors" />
                 </div>
                 <div>
                   <h4 className="text-white font-bold text-xl mb-3 font-serif">Address</h4>
                   <p className="text-white/90 leading-relaxed font-light text-lg">
                     Sri Rama Temple Circle, Gandhi Circle, Bayasabhi Layout,<br/>
                     KSRTC Colony, Anekal, Karnataka 562106
                   </p>
                 </div>
               </div>
               
               <div className="flex items-start gap-6 mb-12 group">
                 <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:bg-secondary group-hover:border-secondary transition-all duration-300 shadow-xl">
                   <Clock className="w-6 h-6 text-secondary group-hover:text-primary transition-colors" />
                 </div>
                 <div>
                   <h4 className="text-white font-bold text-xl mb-3 font-serif">Hours</h4>
                   <p className="text-white/90 font-light text-lg">Open Daily: 5:00 AM – 9:00 PM</p>
                 </div>
               </div>
               
               <a 
                 href="https://www.google.com/maps?q=12.7093199,77.6985811" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-secondary to-[#EFEBE9] text-[#1A100C] rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 hover:shadow-[0_10px_40px_rgba(215,204,200,0.3)] transition-all group"
               >
                 Get Directions <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </a>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="order-1 lg:order-2 h-[500px] lg:h-[700px] w-full rounded-[3rem] overflow-hidden border border-white/10 relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] glass p-2"
            >
               <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative group">
                 <iframe 
                   src="https://www.google.com/maps?q=12.7093199,77.6985811&output=embed"
                   width="100%" 
                   height="100%" 
                   style={{ border: 0 }} 
                   allowFullScreen 
                   loading="lazy" 
                   referrerPolicy="no-referrer-when-downgrade"
                   className="absolute inset-0 grayscale contrast-125 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 z-0"
                   title="Coorg Cafe Location"
                 ></iframe>
                 {/* Map overlay gradient */}
                 <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#1A100C] to-transparent opacity-60 z-10 block lg:hidden" />
                 <div className="absolute bottom-6 left-6 z-20 glass px-4 py-2 rounded-xl border border-white/20 flex items-center gap-2 group-hover:opacity-0 transition-opacity duration-500">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Anekal, KA</span>
                 </div>
               </div>
            </motion.div>
         </div>
      </section>

      <footer className="py-32 px-6 md:px-12 bg-[#0A0503] relative overflow-hidden border-t border-white/5 z-20">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-30">
            <source src="/assets/introbackground.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0503] via-[#0A0503]/60 to-[#0A0503]" />
        </div>
        {/* Dynamic Background Polish */}
        <div className="absolute inset-0 z-[1]">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-secondary/10 blur-[180px] animate-slow-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary/15 blur-[180px] animate-slow-pulse delay-1000" />
        </div>

        {/* Large Decorative Text Background */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[1500px] pointer-events-none opacity-[0.04] select-none flex justify-center">
           <span className="text-[18vw] font-serif font-black text-white whitespace-nowrap tracking-tighter">COORG</span>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
           <div className="w-20 h-20 rounded-full border border-secondary/20 bg-black/40 flex items-center justify-center mb-10 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-secondary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
             <Image src="/assets/coorg_cafe_logo.png" alt="Logo" fill className="object-cover p-1 relative z-10 group-hover:scale-110 transition-transform duration-500" />
           </div>
           
           <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-[0.2em] mb-16 drop-shadow-2xl"
           >
             <AnimatedShinyText shimmerWidth={200} className="inline-flex">
               COORG CAFE
             </AnimatedShinyText>
           </motion.h2>
           
           <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 mb-20 w-full">
              {['Menu', 'About Us', 'Location', 'Contact'].map(link => (
                <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} className="text-secondary/60 hover:text-white transition-colors font-bold uppercase tracking-[0.25em] text-xs relative group py-2">
                  {link}
                  <span className="absolute bottom-0 left-1/2 w-0 h-px bg-secondary -translate-x-1/2 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
           </div>
           
           <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12 max-w-4xl mx-auto" />
           
           <div className="flex flex-col md:flex-row items-center justify-between w-full text-secondary/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest gap-6">
              <p>© 2026 Coorg Cafe. All rights reserved.</p>

              <p>Authentic Taste. Cozy Vibes.</p>
           </div>
        </div>
      </footer>

    </div>
  );
}
