"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Coffee, 
  ShoppingCart, 
  Plus, 
  Minus, 
  ChevronRight,
  TrendingUp,
  Loader2,
  Info
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
}

interface TableInfo {
  id?: string;
  table_number: number;
  is_available?: boolean;
  status?: "available" | "occupied" | "inactive";
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function TableMenu() {
  const { id } = useParams();
  const router = useRouter();
  const [table, setTable] = useState<TableInfo | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [tableUnavailable, setTableUnavailable] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch Table Info
      const { data: tableData, error: tableError } = await supabase
        .from("cafe_tables")
        .select("*")
        .eq("table_number", id) // Using table_number as ID for simplicity in URL
        .single();

      if (tableError) console.warn("Table not found, using generic ID");
      const routeTableNumber = parseInt(id?.toString() || "0", 10);
      setTable(tableData || { table_number: Number.isNaN(routeTableNumber) ? 0 : routeTableNumber });
      if (tableData && (!tableData.is_available || tableData.status === "inactive")) {
        setTableUnavailable(true);
      } else {
        setTableUnavailable(false);
      }

      // Fetch Menu
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true);

      if (menuError) throw menuError;
      setItems(menuData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const existing = cart.find(i => i.id === itemId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setCart(cart.filter(i => i.id !== itemId));
    }
  };

  const categories = ["All", ...Array.from(new Set(items.map(i => i.category)))];
  const filteredItems = selectedCategory === "All" 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Coffee className="w-12 h-12 text-secondary animate-bounce mb-4" />
        <h1 className="text-xl font-bold">Brewing your experience...</h1>
        <p className="text-accent/40 text-sm mt-2">Loading Coorg Cafe Table {id}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Header */}
      <header className="p-6 sticky top-0 bg-background/80 backdrop-blur-md z-20 flex justify-between items-center border-b border-secondary/10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
            <Coffee className="w-6 h-6 text-secondary" />
            Coorg Cafe
          </h1>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Table {table?.table_number || id}</p>
        </div>
        <button className="p-3 bg-secondary/10 rounded-2xl">
          <Info className="w-5 h-5 text-secondary" />
        </button>
      </header>

      {/* Hero / Promo */}
      <section className="px-6 py-8">
        <div className="p-6 bg-gradient-to-br from-primary to-secondary/40 rounded-[2rem] shadow-2xl shadow-primary/20 relative overflow-hidden group">
          <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
          <h2 className="text-3xl font-black text-white leading-none mb-2">Morning Filter Coffee</h2>
          <p className="text-white/70 text-sm font-medium">Bestseller of the day in Coorg.</p>
          <button className="mt-6 px-6 py-2.5 bg-white text-primary rounded-full text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform">
            Try Now
          </button>
        </div>
      </section>

      {tableUnavailable && (
        <section className="px-6 pb-2">
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl text-sm font-bold">
            This table is currently inactive. Please contact staff or choose another table.
          </div>
        </section>
      )}

      {/* Category Pills */}
      <div className="flex gap-3 overflow-x-auto px-6 py-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap border transition-all",
              selectedCategory === cat 
                ? "bg-secondary border-secondary text-white shadow-lg shadow-secondary/20" 
                : "bg-card border-secondary/10 text-accent/60"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <main className="px-6 py-8 grid grid-cols-1 gap-6">
        {filteredItems.map((item) => {
          const cartItem = cart.find(i => i.id === item.id);
          
          return (
            <div 
              key={item.id}
              className="flex items-center gap-4 p-4 bg-card border border-secondary/10 rounded-[2rem] hover:border-secondary/30 transition-colors group"
            >
              <div className="w-20 h-20 bg-secondary/5 rounded-3xl flex items-center justify-center text-2xl font-black text-secondary">
                {item.name.charAt(0)}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{item.category}</span>
                <h3 className="text-base font-bold text-accent group-hover:text-white transition-colors">{item.name}</h3>
                <span className="text-lg font-black text-secondary block mt-1">{formatPrice(item.price)}</span>
              </div>
              
              {cartItem ? (
                <div className="flex items-center bg-primary text-white p-1 rounded-2xl gap-3">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black w-4 text-center">{cartItem.quantity}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => addToCart(item)}
                  className="p-4 bg-secondary/10 hover:bg-primary hover:text-white rounded-2xl transition-all active:scale-90"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}
      </main>

      {/* Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-8 left-6 right-6 z-50">
          <button 
            disabled={tableUnavailable}
            onClick={() => router.push(`/table/${id}/checkout?cart=${encodeURIComponent(JSON.stringify(cart))}`)}
            className="w-full bg-primary p-5 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-primary/40 animate-in slide-in-from-bottom-10 duration-500 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl relative">
                <ShoppingCart className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 bg-secondary text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <p className="text-white font-black text-lg leading-none">{formatPrice(totalPrice)}</p>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">View Order</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-sm uppercase tracking-wider">Place Order</span>
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
