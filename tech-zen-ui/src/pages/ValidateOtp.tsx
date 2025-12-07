import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { OtpType } from '@/types';

const ValidateOtp = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const typeParam = searchParams.get('type');
  const type = typeParam === 'FORGOT_PASSWORD' ? OtpType.FORGOT_PASSWORD : OtpType.REGISTER;

  const queryEmail = searchParams.get('email');
  const email = queryEmail ?? (type === OtpType.REGISTER ? localStorage.getItem('tempRegisterEmail') : localStorage.getItem('tempForgotEmail'));

  
  useEffect(() => {
    if (!email) {
      toast({ title: "Lỗi", description: "Không tìm thấy email để xác thực.", variant: "destructive" });
      navigate(type === OtpType.REGISTER ? '/register' : '/forgot-password');
    }
  }, [email, navigate, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.trim();
    if (code.length < 6) {
      toast({ title: "Lỗi", description: "OTP phải đủ 6 số", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const payload = { code, email: email!, type };
      console.log('Validate OTP payload:', payload);
      const res = await authService.validateOtp(payload);
      console.log('Validate OTP response:', res);

      if (res.success) {
        if (type === OtpType.REGISTER) {
          localStorage.removeItem('tempRegisterEmail');
          toast({
            title: "Xác thực thành công!",
            description: "Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập.",
          });
          navigate('/login');
        } else if (type === OtpType.FORGOT_PASSWORD) {
          
          toast({
            title: "Xác thực thành công!",
            description: "Vui lòng nhập mật khẩu mới của bạn.",
          });
          navigate(`/reset-password`);
        }
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Mã OTP không chính xác. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Xác thực OTP</CardTitle>
          <CardDescription className="text-center">
            Mã OTP (6 số) đã được gửi đến: <br /> <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 flex flex-col items-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Đang xác thực...' : 'Xác thực'}
            </Button>

            <Button variant="ghost" className="w-full" asChild>
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại Đăng nhập
              </Link>
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default ValidateOtp;