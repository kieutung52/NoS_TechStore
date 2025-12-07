import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { brandService } from '../services/brandService';
import type { BrandResponse } from '../types';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

const Brands = () => {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
     
      const response = await brandService.getAllBrands();
      if (response.success && response.data) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Thương hiệu</h1>
          <p className="text-muted-foreground">Khám phá các thương hiệu hàng đầu tại TechStore</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <Card key={brand.id} className="group overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <img
                    src={brand.logoUrl || `https://placehold.co/100x100/e2e8f0/64748b?text=${brand.name}`}
                    alt={brand.name}
                    className="h-20 w-auto mb-4 object-contain"
                  />
                  <h3 className="font-semibold text-lg text-foreground mb-1">{brand.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {brand.description}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    {/* Sửa: Lọc theo brandId */}
                    <Link to={`/products?brandId=${brand.id}`}>
                      Xem sản phẩm <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Brands;