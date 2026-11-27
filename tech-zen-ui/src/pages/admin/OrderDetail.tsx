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
import { User, MapPin, CreditCard, Package, Loader2, CheckCircle2, XCircle, Truck, Wallet } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
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
      <AdminPageHeader
        backTo="/admin/orders"
        eyebrow="Bán hàng · Đơn hàng"
        title={<span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>}
        description={<span className="font-mono">Đặt lúc {new Date(order.orderDate).toLocaleString('vi-VN')}</span>}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Sản phẩm
                <span className="font-mono text-xs font-normal text-muted-foreground">({order.details.length})</span>
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
                      <TableCell className="min-w-[10rem] font-medium">{item.productName}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.productVariantId.slice(0, 8)}</TableCell>
                      <TableCell className="font-mono text-xs">×{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{formatCurrency(item.priceEach)}₫</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{formatCurrency(item.priceEach * item.quantity)}₫</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <dl className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tạm tính</dt>
                  <dd className="font-mono tabular-nums">{formatCurrency(order.totalAmount - order.shippingFee)}₫</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Phí vận chuyển</dt>
                  <dd className="font-mono tabular-nums">{formatCurrency(order.shippingFee)}₫</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
                  <dt className="font-medium">Tổng cộng</dt>
                  <dd className="font-display text-xl font-semibold tabular-nums">{formatCurrency(order.totalAmount)}₫</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="rgb-edge rgb-edge-live">
            <CardHeader>
              <CardTitle className="text-lg">Xử lý đơn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.status === OrderStatus.PENDING && (
                <Button variant="glow" className="w-full" onClick={() => handleStatusChange(OrderStatus.PROCESSING)} disabled={statusLoading}>
                  {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xác nhận đơn hàng
                </Button>
              )}
              {order.status === OrderStatus.PROCESSING && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trackingNumber">Mã vận đơn</Label>
                    <Input id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="VD: GHN123456789" className="font-mono" />
                  </div>
                  <Button variant="glow" className="w-full" onClick={() => handleStatusChange(OrderStatus.SHIPPED)} disabled={statusLoading || !trackingNumber}>
                    {statusLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                    Giao hàng
                  </Button>
                </div>
              )}
              {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) && (
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="cancelReason">Lý do hủy (tùy chọn)</Label>
                    <Input id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="VD: Hết hàng" />
                  </div>
                  <Button variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleStatusChange(OrderStatus.CANCELLED)} disabled={statusLoading}>
                    {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Hủy đơn hàng
                  </Button>
                </div>
              )}
              {order.status === OrderStatus.SHIPPED && (
                <p className="flex items-start gap-2 rounded-lg border border-plasma/30 bg-plasma/10 p-3 text-sm text-plasma">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0" />
                  Đang giao{order.trackingNumber ? ` · vận đơn ${order.trackingNumber}` : ''}. Chờ khách xác nhận đã nhận hàng.
                </p>
              )}
              {order.status === OrderStatus.DELIVERED && (
                <p className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  Đơn hàng đã giao thành công.
                </p>
              )}
              {order.status === OrderStatus.CANCELLED && (
                <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Đơn hàng đã bị hủy.
                </p>
              )}
            </CardContent>
          </Card>
        
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{user?.fullName ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="break-all font-mono text-[11px] text-muted-foreground">{order.userId}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            {/* API /addresses/{id} chỉ trả địa chỉ cho chính chủ, admin chưa xem được chi tiết */}
            <CardContent className="space-y-1 text-sm">
              <p className="font-mono text-xs">Mã địa chỉ #{order.addressId}</p>
              {order.latitude != null && order.longitude != null && (
                <p className="font-mono text-xs text-muted-foreground">
                  {order.latitude.toFixed(5)}, {order.longitude.toFixed(5)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Chi tiết địa chỉ chỉ khách hàng xem được.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm">
              {order.paymentMethodId === 1 ? <Package className="h-4 w-4 text-muted-foreground" /> : <Wallet className="h-4 w-4 text-success" />}
              {order.paymentMethodId === 1 ? 'Thanh toán khi nhận hàng (COD)' : 'Ví điện tử (đã trừ khi đặt)'}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;