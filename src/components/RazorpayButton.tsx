"use client";

import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RazorpayButtonProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  autoOpen?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayButton({ orderId, amount, onSuccess, autoOpen }: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (autoOpen && orderId && orderId !== "pending") {
      handlePayment();
    }
  }, [autoOpen, orderId]);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Check if using demo mode (no valid API key)
      const apiKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
      const isDemoMode = !apiKey || apiKey === "rzp_test_your_key_id" || apiKey.includes("test");

      if (isDemoMode) {
        // Demo mode: simulate payment success
        const { error } = await supabase
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("id", orderId);

        if (error) {
          console.error("Failed to update status:", error);
          alert("Failed to confirm order. Please try again.");
          return;
        }

        await supabase.from("payments").insert([{
          order_id: orderId,
          razorpay_order_id: `demo_${Date.now()}`,
          razorpay_payment_id: `demo_${Math.random().toString(36).substr(2, 9)}`,
          razorpay_signature: "demo_signature",
          payment_method: "online",
          status: "completed",
          amount: amount
        }]);

        if (onSuccess) onSuccess();
        return;
      }

      const options = {
        key: apiKey,
        amount: amount * 100,
        currency: "INR",
        name: "Coorg Cafe",
        description: `Payment for Order #${orderId.slice(0, 8)}`,
        image: "/coffee-icon.png",
        handler: async function (response: any) {
          const { error } = await supabase
            .from("orders")
            .update({ payment_status: "paid" })
            .eq("id", orderId);

          if (error) {
            console.error("Failed to update status, but payment was successful:", error);
          }

          await supabase.from("payments").insert([{
            order_id: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            payment_method: "online",
            status: "completed",
            amount: amount
          }]);

          if (onSuccess) onSuccess();
        },
        prefill: {
          name: "Guest",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3E2723",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async () => {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", orderId);
      });
      rzp.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      alert("Failed to initialize payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          Pay Online
        </>
      )}
    </button>
  );
}
