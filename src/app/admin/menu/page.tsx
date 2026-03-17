"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url: string;
}

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Coffee",
    is_available: true
  });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error("Error fetching items:", error.message || error);
      if (error.details) console.error("Error details:", error.details);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert([{
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          is_available: formData.is_available
        }])
        .select();

      if (error) throw error;
      
      setItems([data[0], ...items]);
      setIsModalOpen(false);
      setFormData({ name: "", price: "", category: "Coffee", is_available: true });
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item. Check Console.");
    }
  }

  async function toggleAvailability(id: string, current: boolean) {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !current })
        .eq("id", id);

      if (error) throw error;
      setItems(items.map(item => item.id === id ? { ...item, is_available: !current } : item));
    } catch (error) {
      console.error("Error updating item:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
            <input 
              type="text" 
              placeholder="Search dishes..."
              className="w-full bg-card/10 border border-secondary/20 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-secondary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white p-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:block">Add Item</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-secondary animate-spin" />
          <p className="text-accent/60 animate-pulse font-medium">Loading Coorg Menu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className={cn(
                "group relative bg-card border border-secondary/20 rounded-2xl overflow-hidden transition-all hover:border-secondary/50",
                !item.is_available && "opacity-75 grayscale-[0.5]"
              )}
            >
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1 block">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold">{item.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        item.is_available ? "text-green-400 hover:bg-green-400/10" : "text-red-400 hover:bg-red-400/10"
                      )}
                      title={item.is_available ? "Mark as Unavailable" : "Mark as Available"}
                    >
                      {item.is_available ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <span className="text-xl font-black text-secondary">
                    {formatPrice(item.price)}
                  </span>
                  {!item.is_available && (
                    <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-1 rounded">
                      OUT OF STOCK
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-secondary/30 w-full max-w-md rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-6">Add New Dish</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-accent/60 mb-1.5 block uppercase tracking-wider">Item Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-background border border-secondary/20 rounded-xl p-3 focus:outline-none focus:border-secondary transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Filter Coffee"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-accent/60 mb-1.5 block uppercase tracking-wider">Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-background border border-secondary/20 rounded-xl p-3 focus:outline-none focus:border-secondary transition-colors"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-accent/60 mb-1.5 block uppercase tracking-wider">Category</label>
                  <select 
                    className="w-full bg-background border border-secondary/20 rounded-xl p-3 focus:outline-none focus:border-secondary transition-colors"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Coffee</option>
                    <option>Tea</option>
                    <option>Snacks</option>
                    <option>Desserts</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-secondary/20 rounded-xl hover:bg-secondary/10 transition-colors font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/80 transition-all font-bold"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
