import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button'; 
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'; 
import { Input } from '../../components/ui/input'; 
import { Label } from '../../components/ui/label'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'; 
import { Switch } from '../../components/ui/switch'; 
import { toast } from '../../hooks/use-toast'; 
import { userService } from '../../services/userService'; 
import type { UserResponse, CreateUserRequest, UpdateUserRequest } from '../../types'; 
import { UserRole } from '../../types'; 
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'; 
import { format } from 'date-fns'; 

const UserForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [user, setUser] = useState<Partial<UserResponse>>({});
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  
  const fetchUser = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const res = await userService.getUserById(userId);
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (error) {
      toast({ title: "Lỗi", description: error.message || "Không tìm thấy người dùng", variant: "destructive" });
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isEditing && id) {
      fetchUser(id);
    }
  }, [id, isEditing, fetchUser]); 
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEditing) {
        const updateRequest: UpdateUserRequest = {
          fullName: user.fullName,
          dateOfBirth: user.dateOfBirth || undefined,
          active: user.active,
          role: user.role,
        };
        await userService.updateUser(id!, updateRequest);
        toast({ title: "Thành công", description: "Đã cập nhật người dùng" });
      } else {
        if (!user.email || !password || !user.fullName) {
          throw new Error("Email, Mật khẩu và Họ tên là bắt buộc");
        }
        const createRequest: CreateUserRequest = {
          email: user.email!,
          password: password,
          fullName: user.fullName!,
          dateOfBirth: user.dateOfBirth || undefined,
          role: user.role || UserRole.USER
        };
        await userService.createUser(createRequest);
        toast({ title: "Thành công", description: "Đã tạo người dùng" });
      }
      navigate('/admin/users');
    } catch (error) {
      toast({ title: "Lỗi", description: error.message || "Thao tác thất bại", variant: "destructive" });
      setLoading(false);
    }
  };
  
  const handleChange = (field: string, value: string | number | boolean | UserRole) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };
  
  
  const formattedDateOfBirth = user.dateOfBirth ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd') : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
            </h1>
            <p className="text-muted-foreground">{isEditing ? user.email : 'Tạo tài khoản mới'}</p>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isEditing}
              required
            />
          </div>
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
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
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              value={user.fullName || ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formattedDateOfBirth} 
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              value={user.role}
              onValueChange={(value: UserRole) => handleChange('role', value)}
              required
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.USER}>Người dùng</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Trạng thái (Khóa/Mở)</Label>
            <Switch
              id="isActive"
              checked={user.active ?? true}
              onCheckedChange={(checked) => handleChange('active', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default UserForm;