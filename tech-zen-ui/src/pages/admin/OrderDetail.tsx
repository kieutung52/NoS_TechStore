import { useEffect, useState, useCallback } from 'react'; 
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Separator } from '../../components/ui/separator';
import { toast } from '../../hooks/use-toast';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import type { OrderResponse, UserResponse, CancelOrderRequest, ShipOrderRequest } from '../../types';
import { OrderStatus } from '../../types';
import { ArrowLeft, User, MapPin, CreditCard, Package, Loader2 } from 'lucide-react';
import { OrderStatusBadge } from '../../lib/badgeUtils';
import { Skeleton } from '../../components/ui/skeleton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

 
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  
  const fetchOrderDetails = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      const orderRes = await orderService.getOrderById(orderId);
      if (orderRes.success && orderRes.data) {
        setOrder(orderRes.data);
        setTrackingNumber(orderRes.data.trackingNumber || '');
        
        const userRes = await userService.getUserById(orderRes.data.userId);
        if (userRes.success && userRes.data) {
          setUser(userRes.data);
        }
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message || "Không tìm thấy đơn hàng", variant: "destructive" });
      navigate('/admin/orders');
    } finally {
      setLoading(false);
    }
  }, [navigate]); 

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id, fetchOrderDetails]); 

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;

    setStatusLoading(true);
    try {
      let res;
      if (newStatus === OrderStatus.PROCESSING) {
        res = await orderService.acceptOrder(order.id);
      } else if (newStatus === OrderStatus.SHIPPED) {
        if (!trackingNumber) {
          toast({ title: "Lỗi", description: "Vui lòng nhập mã vận đơn", variant: "destructive" });
          setStatusLoading(false);
          return;
        }
        const request: ShipOrderRequest = { trackingNumber };
        res = await orderService.shipOrder(order.id, request);
      } else if (newStatus === OrderStatus.CANCELLED) {
        const request: CancelOrderRequest = { reason: cancelReason || "Hủy bởi Admin" };
        res = await orderService.cancelOrder(order.id, request);
      } else {
       
       
        toast({ title: "Hành động không được hỗ trợ", variant: "default" });
        setStatusLoading(false);
        return;
      }

      if (res.success && res.data) {
        setOrder(res.data);
        toast({ title: "Thành công", description: `Đã cập nhật trạng thái đơn hàng` });
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
       toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setStatusLoading(false);
    }
  };
  
  const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

  if (loading) {
    return (
       <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Chi tiết Đơn hàng #{order.id.slice(0, 8)}...
            </h1>
            <p className="text-muted-foreground">
              Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Trạng thái:</span>
          {/* Giữ nguyên Select này để hiển thị, nhưng logic xử lý sẽ qua các nút bấm */}
          <div className="w-[180px]">
             <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.details.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.productVariantId.slice(0, 8)}...</TableCell>
                      <TableCell>x{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.priceEach)}₫</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.priceEach * item.quantity)}₫</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-4">
                  <span className="text-muted-foreground">Tạm tính:</span>
                  <span className="font-medium w-32">{formatCurrency(order.totalAmount - order.shippingFee)}₫</span>
                </div>
                <div className="flex justify-end gap-4">
                  <span className="text-muted-foreground">Phí vận chuyển:</span>
                  <span className="font-medium w-32">{formatCurrency(order.shippingFee)}₫</span>
                </div>
                <div className="flex justify-end gap-4 text-lg font-bold">
                  <span className="text-foreground">Tổng cộng:</span>
                  <span className="text-primary w-32">{formatCurrency(order.totalAmount)}₫</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.status === OrderStatus.PENDING && (
                <Button className="w-full" onClick={() => handleStatusChange(OrderStatus.PROCESSING)} disabled={statusLoading}>
                  {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác nhận đơn hàng
                </Button>
              )}
              {order.status === OrderStatus.PROCESSING && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trackingNumber">Mã vận đơn</Label>
                    <Input id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Nhập mã vận đơn..." />
                  </div>
                  <Button className="w-full" onClick={() => handleStatusChange(OrderStatus.SHIPPED)} disabled={statusLoading || !trackingNumber}>
                    {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Giao hàng
                  </Button>
                </div>
              )}
              {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="cancelReason">Lý do hủy (tùy chọn)</Label>
                    <Input id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="VD: Hết hàng" />
                  </div>
                  <Button variant="destructive" className="w-full" onClick={() => handleStatusChange(OrderStatus.CANCELLED)} disabled={statusLoading}>
                    {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Hủy đơn hàng
                  </Button>
                </div>
              )}
              {order.status === OrderStatus.SHIPPED && (
                <p className="text-sm text-muted-foreground">Đang chờ đơn vị vận chuyển cập nhật...</p>
              )}
               {order.status === OrderStatus.DELIVERED && (
                <p className="text-sm text-success-foreground bg-success p-3 rounded-md">Đơn hàng đã giao thành công.</p>
              )}
               {order.status === OrderStatus.CANCELLED && (
                <p className="text-sm text-destructive-foreground bg-destructive p-3 rounded-md">Đơn hàng đã bị hủy.</p>
              )}
            </CardContent>
          </Card>
        
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">{user?.fullName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">{user?.id}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {/* TODO: Cần gọi API Address để lấy chi tiết */}
              <p className="font-semibold">Đang tải...</p>
              <p className="text-muted-foreground">Đang tải...</p>
              <p className="text-muted-foreground">AddressID: {order.addressId}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Phương thức: {order.paymentMethodId === 1 ? 'COD' : 'Ví điện tử'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;