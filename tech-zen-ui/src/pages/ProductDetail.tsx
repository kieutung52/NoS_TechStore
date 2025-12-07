import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import type { ProductResponse, ReviewResponse, PagedResponse, ProductVariantResponse } from '../types';
import { ShoppingCart, Star, Package, TruckIcon, Shield, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from '../hooks/use-toast';
import { cn } from '../lib/utils';

const ReviewSection = ({ productId }: { productId: string }) => {
    const [reviewsPage, setReviewsPage] = useState<PagedResponse<ReviewResponse> | null>(null);
    
    return (
        <Card>
            <CardHeader><CardTitle>Đánh giá sản phẩm</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                {/* ... code hiển thị review ... */}
            </CardContent>
        </Card>
    );
};


const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { openAddToCartModal } = useCart();
  const { isAuthenticated } = useAuth();
  
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantResponse | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true); 
      try {
        const response = await productService.getProductById(id);
        if (response.success && response.data) {
          setProduct(response.data);
          
          if (response.data.variants && response.data.variants.length > 0) {
            setSelectedVariant(response.data.variants[0]);
          }
        } else {
          navigate('/not-found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/not-found');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (product && selectedVariant) {
      
      const productWithSelectedVariant = {
        ...product,
        variants: [selectedVariant] 
      };
      openAddToCartModal(productWithSelectedVariant);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product || !selectedVariant) return null;

  
  const price = selectedVariant.price?.toLocaleString('vi-VN') || "0";
  const stock = selectedVariant.stock;
  
  
  const imageUrl = selectedVariant.images?.[0]?.imageUrl || `https://placehold.co/600x600/E2E8F0/64748B?text=${product.name.charAt(0)}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
            <img src={imageUrl} alt={product.name} className="h-full w-full object-contain" />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2" variant={product.isPublished && stock > 0 ? "default" : "destructive"}>
                {product.isPublished && stock > 0 ? 'Còn hàng' : 'Hết hàng'}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.averageRating || 0) ? 'fill-warning text-warning' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.averageRating?.toFixed(1) || '0.0'})
                </span>
              </div>
              
              <p className="text-3xl font-bold text-primary">{price}₫</p>
            </div>

            <Separator />

            {/* Chọn Variant */}
            <div>
                <h3 className="font-semibold mb-2">Chọn phiên bản:</h3>
                <div className="flex flex-wrap gap-2">
                    {product.variants.map(variant => (
                        <Button
                            key={variant.id}
                            variant={selectedVariant.id === variant.id ? "default" : "outline"}
                            onClick={() => setSelectedVariant(variant)}
                            className={cn("flex-1 sm:flex-auto", variant.stock === 0 && "line-through text-muted-foreground")}
                            disabled={variant.stock === 0}
                        >
                            {selectedVariant.id === variant.id && <Check className="h-4 w-4 mr-2" />}
                            {/* Hiển thị attribute nếu có, ngược lại hiện SKU */}
                            {Object.keys(variant.attributes).length > 0 
                                ? Object.values(variant.attributes).join(' / ') 
                                : variant.sku
                            }
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-5 w-5 text-primary" />
                <span>Mã SKU: {selectedVariant.sku} (Còn {stock} sản phẩm)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TruckIcon className="h-5 w-5 text-primary" />
                <span>Miễn phí vận chuyển cho đơn hàng trên 1 triệu</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span>Bảo hành chính hãng</span>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.isPublished || stock === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Thêm vào giỏ hàng
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleAddToCart}
                disabled={!product.isPublished || stock === 0}
              >
                Mua ngay
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Reviews & Policies */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ReviewSection productId={product.id} />
          </div>
          
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <TruckIcon className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Giao hàng nhanh</h3>
                <p className="text-sm text-muted-foreground">
                  Giao hàng trong 24h tại nội thành Hà Nội
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Bảo hành chính hãng</h3>
                <p className="text-sm text-muted-foreground">
                  Cam kết 100% hàng chính hãng, bảo hành đầy đủ
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;