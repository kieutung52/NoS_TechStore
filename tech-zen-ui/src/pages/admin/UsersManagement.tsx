import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button'; 
import { Card } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input'; 
import { userService } from '../../services/userService'; 
import { Search, Edit, Plus, Wallet } from 'lucide-react'; 
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPagination, AdminTableToolbar, TableMessageRow } from '../../components/admin/AdminTable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'; 
import { RoleBadge, UserStatusBadge } from '../../lib/badgeUtils'; 
import type { UserResponse, PagedResponse } from '../../types'; 
import { useDebounce } from '../../hooks/useDebounce'; 
import { toast } from '../../hooks/use-toast'; 

const PAGE_SIZE = 8;


const formatCurrency = (value: number) => {
  if (!value) return '0₫';
  return value.toLocaleString('vi-VN') + '₫';
}

const initialsOf = (name: string) => {
  const parts = (name || '?').trim().split(/\s+/);
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UsersManagement = () => {
  const navigate = useNavigate();
  const [pagedData, setPagedData] = useState<PagedResponse<UserResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchData = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      
      const res = await userService.getUsers(page, PAGE_SIZE);
      if (res.success && res.data) {
        setPagedData(res.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } 
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, fetchData]);

  
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
    
  }, [debouncedSearchTerm]);
  
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Khách hàng"
        title="Người dùng"
        description="Tài khoản, vai trò, trạng thái và số dư ví."
        actions={
          <Button variant="glow" onClick={() => navigate('/admin/users/new')}>
            <Plus className="h-4 w-4" />
            Thêm người dùng
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <AdminTableToolbar>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm người dùng (BE chưa hỗ trợ)..."
              aria-label="Tìm người dùng"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled
            />
          </div>
        </AdminTableToolbar>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Số dư ví</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableMessageRow colSpan={5} loading />
            ) : !pagedData?.content.length ? (
              <TableMessageRow colSpan={5}>Chưa có tài khoản nào.</TableMessageRow>
            ) : (
              pagedData.content.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="min-w-[14rem]">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-field font-display text-xs font-semibold text-muted-foreground">
                        {initialsOf(user.fullName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.fullName}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><RoleBadge role={user.role} /></TableCell>
                  <TableCell><UserStatusBadge isActive={user.active} /></TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2 font-mono text-xs tabular-nums">
                      <Wallet className="h-3.5 w-3.5 text-success" />
                      {formatCurrency(user.wallet?.balance ?? 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Sửa ${user.fullName}`}
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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

export default UsersManagement;