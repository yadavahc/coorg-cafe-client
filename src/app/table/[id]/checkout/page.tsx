"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Loader2,
  ReceiptText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";
import RazorpayButton from "@/components/RazorpayButton";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function Checkout() {
  const { id: tableId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'counter' | 'online'>('counter');

  useEffect(() => {
    const cartData = searchParams.get("cart");
    if (cartData) {
      try {
        setCart(JSON.parse(decodeURIComponent(cartData)));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, [searchParams]);

  const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  async function handlePlaceOrder() {
    try {
      setIsPlacingOrder(true);
      
      const { data: tableData } = await supabase
        .from("cafe_tables")
        .select("id")
        .eq("table_number", tableId)
        .single();

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          table_id: tableData?.id || null,
          total_amount: total,
          status: "pending"
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      await supabase.from("order_items").insert(orderItems);

      setNewOrderId(orderData.id);
      setOrderComplete(true);
      
      setTimeout(() => {
        router.push(`/table/${tableId}/status/${orderData.id}`);
      }, 2000);

    } catch (error) {
      console.error("Error placing order:", error);
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black mb-2">Order Received!</h1>
        <p className="text-accent/60 text-sm max-w-xs mx-auto">Redirecting to tracker...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="p-6 flex items-center gap-4 border-b border-secondary/10">
        <button onClick={() => router.back()} className="p-2 border border-secondary/20 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase">Review Order</h1>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div className="bg-card border border-secondary/20 rounded-[2rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <ReceiptText className="w-5 h-5 text-secondary" />
            <span className="text-xs font-black uppercase text-secondary tracking-tighter">Summary</span>
          </div>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm font-bold">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="h-px bg-secondary/10 my-4" />
            <div className="flex justify-between items-center text-xl font-black">
              <span>Total</span>
              <span className="text-secondary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black uppercase text-secondary px-2 mb-4 tracking-widest">Payment Method</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'counter', label: 'Pay at Counter', sub: 'UPI / Cash / Card', icon: CreditCard },
              { id: 'online', label: 'Pay Online', sub: 'Razorpay Secure', icon: Clock }
            ].map((m) => (
              <button 
                key={m.id}
                onClick={() => setSelectedMethod(m.id as any)}
                className={cn(
                  "flex items-center justify-between p-5 bg-card border-2 rounded-3xl transition-all",
                  selectedMethod === m.id ? "border-primary" : "border-secondary/10 opacity-70"
                )}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-secondary/5 rounded-xl flex items-center justify-center">
                    <m.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{m.label}</p>
                    <p className="text-[10px] text-accent/40 font-bold">{m.sub}</p>
                  </div>
                </div>
                <div className={cn("w-6 h-6 rounded-full border-4", selectedMethod === m.id ? "border-primary bg-primary" : "border-secondary/20")} />
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="p-8 pb-12 border-t border-secondary/10 bg-card/30">
        <button 
          onClick={handlePlaceOrder}
          disabled={cart.length === 0 || isPlacingOrder}
          className="w-full bg-primary p-5 rounded-[2.5rem] font-black text-white uppercase tracking-widest shadow-2xl shadow-primary/40 disabled:opacity-50"
        >
          {isPlacingOrder ? "Processing..." : selectedMethod === 'online' ? "Proceed to Pay" : "Place Order"}
        </button>

        {newOrderId && selectedMethod === 'online' && (
          <div className="hidden">
            <RazorpayButton 
              orderId={newOrderId} 
              amount={total} 
              autoOpen={true}
              onSuccess={() => {
                setOrderComplete(true);
                setTimeout(() => {
                  router.push(`/table/${tableId}/status/${newOrderId}`);
                }, 2000);
              }} 
            />
          </div>
        )}
      </footer>
    </div>
  );
}
