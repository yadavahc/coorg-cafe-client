"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const VapourTextEffect = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const letters = text.split("");

  return (
    <div className={cn("inline-flex relative z-20", className)}>
      {letters.map((char, index) => (
        <span key={index} className="relative inline-block">
          {/* Base readable character */}
          <span className="relative z-10">{char === " " ? "\u00A0" : char}</span>
          
          {/* Vaporizing particle 1 */}
          <motion.span
            className="absolute top-0 left-0 text-white/60 z-0 pointer-events-none"
            initial={{ opacity: 0, scale: 1, filter: "blur(0px)", y: 0 }}
            animate={{
              opacity: [0, 0.7, 0],
              scale: [1, 1.3, 1.8],
              filter: ["blur(0px)", "blur(8px)", "blur(16px)"],
              y: [0, -40, -80],
              x: [0, index % 2 === 0 ? 15 : -15, index % 2 === 0 ? 30 : -30],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: index * 0.1,
              ease: "easeOut",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
          
          {/* Vaporizing particle 2 (more blur, rising higher) */}
          <motion.span
            className="absolute top-0 left-0 text-secondary/40 z-0 pointer-events-none mix-blend-screen"
            initial={{ opacity: 0, scale: 1, filter: "blur(2px)", y: 0 }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [1, 1.5, 2.2],
              filter: ["blur(2px)", "blur(12px)", "blur(20px)"],
              y: [0, -50, -110],
              x: [0, index % 2 === 0 ? -10 : 10, index % 2 === 0 ? -20 : 20],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.1 + 0.5,
              ease: "easeOut",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </div>
  );
};
