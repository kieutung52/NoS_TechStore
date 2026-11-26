import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button, buttonVariants } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { toast } from '../hooks/use-toast';
import { User, Wallet, MapPin, Settings, LogOut, Edit, Trash2, Plus, CreditCard, History, KeyRound, Save, Loader2, Calendar, Mail, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { cn } from '../lib/utils';
import { userService } from '../services/userService';
import { addressService } from '../services/addressService';
import { walletService } from '../services/walletService';
import type { AddressResponse, UpdateProfileRequest, ActivateWalletRequest, WalletTransactionResponse } from '../types';
import { Skeleton } from '../components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AddressFormDialog } from '../components/AddressFormDialog';
import { format } from 'date-fns';

// Một dòng giao dịch ví: tiền vào xanh, tiền ra đỏ
const TransactionRow = ({ tx }: { tx: WalletTransactionResponse }) => {
  const incoming = tx.amount > 0;
  return (
    <li className="flex items-center gap-3 py-3 text-sm first:pt-0 last:pb-0">
      <span className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
        incoming ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"
      )}>
        {incoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{tx.description}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{new Date(tx.transactionDate).toLocaleString('vi-VN')}</p>
      </div>
      <span className={cn("font-mono text-sm tabular-nums", incoming ? 'text-success' : 'text-destructive')}>
        {incoming ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}₫
      </span>
    </li>
  );
};

const HISTORY_PAGE_SIZE = 10;

// Toàn bộ lịch sử giao dịch ví, tải thêm theo trang
const TransactionHistoryDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const [items, setItems] = useState<WalletTransactionResponse[]>([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await walletService.getTransactions(p, HISTORY_PAGE_SIZE);
      if (res.success && res.data) {
        const data = res.data;
        setItems(prev => (p === 0 ? data.content : [...prev, ...data.content]));
        setPage(p);
        setLast(data.last);
        setTotal(data.totalElements);
      }
    } catch (error) {
      toast({ title: "Không tải được lịch sử giao dịch", description: (error as Error).message, variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) loadPage(0);
  }, [open, loadPage]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Lịch sử giao dịch</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {total > 0 ? `${items.length}/${total} giao dịch` : 'Nạp, rút, thanh toán và hoàn tiền của ví'}
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {items.length === 0 && loading && <Skeleton className="h-40 w-full" />}
          {items.length === 0 && !loading && <p className="py-6 text-center text-sm text-muted-foreground">Không có giao dịch nào.</p>}
          <ul className="divide-y divide-border">
            {items.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
          </ul>
          {!last && (
            <Button variant="outline" className="mt-4 w-full" onClick={() => loadPage(page + 1)} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tải thêm
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProfileTab = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    fullName: user?.fullName || '',
    dateOfBirth: user?.dateOfBirth || '',
  });

  useEffect(() => {
    setFormData({
      fullName: user?.fullName || '',
      dateOfBirth: user?.dateOfBirth || '',
    });
  }, [user]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await userService.updateProfile(formData);
      if (res.success) {
        await refreshUser();
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin của bạn đã được cập nhật.",
        });
        setIsEditing(false);
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            disabled={!isEditing}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user?.email || ''} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Ngày sinh</Label>
          <Input
            id="dateOfBirth"
            type="date"
           
            value={formData.dateOfBirth ? format(new Date(formData.dateOfBirth), 'yyyy-MM-dd') : ''}
            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
            disabled={!isEditing}
          />
        </div>
        <div className="flex gap-2 border-t border-border pt-5">
          {isEditing ? (
            <>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Component Tab Wallet ---
const WalletTab = () => {
  const navigate = useNavigate();
  const { wallet, refreshWallet } = useWallet();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await walletService.getTransactions(0, 5);
      if (res.success && res.data) {
        setTransactions(res.data.content);
      }
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    }
  }, []);

  useEffect(() => {
   
    if (wallet?.pinSet) {
      fetchTransactions();
    }
  }, [wallet, fetchTransactions]);

  const handleActivate = async () => {
    if (pin !== confirmPin) {
      toast({ title: "Lỗi", description: "Mã PIN xác nhận không khớp", variant: "destructive" });
      return;
    }
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      toast({ title: "Lỗi", description: "Mã PIN phải là 6 chữ số", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const request: ActivateWalletRequest = { newPin: pin, confirmPin: confirmPin };
      const res = await walletService.activateWallet(request);
      if (res.success) {
        toast({ title: "Thành công", description: "Đã kích hoạt ví!" });
        await refreshWallet();
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (!wallet) {
    return <Card><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>;
  }

 
  if (!wallet.pinSet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kích hoạt ví</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Bạn cần tạo mã PIN 6 số để kích hoạt ví.</p>
          <div className="space-y-2">
            <Label htmlFor="pin">Mã PIN (6 số)</Label>
            <Input id="pin" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} className="max-w-[12rem] font-mono tracking-[0.4em]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Xác nhận Mã PIN</Label>
            <Input id="confirmPin" type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} className="max-w-[12rem] font-mono tracking-[0.4em]" />
          </div>
          <Button onClick={handleActivate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Đang kích hoạt..." : "Kích hoạt"}
          </Button>
        </CardContent>
      </Card>
    );
  }

 
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ví điện tử</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Thẻ số dư: viền gradient Ion → Plasma, như một tấm thẻ phát sáng */}
        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-[linear-gradient(135deg,hsl(var(--primary)/0.22),hsl(var(--plasma)/0.18)_60%,hsl(var(--card)))] p-6 shadow-glow-sm">
          <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,hsl(var(--plasma)/0.35),transparent)] blur-xl" />
          <div className="relative">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-foreground/70">
              <span>Số dư khả dụng</span>
              <Wallet className="h-4 w-4" />
            </div>
            <div className="mt-3 font-display text-4xl font-semibold tabular-nums tracking-tight">
              {wallet.balance.toLocaleString('vi-VN')}
              <span className="ml-1 text-xl text-foreground/60">₫</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="glow" onClick={() => navigate('/wallet/deposit')}><CreditCard className="mr-2 h-4 w-4" /> Nạp tiền</Button>
          <Button variant="outline" onClick={() => setHistoryOpen(true)}><History className="mr-2 h-4 w-4" /> Lịch sử giao dịch</Button>
        </div>
        <Separator />
        <h4 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Giao dịch gần đây</h4>
        <ul className="divide-y divide-border">
          {transactions.length > 0
            ? transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)
            : <li className="text-sm text-muted-foreground">Không có giao dịch nào.</li>}
        </ul>
      </CardContent>
      <TransactionHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </Card>
  );
};

// --- Component Tab Address ---
const AddressTab = () => {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<AddressResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<AddressResponse | null>(null);
  const { user } = useAuth();

  const openForm = (addr: AddressResponse | null) => {
    setAddressToEdit(addr);
    setFormOpen(true);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await addressService.getAddresses();
      if (res.success && res.data) setAddresses(res.data);
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!addressToDelete) return;
    try {
      const res = await addressService.deleteAddress(addressToDelete.id);
      if (res.success) {
        toast({ title: "Thành công", description: "Đã xóa địa chỉ." });
        await fetchData();
      } else throw new Error(res.message);
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
    setShowDeleteDialog(false);
    setAddressToDelete(null);
  };
  
  const handleSetDefault = async (id: number) => {
    try {
      const res = await addressService.setDefaultAddress(id);
      if (res.success) {
        toast({ title: "Thành công", description: "Đã đặt làm mặc định." });
        await fetchData();
      } else throw new Error(res.message);
    } catch (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Địa chỉ giao hàng</CardTitle>
          <Button size="sm" variant="outline" onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Thêm địa chỉ mới</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <Skeleton className="h-20 w-full" />}
          {!loading && addresses.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-10 text-center">
              <MapPin className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">Bạn chưa có địa chỉ giao hàng nào.</p>
            </div>
          )}
          {addresses.map(addr => (
            <Card
              key={addr.id}
              className={cn(
                "bg-field/40 shadow-none",
                addr.isDefault && "border-primary/50 bg-primary/5 shadow-[inset_2px_0_0_hsl(var(--primary))]"
              )}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{addr.recipientFullName}</span>
                      {addr.isDefault && <Badge>Mặc định</Badge>}
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{addr.recipientPhone}</p>
                    <p className="text-sm text-muted-foreground">{`${addr.note || ''} ${addr.district}, ${addr.city}, ${addr.country}`}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Sửa địa chỉ" onClick={() => openForm(addr)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" aria-label="Xóa địa chỉ" onClick={() => { setAddressToDelete(addr); setShowDeleteDialog(true); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {!addr.isDefault && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => handleSetDefault(addr.id)}>
                    Đặt làm mặc định
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <AddressFormDialog
        open={formOpen}
        address={addressToEdit}
        defaultFullName={user?.fullName}
        onOpenChange={setFormOpen}
        onSaved={fetchData}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa địa chỉ này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// --- Component Tab Settings ---
const SettingsTab = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cài đặt tài khoản</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-sans font-semibold">Mật khẩu</h3>
              <p className="text-sm text-muted-foreground">Đặt lại mật khẩu của bạn.</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/forgot-password')}>
            Đổi mật khẩu
          </Button>
        </div>

        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
              <LogOut className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-sans font-semibold">Đăng xuất</h3>
              <p className="text-sm text-muted-foreground">Đăng xuất khỏi tài khoản của bạn trên thiết bị này.</p>
            </div>
          </div>
          <Button variant="destructive" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Component Chính ---
const tabItems = [
  { value: "profile", label: "Hồ sơ", Icon: User },
  { value: "wallet", label: "Ví", Icon: Wallet },
  { value: "addresses", label: "Địa chỉ", Icon: MapPin },
  { value: "settings", label: "Cài đặt", Icon: Settings },
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-8 text-3xl font-bold md:text-4xl">Tài khoản của tôi</h1>

          {/* Desktop: danh mục tab dọc bên trái kèm thẻ người dùng; mobile: tab ngang */}
          <Tabs defaultValue="profile" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_1fr]">
            <div className="space-y-3 lg:sticky lg:top-32">
              {user && (
                <Card className="hidden lg:block">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-11 w-11 ring-1 ring-primary/40">
                      <AvatarFallback className="bg-[linear-gradient(135deg,hsl(var(--primary)/0.35),hsl(var(--plasma)/0.35))] font-display text-sm font-semibold text-foreground">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{user.fullName}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <TabsList className="grid h-auto w-full grid-cols-4 lg:flex lg:flex-col lg:items-stretch lg:gap-1 lg:bg-card lg:p-2">
                {tabItems.map(({ value, label, Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="gap-2 lg:justify-start lg:px-3 lg:py-2.5 lg:data-[state=active]:bg-primary/10 lg:data-[state=active]:text-primary lg:data-[state=active]:shadow-[inset_2px_0_0_hsl(var(--primary))]"
                  >
                    <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="min-w-0">
              <TabsContent value="profile" className="mt-0"><ProfileTab /></TabsContent>
              <TabsContent value="wallet" className="mt-0"><WalletTab /></TabsContent>
              <TabsContent value="addresses" className="mt-0"><AddressTab /></TabsContent>
              <TabsContent value="settings" className="mt-0"><SettingsTab /></TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
