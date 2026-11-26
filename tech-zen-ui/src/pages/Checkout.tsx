import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Separator } from '../components/ui/separator';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { orderService } from '../services/orderService';
import { addressService } from '../services/addressService';
import { toast } from '../hooks/use-toast';
import { Wallet, Package, AlertCircle, MapPin, Plus, Loader2, Check, CreditCard } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AddressSearch } from '../components/AddressSearch';
import { NominatimResult } from '../services/mapService';
import type { AddressResponse, CreateAddressRequest } from '../types';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { wallet, refreshWallet } = useWallet();

  const [loading, setLoading] = useState(false);
  const paymentMethods = [
    { id: 1, methodName: 'Thanh toán khi nhận hàng (COD)', icon: Package },
    { id: 2, methodName: 'Thanh toán bằng ví', icon: Wallet },
  ];
  const [paymentMethodId, setPaymentMethodId] = useState<number>(1);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState<CreateAddressRequest>({
    recipientFullName: user?.fullName || '',
    recipientPhone: '',
    district: '',
    city: 'Hà Nội',
    country: 'Việt Nam',
    note: '',
  });

  
  const fetchAddresses = useCallback(async () => {
    try {
      const res = await addressService.getAddresses();
      if (res.success && res.data) {
        setAddresses(res.data);
        
        const defaultAddress = res.data.find(a => a.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (res.data.length > 0) {
          setSelectedAddressId(res.data[0].id); 
        } else {
          setShowNewAddressForm(true); 
        }
      }
    } catch (e) {
      console.error("Failed to fetch addresses", e);
      setShowNewAddressForm(true);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  if (!cart || cart.items.length === 0) {
    if (!loading) navigate('/cart'); 
    return null;
  }

  const totalAmount = cart.totalAmount;
  const isWalletPayment = paymentMethodId === 2;
  const insufficientFunds = isWalletPayment && (wallet?.balance || 0) < totalAmount;

  
  const handleAddressSelect = (result: NominatimResult) => {
    setAddressFormData(prev => ({
      ...prev,
      district: result.address.city_district || result.address.suburb || '',
      city: result.address.city || 'Hà Nội',
      country: result.address.country || 'Việt Nam',
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      note: result.display_name.split(',').slice(0, 2).join(', '),
    }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    let finalAddressId = selectedAddressId;

    try {
      
      if (showNewAddressForm) {
        
        if (!addressFormData.recipientFullName || !addressFormData.recipientPhone || !addressFormData.district) {
          throw new Error("Vui lòng điền đầy đủ thông tin địa chỉ mới.");
        }
        const newAddrRes = await addressService.createAddress(addressFormData);
        if (newAddrRes.success && newAddrRes.data) {
          finalAddressId = newAddrRes.data.id;
          await fetchAddresses(); 
          setShowNewAddressForm(false);
        } else {
          throw new Error(newAddrRes.message);
        }
      }

      if (!finalAddressId) {
        throw new Error("Vui lòng chọn hoặc tạo một địa chỉ giao hàng.");
      }

      
      if (isWalletPayment) {
        if (insufficientFunds) {
          throw new Error("Số dư ví không đủ để thanh toán.");
        }
        if (!/^\d{6}$/.test(pin)) {
          throw new Error("Vui lòng nhập mã PIN ví (6 chữ số).");
        }
      }

      // BE kiểm PIN khi trả bằng ví; sai PIN trả về "Mã PIN ví không đúng"
      const response = await orderService.createOrder({
        addressId: finalAddressId,
        paymentMethodId: paymentMethodId,
        note: showNewAddressForm ? addressFormData.note : addresses.find(a => a.id === finalAddressId)?.note,
        pin: isWalletPayment ? pin : undefined,
      });

      if (response.success) {
        console.log('[Checkout] Order created successfully');
        
        
        await clearCart();
        
        
        console.log('[Checkout] Fetching latest wallet balance from server...');
        await refreshWallet();
        console.log('[Checkout] Wallet balance updated');
        
        toast({
          title: "Đặt hàng thành công",
          description: "Đơn hàng của bạn đã được tạo.",
        });
        
        
        navigate('/orders');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast({
        title: "Đặt hàng thất bại",
        description: error.message || "Vui lòng thử lại sau",
        variant: "destructive",
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Giỏ hàng', 'Thanh toán', 'Hoàn tất'];
  const currentStep = 1;

  // Ô lựa chọn (địa chỉ, phương thức): sáng viền + vạch Ion bên trái khi được chọn
  const optionClass =
    "flex items-start gap-3 rounded-lg border border-border bg-field/40 p-4 transition-colors hover:border-input hover:bg-accent/40 has-[[data-state=checked]]:border-primary/60 has-[[data-state=checked]]:bg-primary/5 has-[[data-state=checked]]:shadow-[inset_2px_0_0_hsl(var(--primary))]";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-bold md:text-4xl">Thanh toán</h1>
          {/* Các bước mua hàng: thứ tự là thông tin thật nên được đánh số */}
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
            {steps.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border text-[10px]",
                    i < currentStep && "border-success/40 bg-success/15 text-success",
                    i === currentStep && "border-primary bg-primary/15 text-primary shadow-glow-sm",
                    i > currentStep && "border-border text-muted-foreground"
                  )}
                >
                  {i < currentStep ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={i === currentStep ? "text-foreground" : "sr-only text-muted-foreground sm:not-sr-only"}>{step}</span>
                {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-4 bg-border sm:w-6" />}
              </li>
            ))}
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            {/* Cột trái: Thông tin */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Thông tin giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* DANH SÁCH ĐỊA CHỈ ĐÃ LƯU */}
                  <RadioGroup
                    value={selectedAddressId?.toString()}
                    onValueChange={(val) => {
                      setSelectedAddressId(parseInt(val));
                      setShowNewAddressForm(false);
                    }}
                  >
                    {addresses.map(addr => (
                      <div key={addr.id} className={optionClass}>
                        <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} className="mt-0.5" />
                        <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer space-y-1 font-normal">
                          <div className="flex flex-wrap items-center gap-2 font-semibold">
                            {addr.recipientFullName}
                            {addr.isDefault && <Badge>Mặc định</Badge>}
                          </div>
                          <p className="font-mono text-xs text-muted-foreground">{addr.recipientPhone}</p>
                          <p className="text-sm text-muted-foreground">{`${addr.note || ''} ${addr.district}, ${addr.city}`}</p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* NÚT THÊM ĐỊA CHỈ MỚI */}
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "w-full border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      showNewAddressForm && "border-primary/50 text-foreground"
                    )}
                    onClick={() => {
                      setShowNewAddressForm(true);
                      setSelectedAddressId(null);
                    }}
                  >
                    <Plus />
                    Thêm địa chỉ mới
                  </Button>

                  {/* FORM ĐỊA CHỈ MỚI (ẨN/HIỆN) */}
                  {showNewAddressForm && (
                    <div className="space-y-4 rounded-lg border border-border bg-field/40 p-4 duration-300 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label>Tìm kiếm địa chỉ (Demo)</Label>
                        <AddressSearch onAddressSelect={handleAddressSelect} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2 md:col-span-1">
                          <Label htmlFor="recipientFullName">Họ và tên</Label>
                          <Input id="recipientFullName" value={addressFormData.recipientFullName} onChange={handleFormChange} required={showNewAddressForm} />
                        </div>
                        <div className="col-span-2 space-y-2 md:col-span-1">
                          <Label htmlFor="recipientPhone">Số điện thoại</Label>
                          <Input id="recipientPhone" type="tel" value={addressFormData.recipientPhone} onChange={handleFormChange} required={showNewAddressForm} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="district">Quận/Huyện</Label>
                          <Input id="district" value={addressFormData.district} onChange={handleFormChange} required={showNewAddressForm} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Tỉnh/Thành phố</Label>
                          <Input id="city" value={addressFormData.city} onChange={handleFormChange} required={showNewAddressForm} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="note">Địa chỉ cụ thể / Ghi chú (từ địa danh)</Label>
                        <Input id="note" value={addressFormData.note} onChange={handleFormChange} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Phương thức thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethodId.toString()} onValueChange={(val) => setPaymentMethodId(parseInt(val))}>
                    {paymentMethods.map(pm => (
                      <div key={pm.id} className={cn(optionClass, "items-center")}>
                        <RadioGroupItem value={pm.id.toString()} id={`pm-${pm.id}`} />
                        <Label htmlFor={`pm-${pm.id}`} className="flex flex-1 cursor-pointer items-center gap-3 font-normal">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                            <pm.icon className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="font-semibold">{pm.methodName}</div>
                            {pm.id === 2 && (
                              <div className="font-mono text-xs text-muted-foreground">
                                Số dư: {wallet?.balance.toLocaleString('vi-VN')}₫
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                    {isWalletPayment && (
                      <div className="space-y-2 border-t border-border pt-4">
                        <Label htmlFor="pin">Mã PIN (6 số)</Label>
                        <Input
                          id="pin"
                          type="password"
                          inputMode="numeric"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="••••••"
                          maxLength={6}
                          className="max-w-[12rem] font-mono tracking-[0.4em]"
                        />
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Cột phải: Tóm tắt */}
            <div className="lg:sticky lg:top-32 lg:col-span-1">
              <Card className="relative overflow-hidden shadow-lg">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)),hsl(var(--plasma)),transparent)]" />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    Đơn hàng
                    <span className="font-mono text-xs font-normal text-muted-foreground">{cart.totalItems} sản phẩm</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
                    {cart.items.map((item) => (
                      <li key={item.productVariantId} className="flex items-center gap-3 text-sm">
                        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-field">
                          {item.imageUrls[0] ? (
                            <img src={item.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1">{item.productName}</span>
                          <span className="font-mono text-xs text-muted-foreground">x{item.quantity}</span>
                        </span>
                        <span className="font-mono text-xs tabular-nums">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tạm tính</span>
                      <span className="font-mono tabular-nums">{totalAmount.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phí vận chuyển</span>
                      {/* BE hard-code 5.00 */}
                      <span className="font-mono tabular-nums">{Number(5).toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">Tổng cộng</span>
                    {/* BE tự cộng shippingFee */}
                    <span className="font-display text-2xl font-semibold tabular-nums">
                      {(totalAmount + 5).toLocaleString('vi-VN')}
                      <span className="ml-0.5 text-base text-muted-foreground">₫</span>
                    </span>
                  </div>

                  {insufficientFunds && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Số dư ví không đủ. Vui lòng nạp thêm.
                      </AlertDescription>
                    </Alert>
                  )}
                  {error && !insufficientFunds && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" variant="glow" className="w-full" size="lg" disabled={loading || insufficientFunds}>
                    {loading && <Loader2 className="animate-spin" />}
                    {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
