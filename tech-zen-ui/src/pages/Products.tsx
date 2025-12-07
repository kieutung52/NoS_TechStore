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
import { Filter, Search, X } from 'lucide-react';
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

  const parentCategories = categories.filter(c => !c.parentCategoryId);
  const activeBrandIds = activeFilters.brandId ? [activeFilters.brandId] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lọc sản phẩm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lọc danh mục */}
        <Accordion type="multiple" defaultValue={['categories']} className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger className="text-base font-semibold">
              Danh mục
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-48">
                <div className="space-y-2 pr-4">
                  {parentCategories.map(parent => (
                    <div key={parent.id} className="space-y-2">
                      <div 
                        className={cn(
                          "font-medium cursor-pointer hover:text-primary",
                          activeFilters.categoryId === parent.id && "text-primary"
                        )}
                        onClick={() => onFilterChange('categoryId', parent.id)}
                      >
                        {parent.name}
                      </div>
                      <div className="pl-4 space-y-2">
                        {parent.children.map(child => (
                          <div 
                            key={child.id} 
                            className={cn(
                              "text-sm text-muted-foreground cursor-pointer hover:text-primary",
                              activeFilters.categoryId === child.id && "text-primary font-medium"
                            )}
                            onClick={() => onFilterChange('categoryId', child.id)}
                          >
                            {child.name}
                          </div>
                        ))}
                      </div>
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
            <AccordionTrigger className="text-base font-semibold">
              Thương hiệu
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-48">
                <div className="space-y-2 pr-4">
                  {brands.map(brand => (
                    <div key={brand.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand.id}`}
                        checked={activeBrandIds.includes(brand.id)}
                        onCheckedChange={(checked) => 
                          onFilterChange('brandId', checked ? brand.id : null)
                        }
                      />
                      <label
                        htmlFor={`brand-${brand.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {brand.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Lọc giá */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Khoảng giá</h3>
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
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{priceRange[0].toLocaleString('vi-VN')}₫</span>
            <span>{priceRange[1].toLocaleString('vi-VN')}₫</span>
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
        <Breadcrumb className="mb-4">
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
        
        <h1 className="text-3xl font-bold mb-2">
          {currentCategory ? currentCategory.name : "Tất cả sản phẩm"}
        </h1>
        <p className="text-muted-foreground mb-8">
          Khám phá các sản phẩm linh kiện máy tính chất lượng cao
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ProductFilterSidebar 
              categories={categories}
              brands={brands}
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 p-4 border rounded-lg bg-card">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm trong trang này..."
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
            
            {activeFilterCount > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <h4 className="text-sm font-medium">Đang lọc:</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary">
                  <X className="h-4 w-4 mr-1" />
                  Xóa tất cả
                </Button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
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
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Hiển thị {pagedData?.content.length} / {pagedData?.totalElements} sản phẩm
                </div>
                {pagedData?.content.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">Không tìm thấy sản phẩm nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pagedData?.content.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
                
                <div className="mt-8">
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