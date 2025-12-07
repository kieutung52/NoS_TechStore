import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { toast } from '../hooks/use-toast';
import { User, Wallet, MapPin, Settings, LogOut, Edit, Trash2, Plus, CreditCard, History, KeyRound, Save, Loader2, Calendar, Mail } from 'lucide-react';
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
import { format } from 'date-fns';

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
        <CardTitle>Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div className="flex gap-2">
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
            <Button onClick={() => setIsEditing(true)}>
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
          <CardTitle>Kích hoạt ví</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Bạn cần tạo mã PIN 6 số để kích hoạt ví.</p>
          <div className="space-y-2">
            <Label htmlFor="pin">Mã PIN (6 số)</Label>
            <Input id="pin" type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Xác nhận Mã PIN</Label>
            <Input id="confirmPin" type="password" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
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
        <CardTitle>Ví điện tử</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 rounded-lg">
          <div className="text-sm opacity-90 mb-2">Số dư khả dụng</div>
          <div className="text-3xl font-bold">{wallet.balance.toLocaleString('vi-VN')}₫</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => navigate('/wallet/deposit')}><CreditCard className="mr-2 h-4 w-4" /> Nạp tiền</Button>
          <Button variant="outline"><History className="mr-2 h-4 w-4" /> Lịch sử giao dịch</Button>
        </div>
        <Separator />
        <h4 className="font-semibold">Giao dịch gần đây</h4>
        <div className="space-y-2">
          {transactions.length > 0 ? transactions.map(tx => (
            <div key={tx.id} className="flex justify-between items-center text-sm">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleString('vi-VN')}</p>
              </div>
              <span className={tx.amount > 0 ? 'text-green-600' : 'text-destructive'}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}₫
              </span>
            </div>
          )) : <p className="text-sm text-muted-foreground">Không có giao dịch nào.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Component Tab Address ---
const AddressTab = () => {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<AddressResponse | null>(null);

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Địa chỉ giao hàng</CardTitle>
          {/* TODO: Thêm logic mở modal/trang tạo địa chỉ */}
          <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Thêm địa chỉ mới</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <Skeleton className="h-20 w-full" />}
          {!loading && addresses.length === 0 && (
            <p className="text-muted-foreground">Bạn chưa có địa chỉ giao hàng nào.</p>
          )}
          {addresses.map(addr => (
            <Card key={addr.id} className={addr.isDefault ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold">{addr.recipientFullName}</span>
                    {addr.isDefault && <Badge className="ml-2">Mặc định</Badge>}
                    <p className="text-sm text-muted-foreground">{addr.recipientPhone}</p>
                    <p className="text-sm text-muted-foreground">{`${addr.note || ''} ${addr.district}, ${addr.city}, ${addr.country}`}</p>
                  </div>
                  <div className="flex gap-1">
                    {/* TODO: Thêm logic mở modal/trang sửa địa chỉ */}
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setAddressToDelete(addr); setShowDeleteDialog(true); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {!addr.isDefault && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => handleSetDefault(addr.id)}>
                    Đặt làm mặc định
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
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
        <CardTitle>Cài đặt tài khoản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-semibold">Mật khẩu</h3>
          <p className="text-sm text-muted-foreground">Đặt lại mật khẩu của bạn.</p>
          <Button variant="outline" onClick={() => navigate('/forgot-password')}>
            <KeyRound className="mr-2 h-4 w-4" />
            Đổi mật khẩu
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="font-semibold">Đăng xuất</h3>
          <p className="text-sm text-muted-foreground">Đăng xuất khỏi tài khoản của bạn trên thiết bị này.</p>
          <Button variant="destructive" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Component Chính ---
const Profile = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Tài khoản của tôi</h1>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Hồ sơ</TabsTrigger>
              <TabsTrigger value="wallet"><Wallet className="h-4 w-4 mr-2" />Ví</TabsTrigger>
              <TabsTrigger value="addresses"><MapPin className="h-4 w-4 mr-2" />Địa chỉ</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Cài đặt</TabsTrigger>
            </TabsList>

            <TabsContent value="profile"><ProfileTab /></TabsContent>
            <TabsContent value="wallet"><WalletTab /></TabsContent>
            <TabsContent value="addresses"><AddressTab /></TabsContent>
            <TabsContent value="settings"><SettingsTab /></TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;