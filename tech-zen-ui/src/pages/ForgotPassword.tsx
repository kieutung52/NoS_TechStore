import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/button';
import { CardContent, CardFooter } from '../components/ui/card';
import { AuthShell } from '../components/AuthShell';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { OtpType } from '../types';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
     
      const res = await authService.forgotPassword({ email });
      if (res.success) {
        toast({
          title: "Đã gửi OTP",
          description: "Vui lòng kiểm tra email để lấy mã OTP.",
        });
       
        try {
          localStorage.setItem('tempForgotEmail', email);
        } catch (err) {
          console.warn('Could not set tempForgotEmail in localStorage', err);
        }
       
        navigate(`/validate-otp?email=${encodeURIComponent(email)}&type=${OtpType.FORGOT_PASSWORD}`);
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi OTP. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <AuthShell
      icon={KeyRound}
      title="Quên mật khẩu"
      description={<>Nhập email của bạn để nhận mã OTP</>}
    >
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại Đăng nhập
            </Link>
          </Button>
        </CardFooter>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;