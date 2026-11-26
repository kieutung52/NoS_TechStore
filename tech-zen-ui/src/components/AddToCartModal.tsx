import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, ShoppingCart, Package, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { thumbnailUrl } from '@/lib/productImage';

export const AddToCartModal = () => {

  const { modalProduct, closeAddToCartModal, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (modalProduct) {
      setQuantity(1);
    }
  }, [modalProduct]);

  if (!modalProduct) {
    return null;
  }


  if (!modalProduct.variants || modalProduct.variants.length === 0) {
    return null;
  }

  const variant = modalProduct.variants[0];
  const stock = variant?.stock || 0;

  // Cùng quy tắc ảnh đại diện với card và trang chi tiết
  const imageUrl = thumbnailUrl(variant?.images);
  const price = variant?.price || 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => {
      const newQuantity = prev + delta;
      if (newQuantity < 1) return 1;
      if (newQuantity > stock) return stock;
      return newQuantity;
    });
  };

  const handleAddToCart = async () => {
    if (!variant) return;

    if (quantity > stock) {
      toast({
        title: "Số lượng không hợp lệ",
        description: `Chỉ còn ${stock} sản phẩm trong kho.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    await addToCart({
      productVariantId: variant.id,
      quantity: quantity
    });
    setLoading(false);

  };

  return (
    <Dialog open={!!modalProduct} onOpenChange={(open) => !open && closeAddToCartModal()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Thêm vào giỏ hàng</DialogTitle>
          <DialogDescription>
            Chọn số lượng sản phẩm bạn muốn thêm.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-field">
              {imageUrl ? (
                <img src={imageUrl} alt={modalProduct.name} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 font-sans font-semibold">{modalProduct.name}</h3>
              <p className="mt-1 font-display text-lg font-semibold tabular-nums">
                {variant?.price ? variant.price.toLocaleString('vi-VN') : 'N/A'}
                <span className="ml-0.5 text-sm text-muted-foreground">₫</span>
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Còn lại: {stock}
              </p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="quantity">Số lượng</Label>
            {/* Bộ chỉnh số lượng: một khối liền, nền lõm (giống trang Giỏ hàng) */}
            <div className="flex items-center rounded-lg border border-input bg-field p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Giảm số lượng"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus />
              </Button>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val <= stock) setQuantity(val);
                  else if (e.target.value === '') setQuantity(1);
                }}
                className="h-8 w-14 border-0 bg-transparent px-0 text-center font-mono shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Tăng số lượng"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= stock}
              >
                <Plus />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Tạm tính</span>
            <span className="font-display text-xl font-semibold tabular-nums">
              {(price * quantity).toLocaleString('vi-VN')}
              <span className="ml-0.5 text-sm text-muted-foreground">₫</span>
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="glow"
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={loading || stock === 0}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Đang thêm...
              </>
            ) : (
              <>
                <ShoppingCart />
                Thêm vào giỏ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
