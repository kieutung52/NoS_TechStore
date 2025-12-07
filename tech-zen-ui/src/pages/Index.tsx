import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { MapComponent } from "../components/MapComponent";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { ChevronRight, Cpu, MemoryStick, MonitorSpeaker, HardDrive, Package, TruckIcon } from "lucide-react";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { websiteConfig } from "../config/website";
import type { ProductResponse, CategoryResponse } from "../types";
import { LucideIcon } from 'lucide-react';

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getProducts({ page: 0, size: 8 }),
          categoryService.getAllCategories()
        ]);

        if (productsRes.success && productsRes.data) setFeaturedProducts(productsRes.data.content);
        if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

 
  const categoryIcons: Record<number, LucideIcon> = {
    1: Cpu,
    2: MemoryStick,
    3: MonitorSpeaker,
    4: MonitorSpeaker,
    5: HardDrive,
    6: HardDrive,
    8: Package,
  };

  const mapMarkers = [
    {
      lat: websiteConfig.contact.coordinates.lat,
      lng: websiteConfig.contact.coordinates.lng,
      label: "TechStore - Cửa hàng",
      popupContent: `<b>TechStore</b><br/>${websiteConfig.contact.address}`
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[500px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(https://placehold.co/1920x600/0071C5/FFFFFF?text=TechStore+Banner)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/50" />
          </div>
          
          <div className="container mx-auto px-4 relative h-full flex items-center">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                Chất lượng - Uy tín - Chuyên nghiệp
              </Badge>
              <h1 className="text-5xl font-bold mb-4 text-foreground">
                Linh kiện máy tính
                <br />
                <span className="text-primary">Chính hãng 100%</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                CPU, RAM, VGA, Mainboard và các linh kiện cao cấp từ Intel, AMD, ASUS, MSI
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/products">
                    Xem sản phẩm
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">
                    Liên hệ tư vấn
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Sản phẩm chính hãng</h3>
                    <p className="text-sm text-muted-foreground">100% hàng chính hãng</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <TruckIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Giao hàng nhanh</h3>
                    <p className="text-sm text-muted-foreground">Freeship nội thành Hà Nội</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MonitorSpeaker className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Bảo hành chính hãng</h3>
                    <p className="text-sm text-muted-foreground">12-36 tháng tùy sản phẩm</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-foreground">Danh mục sản phẩm</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <Card key={i}><CardContent className="p-6 text-center"><Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" /><Skeleton className="h-5 w-3/4 mx-auto mb-1" /></CardContent></Card>
                ))
              ) : (
                categories.filter(c => !c.parentCategoryId).map((category) => {
                  const Icon = categoryIcons[category.id] || Package;
                  return (
                    <Link to={`/products?category=${category.id}`} key={category.id}>
                      <Card
                        className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary"
                      >
                        <CardContent className="p-6 text-center">
                          <div className="flex h-16 w-16 mx-auto mb-4 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-foreground">Sản phẩm nổi bật</h2>
              <Button variant="outline" asChild>
                <Link to="/products">
                  Xem tất cả
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                   <Card key={i}>
                    <Skeleton className="aspect-square w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Vị trí cửa hàng</h2>
            <p className="text-muted-foreground mb-8">
              Ghé thăm chúng tôi tại {websiteConfig.contact.address}
            </p>
            <MapComponent
              center={[websiteConfig.contact.coordinates.lat, websiteConfig.contact.coordinates.lng]}
              zoom={15}
              markers={mapMarkers}
              className="h-[500px] w-full rounded-lg border border-border"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;