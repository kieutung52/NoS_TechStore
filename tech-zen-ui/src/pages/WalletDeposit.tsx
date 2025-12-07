import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useWallet } from '../hooks/useWallet';
import { toast } from '../hooks/use-toast';
import { Wallet, ArrowLeft, Loader2 } from 'lucide-react';
import type { DepositRequest } from '../types';

const WalletDeposit = () => {
  const navigate = useNavigate();
  const { wallet, deposit } = useWallet(); 
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const handleDeposit = async () => {
   
    const depositAmount = parseInt(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: "Số tiền không hợp lệ",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
   
    const request: DepositRequest = {
      amount: depositAmount,
      paymentMethod: 'VNPAY'
    };
    
    const success = await deposit(request);
    setLoading(false);
    
    if (success) {
      setAmount('');
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profile')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Nạp tiền vào ví</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Số dư hiện tại: {wallet?.balance.toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Số tiền nạp</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Nhập số tiền"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-3 block">Chọn nhanh</Label>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map((amt) => (
                    <Button
                      key={amt}
                      variant={amount === amt.toString() ? "default" : "outline"}
                     
                      onClick={() => setAmount(amt.toString())}
                      className="h-auto py-3"
                    >
                      {amt.toLocaleString('vi-VN')}₫
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleDeposit} 
                className="w-full" 
                size="lg"
                disabled={loading || !amount}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {/* SỬA: Dùng parseInt */}
                {loading ? 'Đang xử lý...' : `Nạp ${amount ? parseInt(amount).toLocaleString('vi-VN') : '0'}₫`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WalletDeposit;