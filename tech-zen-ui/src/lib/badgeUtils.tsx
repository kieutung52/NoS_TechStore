import { Badge } from '@/components/ui/badge';
import { OrderStatus, UserRole } from '@/types';
import { CheckCircle, XCircle, Clock, Truck, Archive, CircleDot, User, Shield } from 'lucide-react';
import { cn } from './utils';

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

/**
 * Badge cho Trạng thái Đơn hàng
 */
export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  let variant: BadgeVariant = 'secondary';
  let text = 'Không xác định';
  let Icon = CircleDot;
  let className = '';

  switch (status) {
    case OrderStatus.PENDING:
      variant = 'secondary';
      className = 'bg-warning text-warning-foreground hover:bg-warning/80';
      text = 'Chờ xử lý';
      Icon = Clock;
      break;
    case OrderStatus.PROCESSING:
      variant = 'default';
      text = 'Đang xử lý';
      Icon = Archive;
      break;
    case OrderStatus.SHIPPED:
      variant = 'default';
      text = 'Đang giao';
      Icon = Truck;
      break;
    case OrderStatus.DELIVERED:
      variant = 'secondary';
      className = 'bg-success text-success-foreground hover:bg-success/80';
      text = 'Đã giao';
      Icon = CheckCircle;
      break;
    case OrderStatus.CANCELLED:
      variant = 'destructive';
      text = 'Đã hủy';
      Icon = XCircle;
      break;
    case OrderStatus.REFUNDED:
      variant = 'secondary';
      text = 'Đã hoàn tiền';
      Icon = CheckCircle;
      break;
  }

  return (
    <Badge variant={variant} className={cn("flex items-center gap-1.5 w-fit", className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{text}</span>
    </Badge>
  );
};

/**
 * Badge cho Trạng thái Sản phẩm (Published, Stock)
 */
export const ProductStatusBadge = ({ 
  isPublished, 
  stock 
}: { 
  isPublished: boolean; 
  stock: number 
}) => {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1.5">
        <XCircle className="h-3.5 w-3.5" />
        <span>Hết hàng</span>
      </Badge>
    );
  }
  
  if (!isPublished) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1.5">
        <Archive className="h-3.5 w-3.5" />
        <span>Đã ẩn</span>
      </Badge>
    );
  }

  return (
    <Badge className="flex items-center gap-1.5 bg-success text-success-foreground hover:bg-success/80">
      <CheckCircle className="h-3.5 w-3.5" />
      <span>Đang bán</span>
    </Badge>
  );
};

/**
 * Badge cho Trạng thái Người dùng (Active/Inactive)
 */
export const UserStatusBadge = ({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <Badge className="flex items-center gap-1.5 bg-success text-success-foreground hover:bg-success/80">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>Hoạt động</span>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1.5">
      <XCircle className="h-3.5 w-3.5" />
      <span>Đã khóa</span>
    </Badge>
  );
};

/**
 * Badge cho Vai trò (Admin/User)
 */
export const RoleBadge = ({ role }: { role: UserRole }) => {
  if (role === UserRole.ADMIN) {
    return (
      <Badge variant="default" className="flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5" />
        <span>Quản trị viên</span>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1.5">
      <User className="h-3.5 w-3.5" />
      <span>Người dùng</span>
    </Badge>
  );
};