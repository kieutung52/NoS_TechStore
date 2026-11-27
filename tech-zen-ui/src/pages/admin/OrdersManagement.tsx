import React, { useEffect, useState, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button'; 
import { Card } from '../../components/ui/card'; 
import { orderService } from '../../services/orderService'; 
import type { OrderResponse, PagedResponse, AdminOrderSearchRequest, OrderSearchRequest } from '../../types'; 
import { OrderStatus } from '../../types'; 
import { Eye, ChevronDown } from 'lucide-react'; 
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPagination, AdminTableToolbar, TableMessageRow } from '../../components/admin/AdminTable';
import { cn } from '../../lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'; 
import { OrderStatusBadge } from '../../lib/badgeUtils'; 
import { toast } from '../../hooks/use-toast'; 

const PAGE_SIZE = 8;

const OrdersManagement = () => {
  const navigate = useNavigate();
  const [pagedData, setPagedData] = useState<PagedResponse<OrderResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  
  
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (page: number, status: string) => {
    setLoading(true);
    try {
      const searchRequest: OrderSearchRequest = {};
      if (status !== 'all') {
        searchRequest.status = status as OrderStatus; 
      }
      
      const params: AdminOrderSearchRequest & { page: number; size: number } = {
        page,
        size: PAGE_SIZE,
        search: searchRequest,
      };
      
      const response = await orderService.getAdminOrders(params);
      
      if (response.success && response.data) {
        setPagedData(response.data);
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
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
  
  
  const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Bán hàng"
        title="Đơn hàng"
        description="Theo dõi và xử lý đơn: xác nhận, giao hàng, huỷ."
      />

      <Card className="overflow-hidden">
        <AdminTableToolbar>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[200px]" aria-label="Lọc theo trạng thái">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value={OrderStatus.PENDING}>Chờ xử lý</SelectItem>
              <SelectItem value={OrderStatus.PROCESSING}>Đang xử lý</SelectItem>
              <SelectItem value={OrderStatus.SHIPPED}>Đang giao</SelectItem>
              <SelectItem value={OrderStatus.DELIVERED}>Đã giao</SelectItem>
              <SelectItem value={OrderStatus.CANCELLED}>Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </AdminTableToolbar>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[52px]"><span className="sr-only">Mở chi tiết</span></TableHead>
              <TableHead>Mã đơn</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Vận đơn</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableMessageRow colSpan={8} loading />
            ) : !pagedData?.content.length ? (
              <TableMessageRow colSpan={8}>Không có đơn hàng nào ở trạng thái này.</TableMessageRow>
            ) : (
              pagedData.content.map((order) => {
                const expanded = expandedOrderId === order.id;
                return (
                  <React.Fragment key={order.id}>
                    <TableRow className={cn(expanded && 'border-b-0 bg-accent/30')}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-expanded={expanded}
                          aria-label={expanded ? 'Thu gọn sản phẩm của đơn' : 'Xem sản phẩm của đơn'}
                          onClick={() => setExpandedOrderId(expanded ? null : order.id)}
                        >
                          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                        </Button>
                      </TableCell>
                      <TableCell className="font-mono text-xs">#{String(order.id).slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {new Date(order.orderDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground" title={order.userId}>
                        {order.userId.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold tabular-nums">
                        {formatCurrency(order.totalAmount)}₫
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{order.trackingNumber || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Mở chi tiết đơn"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>

                    {expanded && (
                      <TableRow className="bg-accent/30 hover:bg-accent/30">
                        <TableCell colSpan={8} className="pt-0">
                          <div className="ml-12 animate-rise rounded-lg border border-border bg-field/60 p-4">
                            <ul className="divide-y divide-border">
                              {order.details.map((detail) => (
                                <li key={detail.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm first:pt-0 last:pb-0">
                                  <span className="min-w-0 flex-1 font-medium">{detail.productName}</span>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    SKU …{String(detail.productVariantId).slice(-6)}
                                  </span>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {detail.quantity} × {formatCurrency(detail.priceEach)}₫
                                  </span>
                                  <span className="w-32 text-right font-mono text-xs font-semibold tabular-nums">
                                    {formatCurrency(detail.priceEach * detail.quantity)}₫
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 flex flex-wrap justify-end gap-x-6 gap-y-1 border-t border-border pt-3 font-mono text-xs">
                              <span className="text-muted-foreground">
                                Tạm tính {formatCurrency(order.totalAmount - order.shippingFee)}₫
                              </span>
                              <span className="text-muted-foreground">Phí ship {formatCurrency(order.shippingFee)}₫</span>
                              <span className="font-semibold text-foreground">Tổng {formatCurrency(order.totalAmount)}₫</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

        {pagedData && (
          <AdminPagination
            page={pagedData.page}
            totalPages={pagedData.totalPages}
            last={pagedData.last}
            totalElements={pagedData.totalElements}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>
    </div>
  );
};

export default OrdersManagement;