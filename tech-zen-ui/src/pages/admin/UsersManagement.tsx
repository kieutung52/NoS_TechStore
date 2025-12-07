import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input'; 
import { userService } from '../../services/userService'; 
import { Search, Edit, Plus, ChevronLeft, ChevronRight, Wallet } from 'lucide-react'; 
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Quản lý tài khoản ({pagedData?.totalElements || 0} tài khoản)</p>
        </div>
        <Button onClick={() => navigate('/admin/users/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm người dùng (BE chưa hỗ trợ)..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled 
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                 {/* === BẮT ĐẦU SỬA === */}
                <TableHead>Họ và tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Số dư Ví</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
                 {/* === KẾT THÚC SỬA === */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                   {/* Sửa colSpan */}
                  <TableCell colSpan={6} className="h-24 text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : (
                pagedData?.content.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell><UserStatusBadge isActive={user.active} /></TableCell>
                    {/* === BẮT ĐẦU SỬA === */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-green-600"/>
                        {formatCurrency(user.wallet?.balance ?? 0)}
                      </div>
                    </TableCell>
                    {/* === KẾT THÚC SỬA === */}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${user.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* ... (Giữ nguyên Pagination) ... */} 
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

export default UsersManagement;