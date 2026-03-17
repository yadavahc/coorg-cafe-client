"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Loader2,
  Table as TableIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";
import { generateQR } from "@/lib/qr";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function BillingCounter() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("Counter");
  const [paymentQR, setPaymentQR] = useState<string | null>(null);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
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

  const removeFromCart = (id: string) => {
    const existing = cart.find(i => i.id === id);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setCart(cart.filter(i => i.id !== id));
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  async function handleGeneratePayment() {
    try {
      setIsGeneratingPayment(true);
      
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          total_amount: total,
          status: "pending"
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const paymentUrl = `${window.location.origin}/pay/${orderData.id}?amount=${total}`;
      const qr = await generateQR(paymentUrl);
      setPaymentQR(qr);
    } catch (error) {
      console.error("Error generating payment:", error);
    } finally {
      setIsGeneratingPayment(false);
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col xl:flex-row h-full xl:h-[calc(100vh-160px)] gap-8 overflow-hidden">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
            <input 
              type="text" 
              placeholder="Search items..."
              className="w-full bg-card/10 border border-secondary/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-secondary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-card/10 border border-secondary/20 rounded-xl p-1">
            {["Coffee", "Tea", "Snacks"].map((cat) => (
              <button 
                key={cat}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors hover:bg-secondary/10"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="flex flex-col text-left p-4 bg-card border border-secondary/20 rounded-2xl hover:border-secondary transition-all active:scale-95 group shadow-sm hover:shadow-lg shadow-secondary/5"
              >
                <div className="flex-1 mb-4">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{item.category}</span>
                  <h3 className="font-bold text-sm leading-tight mt-1 line-clamp-2">{item.name}</h3>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-secondary">{formatPrice(item.price)}</span>
                  <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Area */}
      <div className="w-[400px] flex flex-col bg-card border border-secondary/20 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-secondary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold">Billing Cart</h2>
          </div>
          <button 
            onClick={() => setCart([])}
            className="text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <ShoppingCart className="w-12 h-12 mb-4" />
              <p className="text-sm font-medium">Cart is empty.<br/>Select items to start billing.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 rounded-2xl hover:bg-secondary/5 transition-colors group">
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{item.name}</h4>
                  <p className="text-xs text-accent/40">{formatPrice(item.price)} × {item.quantity}</p>
                </div>
                <div className="flex items-center bg-card-foreground/5 rounded-xl border border-secondary/10 overflow-hidden">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 hover:bg-red-500/10 text-red-500 transition-colors"
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </button>
                  <span className="w-8 text-center text-sm font-black text-secondary">{item.quantity}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="p-2 hover:bg-primary/10 text-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-card-foreground/5 border-t border-secondary/10 space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-accent/60 px-1">
            <span>SUBTOTAL</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-black px-1">
            <span>TOTAL</span>
            <span className="text-secondary">{formatPrice(total)}</span>
          </div>
          
          <button 
            disabled={cart.length === 0 || isGeneratingPayment}
            onClick={handleGeneratePayment}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none mt-2"
          >
            {isGeneratingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            Generate Payment QR
          </button>
        </div>
      </div>

      {paymentQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-card border border-secondary/30 w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in duration-300">
            <h2 className="text-xl font-black mb-2 uppercase tracking-tight">Scan to Pay</h2>
            <p className="text-sm text-accent/40 mb-8 font-medium">Customer can scan this to pay {formatPrice(total)}</p>
            
            <div className="bg-white p-6 rounded-[2.5rem] shadow-inner mb-8 border-8 border-secondary/5 inline-block">
              <img src={paymentQR} alt="Payment QR" className="w-48 h-48" />
            </div>

            <button 
              onClick={() => {
                setPaymentQR(null);
                setCart([]);
              }}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all"
            >
              Done & Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
