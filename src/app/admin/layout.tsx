"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ReceiptIndianRupee, 
  History, 
  Settings,
  Coffee,
  ChevronRight,
  Table as TableIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Menu Management", href: "/admin/menu", icon: UtensilsCrossed },
  { name: "Tables Management", href: "/admin/tables", icon: TableIcon },
  { name: "Billing Counter", href: "/admin/billing", icon: ReceiptIndianRupee },
  { name: "Order History", href: "/admin/history", icon: History },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-secondary/20 bg-card/10 flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-secondary/20">
          <Coffee className="w-8 h-8 text-secondary" />
          <span className="text-xl font-bold tracking-tight uppercase">Coorg Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "hover:bg-secondary/10 text-accent/60 hover:text-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-secondary/70")} />
                  <span className="font-medium text-sm">{link.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-secondary/20">
          <button className="w-full p-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors text-sm font-medium flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live System Active
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-secondary/20 flex items-center justify-between px-8 bg-card/5 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-sm font-semibold text-accent uppercase tracking-widest">
            {sidebarLinks.find(l => l.href === pathname)?.name || "Management"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-xs text-secondary bg-secondary/10 px-3 py-1 rounded-full font-bold">
              MANAGER MODE
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold">
              YC
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
