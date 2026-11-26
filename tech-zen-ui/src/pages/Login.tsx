import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; 
import { Button } from '../components/ui/button'; 
import { CardContent, CardFooter } from '../components/ui/card';
import { AuthShell } from '../components/AuthShell'; 
import { Input } from '../components/ui/input'; 
import { Label } from '../components/ui/label'; 
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/authService'; 
import { UserRole } from '../types'; 

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login({ email, password });
    
    if (success) {
      
      
      const user = authService.getCurrentUser(); 
      if (user?.role === UserRole.ADMIN) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
    
    setLoading(false);
  };

  return (
    <AuthShell
      icon={LogIn}
      title="Đăng nhập"
      description={<>Chào mừng trở lại! Vui lòng nhập thông tin.</>}
    >
      
      {/* === ĐÃ XÓA CÁC NÚT LOGIN NHANH === */}

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4 pt-2">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            {/* === THÊM LOGIC ẨN/HIỆN MẬT KHẨU === */}
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
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                tabIndex={-1} 
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {/* === KẾT THÚC LOGIC ẨN/HIỆN === */}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </CardFooter>
      </form>
    </AuthShell>
  );
};

export default Login;