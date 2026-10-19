import React, { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useClinicData, useClinicReports } from "../../lib/hooks/useClinic";
import { useToast } from "../../components/ui/Toast";
import { useTheme } from "../../lib/theme";
import { formatETB } from "../../lib/utils";

export const ReportsPage: React.FC<{
  onNavigate: (path: string) => void;
}> = () => {
  const { doctors, appointments, payments, isLoading, errors } =
    useClinicData();
  const { isDark } = useTheme();
  const { success } = useToast();
  const [timeRange, setTimeRange] = useState<"today" | "7days" | "30days">(
    "7days",
  );
  const reportRange =
    timeRange === "today" ? "today" : timeRange === "7days" ? "7d" : "30d";
  const reportsQuery = useClinicReports(reportRange);
  const reportSeries = reportsQuery.data;
  const appointmentTrends = (reportSeries?.appointments || []).map((point) => ({
    day: point.date,
    total: point.appointments,
    completed: point.completedVisits,
    cancelled: point.cancellations,
  }));
  const revenueHistory = (reportSeries?.revenue || []).map((point) => ({
    day: point.date,
    revenue: point.revenue,
  }));
  const doctorWorkloadData = doctors.map((doc) => ({
    name: doc.name.replace(/^Dr\.\s*/, ""),
    consultations: appointments.filter(
      (appointment) =>
        appointment.doctorId === doc.id && appointment.status === "completed",
    ).length,
  }));
  const paymentColors = ["#2563EB", "#10B981", "#06B6D4", "#8B5CF6", "#F59E0B"];
  const paymentMethodsDistribution = Object.entries(
    payments
      .filter((payment) => payment.status === "confirmed")
      .reduce<Record<string, number>>((totals, payment) => {
        totals[payment.paymentMethod] =
          (totals[payment.paymentMethod] || 0) + payment.amountETB;
        return totals;
      }, {}),
  ).map(([name, value], index) => ({
    name: name.replaceAll("_", " "),
    value,
    color: paymentColors[index % paymentColors.length],
  }));
  const totalBookings = appointmentTrends.reduce(
    (sum, point) => sum + point.total,
    0,
  );
  const completedVisits = appointmentTrends.reduce(
    (sum, point) => sum + point.completed,
    0,
  );
  const cancellations = appointmentTrends.reduce(
    (sum, point) => sum + point.cancelled,
    0,
  );
  const completionRate = totalBookings
    ? Math.round((completedVisits / totalBookings) * 100)
    : 0;
  const cancellationRate = totalBookings
    ? ((cancellations / totalBookings) * 100).toFixed(1)
    : "0.0";
  const observedWaitTimes = (reportSeries?.waitingTime || [])
    .map((point) => point.averageWaitingTimeMinutes)
    .filter((value): value is number => value !== null);
  const observedConsultationTimes = (reportSeries?.waitingTime || [])
    .map((point) => point.averageConsultationTimeMinutes)
    .filter((value): value is number => value !== null);
  const averageWait = observedWaitTimes.length
    ? observedWaitTimes.reduce((sum, value) => sum + value, 0) /
      observedWaitTimes.length
    : null;
  const averageConsultation = observedConsultationTimes.length
    ? observedConsultationTimes.reduce((sum, value) => sum + value, 0) /
      observedConsultationTimes.length
    : null;
  const rangeRevenue = revenueHistory.reduce(
    (sum, point) => sum + point.revenue,
    0,
  );

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,Date,Appointments,Completed,Revenue_ETB,AvgWait_Min\n" +
      appointmentTrends
        .map((point, index) => {
          const wait =
            reportSeries?.waitingTime[index]?.averageWaitingTimeMinutes ?? "";
          return `${point.day},${point.total},${point.completed},${revenueHistory[index]?.revenue ?? 0},${wait}\n`;
        })
        .join("");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ClinicFlow_clinic_report_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success("Clinic analytics CSV exported successfully!");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-gradient-to-r from-white via-white to-blue-50/40 dark:from-[#121214] dark:to-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Clinic Operations & Financial Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Operational benchmarks, patient throughput, wait curves, and ETB
            collections
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center bg-slate-100/80 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700 text-xs">
            {(["today", "7days", "30days"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer capitalize ${
                  timeRange === range
                    ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {range === "today"
                  ? "Today"
                  : range === "7days"
                    ? "Last 7 Days"
                    : "Last 30 Days"}
              </button>
            ))}
          </div>

          <Button
            size="md"
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={
              <Download className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
            }
          >
            Export CSV
          </Button>
        </div>
      </div>

      {(isLoading || reportsQuery.isLoading) && (
        <p role="status" className="text-sm text-slate-500">
          Loading clinic reports…
        </p>
      )}
      {[
        ...errors,
        ...(reportsQuery.error instanceof Error
          ? [reportsQuery.error.message]
          : []),
      ].map((error) => (
        <p role="alert" key={error} className="text-sm text-red-600">
          {error}
        </p>
      ))}

      {/* 2. Top Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
          <span className="text-slate-400 dark:text-zinc-500 block text-[11px] font-medium">
            Total Bookings
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {totalBookings}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
            Selected period
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
          <span className="text-slate-400 dark:text-zinc-500 block text-[11px] font-medium">
            Completed Visits
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {completedVisits}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
            {completionRate}% completion
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
          <span className="text-slate-400 dark:text-zinc-500 block text-[11px] font-medium">
            Cancellation Rate
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {cancellationRate}%
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
            {cancellations} cancellations
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
          <span className="text-slate-400 dark:text-zinc-500 block text-[11px] font-medium">
            Avg Waiting Time
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {averageWait === null ? "—" : `${Math.round(averageWait)} min`}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
            Observed average
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
          <span className="text-slate-400 dark:text-zinc-500 block text-[11px] font-medium">
            Avg Consultation
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {averageConsultation === null
              ? "—"
              : `${Math.round(averageConsultation)} min`}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
            Observed average
          </span>
        </div>

        <div className="bg-white dark:bg-[#121214] p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
          <span className="text-slate-400 dark:text-zinc-500 block text-[11px] font-medium">
            Weekly Revenue
          </span>
          <div className="text-xl font-bold text-blue-700 dark:text-[#93C5FD] tabular-nums mt-1">
            {formatETB(rangeRevenue)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
            Selected period
          </span>
        </div>
      </div>

      {/* 3. Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Appointments Volume */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Patient Volume & Completion Rate
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Scheduled vs successfully completed visits
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Total
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />{" "}
                Completed
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentTrends}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#27272a" : "#e2e8f0"}
                  opacity={0.8}
                />
                <XAxis
                  dataKey="day"
                  stroke={isDark ? "#a1a1aa" : "#71717a"}
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? "#a1a1aa" : "#71717a"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#18181b" : "#ffffff",
                    color: isDark ? "#f4f4f5" : "#0f172a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: isDark ? "1px solid #27272a" : "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Payment Channel Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Recorded completed payments by method
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodsDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentMethodsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: unknown) => [
                    formatETB(Number(val) || 0),
                    "Collected",
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? "#18181b" : "#ffffff",
                    color: isDark ? "#f4f4f5" : "#0f172a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: isDark ? "1px solid #27272a" : "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "11px",
                    color: isDark ? "#d4d4d8" : "#374151",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Second Charts Row: Revenue Over Time & Doctor Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue trajectory */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Revenue Progression (ETB)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Daily gross fee receipts across departments
              </p>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
              {revenueHistory.length
                ? `Avg ${formatETB(rangeRevenue / revenueHistory.length)} / day`
                : "No revenue data"}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueHistory}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#27272a" : "#e2e8f0"}
                  opacity={0.8}
                />
                <XAxis
                  dataKey="day"
                  stroke={isDark ? "#a1a1aa" : "#71717a"}
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke={isDark ? "#a1a1aa" : "#71717a"}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip
                  formatter={(v: any) => [`${v} ETB`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#18181b" : "#ffffff",
                    color: isDark ? "#f4f4f5" : "#0f172a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: isDark ? "1px solid #27272a" : "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doctor Workload */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Physician Workload
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Today's completed visits per doctor
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={doctorWorkloadData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke={isDark ? "#27272a" : "#e2e8f0"}
                  opacity={0.8}
                />
                <XAxis
                  type="number"
                  stroke={isDark ? "#a1a1aa" : "#71717a"}
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={isDark ? "#a1a1aa" : "#71717a"}
                  fontSize={10}
                  tickLine={false}
                  width={75}
                />
                <Tooltip
                  formatter={(v: any) => [`${v} visits`, "Completed"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#18181b" : "#ffffff",
                    color: isDark ? "#f4f4f5" : "#0f172a",
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: isDark ? "1px solid #27272a" : "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="consultations"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
