import { useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useCart } from '../hooks/useCart';
import { Minus, Plus, Trash2, ShoppingBag, Package } from 'lucide-react';
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
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
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
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
            <p className="text-muted-foreground mb-6">Thêm sản phẩm vào giỏ hàng để tiếp tục</p>
            <Button onClick={() => navigate('/products')}>
              Khám phá sản phẩm
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng của bạn</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.productVariantId}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.imageUrls[0] ? (
                         <img src={item.imageUrls[0]} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{item.productName}</h3>
                      <p className="text-lg font-bold text-primary mb-4">
                        {formatCurrency(item.price)}₫
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity + 1)}
                           
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.productVariantId)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right font-bold text-lg w-32">
                      {formatCurrency(item.price * item.quantity)}₫
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button variant="outline" onClick={clearCart} className="w-full text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa toàn bộ giỏ hàng
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính ({cart.totalItems} sản phẩm)</span>
                    <span>{formatCurrency(cart.totalAmount)}₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{formatCurrency(cart.totalAmount)}₫</span>
                </div>
                
                <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>
                  Tiến hành thanh toán
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