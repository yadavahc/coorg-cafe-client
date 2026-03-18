"use client";

import { GlowingEffectDemo } from "@/components/glowing-effect-demo";

export default function TestGlowPage() {
  return (
    <main className="min-h-screen bg-background p-8 pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Glowing Effect Demo
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A dynamic, cursor-following glow effect for showcasing premium features of Coorg Cafe.
          </p>
        </div>
        
        <GlowingEffectDemo />
      </div>
    </main>
  );
}
