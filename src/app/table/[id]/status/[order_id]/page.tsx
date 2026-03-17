"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Coffee, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Timer,
  RefreshCw,
  Home,
  UtensilsCrossed
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  status: 'pending' | 'preparing' | 'completed' | 'paid';
  total_amount: number;
}

export default function OrderStatus() {
  const { id: tableId, order_id: orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();

    // Subscribe to changes for this specific order
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('Order update received!', payload);
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function fetchOrder() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { status: 'pending', label: 'Order Received', icon: Clock, desc: 'We have received your coffee request.' },
    { status: 'preparing', label: 'Preparing', icon: ChefHat, desc: 'Our barista is hand-picking your beans.' },
    { status: 'completed', label: 'Ready', icon: CheckCircle2, desc: 'Your coffee is ready! Enjoy the aroma.' }
  ];

  const currentStepIndex = order ? steps.findIndex(s => s.status === order.status) : 0;
  // If status is 'paid', it's effectively 'pending' or 'preparing' but we'll show based on kitchen flow.
  // For simplicity, handle 'paid' as 'pending' for customer tracking unless kitchen updates it.
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-10 h-10 text-secondary animate-spin mb-4" />
        <h1 className="text-xl font-bold uppercase tracking-widest">Tracking Order...</h1>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold">Order Not Found</h1>
        <button 
          onClick={() => router.push(`/table/${tableId}`)}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-6 max-w-lg mx-auto">
      {/* Header */}
      <header className="flex flex-col items-center gap-4 py-8">
        <div className="w-20 h-20 bg-secondary/10 rounded-[2.5rem] flex items-center justify-center relative">
          <Coffee className="w-10 h-10 text-secondary" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full animate-ping opacity-20" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight">Coorg ☕ Tracker</h1>
          <p className="text-accent/40 text-[10px] font-black uppercase tracking-widest mt-1">Order #{orderId?.toString().slice(0, 8)}</p>
        </div>
      </header>

      {/* Main Status */}
      <main className="flex-1 space-y-12 py-8">
        <div className="space-y-10 relative">
          {/* Progress Line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-secondary/10 -z-10" />
          
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex || (order.status === 'completed' && index <= currentStepIndex);
            const isActive = index === currentStepIndex && order.status !== 'completed';
            const Icon = step.icon;
            
            return (
              <div 
                key={step.status}
                className={cn(
                  "flex gap-6 transition-all duration-500",
                  !isCompleted && !isActive && "opacity-30 grayscale"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all",
                  isCompleted ? "bg-secondary border-secondary text-white" : 
                  isActive ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 animate-pulse" : 
                  "bg-card border-secondary/10 text-accent/20"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className={cn("font-black text-lg", (isCompleted || isActive) ? "text-accent" : "text-accent/20")}>
                    {step.label}
                  </h3>
                  <p className="text-xs font-medium text-accent/40">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated Time */}
        <div className="p-8 bg-card border border-secondary/10 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl shadow-secondary/5">
          <Timer className="w-8 h-8 text-secondary mb-3" />
          <span className="text-[10px] font-black uppercase text-secondary tracking-widest">Est. Ready In</span>
          <h2 className="text-4xl font-black mt-1">8-10 <span className="text-sm text-accent/40">min</span></h2>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="py-8 grid grid-cols-2 gap-4">
        <button 
          onClick={() => router.push(`/table/${tableId}`)}
          className="p-5 bg-card border border-secondary/10 rounded-3xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-2 hover:bg-secondary/5 transition-colors"
        >
          <UtensilsCrossed className="w-5 h-5 text-secondary" />
          Order More
        </button>
        <button 
          onClick={() => router.push("/")}
          className="p-5 bg-card border border-secondary/10 rounded-3xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-2 hover:bg-secondary/5 transition-colors"
        >
          <Home className="w-5 h-5 text-secondary" />
          Cafe Home
        </button>
      </footer>
    </div>
  );
}
