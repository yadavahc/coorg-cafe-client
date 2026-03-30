"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  Wallet,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";
import * as analytics from "@/lib/analytics";

interface Order {
  id: string;
  table_number?: number | null;
  order_type: "table_order" | "counter_order";
  payment_method: "cash" | "online";
  payment_status: "pending" | "paid" | "failed" | "cash_pending" | "cash_confirmed";
  total_amount: number;
  status: string;
  created_at: string;
}

type ReportTab = "all" | "daily" | "weekly" | "monthly" | "payment" | "source";

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ReportTab>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    fetchHistory();
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          cafe_tables (table_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedOrders = (data || []).map((o: any) => ({
        ...o,
        table_number: o.cafe_tables?.table_number
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }

  const getFilteredOrders = (): Order[] => {
    let filtered = orders;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = analytics.getOrdersInDateRange(filtered, start, end);
    }

    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.status.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  // Calculate stats
  const metrics = analytics.calculateOrderMetrics(filteredOrders);
  const paymentMetrics = analytics.calculatePaymentMetrics(filteredOrders);
  const tableVsCounter = analytics.calculateTableVsCounterSplit(filteredOrders);

  // Daily data
  const dailyData = analytics.calculateDailyRevenue(filteredOrders);
  const weeklyData = analytics.calculateWeeklyRevenue(filteredOrders);
  const monthlyData = analytics.calculateMonthlyRevenue(filteredOrders);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <History className="w-8 h-8 text-secondary" />
            Order Analytics
          </h1>
          <p className="text-accent/40 text-sm mt-1">Comprehensive reports and insights.</p>
        </div>
        <button
          onClick={() => analytics.exportToCSV(filteredOrders, `orders-${new Date().toISOString().split('T')[0]}.csv`)}
          className="p-3 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-all border border-secondary/10"
          title="Export to CSV"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card border border-secondary/20 rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-accent/60 mb-2 block uppercase tracking-wider">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background border border-secondary/20 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-accent/60 mb-2 block uppercase tracking-wider">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-background border border-secondary/20 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
          </div>
          <div className="relative flex-1 md:flex-initial md:min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
            <input
              type="text"
              placeholder="Search by ID or Status..."
              className="w-full bg-background border border-secondary/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-secondary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-secondary/20 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-accent/50 uppercase tracking-wider">Total Revenue</span>
              <p className="text-2xl font-black text-secondary mt-2">{formatPrice(metrics.totalRevenue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-secondary/30" />
          </div>
        </div>

        <div className="bg-card border border-secondary/20 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-accent/50 uppercase tracking-wider">Total Orders</span>
              <p className="text-2xl font-black text-secondary mt-2">{metrics.totalOrders}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-secondary/30" />
          </div>
        </div>

        <div className="bg-card border border-secondary/20 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-accent/50 uppercase tracking-wider">Avg Order Value</span>
              <p className="text-2xl font-black text-secondary mt-2">{formatPrice(metrics.avgOrderValue)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-secondary/30" />
          </div>
        </div>

        <div className="bg-card border border-secondary/20 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-accent/50 uppercase tracking-wider">Success Rate</span>
              <p className="text-2xl font-black text-secondary mt-2">{paymentMetrics.successRate.toFixed(1)}%</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-secondary/30" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-secondary animate-spin" />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 bg-card/10 border border-secondary/20 rounded-xl p-1 overflow-x-auto">
            {[
              { id: "all", label: "All Orders" },
              { id: "daily", label: "Daily" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "payment", label: "Payment" },
              { id: "source", label: "Table vs Counter" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-accent/60 hover:text-accent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-card border border-secondary/20 rounded-3xl overflow-hidden shadow-xl">
            {activeTab === "all" && <AllOrdersTable orders={filteredOrders} />}
            {activeTab === "daily" && <DailyReportTable data={dailyData} />}
            {activeTab === "weekly" && <WeeklyReportTable data={weeklyData} />}
            {activeTab === "monthly" && <MonthlyReportTable data={monthlyData} />}
            {activeTab === "payment" && <PaymentReportTable metrics={paymentMetrics} />}
            {activeTab === "source" && <SourceReportTable metrics={tableVsCounter} />}
          </div>
        </>
      )}
    </div>
  );
}

// All Orders Table
function AllOrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-secondary/10 bg-secondary/5">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Date & Time
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Order ID
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Source
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Status
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40 text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/5">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-accent/40">
                No orders found
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="hover:bg-secondary/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-accent/40 font-medium">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-[10px] bg-secondary/10 px-2 py-1 rounded text-secondary font-bold">
                    #{order.id.slice(0, 8)}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold uppercase py-1 px-3 bg-card-foreground/5 rounded-full border border-secondary/10">
                    {order.order_type === "counter_order"
                      ? "Counter"
                      : order.table_number
                        ? `Table ${order.table_number}`
                        : "Table NA"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black uppercase",
                      order.status === "delivered" || order.status === "completed"
                        ? "bg-zinc-500 text-white"
                        : order.status === "out_for_delivery"
                          ? "bg-indigo-500 text-white"
                          : order.status === "preparing"
                            ? "bg-blue-500 text-white"
                            : "bg-orange-500 text-white"
                    )}
                  >
                    {order.status === "delivered" || order.status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {order.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-black text-secondary">{formatPrice(order.total_amount)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Daily Report Table
function DailyReportTable({
  data,
}: {
  data: { date: string; revenue: number; orderCount: number; avgOrderValue: number }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-secondary/10 bg-secondary/5">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Date
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Orders
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Revenue
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Avg Order
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-accent/40">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.date} className="hover:bg-secondary/5 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{row.date}</td>
                <td className="px-6 py-4 text-sm font-bold">{row.orderCount}</td>
                <td className="px-6 py-4 text-sm font-black text-secondary">
                  {formatPrice(row.revenue)}
                </td>
                <td className="px-6 py-4 text-sm font-bold">{formatPrice(row.avgOrderValue)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Weekly Report Table
function WeeklyReportTable({
  data,
}: {
  data: { week: string; revenue: number; orderCount: number; avgOrderValue: number }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-secondary/10 bg-secondary/5">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Week Starting
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Orders
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Revenue
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Avg Order
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-accent/40">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.week} className="hover:bg-secondary/5 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{row.week}</td>
                <td className="px-6 py-4 text-sm font-bold">{row.orderCount}</td>
                <td className="px-6 py-4 text-sm font-black text-secondary">
                  {formatPrice(row.revenue)}
                </td>
                <td className="px-6 py-4 text-sm font-bold">{formatPrice(row.avgOrderValue)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Monthly Report Table
function MonthlyReportTable({
  data,
}: {
  data: { month: string; revenue: number; orderCount: number; avgOrderValue: number }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-secondary/10 bg-secondary/5">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Month
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Orders
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Revenue
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Avg Order
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-accent/40">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.month} className="hover:bg-secondary/5 transition-colors">
                <td className="px-6 py-4 text-sm font-bold">{row.month}</td>
                <td className="px-6 py-4 text-sm font-bold">{row.orderCount}</td>
                <td className="px-6 py-4 text-sm font-black text-secondary">
                  {formatPrice(row.revenue)}
                </td>
                <td className="px-6 py-4 text-sm font-bold">{formatPrice(row.avgOrderValue)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Payment Report Table
function PaymentReportTable({
  metrics,
}: {
  metrics: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    failedOrders: number;
    successRate: number;
    cashOrders: number;
    onlineOrders: number;
    cashRevenue: number;
    onlineRevenue: number;
  };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-secondary/10 bg-secondary/5">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Payment Method
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Orders
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Revenue
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Percentage
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/5">
          <tr className="hover:bg-secondary/5 transition-colors">
            <td className="px-6 py-4 text-sm font-bold">Cash</td>
            <td className="px-6 py-4 text-sm font-bold">{metrics.cashOrders}</td>
            <td className="px-6 py-4 text-sm font-black text-secondary">
              {formatPrice(metrics.cashRevenue)}
            </td>
            <td className="px-6 py-4 text-sm font-bold">
              {metrics.totalOrders > 0
                ? ((metrics.cashOrders / metrics.totalOrders) * 100).toFixed(1)
                : 0}
              %
            </td>
          </tr>
          <tr className="hover:bg-secondary/5 transition-colors">
            <td className="px-6 py-4 text-sm font-bold">Online</td>
            <td className="px-6 py-4 text-sm font-bold">{metrics.onlineOrders}</td>
            <td className="px-6 py-4 text-sm font-black text-secondary">
              {formatPrice(metrics.onlineRevenue)}
            </td>
            <td className="px-6 py-4 text-sm font-bold">
              {metrics.totalOrders > 0
                ? ((metrics.onlineOrders / metrics.totalOrders) * 100).toFixed(1)
                : 0}
              %
            </td>
          </tr>
          <tr className="bg-secondary/5 hover:bg-secondary/10 transition-colors">
            <td className="px-6 py-4 text-sm font-bold">Total</td>
            <td className="px-6 py-4 text-sm font-bold">{metrics.totalOrders}</td>
            <td className="px-6 py-4 text-sm font-black text-secondary">
              {formatPrice(metrics.cashRevenue + metrics.onlineRevenue)}
            </td>
            <td className="px-6 py-4 text-sm font-bold">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Source Report Table (Table vs Counter)
function SourceReportTable({
  metrics,
}: {
  metrics: {
    tableOrders: number;
    counterOrders: number;
    tableRevenue: number;
    counterRevenue: number;
    tablePercentage: number;
    counterPercentage: number;
  };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-secondary/10 bg-secondary/5">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Order Source
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Orders
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Revenue
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-accent/40">
              Percentage
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/5">
          <tr className="hover:bg-secondary/5 transition-colors">
            <td className="px-6 py-4 text-sm font-bold">Table Orders</td>
            <td className="px-6 py-4 text-sm font-bold">{metrics.tableOrders}</td>
            <td className="px-6 py-4 text-sm font-black text-secondary">
              {formatPrice(metrics.tableRevenue)}
            </td>
            <td className="px-6 py-4 text-sm font-bold">{metrics.tablePercentage.toFixed(1)}%</td>
          </tr>
          <tr className="hover:bg-secondary/5 transition-colors">
            <td className="px-6 py-4 text-sm font-bold">Counter Orders</td>
            <td className="px-6 py-4 text-sm font-bold">{metrics.counterOrders}</td>
            <td className="px-6 py-4 text-sm font-black text-secondary">
              {formatPrice(metrics.counterRevenue)}
            </td>
            <td className="px-6 py-4 text-sm font-bold">{metrics.counterPercentage.toFixed(1)}%</td>
          </tr>
          <tr className="bg-secondary/5 hover:bg-secondary/10 transition-colors">
            <td className="px-6 py-4 text-sm font-bold">Total</td>
            <td className="px-6 py-4 text-sm font-bold">
              {metrics.tableOrders + metrics.counterOrders}
            </td>
            <td className="px-6 py-4 text-sm font-black text-secondary">
              {formatPrice(metrics.tableRevenue + metrics.counterRevenue)}
            </td>
            <td className="px-6 py-4 text-sm font-bold">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
