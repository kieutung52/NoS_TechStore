import { ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/** Thanh công cụ phía trên bảng (tìm kiếm, bộ lọc) — nằm trong Card, kẻ đáy. */
export const AdminTableToolbar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex flex-wrap items-center gap-3 border-b border-border p-4', className)}>{children}</div>
);

/** Dòng trạng thái chiếm cả bảng: đang tải hoặc không có dữ liệu. */
export const TableMessageRow = ({
  colSpan,
  loading,
  children,
}: {
  colSpan: number;
  loading?: boolean;
  children?: React.ReactNode;
}) => (
  <TableRow className="hover:bg-transparent">
    <TableCell colSpan={colSpan} className="h-32 text-center">
      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Inbox className="h-5 w-5" />}
        <span>{loading ? 'Đang tải…' : children}</span>
      </div>
    </TableCell>
  </TableRow>
);

interface AdminPaginationProps {
  /** Trang hiện tại, đếm từ 0 (như Spring Pageable) */
  page: number;
  totalPages: number;
  last: boolean;
  totalElements?: number;
  onPageChange: (page: number) => void;
}

/** Chân bảng: tổng số bản ghi + chuyển trang. Ẩn nút khi chỉ có 1 trang. */
export const AdminPagination = ({ page, totalPages, last, totalElements, onPageChange }: AdminPaginationProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
    <span className="font-mono text-xs text-muted-foreground">
      {totalElements !== undefined ? `${totalElements} bản ghi` : ''}
    </span>
    {totalPages > 1 && (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          Trang {page + 1} / {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0}>
          <ChevronLeft className="h-4 w-4" />
          Trước
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={last}>
          Sau
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )}
  </div>
);
