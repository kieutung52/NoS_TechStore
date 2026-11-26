import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { orderService } from '../services/orderService';
import { type OrderResponse, type PagedResponse, OrderStatus, type OrderSearchRequest } from '../types';
import { Package, MapPin, Calendar, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { OrderStatusBadge } from '../lib/badgeUtils';
import { useWallet } from '../hooks/useWallet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';

const PAGE_SIZE = 5; 

const Orders = () => {
  const navigate = useNavigate();
  const { refreshWallet } = useWallet();
  const [pagedData, setPagedData] = useState<PagedResponse<OrderResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(0);

  const fetchOrders = useCallback(async (page: number, status: string) => {
    setLoading(true);
    try {
      const params: OrderSearchRequest & { page: number; size: number } = {
        page,
        size: PAGE_SIZE,
      };
      
      if (status !== 'ALL') {
        params.status = status as OrderStatus;
      }
      
     
      const response = await orderService.getUserOrders(params);
      if (response.success && response.data) {
        setPagedData(response.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage, statusFilter);
  }, [currentPage, statusFilter, fetchOrders]);

 
 

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const orders = pagedData?.content || [];

  if (loading && !pagedData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">Đơn hàng của tôi</h1>
            <p className="text-muted-foreground">Theo dõi và quản lý đơn hàng của bạn</p>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">Đơn hàng của tôi</h1>
            <p className="text-muted-foreground">Theo dõi và quản lý đơn hàng của bạn</p>
          </div>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full md:w-[220px]" aria-label="Lọc theo trạng thái">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value={OrderStatus.PENDING}>Chờ xử lý</SelectItem>
              <SelectItem value={OrderStatus.PROCESSING}>Đang xử lý</SelectItem>
              <SelectItem value={OrderStatus.SHIPPED}>Đang giao</SelectItem>
              <SelectItem value={OrderStatus.DELIVERED}>Đã giao</SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-border bg-field text-muted-foreground">
              <ShoppingBag className="h-7 w-7" />
            </span>
            <h2 className="mb-2 text-2xl font-bold">Không tìm thấy đơn hàng</h2>
            <p className="mb-6 text-muted-foreground">Không có đơn hàng nào khớp với bộ lọc của bạn.</p>
            <Button variant="outline" onClick={() => navigate('/products')}>
              Khám phá sản phẩm
            </Button>
          </div>
        ) : (
          <div className={cn("space-y-4 transition-opacity", loading && "opacity-60")}>
            {orders.map((order, i) => (
              <Card key={order.id} className="animate-rise overflow-hidden" style={{ "--i": i } as React.CSSProperties}>
                <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b border-border bg-field/40 px-5 py-4">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="font-mono text-sm font-medium tracking-normal">
                      #{String(order.id).slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <ul className="space-y-2">
                    {order.details.map((detail) => (
                      <li key={detail.id} className="flex justify-between gap-4 text-sm">
                        <span className="min-w-0">
                          <span className="line-clamp-1">{detail.productName}</span>
                        </span>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                          x{detail.quantity} · <span className="text-foreground">{detail.priceEach.toLocaleString('vi-VN')}₫</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.trackingNumber && (
                    <div className="flex items-start gap-2 rounded-lg border border-border bg-field/60 p-3 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <div>
                        <div className="font-medium">Mã vận đơn: <span className="font-mono">{order.trackingNumber}</span></div>
                        {order.estimatedDeliveryDate && (
                          <div className="text-muted-foreground">
                            Dự kiến giao: {new Date(order.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        Xem chi tiết
                      </Button>
                      {/* Đơn đã giao còn món chưa đánh giá: đánh giá từng món ở trang chi tiết đơn */}
                      {order.status === OrderStatus.DELIVERED && order.details.some((d) => !d.review) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:text-primary"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          Viết đánh giá
                        </Button>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm text-muted-foreground">Tổng cộng</span>
                      <span className="font-display text-xl font-semibold tabular-nums">
                        {order.totalAmount.toLocaleString('vi-VN')}
                        <span className="ml-0.5 text-sm text-muted-foreground">₫</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pagedData && pagedData.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-8">
            <span className="mr-2 font-mono text-xs text-muted-foreground">
              Trang {pagedData.page + 1} / {pagedData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(pagedData.page - 1)}
              disabled={pagedData.page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(pagedData.page + 1)}
              disabled={pagedData.last}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
