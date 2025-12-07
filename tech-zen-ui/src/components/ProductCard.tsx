import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Eye } from "lucide-react";
import type { ProductResponse } from "@/types";
import { useCart } from "@/hooks/useCart";

interface ProductCardProps {
  product: ProductResponse;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { openAddToCartModal } = useCart();
  
  const variant = product.variants[0];
  const price = variant?.price || 0;

  const imageUrl = variant?.images?.[0]?.imageUrl || `https://placehold.co/600x600/E2E8F0/64748B?text=${product.name.charAt(0)}`;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };
  
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    openAddToCartModal(product);
  };

  return (
    <Card className="group flex flex-col justify-between overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div>
        <Link to={`/products/${product.id}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {product.quantityInStock === 0 && (
              <Badge variant="destructive" className="absolute top-2 right-2">
                Hết hàng
              </Badge>
            )}
            {product.quantityInStock > 0 && product.quantityInStock < 10 && (
              <Badge variant="secondary" className="absolute top-2 right-2 bg-warning text-warning-foreground">
                Sắp hết
              </Badge>
            )}
          </div>
        </Link>

        <CardContent className="p-4">
          <Link to={`/products/${product.id}`}>
            <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors mb-2 h-10">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1 mb-2">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="text-sm font-medium text-foreground">
              {product.averageRating?.toFixed(1) ?? '0.0'}
            </span>
            <span className="text-sm text-muted-foreground">
              ({product.quantitySales} đã bán)
            </span>
          </div>

          <p className="text-xl font-bold text-primary mb-1">
            {formatPrice(price)}
          </p>

          {variant?.attributes && Object.keys(variant.attributes).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 h-5 overflow-hidden">
              {Object.entries(variant.attributes).slice(0, 2).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {value}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="w-2/3"
            asChild
          >
            <Link to={`/products/${product.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Chi tiết
            </Link>
          </Button>
          <Button
            size="icon"
            className="w-1/3"
            disabled={product.quantityInStock === 0 || !product.isPublished}
            onClick={handleAddToCartClick}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};