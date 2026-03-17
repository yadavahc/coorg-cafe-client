"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  table_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  cafe_tables?: { table_number: number };
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          cafe_tables (table_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    o.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <History className="w-8 h-8 text-secondary" />
            Order History
          </h1>
          <p className="text-accent/40 text-sm mt-1">Reviewing past transactions and performance.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="p-3 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-all border border-secondary/10">
            <Download className="w-5 h-5" />
          </button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
            <input 
              type="text" 
              placeholder="Search by ID or Status..."
              className="w-full bg-card/10 border border-secondary/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-secondary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-secondary animate-spin" />
        </div>
      ) : (
        <div className="bg-card border border-secondary/20 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-secondary/10 bg-secondary/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">Date & Time</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">Source</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40 text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="text-[10px] text-accent/40 font-medium">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[10px] bg-secondary/10 px-2 py-1 rounded text-secondary font-bold">
                        #{order.id.slice(0, 8)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold uppercase py-1 px-3 bg-card-foreground/5 rounded-full border border-secondary/10">
                        {order.cafe_tables?.table_number ? `Table ${order.cafe_tables.table_number}` : 'Counter'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase",
                        order.status === 'completed' ? "bg-zinc-500 text-white" : 
                        order.status === 'paid' ? "bg-green-500 text-white" : "bg-orange-500 text-white"
                      )}>
                        {order.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {order.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-secondary">{formatPrice(order.total_amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-secondary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-4 h-4 text-accent/40" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
