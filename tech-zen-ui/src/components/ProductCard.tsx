import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Eye } from "lucide-react";
import type { ProductResponse } from "@/types";
import { useCart } from "@/hooks/useCart";

interface ProductCardProps {
  product: ProductResponse;
  /** Thứ tự trong lưới, dùng để các card hiện lần lượt (stagger) */
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { openAddToCartModal } = useCart();

  const variant = product.variants[0];
  const price = variant?.price || 0;

  const imageUrl = variant?.images?.[0]?.imageUrl || `https://placehold.co/600x600/0D1220/8F98AD?text=${product.name.charAt(0)}`;

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openAddToCartModal(product);
  };

  return (
    <Card
      className="rgb-edge group flex animate-rise flex-col justify-between overflow-hidden hover:-translate-y-1"
      style={{ "--i": index % 12 } as React.CSSProperties}
    >
      <div>
        <Link to={`/products/${product.id}`} className="block" tabIndex={-1} aria-hidden="true">
          <div className="relative aspect-square overflow-hidden bg-field">
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]"
            />
            {/* Mép dưới ảnh chìm dần vào thân card */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
            {product.quantityInStock === 0 && (
              <Badge variant="destructive" className="absolute left-3 top-3 backdrop-blur-md">
                Hết hàng
              </Badge>
            )}
            {product.quantityInStock > 0 && product.quantityInStock < 10 && (
              <Badge variant="warning" className="absolute left-3 top-3 backdrop-blur-md">
                Sắp hết
              </Badge>
            )}
          </div>
        </Link>

        <CardContent className="p-4 pt-2">
          <Link to={`/products/${product.id}`}>
            <h3 className="mb-2 line-clamp-2 h-10 font-sans text-sm font-semibold leading-5 text-foreground transition-colors hover:text-primary">
              {product.name}
            </h3>
          </Link>

          <div className="mb-3 flex items-center gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-medium text-foreground">{product.averageRating?.toFixed(1) ?? '0.0'}</span>
            <span className="text-muted-foreground">· {product.quantitySales} đã bán</span>
          </div>

          <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">
            {price.toLocaleString('vi-VN')}
            <span className="ml-0.5 text-sm font-medium text-muted-foreground">₫</span>
          </p>

          {variant?.attributes && Object.keys(variant.attributes).length > 0 && (
            <div className="mt-3 flex h-5 flex-wrap gap-1.5 overflow-hidden">
              {Object.entries(variant.attributes).slice(0, 2).map(([key, value]) => (
                <span
                  key={key}
                  title={key}
                  className="rounded border border-border bg-field px-1.5 font-mono text-[10px] leading-[18px] text-muted-foreground"
                >
                  {value}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-0">
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link to={`/products/${product.id}`}>
              <Eye />
              Chi tiết
            </Link>
          </Button>
          <Button
            size="icon"
            aria-label={`Thêm ${product.name} vào giỏ`}
            disabled={product.quantityInStock === 0 || !product.isPublished}
            onClick={handleAddToCartClick}
          >
            <ShoppingCart />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
