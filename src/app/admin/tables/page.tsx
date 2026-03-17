"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Table as TableIcon, 
  QrCode, 
  Download, 
  Trash2, 
  Loader2,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateQR } from "@/lib/qr";
import { cn } from "@/lib/utils";

interface CafeTable {
  id: string;
  table_number: number;
  qr_code_url: string;
}

export default function TableManagement() {
  const [tables, setTables] = useState<CafeTable[]>([]);
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
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(newTableNumber);
    if (isNaN(num)) return;

    try {
      setIsAdding(true);
      // Generate the URL for the table
      const tableUrl = `${window.location.origin}/table/${num}`;
      const qrDataUrl = await generateQR(tableUrl);

      const { data, error } = await supabase
        .from("cafe_tables")
        .insert([{ 
          table_number: num,
          qr_code_url: qrDataUrl 
        }])
        .select();

      if (error) throw error;
      
      setTables([...tables, data[0]].sort((a, b) => a.table_number - b.table_number));
      setNewTableNumber("");
    } catch (error) {
      console.error("Error adding table:", error);
      alert("Failed to add table. Check console.");
    } finally {
      setIsAdding(false);
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
    } catch (error) {
      console.error("Error deleting table:", error);
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
          <p className="text-accent/40 text-sm">Generate static QR codes for physical tables.</p>
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
              placeholder="e.g. 5"
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
                <p className="text-[10px] font-black uppercase text-accent/40 tracking-[0.2em] mb-6">Static QR Required</p>
                
                <div className="relative w-48 h-48 bg-white p-4 rounded-2xl mb-6 shadow-inner group-hover:scale-105 transition-transform">
                   <img src={table.qr_code_url} alt={`QR for Table ${table.table_number}`} className="w-full h-full" />
                </div>

                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => downloadQR(table.qr_code_url, table.table_number)}
                    className="flex-1 py-3 bg-secondary/10 border border-secondary/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-secondary/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
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
