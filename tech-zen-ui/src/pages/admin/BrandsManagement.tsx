import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, buttonVariants } from '../../components/ui/button'; 
import { Card } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input'; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'; 
import { toast } from '../../hooks/use-toast'; 
import { brandService } from '../../services/brandService'; 
import type { BrandResponse } from '../../types'; 
import { Plus, Edit, Trash2, Search, ImageOff } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminTableToolbar, TableMessageRow } from '../../components/admin/AdminTable';

const BrandsManagement = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<BrandResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await brandService.getAllBrands();
      if (res.success && res.data) {
        setBrands(res.data);
        setFilteredBrands(res.data); 
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      setFilteredBrands(
        brands.filter(b => 
          b.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredBrands(brands);
    }
  }, [debouncedSearchTerm, brands]);

  const openDeleteDialog = (brand: BrandResponse) => {
    setBrandToDelete(brand);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;
    try {
      await brandService.deleteBrand(brandToDelete.id);
      toast({ title: "Thành công", description: `Đã xóa ${brandToDelete.name}` });
      fetchData(); 
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Hàng hoá"
          title="Thương hiệu"
          description="Logo và mô tả thương hiệu hiển thị trên cửa hàng."
          actions={
            <Button variant="glow" onClick={() => navigate('/admin/brands/new')}>
              <Plus className="h-4 w-4" />
              Thêm thương hiệu
            </Button>
          }
        />

        <Card className="overflow-hidden">
          <AdminTableToolbar>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên thương hiệu…"
                aria-label="Tìm thương hiệu"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{filteredBrands.length} thương hiệu</span>
          </AdminTableToolbar>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Tên thương hiệu</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableMessageRow colSpan={4} loading />
              ) : filteredBrands.length === 0 ? (
                <TableMessageRow colSpan={4}>
                  {searchTerm ? `Không có thương hiệu nào khớp "${searchTerm}".` : 'Chưa có thương hiệu nào.'}
                </TableMessageRow>
              ) : (
                filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      {/* Cùng kiểu khay logo với trang Thương hiệu ngoài cửa hàng */}
                      <span className="grid h-10 w-14 place-items-center overflow-hidden rounded-md border border-border bg-field">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-1 text-muted-foreground">{brand.description || '—'}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Sửa ${brand.name}`} onClick={() => navigate(`/admin/brands/${brand.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" aria-label={`Xoá ${brand.name}`} onClick={() => openDeleteDialog(brand)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa thương hiệu "{brandToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BrandsManagement;