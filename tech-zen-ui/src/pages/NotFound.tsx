import { Link } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const { isAdmin } = useAuth(); 
  const homePath = isAdmin ? "/admin" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-8">
      <Card className="w-full max-w-md shadow-lg animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-4xl font-bold text-foreground">404</CardTitle>
          <CardDescription className="text-lg">
            Ối! Trang không tồn tại
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Có vẻ như đường dẫn bạn đang tìm kiếm không có trên trang web này.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild className="group">
            {/* Sửa: Dùng Link thay vì <a> để SPA hoạt động */}
            <Link to={homePath} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Quay về {isAdmin ? 'Bảng điều khiển' : 'Trang chủ'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
      {/* Giữ nguyên CSS animation từ file gốc của bạn */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotFound;