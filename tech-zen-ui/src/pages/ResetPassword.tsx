import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { KeyRound, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const email = searchParams.get('email');

 
  useEffect(() => {
    if (!email) {
      toast({ title: "Lỗi", description: "Phiên đặt lại mật khẩu không hợp lệ.", variant: "destructive" });
      navigate('/login');
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({ title: "Lỗi", description: "Mật khẩu phải có ít nhất 6 ký tự.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Lỗi", description: "Mật khẩu xác nhận không khớp.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    
    try {
     
      const res = await authService.resetPassword({
        email: email!,
        newPassword: password,
      });

      if (res.success) {
        toast({
          title: "Thành công!",
          description: "Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập.",
        });
        navigate('/login');
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đặt lại mật khẩu.",
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
              <KeyRound className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-center">
            Nhập mật khẩu mới cho tài khoản: {email}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
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

export default ResetPassword;