"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { BASE_MENU_IDS } from "@/lib/menuItems";
import { Trash2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function AdminCleanup() {
  const [extraItems, setExtraItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchExtraItems();
  }, []);

  async function fetchExtraItems() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, category, price");

      if (error) throw error;

      // Filter items that are NOT in base menu
      const extra = data.filter(item => !BASE_MENU_IDS.has(item.id));
      setExtraItems(extra);
    } catch (error) {
      console.error("Error fetching items:", error);
      setMessage("Error fetching menu items");
    } finally {
      setLoading(false);
    }
  }

  async function handleCleanup() {
    if (!window.confirm(`Delete ${extraItems.length} extra items? This cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      const idsToDelete = extraItems.map(item => item.id);

      const { error } = await supabase
        .from("menu_items")
        .delete()
        .in("id", idsToDelete);

      if (error) throw error;

      setMessage(`✅ Successfully deleted ${extraItems.length} items!`);
      setExtraItems([]);
    } catch (error) {
      console.error("Error deleting items:", error);
      setMessage(`❌ Error: ${error}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-2">Database Cleanup</h1>
        <p className="text-accent/60">Remove extra menu items and keep only the original 17 items</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${message.includes("✅") ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"}`}>
          <p className="text-sm font-bold">{message}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      ) : extraItems.length === 0 ? (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <p className="font-bold text-green-400">✅ Database is clean!</p>
          <p className="text-sm text-green-300 mt-1">Only the original 17 items are in the database.</p>
        </div>
      ) : (
        <>
          <div className="bg-amber-500/10 border border-amber-500 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">Found {extraItems.length} extra items</p>
              <p className="text-sm text-amber-100 mt-1">These items will be deleted:</p>
            </div>
          </div>

          <div className="space-y-2">
            {extraItems.map(item => (
              <div key={item.id} className="bg-card border border-secondary/20 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-accent/50">{item.category} • ₹{item.price}</p>
                </div>
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
            ))}
          </div>

          <button
            onClick={handleCleanup}
            disabled={deleting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Delete All Extra Items
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
