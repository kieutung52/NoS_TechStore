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
import { cn } from '../lib/utils';

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

      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-6 text-muted-foreground"
          >
            <ArrowLeft />
            Quay lại
          </Button>

          <Card className="relative overflow-hidden shadow-lg">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)),hsl(var(--plasma)),transparent)]" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-glow-sm">
                  <Wallet className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Nạp tiền vào ví</CardTitle>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-field/60 px-4 py-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Số dư hiện tại</p>
                <p className="font-display text-2xl font-semibold tabular-nums">
                  {wallet?.balance.toLocaleString('vi-VN')}
                  <span className="ml-0.5 text-base text-muted-foreground">₫</span>
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Số tiền nạp</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    placeholder="Nhập số tiền"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 pr-10 font-mono text-lg [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">₫</span>
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Chọn nhanh</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {quickAmounts.map((amt) => {
                    const selected = amount === amt.toString();
                    return (
                      <button
                        key={amt}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setAmount(amt.toString())}
                        className={cn(
                          "rounded-lg border px-3 py-3 font-mono text-sm tabular-nums transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "border-primary bg-primary/10 text-primary shadow-glow-sm"
                            : "border-input bg-card/40 hover:border-primary/60 hover:bg-primary/5"
                        )}
                      >
                        {amt.toLocaleString('vi-VN')}₫
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleDeposit}
                variant="glow"
                className="w-full"
                size="lg"
                disabled={loading || !amount}
              >
                {loading && <Loader2 className="animate-spin" />}
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
