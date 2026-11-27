import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tags,
  Bookmark,
  CreditCard,
  LogOut,
  Menu,
  X,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { Button, buttonVariants } from '../../components/ui/button';
import { LogoMark } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

// Menu chia theo việc của người quản trị, không theo thứ tự bảng dữ liệu
const navGroups: { label: string; items: NavItem[] }[] = [
  { label: 'Tổng quan', items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/admin' }] },
  {
    label: 'Bán hàng',
    items: [
      { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/orders' },
      { icon: CreditCard, label: 'Thanh toán', path: '/admin/payment-methods' },
    ],
  },
  {
    label: 'Hàng hoá',
    items: [
      { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
      { icon: Tags, label: 'Danh mục', path: '/admin/categories' },
      { icon: Bookmark, label: 'Thương hiệu', path: '/admin/brands' },
    ],
  },
  { label: 'Khách hàng', items: [{ icon: Users, label: 'Người dùng', path: '/admin/users' }] },
];

const isActivePath = (pathname: string, path: string) =>
  path === '/admin' ? pathname === '/admin' : pathname === path || pathname.startsWith(`${path}/`);

const initialsOf = (name?: string) => {
  const parts = (name || 'Admin').trim().split(/\s+/);
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = navGroups.flatMap((g) => g.items).find((item) => isActivePath(location.pathname, item.path));

  // Đổi trang thì đóng menu mobile; Esc cũng đóng
  useEffect(() => setSidebarOpen(false), [location.pathname]);
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Sidebar: drawer trên mobile, cột dính trên desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-out',
          'lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
        aria-label="Menu quản trị"
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
          <LogoMark className="h-8 w-8" />
          <div className="min-w-0 leading-tight">
            <p className="font-display text-sm font-bold text-foreground">TechStore</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Admin console</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 lg:hidden"
            aria-label="Đóng menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ icon: Icon, label, path }) => {
                  const active = isActivePath(location.pathname, path);
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                          active
                            ? 'bg-sidebar-accent text-foreground'
                            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-foreground'
                        )}
                      >
                        {/* Đèn LED trạng thái của mục đang mở, như đèn trên khay server */}
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                          />
                        )}
                        <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : '')} />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--plasma)))] font-display text-xs font-bold text-primary-foreground">
              {initialsOf(user?.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.fullName || 'Quản trị viên'}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Đăng xuất" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Mở menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">
            <span className="hidden sm:inline">Admin</span>
            <span className="mx-2 hidden text-border sm:inline">/</span>
            <span className="text-foreground">{current?.label ?? 'Quản trị'}</span>
          </p>
          <Link to="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'ml-auto')}>
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Xem cửa hàng</span>
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
