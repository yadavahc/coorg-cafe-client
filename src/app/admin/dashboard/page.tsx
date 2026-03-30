"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  Table as TableIcon,
  Timer,
  AlertCircle,
  MoreVertical,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";
import * as analytics from "@/lib/analytics";

interface Order {
  id: string;
  table_id: string | null;
  table_number?: number | null;
  order_type: "table_order" | "counter_order";
  payment_status: "pending" | "paid" | "failed" | "cash_pending" | "cash_confirmed";
  total_amount: number;
  status: "placed" | "preparing" | "out_for_delivery" | "delivered" | "pending" | "completed";
  created_at: string;
}

export default function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Change received!', payload);
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          cafe_tables (table_number)
        `)
        .neq("status", "delivered")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedOrders = data.map((o: any) => ({
        ...o,
        table_number: o.cafe_tables?.table_number
      }));
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: "preparing" | "out_for_delivery" | "delivered") {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  const normalizeStatus = (status: Order["status"]) => {
    if (status === "pending") return "placed";
    if (status === "completed") return "delivered";
    return status;
  };

  const getStatusConfig = (status: Order["status"]) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "placed":
        return { label: "Placed", color: "bg-orange-500", icon: AlertCircle };
      case "preparing":
        return { label: "Preparing", color: "bg-blue-500", icon: ChefHat };
      case "out_for_delivery":
        return { label: "Out", color: "bg-indigo-500", icon: Timer };
      default:
        return { label: "Delivered", color: "bg-green-600", icon: CheckCircle2 };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Dashboard</h1>
          <p className="text-accent/40 text-sm">Managing live orders from the coffee station.</p>
        </div>
        <div className="flex bg-card/10 border border-secondary/20 p-1 rounded-xl">
          <div className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase shadow-lg shadow-primary/20">Active</div>
          <div className="px-4 py-2 text-accent/40 text-xs font-bold uppercase hover:bg-secondary/5 transition-colors cursor-pointer rounded-lg">History</div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl">
          <span className="text-[10px] font-black uppercase text-primary tracking-widest">Today's Revenue</span>
          <h2 className="text-3xl font-black mt-1 text-secondary">
            {formatPrice(analytics.getTodayRevenue(orders))}
          </h2>
        </div>
        <div className="p-6 bg-secondary/5 border border-secondary/10 rounded-3xl">
          <span className="text-[10px] font-black uppercase text-accent/40 tracking-widest">Active Orders</span>
          <h2 className="text-3xl font-black mt-1">{orders.length}</h2>
        </div>
        <div className="p-6 bg-secondary/5 border border-secondary/10 rounded-3xl">
          <span className="text-[10px] font-black uppercase text-accent/40 tracking-widest">Avg. Prep Time</span>
          <h2 className="text-3xl font-black mt-1">{analytics.calculateOrderMetrics(orders).avgPrepTime} <span className="text-sm font-bold text-accent/40 tracking-normal">min</span></h2>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-secondary animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-card/5 border border-dashed border-secondary/20 rounded-3xl opacity-40">
          <Clock className="w-12 h-12 mb-4" />
          <h3 className="font-bold">No Active Orders</h3>
          <p className="text-sm">Sit back and enjoy the aroma of coffee.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => {
            const config = getStatusConfig(order.status);
            const Icon = config.icon;
            const normalizedStatus = normalizeStatus(order.status);
            const timeAgo = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);

            return (
              <div 
                key={order.id}
                className="bg-card border border-secondary/20 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-secondary transition-all group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-full border border-secondary/10">
                      <TableIcon className="w-3 h-3" />
                      <span className="text-xs font-black uppercase">
                        {order.order_type === "counter_order" ? "Counter" : `Table ${order.table_number || "NA"}`}
                      </span>
                    </div>
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-lg", config.color)}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-accent/40 uppercase tracking-widest">ID: {order.id.slice(0, 8)}</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-accent/60">
                        <Timer className="w-3 h-3" />
                        {timeAgo} min ago
                      </div>
                    </div>
                    <div className="h-px bg-secondary/10 my-4" />
                    <div className="flex justify-between items-center font-black">
                      <span className="text-sm opacity-60">Total Bill</span>
                      <span className="text-xl text-secondary">{formatPrice(order.total_amount)}</span>
                    </div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-accent/50">
                      Payment: {order.payment_status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => updateStatus(order.id, normalizedStatus === "placed" ? "preparing" : "out_for_delivery")}
                      className="px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-white transition-all"
                    >
                      {normalizedStatus === "placed" ? "Prepare" : "Dispatch"}
                    </button>
                    <button 
                      onClick={() => updateStatus(order.id, 'delivered')}
                      className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-xs font-bold hover:bg-green-500 hover:text-white transition-all"
                    >
                      Deliver
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
