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

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        name: "Coorg Cafe",
        description: `Payment for Order #${orderId.slice(0, 8)}`,
        image: "/coffee-icon.png",
        handler: async function (response: any) {
          // On Success
          const { error } = await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", orderId);

          if (error) {
            console.error("Failed to update status, but payment was successful:", error);
          }

          // Insert into payments table
          await supabase.from("payments").insert([{
            order_id: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            status: "success",
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
          color: "#3E2723", // Primary brown
        },
      };

      const rzp = new window.Razorpay(options);
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
