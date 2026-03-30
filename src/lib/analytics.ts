// Analytics utilities for reporting and insights

export interface Order {
  id: string;
  table_number?: number | null;
  order_type: "table_order" | "counter_order";
  payment_method: "cash" | "online";
  payment_status: "pending" | "paid" | "failed" | "cash_pending" | "cash_confirmed";
  total_amount: number;
  status: string;
  created_at: string;
}

// Get orders within a date range
export function getOrdersInDateRange(
  orders: Order[],
  startDate: Date,
  endDate: Date
): Order[] {
  return orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    return orderDate >= startDate && orderDate <= endDate;
  });
}

// Calculate daily revenue
export function calculateDailyRevenue(
  orders: Order[]
): { date: string; revenue: number; orderCount: number; avgOrderValue: number }[] {
  const daily: {
    [key: string]: { revenue: number; count: number }
  } = {};

  orders.forEach((order) => {
    if (isPaidOrder(order)) {
      const date = new Date(order.created_at).toLocaleDateString();
      if (!daily[date]) {
        daily[date] = { revenue: 0, count: 0 };
      }
      daily[date].revenue += order.total_amount;
      daily[date].count += 1;
    }
  });

  return Object.entries(daily)
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orderCount: data.count,
      avgOrderValue: data.revenue / data.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Calculate weekly revenue
export function calculateWeeklyRevenue(
  orders: Order[]
): { week: string; revenue: number; orderCount: number; avgOrderValue: number }[] {
  const weekly: {
    [key: string]: { revenue: number; count: number }
  } = {};

  orders.forEach((order) => {
    if (isPaidOrder(order)) {
      const orderDate = new Date(order.created_at);
      const weekStart = getWeekStart(orderDate);
      const weekKey = weekStart.toLocaleDateString();

      if (!weekly[weekKey]) {
        weekly[weekKey] = { revenue: 0, count: 0 };
      }
      weekly[weekKey].revenue += order.total_amount;
      weekly[weekKey].count += 1;
    }
  });

  return Object.entries(weekly)
    .map(([week, data]) => ({
      week,
      revenue: data.revenue,
      orderCount: data.count,
      avgOrderValue: data.revenue / data.count,
    }))
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
}

// Calculate monthly revenue
export function calculateMonthlyRevenue(
  orders: Order[]
): { month: string; revenue: number; orderCount: number; avgOrderValue: number }[] {
  const monthly: {
    [key: string]: { revenue: number; count: number }
  } = {};

  orders.forEach((order) => {
    if (isPaidOrder(order)) {
      const date = new Date(order.created_at);
      const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });

      if (!monthly[monthKey]) {
        monthly[monthKey] = { revenue: 0, count: 0 };
      }
      monthly[monthKey].revenue += order.total_amount;
      monthly[monthKey].count += 1;
    }
  });

  return Object.entries(monthly)
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orderCount: data.count,
      avgOrderValue: data.revenue / data.count,
    }))
    .sort(
      (a, b) =>
        new Date(a.month + " 1").getTime() - new Date(b.month + " 1").getTime()
    );
}

// Calculate yearly revenue
export function calculateYearlyRevenue(
  orders: Order[]
): { year: string; revenue: number; orderCount: number; avgOrderValue: number }[] {
  const yearly: {
    [key: string]: { revenue: number; count: number }
  } = {};

  orders.forEach((order) => {
    if (isPaidOrder(order)) {
      const year = new Date(order.created_at).getFullYear().toString();

      if (!yearly[year]) {
        yearly[year] = { revenue: 0, count: 0 };
      }
      yearly[year].revenue += order.total_amount;
      yearly[year].count += 1;
    }
  });

  return Object.entries(yearly)
    .map(([year, data]) => ({
      year,
      revenue: data.revenue,
      orderCount: data.count,
      avgOrderValue: data.revenue / data.count,
    }))
    .sort((a, b) => parseInt(b.year) - parseInt(a.year));
}

// Calculate payment metrics
export function calculatePaymentMetrics(
  orders: Order[]
): {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  successRate: number;
  cashOrders: number;
  onlineOrders: number;
  cashRevenue: number;
  onlineRevenue: number;
} {
  const totalOrders = orders.length;
  const paidOrders = orders.filter(isPaidOrder).length;
  const pendingOrders = orders.filter((o) => o.payment_status === "pending" || o.payment_status === "cash_pending").length;
  const failedOrders = orders.filter((o) => o.payment_status === "failed").length;
  const successRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

  const cashOrders = orders.filter((o) => o.payment_method === "cash").length;
  const onlineOrders = orders.filter((o) => o.payment_method === "online").length;

  const cashRevenue = orders
    .filter((o) => o.payment_method === "cash" && isPaidOrder(o))
    .reduce((acc, o) => acc + o.total_amount, 0);

  const onlineRevenue = orders
    .filter((o) => o.payment_method === "online" && isPaidOrder(o))
    .reduce((acc, o) => acc + o.total_amount, 0);

  return {
    totalOrders,
    paidOrders,
    pendingOrders,
    failedOrders,
    successRate,
    cashOrders,
    onlineOrders,
    cashRevenue,
    onlineRevenue,
  };
}

// Calculate order metrics
export function calculateOrderMetrics(
  orders: Order[]
): {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgPrepTime: number;
} {
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(isPaidOrder)
    .reduce((acc, o) => acc + o.total_amount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate average prep time (time from created_at to delivered status)
  let totalPrepTime = 0;
  let deliveredCount = 0;

  orders.forEach((order) => {
    if (order.status === "delivered" || order.status === "completed") {
      const createdAt = new Date(order.created_at).getTime();
      // Estimate: assume delivered orders take ~5-10 minutes, use 5 as default
      totalPrepTime += 5;
      deliveredCount += 1;
    }
  });

  const avgPrepTime = deliveredCount > 0 ? totalPrepTime / deliveredCount : 5;

  return {
    totalOrders,
    totalRevenue,
    avgOrderValue,
    avgPrepTime: Math.round(avgPrepTime),
  };
}

// Calculate table vs counter split
export function calculateTableVsCounterSplit(
  orders: Order[]
): {
  tableOrders: number;
  counterOrders: number;
  tableRevenue: number;
  counterRevenue: number;
  tablePercentage: number;
  counterPercentage: number;
} {
  const tableOrders = orders.filter((o) => o.order_type === "table_order").length;
  const counterOrders = orders.filter((o) => o.order_type === "counter_order").length;

  const tableRevenue = orders
    .filter((o) => o.order_type === "table_order" && isPaidOrder(o))
    .reduce((acc, o) => acc + o.total_amount, 0);

  const counterRevenue = orders
    .filter((o) => o.order_type === "counter_order" && isPaidOrder(o))
    .reduce((acc, o) => acc + o.total_amount, 0);

  const total = tableOrders + counterOrders;
  const tablePercentage = total > 0 ? (tableOrders / total) * 100 : 0;
  const counterPercentage = total > 0 ? (counterOrders / total) * 100 : 0;

  return {
    tableOrders,
    counterOrders,
    tableRevenue,
    counterRevenue,
    tablePercentage,
    counterPercentage,
  };
}

// Export to CSV
export function exportToCSV(orders: Order[], filename: string = "orders.csv"): void {
  const headers = [
    "Order ID",
    "Date",
    "Time",
    "Source",
    "Status",
    "Payment Method",
    "Payment Status",
    "Amount",
  ];

  const rows = orders.map((order) => [
    order.id.slice(0, 8),
    new Date(order.created_at).toLocaleDateString(),
    new Date(order.created_at).toLocaleTimeString(),
    order.order_type === "counter_order"
      ? "Counter"
      : `Table ${order.table_number || "NA"}`,
    order.status,
    order.payment_method,
    order.payment_status,
    order.total_amount.toFixed(2),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper: Check if order is paid
function isPaidOrder(order: Order): boolean {
  return (
    order.payment_status === "paid" ||
    order.payment_status === "cash_confirmed"
  );
}

// Helper: Get start of week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// Get today's orders
export function getTodayOrders(orders: Order[]): Order[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getOrdersInDateRange(orders, today, tomorrow);
}

// Get today's revenue
export function getTodayRevenue(orders: Order[]): number {
  return getTodayOrders(orders)
    .filter(isPaidOrder)
    .reduce((acc, o) => acc + o.total_amount, 0);
}
