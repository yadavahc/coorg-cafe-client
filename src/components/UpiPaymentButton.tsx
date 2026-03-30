"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UpiPaymentButtonProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    yadavaUpiQR: string;
  }
}

export default function UpiPaymentButton({ orderId, amount, onSuccess, onClose }: UpiPaymentButtonProps) {
  const [showQR, setShowQR] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleShowQR = () => {
    setShowQR(true);
  };

  const handleConfirmPayment = async () => {
    try {
      setIsConfirming(true);

      // Update order status to paid
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", orderId);

      if (error) {
        console.error("Failed to update status:", error);
        alert("Failed to confirm payment. Please try again.");
        return;
      }

      // Record the UPI payment
      await supabase.from("payments").insert([{
        order_id: orderId,
        razorpay_order_id: null,
        razorpay_payment_id: `upi_${Date.now()}`,
        razorpay_signature: "upi_payment",
        payment_method: "upi",
        status: "completed",
        amount: amount
      }]);

      setConfirmed(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("Failed to confirm payment. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <div className="w-full">
        <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-green-400 font-bold">Payment Confirmed!</p>
          <p className="text-sm text-green-300 mt-1">UPI payment received</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!showQR ? (
        <button
          onClick={handleShowQR}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:scale-[1.02] transition-transform"
        >
          Show Yadava UPI QR
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border border-secondary/20 rounded-2xl p-6 text-center">
            <p className="text-xs font-bold text-accent/60 uppercase tracking-wider mb-4">Scan with any UPI app</p>
            <div className="bg-white p-6 rounded-2xl shadow-inner mb-6 inline-block">
              <img
                src="/yadava_upi.jpeg"
                alt="Yadava UPI QR"
                className="w-48 h-48 object-contain"
              />
            </div>
            <p className="text-sm font-bold text-secondary mb-4">Amount: ₹{amount.toFixed(2)}</p>
            <p className="text-xs text-accent/40 mb-6">After scanning and completing payment, click button below</p>

            <button
              onClick={handleConfirmPayment}
              disabled={isConfirming}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Payment Done"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
