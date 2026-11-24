import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useCart } from '../hooks/useCart';
import { Minus, Plus, Trash2, ShoppingBag, Package, ArrowRight } from 'lucide-react';
// import { toast } from '../hooks/use-toast';
import { Skeleton } from '../components/ui/skeleton';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, loading } = useCart();

  const handleUpdateQuantity = (variantId: string, newQuantity: number) => {
    if (newQuantity < 1) {

      handleUpdateQuantity(variantId, 1);
      return;
    }
    updateQuantity(variantId, newQuantity);
  };

  const handleRemoveItem = (variantId: string) => {
    removeFromCart(variantId);
  };

  if (loading && !cart) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-10">
          <Skeleton className="mb-8 h-9 w-64" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cart|| !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto flex items-center justify-center px-4 py-20">
          <div className="flex max-w-sm animate-rise flex-col items-center text-center">
            <span className="relative isolate mb-6 grid h-24 w-24 place-items-center rounded-full border border-border bg-card shadow-lg">
              <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.35),transparent)] blur-xl" />
              <ShoppingBag className="h-10 w-10 text-primary" />
            </span>
            <h2 className="mb-2 text-2xl font-bold">Giỏ hàng trống</h2>
            <p className="mb-8 text-muted-foreground">Thêm sản phẩm vào giỏ hàng để tiếp tục</p>
            <Button variant="glow" size="lg" onClick={() => navigate('/products')}>
              Khám phá sản phẩm
              <ArrowRight />
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold md:text-4xl">Giỏ hàng của bạn</h1>
          <span className="font-mono text-xs text-muted-foreground">{cart.totalItems} sản phẩm</span>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-3 lg:col-span-2">
            {cart.items.map((item, i) => (
              <Card
                key={item.productVariantId}
                className="animate-rise transition-colors duration-200 hover:border-input"
                style={{ "--i": i } as React.CSSProperties}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-field sm:h-24 sm:w-24">
                      {item.imageUrls[0] ? (
                         <img src={item.imageUrls[0]} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <h3 className="line-clamp-2 font-sans font-semibold">{item.productName}</h3>
                        {/* Thành tiền của dòng */}
                        <p className="shrink-0 font-display text-lg font-semibold tabular-nums">
                          {formatCurrency(item.price * item.quantity)}
                          <span className="ml-0.5 text-sm font-medium text-muted-foreground">₫</span>
                        </p>
                      </div>
                      <p className="mb-4 mt-1 font-mono text-xs text-muted-foreground">
                        Đơn giá {formatCurrency(item.price)}₫
                      </p>

                      <div className="flex items-center justify-between">
                        {/* Bộ chỉnh số lượng: một khối liền, nền lõm */}
                        <div className="flex items-center rounded-lg border border-input bg-field p-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Giảm số lượng"
                            onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus />
                          </Button>
                          <span className="w-10 text-center font-mono text-sm tabular-nums" aria-live="polite">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Tăng số lượng"
                            onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity + 1)}
                          >
                            <Plus />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveItem(item.productVariantId)}
                        >
                          <Trash2 />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="ghost"
              onClick={clearCart}
              className="w-full border border-dashed border-border text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
              Xóa toàn bộ giỏ hàng
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-32 lg:col-span-1">
            <Card className="relative overflow-hidden shadow-lg">
              {/* Vạch sáng mép trên đánh dấu khối thanh toán */}
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)),hsl(var(--plasma)),transparent)]" />
              <CardContent className="space-y-4 p-6">
                <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>

                <Separator />

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính ({cart.totalItems} sản phẩm)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(cart.totalAmount)}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="text-success">Miễn phí</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="font-display text-2xl font-semibold tabular-nums text-foreground">
                    {formatCurrency(cart.totalAmount)}
                    <span className="ml-0.5 text-base text-muted-foreground">₫</span>
                  </span>
                </div>

                <Button variant="glow" className="w-full" size="lg" onClick={() => navigate('/checkout')}>
                  Tiến hành thanh toán
                  <ArrowRight />
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link to="/products">
                    Tiếp tục mua sắm
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
