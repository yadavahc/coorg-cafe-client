"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Table as TableIcon, 
  Download, 
  Trash2, 
  Loader2,
  ExternalLink,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateQR } from "@/lib/qr";
import { cn } from "@/lib/utils";

interface CafeTable {
  id: string;
  table_number: number;
  qr_code_url: string;
  is_available: boolean;
  status: "available" | "occupied" | "inactive";
}

export default function TableManagement() {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [paymentQRs, setPaymentQRs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

  async function fetchTables() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cafe_tables")
        .select("*")
        .order("table_number", { ascending: true });

      if (error) throw error;
      setTables(data || []);

      // Generate payment QRs for each table
      if (data && data.length > 0) {
        const qrMap: Record<number, string> = {};
        for (const table of data) {
          const paymentUrl = `${window.location.origin}/table/${table.table_number}/checkout`;
          const qrCode = await generateQR(paymentUrl);
          qrMap[table.table_number] = qrCode;
        }
        setPaymentQRs(qrMap);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(newTableNumber);
    if (isNaN(num) || num < 1 || num > 10) {
      alert("Table number must be between 1 and 10.");
      return;
    }

    try {
      setIsAdding(true);
      // Generate the URL for the table
      const tableUrl = `${window.location.origin}/table/${num}`;
      const qrDataUrl = await generateQR(tableUrl);

      const { data, error } = await supabase
        .from("cafe_tables")
        .insert([{ 
          table_number: num,
          qr_code_url: qrDataUrl,
          is_available: true,
          status: "available"
        }])
        .select();

      if (error) throw error;

      // Generate payment QR for the new table
      const paymentUrl = `${window.location.origin}/table/${num}/checkout`;
      const paymentQR = await generateQR(paymentUrl);

      setTables([...tables, data[0]].sort((a, b) => a.table_number - b.table_number));
      setPaymentQRs((prev) => ({ ...prev, [num]: paymentQR }));
      setNewTableNumber("");
    } catch (error: any) {
      const errorMessage = error?.message || error?.status || JSON.stringify(error) || "Unknown error";
      console.error("Error adding table:", errorMessage);
      alert(`Failed to add table: ${errorMessage}`);
    } finally {
      setIsAdding(false);
    }
  }

  async function toggleTableAvailability(id: string, current: boolean) {
    try {
      const { error } = await supabase
        .from("cafe_tables")
        .update({ is_available: !current, status: !current ? "available" : "inactive" })
        .eq("id", id);

      if (error) throw error;

      setTables((prev) =>
        prev.map((table) =>
          table.id === id
            ? { ...table, is_available: !current, status: !current ? "available" : "inactive" }
            : table
        )
      );
    } catch (error: any) {
      console.error("Error updating table availability:", error?.message || error);
    }
  }

  async function updateTableStatus(id: string, status: CafeTable["status"]) {
    try {
      const { error } = await supabase
        .from("cafe_tables")
        .update({ status, is_available: status !== "inactive" })
        .eq("id", id);

      if (error) throw error;

      setTables((prev) =>
        prev.map((table) => (table.id === id ? { ...table, status, is_available: status !== "inactive" } : table))
      );
    } catch (error: any) {
      console.error("Error updating table status:", error?.message || error);
    }
  }

  async function handleDeleteTable(id: string) {
    if (!confirm("Delete this table and its QR code?")) return;
    try {
      const { error } = await supabase
        .from("cafe_tables")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setTables(tables.filter(t => t.id !== id));
    } catch (error: any) {
      console.error("Error deleting table:", error?.message || error);
    }
  }

  const downloadQR = (qrUrl: string, tableNum: number) => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `CoorgCafe_Table_${tableNum}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Table QR Management</h1>
          <p className="text-accent/40 text-sm">Manage tables (1-10), QR links, and availability status.</p>
        </div>
      </div>

      {/* Add Table Form */}
      <div className="bg-card border border-secondary/20 rounded-3xl p-6">
        <form onSubmit={handleAddTable} className="flex gap-4 items-end">
          <div className="flex-1 max-w-[200px]">
            <label className="text-xs font-bold text-accent/60 mb-1.5 block uppercase tracking-wider">Table Number</label>
            <input 
              required
              type="number" 
              className="w-full bg-background border border-secondary/20 rounded-xl p-3 focus:outline-none focus:border-secondary transition-colors"
              value={newTableNumber}
              onChange={e => setNewTableNumber(e.target.value)}
              placeholder="1 to 10"
              min={1}
              max={10}
            />
          </div>
          <button 
            type="submit"
            disabled={isAdding}
            className="bg-primary text-white h-12 px-6 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all disabled:opacity-50"
          >
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Add Table
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-secondary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div 
              key={table.id}
              className="bg-card border border-secondary/20 rounded-3xl overflow-hidden hover:border-secondary/50 transition-all group"
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4">
                  <TableIcon className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-black mb-1">Table {table.table_number}</h3>
                <p className="text-[10px] font-black uppercase text-accent/40 tracking-[0.2em] mb-4">QR Codes + Status</p>

                <div className="w-full grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => toggleTableAvailability(table.id, table.is_available)}
                    className={cn(
                      "py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2",
                      table.is_available
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-zinc-500/10 border-zinc-500/30 text-zinc-300"
                    )}
                  >
                    {table.is_available ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {table.is_available ? "Available" : "Inactive"}
                  </button>
                  <select
                    value={table.status}
                    onChange={(e) => updateTableStatus(table.id, e.target.value as CafeTable["status"])}
                    className="py-2 px-2 rounded-xl border border-secondary/20 bg-background text-xs font-bold"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                {paymentQRs[table.table_number] && (
                  <div className="w-full p-4 bg-blue-50 rounded-2xl mb-4 border-2 border-blue-200">
                    <p className="text-[10px] font-black uppercase text-blue-900 tracking-[0.2em] mb-2">Payment Checkout QR</p>
                    <img src={paymentQRs[table.table_number]} alt={`Payment QR for Table ${table.table_number}`} className="w-full h-auto rounded-lg" />
                  </div>
                )}

                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => downloadQR(table.qr_code_url, table.table_number)}
                    className="flex-1 py-2 bg-secondary/10 border border-secondary/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-secondary/20 transition-all"
                    title="Download Table Ordering QR"
                  >
                    <Download className="w-4 h-4" />
                    Table QR
                  </button>
                  {paymentQRs[table.table_number] && (
                    <button
                      onClick={() => downloadQR(paymentQRs[table.table_number], table.table_number)}
                      className="flex-1 py-2 bg-blue-500/10 border border-blue-500/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-500/20 transition-all"
                      title="Download Payment Checkout QR"
                    >
                      <Download className="w-4 h-4" />
                      Pay QR
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <a 
                  href={`/table/${table.table_number}`} 
                  target="_blank"
                  className="mt-4 text-[10px] font-bold text-accent/40 flex items-center gap-1 hover:text-secondary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview Live Page
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
