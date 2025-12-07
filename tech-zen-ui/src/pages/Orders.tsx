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
        <main className="flex-1 container mx-auto px-4 py-8">
           <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Đơn hàng của tôi</h1>
            <p className="text-muted-foreground">Theo dõi và quản lý đơn hàng của bạn</p>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Đơn hàng của tôi</h1>
            <p className="text-muted-foreground">Theo dõi và quản lý đơn hàng của bạn</p>
          </div>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full md:w-[200px] mt-4 md:mt-0">
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
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-muted-foreground mb-6">Không có đơn hàng nào khớp với bộ lọc của bạn.</p>
            <Button onClick={() => navigate('/products')}>
              Khám phá sản phẩm
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">Đơn hàng #{String(order.id).slice(0, 8)}...</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {order.details.map((detail) => (
                      <div key={detail.id} className="flex justify-between text-sm">
                        <span>
                          {detail.productName} (x{detail.quantity})
                        </span>
                        <span className="font-medium">
                          {detail.priceEach.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-semibold">Tổng cộng</span>
                    <span className="text-lg font-bold text-primary">
                      {order.totalAmount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  {order.trackingNumber && (
                    <div className="flex items-start gap-2 text-sm bg-muted p-3 rounded-lg">
                      <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <div>
                        <div className="font-medium">Mã vận đơn: {order.trackingNumber}</div>
                        {order.estimatedDeliveryDate && (
                          <div className="text-muted-foreground">
                            Dự kiến giao: {new Date(order.estimatedDeliveryDate).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/orders/${order.id}`)} 
                    >
                      Xem chi tiết
                    </Button>
                    {/* BỔ SUNG: Cho phép viết review nếu đã giao hàng */}
                    {order.status === OrderStatus.DELIVERED && (
                       <Button
                        size="sm"
                       
                        onClick={() => navigate(`/products/${order.details[0].productVariantId.split('-')[0]}`)}
                      >
                        Viết đánh giá
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {pagedData && pagedData.totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 pt-8">
            <span className="text-sm text-muted-foreground">
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