import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Checkbox } from '../components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '../components/ui/pagination';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { Skeleton } from '../components/ui/skeleton';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { brandService } from '../services/brandService';
import type {
  ProductResponse,
  CategoryResponse,
  BrandResponse,
  PagedResponse,
  ProductSearchRequest,
} from '../types';
import { Filter, Search, X, SlidersHorizontal, SearchX, ChevronDown } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { ScrollArea } from '../components/ui/scroll-area';
import { Slider } from '../components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';

const PAGE_SIZE = 18; 

const ProductFilterSidebar = ({
  categories,
  brands,
  onFilterChange,
  activeFilters,
}: {
  categories: CategoryResponse[];
  brands: BrandResponse[];
  onFilterChange: (key: string, value: string | number | null) => void;
  activeFilters: ProductSearchRequest;
}) => {
  const [priceRange, setPriceRange] = useState([activeFilters.minPrice || 0, activeFilters.maxPrice || 50000000]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const parentCategories = categories.filter(c => !c.parentCategoryId);
  const activeBrandIds = activeFilters.brandId ? [activeFilters.brandId] : [];

  // Mục danh mục: vạch sáng bên trái + nền Ion nhạt khi đang chọn
  const categoryItemClass = (active: boolean, extra: string) =>
    cn(
      "flex w-full items-center rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      extra,
      active && "bg-primary/10 text-primary shadow-[inset_2px_0_0_hsl(var(--primary))] hover:bg-primary/15 hover:text-primary"
    );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Lọc sản phẩm
        </CardTitle>
        {/* Trên mobile bộ lọc thu gọn mặc định để danh sách sản phẩm không bị đẩy xuống quá xa */}
        <Button
          variant="ghost"
          size="sm"
          className="-mr-2 text-muted-foreground lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? 'Thu gọn' : 'Mở bộ lọc'}
          <ChevronDown className={cn("transition-transform", mobileOpen && "rotate-180")} />
        </Button>
      </CardHeader>
      <CardContent className={cn("space-y-6", !mobileOpen && "hidden lg:block")}>
        {/* Lọc danh mục */}
        <Accordion type="multiple" defaultValue={['categories']} className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              Danh mục
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-56">
                <div className="space-y-0.5 pr-3">
                  {parentCategories.map(parent => (
                    <div key={parent.id}>
                      <button
                        type="button"
                        className={categoryItemClass(activeFilters.categoryId === parent.id, "font-medium text-foreground/90")}
                        onClick={() => onFilterChange('categoryId', parent.id)}
                      >
                        {parent.name}
                      </button>
                      {parent.children.length > 0 && (
                        <div className="ml-3 space-y-0.5 border-l border-border pl-2">
                          {parent.children.map(child => (
                            <button
                              type="button"
                              key={child.id}
                              className={categoryItemClass(activeFilters.categoryId === child.id, "text-muted-foreground")}
                              onClick={() => onFilterChange('categoryId', child.id)}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Lọc thương hiệu */}
        <Accordion type="multiple" defaultValue={['brands']} className="w-full">
          <AccordionItem value="brands">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              Thương hiệu
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-48">
                <div className="space-y-1 pr-3">
                  {brands.map(brand => (
                    <label
                      key={brand.id}
                      htmlFor={`brand-${brand.id}`}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent"
                    >
                      <Checkbox
                        id={`brand-${brand.id}`}
                        checked={activeBrandIds.includes(brand.id)}
                        onCheckedChange={(checked) =>
                          onFilterChange('brandId', checked ? brand.id : null)
                        }
                      />
                      {brand.name}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Lọc giá */}
        <div className="space-y-4">
          <h3 className="font-sans text-sm font-semibold">Khoảng giá</h3>
          <Slider
            min={0}
            max={50000000}
            step={100000}
            value={priceRange}
            onValueChange={setPriceRange}
            onValueCommit={(value) => {
              onFilterChange('minPrice', value[0]);
              onFilterChange('maxPrice', value[1]);
            }}
          />
          <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
            <span className="rounded-md border border-border bg-field px-2 py-1.5 text-center">{priceRange[0].toLocaleString('vi-VN')}₫</span>
            <span className="rounded-md border border-border bg-field px-2 py-1.5 text-center">{priceRange[1].toLocaleString('vi-VN')}₫</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages - 1, currentPage + half);
    if (currentPage - half < 0) {
      end = Math.min(totalPages - 1, end + (half - currentPage));
    }
    if (currentPage + half >= totalPages) {
      start = Math.max(0, start - (currentPage + half - totalPages + 1));
    }
    if (start > 0) {
      pages.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === currentPage}
            onClick={(e) => { e.preventDefault(); onPageChange(i); }}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    if (end < totalPages - 1) {
      pages.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => { e.preventDefault(); onPageChange(Math.max(0, currentPage - 1)); }}
            className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => { e.preventDefault(); onPageChange(Math.min(totalPages - 1, currentPage + 1)); }}
            className={currentPage === totalPages - 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagedData, setPagedData] = useState<PagedResponse<ProductResponse> | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const activeFilters = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '0'),
    size: PAGE_SIZE,
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined,
    brandId: searchParams.get('brandId') ? parseInt(searchParams.get('brandId')!) : undefined, 
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    sort: searchParams.get('sort') || undefined,
  }), [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes, brandsRes] = await Promise.all([
          productService.getProducts(activeFilters),
          categoryService.getAllCategories(),
          brandService.getAllBrands(),    
        ]);

        if (productsRes.success && productsRes.data) setPagedData(productsRes.data);
        if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
        if (brandsRes.success && brandsRes.data) setBrands(brandsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeFilters]); 

  const handleFilterChange = useCallback((key: string, value: string | number | null) => {
    setSearchParams(prev => {
      if (value !== null) {
        prev.set(key, String(value));
      } else {
        prev.delete(key);
      }
      if (key !== 'page') {
        prev.set('page', '0');
      }
      return prev;
    });
  }, [setSearchParams]);

  useEffect(() => {
    const currentSearch = searchParams.get('search');
    
    if ((debouncedSearchTerm || null) !== (currentSearch || null)) {
      handleFilterChange('search', debouncedSearchTerm || null);
    }
  }, [debouncedSearchTerm, handleFilterChange, searchParams]);

  const handleSortChange = (value: string) => {
    handleFilterChange('sort', value);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSearchParams({});
  };
  
  const activeFilterCount = Object.keys(activeFilters).filter(k => k !== 'page' && k !== 'size' && activeFilters[k as keyof typeof activeFilters]).length;
  
  const findCategory = (cats: CategoryResponse[], id: number): CategoryResponse | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategory(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  const currentCategory = activeFilters.categoryId ? findCategory(categories, activeFilters.categoryId) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Breadcrumb className="mb-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Trang chủ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Sản phẩm</BreadcrumbPage>
            </BreadcrumbItem>
            {currentCategory && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentCategory.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">
          {currentCategory ? currentCategory.name : "Tất cả sản phẩm"}
        </h1>
        <p className="mb-8 text-muted-foreground">
          Khám phá các sản phẩm linh kiện máy tính chất lượng cao
        </p>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[264px_1fr]">
          {/* Thanh lọc dính khi cuộn; tự cuộn riêng nếu cao hơn màn hình */}
          <aside className="lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pb-1">
            <ProductFilterSidebar
              categories={categories}
              brands={brands}
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
            />
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-card/70 p-3 shadow-sm backdrop-blur-md md:flex-row">
              <div className="relative w-full md:flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm trong trang này..."
                  aria-label="Tìm kiếm sản phẩm"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select 
                defaultValue={searchParams.get('sort') || 'default'} 
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  {/* BE đã tự động sort "name,asc" khi value="default" */}
                  <SelectItem value="default">Tên A-Z (Mặc định)</SelectItem> 
                  <SelectItem value="name,desc">Tên Z-A</SelectItem>
                  {/* Bạn có thể thêm sort theo ngày nếu muốn (BE đã hỗ trợ) */}
                  <SelectItem value="createdAt,desc">Mới nhất</SelectItem> 
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-5 flex min-h-9 flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                {loading
                  ? "Đang tải…"
                  : `Hiển thị ${pagedData?.content.length ?? 0} / ${pagedData?.totalElements ?? 0} sản phẩm`}
              </span>
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Đang lọc:</span>
                  <span className="rounded-md border border-primary/30 bg-primary/15 px-1.5 font-mono text-xs text-primary">
                    {activeFilterCount}
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary hover:text-primary">
                    <X />
                    Xóa tất cả
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(9)].map((_, i) => (
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
              <>
                {pagedData?.content.length === 0 ? (
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
                    <span className="mb-4 grid h-14 w-14 place-items-center rounded-full border border-border bg-field text-muted-foreground">
                      <SearchX className="h-6 w-6" />
                    </span>
                    <p className="text-lg font-medium text-foreground">Không tìm thấy sản phẩm nào</p>
                    <p className="mt-1 text-sm text-muted-foreground">Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm.</p>
                    {activeFilterCount > 0 && (
                      <Button variant="outline" className="mt-6" onClick={clearFilters}>
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {pagedData?.content.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} />
                    ))}
                  </div>
                )}

                <div className="mt-10">
                  <PaginationControls 
                    currentPage={activeFilters.page}
                    totalPages={pagedData?.totalPages || 1}
                    onPageChange={(page) => handleFilterChange('page', page.toString())}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;