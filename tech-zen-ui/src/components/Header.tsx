import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ShoppingCart, User, Search, Menu, LogOut, UserRound, Package, ArrowDown, Wallet } from "lucide-react"; 
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { websiteConfig } from "@/config/website";
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useWallet } from '@/hooks/useWallet'; 

export const Header = () => {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const { wallet } = useWallet(); 
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  const getAvatarFallback = (name: string) => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  const formatCurrency = (value: number) => value.toLocaleString('vi-VN');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex h-14 items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>📞 {websiteConfig.contact.phone}</span>
            <span className="hidden md:inline">✉️ {websiteConfig.contact.email}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-sm text-primary hover:underline font-medium">
                    Trang Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Đăng nhập
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link to="/register" className="text-sm text-muted-foreground hover:text-foreground">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Main header */}
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <span className="text-xl font-bold text-primary-foreground">T</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-foreground">{websiteConfig.storeName}</h1>
              <p className="text-xs text-muted-foreground">{websiteConfig.tagline}</p>
            </div>
          </Link>

          {/* Search bar */}
          <div className="hidden flex-1 max-w-xl lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Search className="h-5 w-5" />
            </Button>
            
            {isAuthenticated ? (
              <>
                {/* SỬA: Thêm hiển thị Ví */}
                {wallet && !isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="hidden sm:flex items-center gap-2" 
                    onClick={() => navigate('/profile')}
                    title={`Số dư ví: ${formatCurrency(wallet.balance)}₫`}
                  >
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {formatCurrency(wallet.balance)}₫
                    </span>
                  </Button>
                )}

                {/* Cart Icon */}
                <Button variant="ghost" size="icon" className="relative" asChild>
                  <Link to="/cart">
                    <ShoppingCart className="h-5 w-5" />
                    {cart && cart.totalItems > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {cart.totalItems}
                      </span>
                    )}
                  </Link>
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-1 md:px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://placehold.co/100x100/0071C5/FFFFFF?text=${getAvatarFallback(user!.fullName)}`} alt={user!.fullName} />
                        <AvatarFallback>{getAvatarFallback(user!.fullName)}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline-block font-medium">{user!.fullName}</span>
                      <ArrowDown className="h-4 w-4 text-muted-foreground hidden sm:inline-block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                    <DropdownMenuSeparator />
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
            ) : null}
            
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex h-12 items-center gap-6 text-sm">
          <Link to="/" className="font-medium text-foreground hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <Link to="/products" className="text-muted-foreground hover:text-foreground transition-colors">
            Sản phẩm
          </Link>
          <Link to="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
            Danh mục
          </Link>
          <Link to="/brands" className="text-muted-foreground hover:text-foreground transition-colors">
            Thương hiệu
          </Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
            Về chúng tôi
          </Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Liên hệ
          </Link>
        </nav>
      </div>
    </header>
  );
};