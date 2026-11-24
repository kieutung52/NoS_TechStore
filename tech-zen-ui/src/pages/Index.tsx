import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { MapComponent } from "../components/MapComponent";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import {
  ChevronRight,
  Cpu,
  MemoryStick,
  HardDrive,
  Package,
  TruckIcon,
  ShieldCheck,
  BadgeCheck,
  CircuitBoard,
  Monitor,
  Laptop,
  Mouse,
  Keyboard,
  PcCase,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { websiteConfig } from "../config/website";
import type { ProductResponse } from "../types";
import type { CategoryResponse } from "../types";
import { LucideIcon } from 'lucide-react';

// Icon theo tên danh mục (id thay đổi mỗi lần seed lại DB nên không map theo id)
const categoryIconFor = (name: string): LucideIcon => {
  const n = name.toLowerCase();
  if (n.includes("cpu") || n.includes("vi xử lý")) return Cpu;
  if (n.includes("ram") || n.includes("bộ nhớ")) return MemoryStick;
  if (n.includes("vga") || n.includes("card") || n.includes("mainboard") || n.includes("bo mạch")) return CircuitBoard;
  if (n.includes("ổ cứng") || n.includes("ssd") || n.includes("hdd")) return HardDrive;
  if (n.includes("màn hình")) return Monitor;
  if (n.includes("laptop")) return Laptop;
  if (n.includes("chuột")) return Mouse;
  if (n.includes("bàn phím")) return Keyboard;
  if (n === "pc" || n.startsWith("pc ") || n.includes("máy bộ")) return PcCase;
  return Package;
};

const features = [
  { Icon: BadgeCheck, title: "Sản phẩm chính hãng", desc: "100% hàng chính hãng" },
  { Icon: TruckIcon, title: "Giao hàng nhanh", desc: "Freeship nội thành Hà Nội" },
  { Icon: ShieldCheck, title: "Bảo hành chính hãng", desc: "12-36 tháng tùy sản phẩm" },
];

const SectionHeading = ({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

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

  // Panel "Tâm điểm" ở hero: sản phẩm bán nhiều nhất trong nhóm nổi bật
  const spotlight = featuredProducts.length
    ? featuredProducts.reduce((best, p) => (p.quantitySales > best.quantitySales ? p : best))
    : null;
  const spotlightVariant = spotlight?.variants[0];
  const spotlightImage = spotlightVariant?.images?.[0]?.imageUrl;

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
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto grid grid-cols-1 items-center gap-14 px-4 pb-14 pt-12 lg:grid-cols-[1.15fr_1fr] lg:pb-16 lg:pt-14">
            <div className="max-w-2xl">
              <p className="eyebrow mb-5 flex animate-rise items-center gap-3" style={{ "--i": 0 } as React.CSSProperties}>
                <span className="h-px w-8 bg-primary/70" />
                Chất lượng · Uy tín · Chuyên nghiệp
              </p>
              <h1
                className="mb-6 animate-rise text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl xl:text-6xl"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                Linh kiện máy tính
                <br />
                <span className="text-gradient">Chính hãng 100%</span>
              </h1>
              <p
                className="mb-9 max-w-xl animate-rise text-lg leading-relaxed text-muted-foreground"
                style={{ "--i": 2 } as React.CSSProperties}
              >
                CPU, RAM, VGA, Mainboard và các linh kiện cao cấp từ Intel, AMD, ASUS, MSI
              </p>
              <div className="flex animate-rise flex-wrap gap-3" style={{ "--i": 3 } as React.CSSProperties}>
                <Button size="lg" variant="glow" asChild>
                  <Link to="/products">
                    Xem sản phẩm
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">Liên hệ tư vấn</Link>
                </Button>
              </div>
            </div>

            {/* Panel tâm điểm: điểm nhấn duy nhất có viền RGB luôn bật */}
            <div className="relative isolate mx-auto w-full max-w-md animate-rise lg:mr-0 lg:max-w-[480px]" style={{ "--i": 2 } as React.CSSProperties}>
              <div
                aria-hidden="true"
                className="absolute -inset-12 -z-10 bg-[radial-gradient(closest-side,hsl(var(--plasma)/0.26),hsl(var(--primary)/0.10)_55%,transparent)] blur-2xl"
              />
              {spotlight ? (
                <Link
                  to={`/products/${spotlight.id}`}
                  className="rgb-edge rgb-edge-live group block rounded-2xl border border-border bg-card/80 p-4 shadow-xl backdrop-blur-xl focus-visible:outline-none"
                >
                  <div className="flex items-center justify-between px-1 pb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                      </span>
                      Tâm điểm
                    </span>
                    <span>{spotlight.quantitySales} đã bán</span>
                  </div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-field">
                    {spotlightImage ? (
                      <img
                        src={spotlightImage}
                        alt={spotlight.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.03]"
                      />
                    ) : (
                      <Package className="absolute inset-0 m-auto h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-4 px-1 pt-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{spotlight.name}</p>
                      {spotlightVariant?.attributes && (
                        <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                          {Object.entries(spotlightVariant.attributes).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex gap-1.5">
                              <dt>{key}</dt>
                              <dd className="text-foreground">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                    <p className="shrink-0 font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                      {(spotlightVariant?.price || 0).toLocaleString('vi-VN')}
                      <span className="ml-0.5 text-sm text-muted-foreground">₫</span>
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-xl">
                  <Skeleton className="mb-3 h-4 w-32" />
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <div className="mt-4 flex justify-between gap-4">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dải cam kết */}
          <div className="container mx-auto px-4">
            <div className="grid divide-y divide-border rounded-xl border border-border bg-card/60 shadow backdrop-blur-md md:grid-cols-3 md:divide-x md:divide-y-0">
              {features.map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4 p-5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Danh mục */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <SectionHeading
              title="Danh mục sản phẩm"
              description="Chọn theo loại linh kiện bạn cần"
              action={
                <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
                  <Link to="/categories">
                    Tất cả danh mục
                    <ChevronRight />
                  </Link>
                </Button>
              }
            />
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
              {loading ? (
                [...Array(9)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/70 px-2 py-5">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))
              ) : (
                categories.filter(c => !c.parentCategoryId).map((category, i) => {
                  const Icon = categoryIconFor(category.name);
                  return (
                    <Link
                      to={`/products?categoryId=${category.id}`}
                      key={category.id}
                      title={category.description}
                      className="group flex animate-rise flex-col items-center gap-3 rounded-xl border border-border bg-card/70 px-2 py-5 text-center shadow-sm transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-md"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-field text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:text-primary group-hover:shadow-glow-sm">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="text-sm font-medium text-foreground">{category.name}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Sản phẩm nổi bật */}
        <section className="border-y border-border/60 bg-[linear-gradient(180deg,hsl(var(--card)/0.55),hsl(var(--background)/0))] py-20">
          <div className="container mx-auto px-4">
            <SectionHeading
              title="Sản phẩm nổi bật"
              action={
                <Button variant="outline" asChild>
                  <Link to="/products">
                    Xem tất cả
                    <ChevronRight />
                  </Link>
                </Button>
              }
            />

            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-square w-full rounded-none" />
                    <CardContent className="space-y-2 p-4">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Vị trí cửa hàng */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <SectionHeading title="Vị trí cửa hàng" description={`Ghé thăm chúng tôi tại ${websiteConfig.contact.address}`} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
              <Card className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-5 p-6">
                  <p className="eyebrow">Showroom</p>
                  <ul className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{websiteConfig.contact.address}</span>
                    </li>
                    <li className="flex gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="font-mono text-xs leading-5 text-foreground">{websiteConfig.contact.phone}</span>
                    </li>
                    <li className="flex gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="font-mono text-xs leading-5 text-muted-foreground">
                        T2–T6 <span className="text-foreground">{websiteConfig.businessHours.weekdays}</span>
                        <br />
                        T7–CN <span className="text-foreground">{websiteConfig.businessHours.weekend}</span>
                      </span>
                    </li>
                  </ul>
                  <Button variant="outline" className="mt-auto" asChild>
                    <Link to="/contact">Liên hệ tư vấn</Link>
                  </Button>
                </CardContent>
              </Card>
              {/* isolate: giữ z-index của Leaflet bên trong, không đè lên header dính */}
              <div className="isolate overflow-hidden rounded-xl border border-border shadow-lg">
                <MapComponent
                  center={[websiteConfig.contact.coordinates.lat, websiteConfig.contact.coordinates.lng]}
                  zoom={15}
                  markers={mapMarkers}
                  className="h-[420px] w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
