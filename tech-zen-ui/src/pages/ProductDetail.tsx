import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../components/ui/breadcrumb';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { productService } from '../services/productService';
import { reviewService } from '../services/reviewService';
import type { ProductResponse, ReviewResponse, ProductVariantResponse } from '../types';
import { ShoppingCart, Star, TruckIcon, Shield, Loader2, ChevronLeft, ChevronRight, Check, MessageSquare, Package } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from '../hooks/use-toast';
import { cn } from '../lib/utils';
import { thumbnailIndex } from '../lib/productImage';

const Stars = ({ value, className, size = "h-4 w-4" }: { value: number; className?: string; size?: string }) => (
  <div className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${value} trên 5 sao`}>
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={cn(size, i < Math.floor(value || 0) ? "fill-warning text-warning" : "text-muted-foreground/40")}
      />
    ))}
  </div>
);

const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Hiển thị các đánh giá gần đây có sẵn trong dữ liệu sản phẩm (recentReviews)
const ReviewSection = ({ reviews }: { reviews: ReviewResponse[] }) => {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Đánh giá sản phẩm</CardTitle>
        <span className="font-mono text-xs text-muted-foreground">{reviews.length} đánh giá gần đây</span>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">Chưa có đánh giá nào</p>
            <p className="mt-1 text-sm text-muted-foreground">Đánh giá xuất hiện sau khi người mua đã nhận được hàng.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((review) => (
              <li key={review.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <Avatar className="h-10 w-10 ring-1 ring-border">
                  <AvatarFallback className="bg-secondary font-display text-xs">{getInitials(review.userName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{review.userName}</span>
                    <time dateTime={review.createdAt} className="font-mono text-[11px] text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </time>
                  </div>
                  <Stars value={review.rating} size="h-3.5 w-3.5" className="mt-1" />
                  {review.comment && <p className="mt-2 text-sm leading-relaxed text-foreground/90">{review.comment}</p>}
                  {review.attachmentUrls?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.attachmentUrls.map((url) =>
                        isVideo(url) ? (
                          <video key={url} src={url} controls muted className="h-20 rounded-md border border-border bg-field" />
                        ) : (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-border transition-colors hover:border-primary/60">
                            <img src={url} alt={`Ảnh đánh giá của ${review.userName}`} loading="lazy" className="h-20 w-20 object-cover" />
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
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
  const [activeImage, setActiveImage] = useState(0);

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
            setActiveImage(thumbnailIndex(response.data.variants[0].images));
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

  const handleSelectVariant = (variant: ProductVariantResponse) => {
    setSelectedVariant(variant);
    setActiveImage(thumbnailIndex(variant.images));
  };

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
          <Skeleton className="mb-6 h-4 w-64" />
          <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-32 w-full rounded-xl" />
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
  const inStock = product.isPublished && stock > 0;
  const rating = product.averageRating || 0;

  const images = selectedVariant.images ?? [];
  const fallbackImage = `https://placehold.co/600x600/0D1220/8F98AD?text=${product.name.charAt(0)}`;
  const imageUrl = images[activeImage]?.imageUrl || images[0]?.imageUrl || fallbackImage;
  const specs = Object.entries(selectedVariant.attributes ?? {});

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/products">Sản phẩm</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[16rem]">{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Ảnh sản phẩm: ảnh lớn + dải ảnh nhỏ để đổi ảnh */}
          <div className="space-y-3 lg:sticky lg:top-32 lg:self-start">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-field shadow-lg">
              <img
                key={imageUrl}
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-cover duration-300 animate-in fade-in"
              />
            </div>
            {images.length > 1 && (
              <div className="flex flex-wrap gap-3">
                {images.map((image, i) => (
                  <button
                    key={image.imageUrl}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Xem ảnh ${i + 1}`}
                    aria-pressed={i === activeImage}
                    className={cn(
                      "h-20 w-20 overflow-hidden rounded-lg border bg-field transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      i === activeImage ? "border-primary shadow-glow-sm" : "border-border opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={image.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thông tin sản phẩm */}
          <div className="space-y-7">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Badge variant={inStock ? "success" : "destructive"}>
                  {inStock ? 'Còn hàng' : 'Hết hàng'}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">SKU {selectedVariant.sku}</span>
              </div>
              <h1 className="mb-3 text-3xl font-bold leading-tight md:text-4xl">{product.name}</h1>
              <div className="flex items-center gap-2 text-sm">
                <Stars value={rating} />
                <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                <span className="text-muted-foreground">· {product.quantitySales} đã bán</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/70 p-5 shadow">
              <p className="font-display text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                {price}
                <span className="ml-1 text-xl font-medium text-muted-foreground">₫</span>
              </p>
              <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                {stock > 0 ? `Còn ${stock} sản phẩm` : 'Tạm hết hàng'}
              </p>
            </div>

            {/* Chọn phiên bản */}
            <div>
              <h3 className="mb-3 font-sans text-sm font-semibold">Chọn phiên bản</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(variant => {
                  const selected = selectedVariant.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleSelectVariant(variant)}
                      disabled={variant.stock === 0}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary bg-primary/10 font-medium text-primary shadow-glow-sm"
                          : "border-input bg-card/40 hover:border-primary/60 hover:bg-primary/5",
                        variant.stock === 0 && "cursor-not-allowed text-muted-foreground line-through opacity-50"
                      )}
                    >
                      {selected && <Check className="h-4 w-4" />}
                      {/* Hiển thị attribute nếu có, ngược lại hiện SKU */}
                      {Object.keys(variant.attributes).length > 0
                        ? Object.values(variant.attributes).join(' / ')
                        : variant.sku
                      }
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bảng thông số của phiên bản đang chọn */}
            {specs.length > 0 && (
              <div>
                <h3 className="mb-3 font-sans text-sm font-semibold">Thông số</h3>
                <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border font-mono text-xs">
                  {specs.map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-4 bg-card/40 px-4 py-2.5 odd:bg-field/70">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                size="lg"
                variant="glow"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingCart className="h-5 w-5" />
                Thêm vào giỏ hàng
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                Mua ngay
              </Button>
            </div>

            <ul className="grid gap-3 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-3 text-muted-foreground">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <TruckIcon className="h-4 w-4" />
                </span>
                Miễn phí vận chuyển cho đơn hàng trên 1 triệu
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </span>
                Bảo hành chính hãng
              </li>
            </ul>
          </div>
        </div>

        {/* Mô tả, đánh giá & chính sách */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mô tả sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                {product.description ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{product.description}</p>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Sản phẩm chưa có mô tả.
                  </p>
                )}
              </CardContent>
            </Card>
            <ReviewSection reviews={product.recentReviews ?? []} />
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="flex gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <TruckIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="mb-1 font-semibold">Giao hàng nhanh</h3>
                  <p className="text-sm text-muted-foreground">
                    Giao hàng trong 24h tại nội thành Hà Nội
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="mb-1 font-semibold">Bảo hành chính hãng</h3>
                  <p className="text-sm text-muted-foreground">
                    Cam kết 100% hàng chính hãng, bảo hành đầy đủ
                  </p>
                </div>
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
