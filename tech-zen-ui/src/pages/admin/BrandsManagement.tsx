import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button'; 
import { Card, CardContent } from '../../components/ui/card'; 
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý thương hiệu</h1>
            <p className="text-muted-foreground">Thêm, sửa, xóa các thương hiệu ({filteredBrands.length || 0})</p>
          </div>
          <Button onClick={() => navigate('/admin/brands/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm thương hiệu
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm thương hiệu..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  {/* === BẮT ĐẦU SỬA === */}
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead>Tên thương hiệu</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                  {/* === KẾT THÚC SỬA === */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center"> {/* Sửa colSpan */}
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBrands.map((brand) => (
                    <TableRow key={brand.id}>
                      {/* === BẮT ĐẦU SỬA === */}
                      <TableCell>
                        {brand.logoUrl ? (
                          <img 
                            src={brand.logoUrl} 
                            alt={brand.name} 
                            className="h-10 w-10 object-contain rounded-md border p-1" 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md border p-1 flex items-center justify-center bg-muted">
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      {/* === KẾT THÚC SỬA === */}
                      <TableCell className="text-muted-foreground line-clamp-1">{brand.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/brands/${brand.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(brand)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BrandsManagement;