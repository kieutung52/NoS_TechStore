import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
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

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Thương hiệu</h1>
          <p className="text-muted-foreground">Khám phá các thương hiệu hàng đầu tại TechStore</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-60 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand, i) => (
              // Cả card là liên kết, lọc sản phẩm theo brandId
              <Link
                key={brand.id}
                to={`/products?brandId=${brand.id}`}
                className="group flex animate-rise flex-col rounded-xl border border-border bg-card p-5 shadow transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className="mb-5 grid h-28 place-items-center overflow-hidden rounded-lg border border-border bg-field p-4">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      loading="lazy"
                      className="max-h-full w-auto object-contain transition-transform duration-500 ease-out-soft group-hover:scale-105"
                    />
                  ) : (
                    <span className="font-display text-3xl font-bold text-muted-foreground">{brand.name.charAt(0)}</span>
                  )}
                </div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">{brand.name}</h3>
                <p className="mb-5 line-clamp-2 text-sm text-muted-foreground">{brand.description}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Xem sản phẩm
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Brands;
