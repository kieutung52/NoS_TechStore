import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, CreditCard, PackageCheck, RefreshCw, TrendingUp, Users, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { orderService } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import { OrderStatusBadge } from '../../lib/badgeUtils';
import { toast } from '../../hooks/use-toast';
import { cn } from '../../lib/utils';
import { OrderStatus, type AnalyticsOverviewResponse, type OrderResponse } from '../../types';

const REVENUE_DAYS = 14;

// Màu theo trạng thái — khớp với màu badge đơn hàng (badgeUtils)
const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]: { label: 'Chờ xử lý', color: 'hsl(var(--warning))' },
  [OrderStatus.PROCESSING]: { label: 'Đang xử lý', color: 'hsl(var(--primary))' },
  [OrderStatus.SHIPPED]: { label: 'Đang giao', color: 'hsl(var(--plasma))' },
  [OrderStatus.DELIVERED]: { label: 'Đã giao', color: 'hsl(var(--success))' },
  [OrderStatus.CANCELLED]: { label: 'Đã huỷ', color: 'hsl(var(--destructive))' },
  [OrderStatus.REFUNDED]: { label: 'Đã hoàn tiền', color: 'hsl(var(--muted-foreground))' },
};

const NOT_REVENUE = new Set([OrderStatus.CANCELLED, OrderStatus.REFUNDED]);

/** 12.500.000 → "12,5 tr"; 1.200.000.000 → "1,2 tỷ" */
const compactVnd = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  return value.toLocaleString('vi-VN');
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { label: string; orders?: number } }[];
}

const RevenueTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { value, payload: point } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur">
      <p className="font-mono text-[11px] text-muted-foreground">{point.label}</p>
      <p className="font-display text-base font-semibold tabular-nums">{value.toLocaleString('vi-VN')}₫</p>
      <p className="font-mono text-[11px] text-muted-foreground">{point.orders} đơn</p>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [overviewRes, ordersRes] = await Promise.allSettled([
      adminService.getAnalyticsOverview(),
      orderService.getAdminOrders({ page: 0, size: 200 }),
    ]);
    if (overviewRes.status === 'fulfilled' && overviewRes.value.success) setOverview(overviewRes.value.data);
    if (ordersRes.status === 'fulfilled' && ordersRes.value.success && ordersRes.value.data) {
      setOrders(ordersRes.value.data.content);
    }
    if (overviewRes.status === 'rejected' || ordersRes.status === 'rejected') {
      toast({ title: 'Không tải đủ số liệu', description: 'Một phần dữ liệu dashboard chưa tải được.', variant: 'destructive' });
    }
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Doanh thu theo ngày (đơn chưa huỷ/hoàn), đủ REVENUE_DAYS ngày kể cả ngày trống
  const revenueSeries = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: REVENUE_DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (REVENUE_DAYS - 1 - i));
      return { key: dayKey(d), label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }), revenue: 0, orders: 0 };
    });
    const byKey = new Map(days.map((d) => [d.key, d]));
    orders.forEach((o) => {
      if (NOT_REVENUE.has(o.status)) return;
      const bucket = byKey.get(dayKey(new Date(o.orderDate)));
      if (bucket) {
        bucket.revenue += o.totalAmount;
        bucket.orders += 1;
      }
    });
    return days;
  }, [orders]);

  const periodRevenue = revenueSeries.reduce((sum, d) => sum + d.revenue, 0);

  const statusSlices = useMemo(() => {
    const counts = new Map<OrderStatus, number>();
    orders.forEach((o) => counts.set(o.status, (counts.get(o.status) ?? 0) + 1));
    return (Object.keys(STATUS_META) as OrderStatus[])
      .map((status) => ({ status, ...STATUS_META[status], value: counts.get(status) ?? 0 }))
      .filter((s) => s.value > 0);
  }, [orders]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.orderDate) - +new Date(a.orderDate)).slice(0, 6),
    [orders]
  );

  const stats = [
    { label: 'Doanh thu hôm nay', value: overview ? `${compactVnd(overview.todayRevenue)}₫` : '—', icon: TrendingUp, tone: 'primary' },
    { label: 'Đơn đã giao hôm nay', value: overview ? overview.todayOrders.toLocaleString('vi-VN') : '—', icon: PackageCheck, tone: 'success' },
    { label: 'Tài khoản hoạt động', value: overview ? overview.activeUsers.toLocaleString('vi-VN') : '—', icon: Users, tone: 'plasma' },
    { label: 'Tổng số dư ví', value: overview ? `${compactVnd(overview.totalBalance)}₫` : '—', icon: Wallet, tone: 'warning' },
  ] as const;

  const toneClass = {
    primary: 'border-primary/30 bg-primary/10 text-primary',
    success: 'border-success/30 bg-success/10 text-success',
    plasma: 'border-plasma/30 bg-plasma/10 text-plasma',
    warning: 'border-warning/30 bg-warning/10 text-warning',
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Tổng quan"
        title="Dashboard"
        description={
          <>
            Số liệu trực tiếp từ hệ thống
            {updatedAt && <span className="font-mono"> · cập nhật {updatedAt.toLocaleTimeString('vi-VN')}</span>}
          </>
        }
        actions={
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Làm mới
          </Button>
        }
      />

      {/* Dải chỉ số: các ô ngăn bằng khe 1px trên nền viền */}
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-md sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }, i) => (
          <div key={label} className="flex animate-rise items-start justify-between gap-4 bg-card p-5" style={{ '--i': i } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              {loading && !overview ? (
                <Skeleton className="mt-3 h-8 w-28" />
              ) : (
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
              )}
            </div>
            <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg border', toneClass[tone])}>
              <Icon className="h-5 w-5" />
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Doanh thu — điểm nhấn duy nhất của trang (viền RGB luôn bật) */}
        <Card className="rgb-edge rgb-edge-live xl:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-lg">Doanh thu {REVENUE_DAYS} ngày</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Tổng giá trị đơn, không tính đơn đã huỷ/hoàn tiền</p>
            </div>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {periodRevenue.toLocaleString('vi-VN')}
              <span className="ml-0.5 text-base text-muted-foreground">₫</span>
            </p>
          </CardHeader>
          <CardContent className="h-[300px] px-2 pb-4">
            {loading && orders.length === 0 ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--plasma))" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 4" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    tickFormatter={(v: number) => (v === 0 ? '0' : compactVnd(v))}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'hsl(var(--primary) / 0.4)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="url(#revenueStroke)"
                    strokeWidth={2.5}
                    fill="url(#revenueFill)"
                    // Hiệu ứng vẽ của Recharts chạy bằng JS, bỏ qua prefers-reduced-motion; trang admin làm mới thường xuyên nên tắt
                    isAnimationActive={false}
                    activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cơ cấu trạng thái đơn */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trạng thái đơn hàng</CardTitle>
            <p className="text-sm text-muted-foreground">Toàn bộ {orders.length} đơn trong hệ thống</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading && orders.length === 0 ? (
              <Skeleton className="mx-auto h-44 w-44 rounded-full" />
            ) : statusSlices.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
            ) : (
              <div className="relative mx-auto h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusSlices}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="68%"
                      outerRadius="100%"
                      paddingAngle={2}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {statusSlices.map((s) => (
                        <Cell key={s.status} fill={s.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                  <span className="font-display text-3xl font-semibold tabular-nums">{orders.length}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">đơn</span>
                </div>
              </div>
            )}
            <ul className="space-y-2">
              {statusSlices.map((s) => (
                <li key={s.status} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 text-muted-foreground">{s.label}</span>
                  <span className="font-mono tabular-nums">{s.value}</span>
                  <span className="w-12 text-right font-mono text-xs text-muted-foreground tabular-nums">
                    {Math.round((s.value / orders.length) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Đơn hàng mới nhất */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Đơn hàng mới nhất</CardTitle>
          <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">{loading ? 'Đang tải…' : 'Chưa có đơn hàng nào.'}</p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
                  >
                    <span className="font-mono text-sm text-foreground">#{String(order.id).slice(0, 8).toUpperCase()}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(order.orderDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5" />
                      {order.paymentMethodId === 2 ? 'Ví' : 'COD'}
                    </span>
                    <span className="ml-auto font-display text-sm font-semibold tabular-nums">
                      {order.totalAmount.toLocaleString('vi-VN')}₫
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
