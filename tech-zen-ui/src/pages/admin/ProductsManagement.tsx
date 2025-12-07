import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button'; 
import { Card, CardContent } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input'; 
import { productService } from '../../services/productService'; 
import { categoryService } from '../../services/categoryService'; 
import type { ProductResponse, CategoryResponse, PagedResponse } from '../../types'; 
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
            <p className="text-muted-foreground">Quản lý danh sách sản phẩm ({pagedData?.totalElements || 0} sản phẩm)</p>
          </div>
          <Button onClick={() => navigate('/admin/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedData?.content.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                      {/* Giả sử giá đầu tiên là giá bán */}
                      <TableCell>{formatCurrency(product.variants[0]?.price)}₫</TableCell> 
                      <TableCell>{product.quantityInStock}</TableCell>
                      <TableCell>
                        <ProductStatusBadge
                          isPublished={product.isPublished}
                          stock={product.quantityInStock}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/products/${product.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(product)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
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
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductsManagement;