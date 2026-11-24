import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingCart, Search, Menu, LogOut, UserRound, Package, ChevronDown, Wallet, LayoutDashboard, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import { websiteConfig } from "@/config/website";
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useWallet } from '@/hooks/useWallet';

const navItems = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/products", label: "Sản phẩm" },
  { to: "/categories", label: "Danh mục" },
  { to: "/brands", label: "Thương hiệu" },
  { to: "/about", label: "Về chúng tôi" },
  { to: "/contact", label: "Liên hệ" },
];

// Logo dạng "die" chip: viền gradient Ion → Plasma bọc lõi tối
export const LogoMark = ({ className = "h-9 w-9" }: { className?: string }) => (
  <span className={`grid shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--plasma)))] p-px shadow-glow-sm ${className}`}>
    <span className="grid h-full w-full place-items-center rounded-[7px] bg-background font-display text-lg font-bold text-foreground">
      T
    </span>
  </span>
);

export const Header = () => {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");

  // Trang Sản phẩm đã có ô tìm kiếm riêng => ẩn ô ở header để hai ô không giành nhau tham số ?search
  const onProductsPage = location.pathname === "/products";

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  const getAvatarFallback = (name: string) => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

  return (
    <header className="glass sticky top-0 z-50 w-full border-b border-border/70">
      <div className="container mx-auto px-4">
        {/* Hàng chính: logo · tìm kiếm · tác vụ */}
        <div className="flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogoMark />
            <div className="hidden leading-tight md:block">
              <span className="block font-display text-lg font-bold tracking-tight text-foreground">{websiteConfig.storeName}</span>
              <span className="block text-[11px] text-muted-foreground">{websiteConfig.tagline}</span>
            </div>
          </Link>

          {onProductsPage ? (
            <div className="hidden flex-1 lg:block" />
          ) : (
            <form role="search" onSubmit={handleSearch} className="mx-auto hidden max-w-xl flex-1 lg:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm CPU, RAM, VGA..."
                  aria-label="Tìm kiếm sản phẩm"
                  className="h-10 rounded-full pl-10"
                />
              </div>
            </form>
          )}

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" asChild>
              <Link to="/products" aria-label="Tìm kiếm sản phẩm">
                <Search className="h-5 w-5" />
              </Link>
            </Button>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="text-primary" />
                      Trang Admin
                    </Link>
                  </Button>
                )}

                {wallet && !isAdmin && (
                  <Link
                    to="/profile"
                    title={`Số dư ví: ${formatCurrency(wallet.balance)}₫`}
                    className="hidden h-9 items-center gap-2 rounded-full border border-border bg-field/70 px-3 font-mono text-xs text-foreground transition-colors hover:border-primary/50 sm:flex"
                  >
                    <Wallet className="h-4 w-4 text-primary" />
                    {formatCurrency(wallet.balance)}₫
                  </Link>
                )}

                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/cart" aria-label="Giỏ hàng">
                    <ShoppingCart className="h-5 w-5" />
                    {cart && cart.totalItems > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--plasma)))] px-1 font-mono text-[10px] font-semibold text-primary-foreground shadow-glow-sm">
                        {cart.totalItems}
                      </span>
                    )}
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-1.5 md:px-2">
                      <Avatar className="h-8 w-8 ring-1 ring-primary/40">
                        <AvatarFallback className="bg-[linear-gradient(135deg,hsl(var(--primary)/0.35),hsl(var(--plasma)/0.35))] font-display text-xs font-semibold text-foreground">
                          {getAvatarFallback(user!.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[10rem] truncate font-medium xl:inline-block">{user!.fullName}</span>
                      <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline-block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <span className="block truncate font-medium">{user!.fullName}</span>
                      <span className="block font-mono text-[11px] text-muted-foreground">Tài khoản</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} className="sm:hidden">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Trang Admin</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <UserRound className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <Package className="mr-2 h-4 w-4" />
                      <span>Đơn hàng</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button size="sm" className="hidden sm:inline-flex" asChild>
                  <Link to="/register">Đăng ký</Link>
                </Button>
              </>
            )}

            {/* Menu di động */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-6" aria-describedby={undefined}>
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-3">
                    <LogoMark className="h-8 w-8" />
                    <span className="font-display">{websiteConfig.storeName}</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className="rounded-md px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        activeClassName="bg-primary/10 text-primary"
                      >
                        {item.label}
                      </NavLink>
                    </SheetClose>
                  ))}
                </nav>
                {!isAuthenticated && (
                  <div className="grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Button variant="outline" asChild>
                        <Link to="/login">Đăng nhập</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild>
                        <Link to="/register">Đăng ký</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
                <a
                  href={`tel:${websiteConfig.contact.phone.replace(/\s/g, "")}`}
                  className="mt-auto flex items-center gap-2 font-mono text-xs text-muted-foreground"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {websiteConfig.contact.phone}
                </a>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Hàng điều hướng: gạch chân phát sáng ở mục đang mở */}
        <nav className="hidden h-11 items-center justify-between border-t border-border/50 text-sm md:flex">
          <div className="flex items-center gap-7">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="relative flex h-11 items-center text-muted-foreground transition-colors hover:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--plasma)))] after:opacity-0 after:transition-opacity after:duration-300"
                activeClassName="font-medium text-foreground after:opacity-100 after:shadow-[0_0_12px_hsl(var(--primary)/0.8)]"
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <a
            href={`tel:${websiteConfig.contact.phone.replace(/\s/g, "")}`}
            className="hidden items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground lg:flex"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            Hotline {websiteConfig.contact.phone}
          </a>
        </nav>
      </div>
    </header>
  );
};
