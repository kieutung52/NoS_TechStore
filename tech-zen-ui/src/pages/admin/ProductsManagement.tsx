import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, buttonVariants } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input'; 
import { productService } from '../../services/productService'; 
import { categoryService } from '../../services/categoryService'; 
import type { ProductResponse, CategoryResponse, PagedResponse } from '../../types'; 
import { Search, Plus, Edit, Trash2, Eye, Package } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPagination, AdminTableToolbar, TableMessageRow } from '../../components/admin/AdminTable';
import { thumbnailUrl } from '../../lib/productImage';
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
import { ProductStatusBadge } from '../../lib/badgeUtils'; 
import { Skeleton } from '../../components/ui/skeleton'; 

const PAGE_SIZE = 8;

const ProductsManagement = () => {
  const navigate = useNavigate();
  const [pagedData, setPagedData] = useState<PagedResponse<ProductResponse> | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductResponse | null>(null);

  const fetchData = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getProducts({ page, size: PAGE_SIZE, search: search || undefined }),
        categoryService.getAllCategories(), 
      ]);
      
      if (productsRes.success && productsRes.data) setPagedData(productsRes.data);
      if (categoriesRes.success && categoriesRes.data) {
        const flatCats = categoriesRes.data.flatMap(c => [c, ...(c.children || [])]);
        setCategories(flatCats);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(currentPage, searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm, fetchData]); 

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; 
    }
    
    setCurrentPage(0);
  }, [searchTerm]); 
  
  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.name || 'N/A';
  };

  const openDeleteDialog = (product: ProductResponse) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await productService.deleteProduct(productToDelete.id);
      toast({ title: "Thành công", description: `Đã xóa sản phẩm ${productToDelete.name}` });
      fetchData(currentPage, searchTerm);
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };
  
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return value.toLocaleString('vi-VN');
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Hàng hoá"
          title="Sản phẩm"
          description="Danh sách sản phẩm, giá bán, tồn kho và trạng thái hiển thị."
          actions={
            <Button variant="glow" onClick={() => navigate('/admin/products/new')}>
              <Plus className="h-4 w-4" />
              Thêm sản phẩm
            </Button>
          }
        />

        <Card className="overflow-hidden">
          <AdminTableToolbar>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên sản phẩm…"
                aria-label="Tìm sản phẩm"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </AdminTableToolbar>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableMessageRow colSpan={6} loading />
              ) : !pagedData?.content.length ? (
                <TableMessageRow colSpan={6}>
                  {searchTerm ? `Không có sản phẩm nào khớp "${searchTerm}".` : 'Chưa có sản phẩm nào.'}
                </TableMessageRow>
              ) : (
                pagedData.content.map((product) => {
                  const image = thumbnailUrl(product.variants[0]?.images);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="min-w-[14rem]">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-field">
                            {image ? (
                              <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </span>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{getCategoryName(product.categoryId)}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {formatCurrency(product.variants[0]?.price)}₫
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">{product.quantityInStock}</TableCell>
                      <TableCell>
                        <ProductStatusBadge isPublished={product.isPublished} stock={product.quantityInStock} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Xem ${product.name} trên cửa hàng`} onClick={() => navigate(`/products/${product.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Sửa ${product.name}`} onClick={() => navigate(`/admin/products/${product.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" aria-label={`Xoá ${product.name}`} onClick={() => openDeleteDialog(product)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Sản phẩm "{productToDelete?.name}" sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className={buttonVariants({ variant: 'destructive' })}>
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductsManagement;