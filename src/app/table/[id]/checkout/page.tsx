"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  CheckCircle2,
  Loader2,
  ReceiptText,
  Clock,
  AlertCircle,
  QrCode
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";
import RazorpayButton from "@/components/RazorpayButton";
import UpiPaymentButton from "@/components/UpiPaymentButton";

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
  const [availableTables, setAvailableTables] = useState<number[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>(tableId?.toString() || "1");
  const [tableWarning, setTableWarning] = useState<string>("");
  const [loadingTables, setLoadingTables] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "online" | "upi">("cash");
  const [isAwaitingOnlinePayment, setIsAwaitingOnlinePayment] = useState(false);

  useEffect(() => {
    const cartData = searchParams.get("cart");
    if (cartData) {
      try {
        setCart(JSON.parse(decodeURIComponent(cartData)));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    fetchAvailableTables();
  }, [searchParams]);

  async function fetchAvailableTables() {
    try {
      setLoadingTables(true);
      const { data, error } = await supabase
        .from("cafe_tables")
        .select("table_number, is_available, status")
        .eq("is_available", true)
        .neq("status", "inactive")
        .order("table_number", { ascending: true });

      if (error) throw error;

      const numbers = (data || []).map((t: any) => t.table_number).filter((n: number) => n >= 1 && n <= 10);
      setAvailableTables(numbers);

      const routeTable = parseInt(tableId?.toString() || "", 10);
      if (numbers.length === 0) {
        if (!Number.isNaN(routeTable) && routeTable >= 1 && routeTable <= 10) {
          setSelectedTable(String(routeTable));
        }
        setTableWarning("No active tables are configured by admin. You can still continue with a valid table number.");
        return;
      }

      if (!Number.isNaN(routeTable) && numbers.includes(routeTable)) {
        setSelectedTable(String(routeTable));
      } else {
        setSelectedTable(String(numbers[0]));
      }
    } catch (error: any) {
      console.error("Error fetching tables:", error?.message || error);
      setTableWarning("Could not validate table availability. Please enter table number manually (1-10).");
    } finally {
      setLoadingTables(false);
    }
  }

  const total = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  async function createOrderRecord() {
    const tableNumber = parseInt(selectedTable, 10);
    if (Number.isNaN(tableNumber) || tableNumber < 1 || tableNumber > 10) {
      alert("Please enter a valid table number between 1 and 10.");
      return null;
    }

    if (availableTables.length > 0 && !availableTables.includes(tableNumber)) {
      alert("Selected table is currently unavailable. Please choose another table.");
      return null;
    }

    let tableId = null;
    if (availableTables.length > 0) {
      const { data: tableData, error: tableError } = await supabase
        .from("cafe_tables")
        .select("id, table_number, is_available, status")
        .eq("table_number", tableNumber)
        .maybeSingle();

      if (tableError) throw tableError;

      if (tableData && (!tableData.is_available || tableData.status === "inactive")) {
        alert("This table is marked unavailable by admin. Please pick another table.");
        return null;
      }

      tableId = tableData?.id || null;
    }

    const estimatedReadyAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          table_id: tableId,
          table_number: tableNumber,
          order_type: "table_order",
          payment_method: selectedMethod,
          payment_status: selectedMethod === "online" ? "pending" : "cash_pending",
          status: "placed",
          total_amount: total,
          estimated_ready_at: estimatedReadyAt
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = cart.map((item) => ({
      order_id: orderData.id,
      menu_id: item.id,
      quantity: item.quantity,
      price: item.price,
      price_snapshot: item.price
    }));

    const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems);
    if (orderItemsError) throw orderItemsError;

    return { id: orderData.id, tableNumber };
  }

  async function handlePlaceOrder() {
    try {
      setIsPlacingOrder(true);
      const created = await createOrderRecord();
      if (!created) return;

      setNewOrderId(created.id);

      if (selectedMethod === "cash") {
        // Update payment status for cash payment
        const { error } = await supabase
          .from("orders")
          .update({ payment_status: "cash_confirmed" })
          .eq("id", created.id);

        if (error) {
          console.error("Failed to confirm cash payment:", error);
          alert("Failed to confirm order. Please try again.");
          return;
        }

        setOrderComplete(true);
        setTimeout(() => {
          router.push(`/table/${created.tableNumber}/status/${created.id}`);
        }, 1800);
      } else if (selectedMethod === "upi") {
        // For UPI payment, show UPI button
        setIsAwaitingOnlinePayment(true);
      } else {
        // For online payment (Razorpay), show Razorpay button
        setIsAwaitingOnlinePayment(true);
      }

    } catch (error: any) {
      console.error("Error placing order:", error?.message || error);
      alert("Unable to place order. Please try again.");
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
        <h1 className="text-3xl font-black mb-2">Order Confirmed</h1>
        <p className="text-accent/60 text-sm max-w-xs mx-auto">
          Order #{newOrderId?.slice(0, 8)} is placed. Estimated arrival in 5 minutes.
        </p>
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
            {cart.length === 0 ? (
              <div className="text-center py-8 text-accent/60">
                <p className="text-sm font-bold uppercase">No items in cart</p>
                <p className="text-xs mt-2">Please add items from the menu before checkout</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-sm font-bold">
                    <span className="col-span-5">{item.name}</span>
                    <span className="col-span-2 text-right text-accent/60">{formatPrice(item.price)}</span>
                    <span className="col-span-2 text-center">x{item.quantity}</span>
                    <span className="col-span-3 text-right">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="h-px bg-secondary/10 my-4" />
                <div className="flex justify-between items-center text-xl font-black">
                  <span>Total</span>
                  <span className="text-secondary">{formatPrice(total)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-card border border-secondary/20 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">Table Selection</h3>
          </div>
          {tableWarning && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{tableWarning}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-accent/50">Table ID (1-10)</label>
              <input
                min={1}
                max={10}
                type="number"
                className="mt-2 w-full bg-background border border-secondary/20 rounded-xl p-3 focus:outline-none focus:border-secondary"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-accent/50">Available Tables</label>
              <div className="mt-2 p-3 rounded-xl border border-secondary/20 bg-background text-sm">
                {loadingTables ? "Loading..." : availableTables.length > 0 ? availableTables.join(", ") : "Not configured"}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black uppercase text-secondary px-2 mb-4 tracking-widest">Payment Method</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: "cash", label: "Cash Payment", sub: "Pay at counter (manual confirmation)", icon: Wallet },
              { id: "upi", label: "UPI Payment", sub: "Scan Yadava UPI QR code", icon: QrCode },
              { id: "online", label: "Online Payment", sub: "Razorpay secure checkout", icon: CreditCard }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id as "cash" | "online" | "upi")}
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
        {!isAwaitingOnlinePayment ? (
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isPlacingOrder}
            className="w-full bg-primary p-5 rounded-[2.5rem] font-black text-white uppercase tracking-widest shadow-2xl shadow-primary/40 disabled:opacity-50"
          >
            {isPlacingOrder ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating Order...</span>
            ) : (
              "Proceed to Payment"
            )}
          </button>
        ) : selectedMethod === "online" ? (
          <div className="space-y-4">
            <p className="text-center text-xs text-accent/60 font-bold uppercase tracking-wider">Order created. Complete payment to confirm.</p>
            <RazorpayButton
              orderId={newOrderId!}
              amount={total}
              autoOpen={true}
              onSuccess={() => {
                setOrderComplete(true);
                setTimeout(() => {
                  router.push(`/table/${selectedTable}/status/${newOrderId}`);
                }, 2000);
              }}
            />
          </div>
        ) : selectedMethod === "upi" ? (
          <div className="space-y-4">
            <p className="text-center text-xs text-accent/60 font-bold uppercase tracking-wider">Order created. Scan QR to pay via UPI.</p>
            <UpiPaymentButton
              orderId={newOrderId!}
              amount={total}
              onSuccess={() => {
                setOrderComplete(true);
                setTimeout(() => {
                  router.push(`/table/${selectedTable}/status/${newOrderId}`);
                }, 2000);
              }}
            />
          </div>
        ) : null}
      </footer>
    </div>
  );
}
