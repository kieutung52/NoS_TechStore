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
import { Minus, Plus, ShoppingCart, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  
  
  const thumbnailImage = variant?.images?.find(img => img.isThumbnail) || variant?.images?.[0];
  const imageUrl = thumbnailImage?.imageUrl;

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm vào giỏ hàng</DialogTitle>
          <DialogDescription>
            Chọn số lượng sản phẩm bạn muốn thêm.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={modalProduct.name} className="h-full w-full object-cover rounded-lg" />
              ) : (
                <Package className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{modalProduct.name}</h3>
              <p className="text-primary font-bold text-lg">
                {variant?.price ? variant.price.toLocaleString('vi-VN') : 'N/A'}₫
              </p>
              <p className="text-sm text-muted-foreground">
                Còn lại: {stock}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Số lượng
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val <= stock) setQuantity(val);
                  else if (e.target.value === '') setQuantity(1);
                }}
                className="w-16 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            className="w-full" 
            onClick={handleAddToCart}
            disabled={loading || stock === 0}
          >
            {loading ? "Đang thêm..." : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Thêm vào giỏ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};