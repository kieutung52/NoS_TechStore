import React, { useEffect, useState, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { orderService } from '../../services/orderService'; 
import type { OrderResponse, PagedResponse, AdminOrderSearchRequest, OrderSearchRequest } from '../../types'; 
import { OrderStatus } from '../../types'; 
import { Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'; 
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
import { Separator } from '../../components/ui/separator'; 

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
      <div>
        <h1 className="text-3xl font-bold">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground">Theo dõi và xử lý đơn hàng</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* ... (Giữ nguyên Filter) ... */} 
          <div className="mb-6">
            <Select value={statusFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value={OrderStatus.PENDING}>Chờ xử lý</SelectItem>
                <SelectItem value={OrderStatus.PROCESSING}>Đang xử lý</SelectItem>
                <SelectItem value={OrderStatus.SHIPPED}>Đang giao</SelectItem>
                <SelectItem value={OrderStatus.DELIVERED}>Đã giao</SelectItem>
                <SelectItem value={OrderStatus.CANCELLED}>Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

    
          <Table>
            <TableHeader>
              <TableRow>
                {/* === BẮT ĐẦU SỬA === */}
                <TableHead className="w-[50px]"></TableHead> 
                <TableHead>Mã đơn</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Khách hàng (ID)</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Vận đơn</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
                {/* === KẾT THÚC SỬA === */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                   {/* Sửa colSpan */}
                  <TableCell colSpan={8} className="h-24 text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : (
                pagedData?.content.map((order) => (
                  
                  <React.Fragment key={order.id}>
                    <TableRow>
                      {/* === BẮT ĐẦU SỬA: Thêm nút expand === */}
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        >
                          {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      {/* === KẾT THÚC SỬA === */}
                      <TableCell className="font-medium">#{String(order.id).slice(0, 8)}...</TableCell>
                      <TableCell>
                        {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>{order.userId.slice(0, 8)}...</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(order.totalAmount)}₫
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{order.trackingNumber || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {/* === BẮT ĐẦU SỬA: Hàng "con" (chi tiết) === */}
                    {expandedOrderId === order.id && (
                      <TableRow className="bg-muted hover:bg-muted">
                        <TableCell colSpan={8}>
                          <div className="p-4 space-y-2">
                            <h4 className="font-semibold">Chi tiết sản phẩm:</h4>
                            {order.details.map(detail => (
                              <div key={detail.id} className="flex justify-between items-center text-sm ml-4">
                                <span>{detail.productName} (SKU: ...{String(detail.productVariantId).slice(-6)})</span>
                                <span>SL: {detail.quantity} x {formatCurrency(detail.priceEach)}₫</span>
                                <span className="font-medium">{formatCurrency(detail.priceEach * detail.quantity)}₫</span>
                              </div>
                            ))}
                            <Separator className="my-2" />
                            <div className="flex justify-end gap-4 text-sm">
                              <span>Tạm tính: {formatCurrency(order.totalAmount - order.shippingFee)}₫</span>
                              <span>Phí Ship: {formatCurrency(order.shippingFee)}₫</span>
                              <span className="font-bold">Tổng: {formatCurrency(order.totalAmount)}₫</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {/* === KẾT THÚC SỬA === */}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* ... (Giữ nguyên Pagination, đã sửa style nút) ... */} 
          {pagedData && pagedData.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersManagement;