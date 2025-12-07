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
import { Wallet, Package, AlertCircle, MapPin, Plus, Loader2, Badge } from 'lucide-react';
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
        
        
        
      }

      

      const response = await orderService.createOrder({
        addressId: finalAddressId,
        paymentMethodId: paymentMethodId,
        note: showNewAddressForm ? addressFormData.note : addresses.find(a => a.id === finalAddressId)?.note,
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cột trái: Thông tin */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin giao hàng</CardTitle>
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
                      <div key={addr.id} className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} />
                        <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
                          <div className="font-semibold">{addr.recipientFullName} {addr.isDefault && <Badge className="ml-2">Mặc định</Badge>}</div>
                          <p className="text-sm text-muted-foreground">{addr.recipientPhone}</p>
                          <p className="text-sm text-muted-foreground">{`${addr.note || ''} ${addr.district}, ${addr.city}`}</p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* NÚT THÊM ĐỊA CHỈ MỚI */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowNewAddressForm(true);
                      setSelectedAddressId(null);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm địa chỉ mới
                  </Button>

                  {/* FORM ĐỊA CHỈ MỚI (ẨN/HIỆN) */}
                  {showNewAddressForm && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Tìm kiếm địa chỉ (Demo)</Label>
                        <AddressSearch onAddressSelect={handleAddressSelect} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                          <Label htmlFor="recipientFullName">Họ và tên</Label>
                          <Input id="recipientFullName" value={addressFormData.recipientFullName} onChange={handleFormChange} required={showNewAddressForm} />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <Label htmlFor="recipientPhone">Số điện thoại</Label>
                          <Input id="recipientPhone" type="tel" value={addressFormData.recipientPhone} onChange={handleFormChange} required={showNewAddressForm} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="district">Quận/Huyện</Label>
                          <Input id="district" value={addressFormData.district} onChange={handleFormChange} required={showNewAddressForm} />
                        </div>
                        <div>
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
                  <CardTitle>Phương thức thanh toán</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethodId.toString()} onValueChange={(val) => setPaymentMethodId(parseInt(val))}>
                    {paymentMethods.map(pm => (
                      <div key={pm.id} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value={pm.id.toString()} id={`pm-${pm.id}`} />
                        <Label htmlFor={`pm-${pm.id}`} className="flex items-center gap-3 cursor-pointer flex-1">
                          <pm.icon className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-semibold">{pm.methodName}</div>
                            {pm.id === 2 && (
                              <div className="text-sm text-muted-foreground">
                                Số dư: {wallet?.balance.toLocaleString('vi-VN')}₫
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                    {isWalletPayment && (
                      <div className="space-y-2 pl-4 pt-4 border-t">
                        <Label htmlFor="pin">Mã PIN (6 số)</Label>
                        <Input
                          id="pin"
                          type="password"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="••••••"
                          maxLength={6}
                        />
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Cột phải: Tóm tắt */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {cart.items.map((item) => (
                      <div key={item.productVariantId} className="flex justify-between text-sm">
                        <span className="flex-1 pr-2">
                          {item.productName} (x{item.quantity})
                        </span>
                        <span className="font-medium">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính</span>
                      <span>{totalAmount.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phí vận chuyển</span>
                      {/* BE hard-code 5.00 */}
                      <span className="font-medium">{Number(5).toLocaleString('vi-VN')}₫</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng</span>
                    {/* BE tự cộng shippingFee */}
                    <span className="text-primary">{(totalAmount + 5).toLocaleString('vi-VN')}₫</span>
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

                  <Button type="submit" className="w-full" size="lg" disabled={loading || insufficientFunds}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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