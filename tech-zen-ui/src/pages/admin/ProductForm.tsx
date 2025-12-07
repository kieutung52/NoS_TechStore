import { useEffect, useState, useCallback, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import type { ProductResponse, CategoryResponse, BrandResponse, CreateProductRequest, UpdateProductRequest, CreateVariantRequest, UploadImageRequest, ProductVariantResponse } from '../../types';
import { ArrowLeft, UploadCloud, Plus, Trash2, Loader2, Edit } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Separator } from '../../components/ui/separator';
import { EditVariantModal } from './EditVariantModal'; 

const ImageUploader = ({ 
  productId, 
  variantId, 
  onImageUploaded 
}: { 
  productId: string, 
  variantId: string, 
  onImageUploaded: () => void 
}) => {
    const [loading, setLoading] = useState(false);
    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setLoading(true);
        try {
          const request: UploadImageRequest = {
              targetId: variantId,
              isThumbnail: false,
          };
          await productService.uploadImage(productId, request, file);
          toast({ title: "Thành công", description: "Đã tải ảnh lên" });
          onImageUploaded();
        } catch (error) {
          toast({ title: "Lỗi", description: error.message, variant: "destructive" });
        }
        setLoading(false);
    };
    return (
        <div className="relative border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary">
        {loading ? <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" /> : <UploadCloud className="h-12 w-12 text-muted-foreground" />}
        <p className="font-semibold text-foreground mt-4">Nhấn để tải ảnh lên</p>
        <p className="text-sm text-muted-foreground">PNG, JPG (Tối đa 5MB)</p>
        <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileSelect} disabled={loading} accept="image/*" />
        </div>
    );
};


const VariantManager = ({ 
  product, 
  onUpdate,
  onEditVariant
}: { 
  product: ProductResponse, 
  onUpdate: () => void,
  onEditVariant: (variant: ProductVariantResponse) => void;
}) => {
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState(0);
  const [isAddingVariant, setIsAddingVariant] = useState(false); 
  const [addLoading, setAddLoading] = useState(false); 

  const handleAddVariant = async () => {
    setAddLoading(true);
    try {
      const request: CreateVariantRequest = { sku, price: price || 0, attributes: {} };
      await productService.createVariant(product.id, request);
      toast({ title: "Thành công", description: "Đã thêm biến thể" });
      onUpdate(); 
      setIsAddingVariant(false); 
      setSku(''); 
      setPrice(0);
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
    setAddLoading(false);
  };

  const handleDeleteVariant = async (variantId: string) => {
     try {
      await productService.deleteVariant(product.id, variantId);
      toast({ title: "Thành công", description: "Đã xóa biến thể" });
      onUpdate();
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý Biến thể & Hình ảnh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* === BẮT ĐẦU SỬA: Logic Ẩn/Hiện Form Thêm === */}
        {!isAddingVariant ? (
          <Button type="button" onClick={() => setIsAddingVariant(true)} className="w-full" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Thêm biến thể mới
          </Button>
        ) : (
          <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold">Thêm biến thể mới</h4>
            <div className="space-y-2">
              <Label htmlFor="new-sku">SKU (bắt buộc)</Label>
              <Input id="new-sku" placeholder="Mã SKU (vd: CPU-I5-13600K)" value={sku} onChange={e => setSku(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="new-price">Giá (bắt buộc)</Label>
              <Input id="new-price" type="number" placeholder="Giá (VND)" value={price} onChange={e => setPrice(Number(e.target.value))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAddingVariant(false)} disabled={addLoading}>Hủy</Button>
              <Button type="button" onClick={handleAddVariant} disabled={addLoading}>
                {addLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu biến thể
              </Button>
            </div>
          </div>
        )}
        {/* === KẾT THÚC SỬA === */}
        
        <Separator /> 

        {/* Danh sách variants */}
        <div className="space-y-4">
          <Label>Các biến thể hiện có ({product.variants.length})</Label>
          {product.variants.length === 0 && (
             <p className="text-sm text-muted-foreground text-center py-4">Chưa có biến thể nào.</p>
          )}
          {product.variants.map(variant => (
             <div key={variant.id} className="p-4 border rounded-lg space-y-4 bg-background">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">SKU: {variant.sku}</p>
                  <p className="text-primary">{variant.price?.toLocaleString('vi-VN')}₫</p>
                  {/* BE gửi stock trong variant, ta dùng nó */}
                  <p className="text-sm text-muted-foreground">Tồn kho (của variant): {variant.stock}</p>
                </div>
                <div className="flex gap-2">
                   <Button type="button" variant="outline" size="sm" onClick={() => onEditVariant(variant)}>
                    <Edit className="h-4 w-4 mr-2" /> Chi tiết
                  </Button>
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleDeleteVariant(variant.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



const ProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [product, setProduct] = useState<Partial<ProductResponse>>({});
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariantResponse | null>(null);

  
  const fetchDependencies = useCallback(async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        categoryService.getAllCategories(), 
        brandService.getAllBrands() 
      ]);
      if (categoriesRes.success && categoriesRes.data) {
        const childCategories = categoriesRes.data.flatMap(c => c.children.length > 0 ? c.children : (c.parentCategoryId ? c : []));
        setCategories(childCategories); 
      }
      if (brandsRes.success && brandsRes.data) {
        setBrands(brandsRes.data); 
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
  }, []);

  const fetchProduct = useCallback(async (productId: string) => {
    setLoading(true);
    try {
      const res = await productService.getProductById(productId);
      if (res.success && res.data) {
        setProduct(res.data);
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message || "Không tìm thấy sản phẩm", variant: "destructive" });
      navigate('/admin/products'); 
    } finally {
      setLoading(false);
    }
  }, [navigate]); 

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    if (isEditing && id) {
      fetchProduct(id);
    } else {
      setLoading(false); 
    }
  }, [id, isEditing, fetchProduct]);

  const handleVariantUpdated = () => {
    setEditingVariant(null); 
    if(id) {
      fetchProduct(id); 
    }
  }

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!product.categoryId || !product.brandId || !product.name) {
      toast({ title: "Lỗi", description: "Vui lòng chọn Tên, Danh mục và Thương hiệu", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (isEditing) {
        const requestData: UpdateProductRequest = {
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          brandId: product.brandId,
          isPublished: product.isPublished ?? true,
          quantityInStock: product.quantityInStock 
        };
        
        await productService.updateProduct(id!, requestData);
        toast({ title: "Thành công", description: "Đã cập nhật sản phẩm" });
        navigate('/admin/products');
      } else {
         const requestData: CreateProductRequest = {
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          brandId: product.brandId,
          isPublished: product.isPublished ?? false 
        };
        const res = await productService.createProduct(requestData);
        toast({ title: "Thành công", description: "Đã tạo sản phẩm. Giờ bạn có thể thêm biến thể." });
        navigate(`/admin/products/${res.data!.id}`);
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message || "Thao tác thất bại", variant: "destructive" });
      setIsSubmitting(false);
    }
  };
  
  const handleChange = (field: string, value: string | number | boolean) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  if (loading) { 
    
     return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <> 
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... (Giữ nguyên Header Form) ... */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" size="icon" onClick={() => navigate('/admin/products')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h1>
              <p className="text-muted-foreground">{isEditing ? product.name : 'Tạo sản phẩm mới'}</p>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </Button>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* ... (Giữ nguyên Card Thông tin chung) ... */}
            <Card>
                <CardHeader>
                <CardTitle>Thông tin chung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Tên sản phẩm</Label>
                    <Input
                    id="name"
                    value={product.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                    id="description"
                    value={product.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Mô tả chi tiết sản phẩm..."
                    rows={5}
                    />
                </div>
                </CardContent>
            </Card>
            
            {/* ... (Giữ nguyên logic hiển thị VariantManager) ... */}
            {isEditing && product.id ? (
              <VariantManager 
                product={product as ProductResponse} 
                onUpdate={() => fetchProduct(id!)}
                onEditVariant={(variant) => setEditingVariant(variant)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Biến thể & Hình ảnh</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Bạn cần lưu sản phẩm trước khi thêm biến thể và hình ảnh.
                  </p>
                </CardContent>
              </Card>
            )}

          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* ... (Giữ nguyên Card Tổ chức) ... */}
            <Card>
                <CardHeader>
                <CardTitle>Tổ chức</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="category">Danh mục</Label>
                    <Select
                    value={product.categoryId?.toString()}
                    onValueChange={(value) => handleChange('categoryId', parseInt(value))}
                    required
                    >
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="brand">Thương hiệu</Label>
                    <Select
                    value={product.brandId?.toString()}
                    onValueChange={(value) => handleChange('brandId', parseInt(value))}
                    required
                    >
                    <SelectTrigger id="brand">
                        <SelectValue placeholder="Chọn thương hiệu" />
                    </SelectTrigger>
                    <SelectContent>
                        {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                </CardContent>
            </Card>
            
            {/* --- Card Trạng thái (Đã sửa theo BE) --- */}
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái & Kho hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublished">Hiển thị sản phẩm</Label>
                  <Switch
                    id="isPublished"
                    checked={product.isPublished ?? (isEditing ? true : false)} 
                    onCheckedChange={(checked) => handleChange('isPublished', checked)}
                  />
                </div>
                
                <Separator />

                <div className="space-y-2">
                    <Label htmlFor="quantityInStock">Tồn kho (Tổng)</Label>
                    <Input 
                      id="quantityInStock"
                      type="number"
                      value={product.quantityInStock ?? 0} 
                      onChange={(e) => handleChange('quantityInStock', parseInt(e.target.value) || 0)}
                      disabled={!isEditing} 
                    />
                    <p className="text-xs text-muted-foreground">
                      {isEditing ? "Cập nhật tồn kho thủ công." : "Tồn kho mặc định là 0."}
                    </p>
                </div>
                 <div className="space-y-2">
                    <Label>Đã bán (Read-only)</Label>
                    <Input value={product.quantitySales ?? 0} readOnly disabled />
                </div>
              </CardContent>
            </Card>
            {/* === KẾT THÚC SỬA === */}

          </div>
        </div>
      </form>
      
      {/* Modal (Giữ nguyên) */}
      {isEditing && editingVariant && product.id && (
        <EditVariantModal
          product={product as ProductResponse}
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
          onSaveSuccess={handleVariantUpdated}
        />
      )}
    </>
  );
};

export default ProductForm;