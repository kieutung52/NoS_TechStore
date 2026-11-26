import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from '../components/Header';

const NotFound = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const homePath = isAdmin ? "/admin" : "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <Link to={homePath} className="mb-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Về trang chủ">
        <LogoMark />
      </Link>

      <div className="relative isolate animate-rise">
        <div
          aria-hidden="true"
          className="absolute -inset-10 -z-10 bg-[radial-gradient(closest-side,hsl(var(--plasma)/0.22),transparent)] blur-2xl"
        />
        <p className="text-gradient font-display text-[7rem] font-bold leading-none tracking-tight md:text-[9rem]">404</p>
      </div>

      <h1 className="mt-4 animate-rise text-2xl font-bold md:text-3xl" style={{ "--i": 1 } as React.CSSProperties}>
        Ối! Trang không tồn tại
      </h1>
      <p className="mt-3 max-w-md animate-rise text-muted-foreground" style={{ "--i": 2 } as React.CSSProperties}>
        Có vẻ như đường dẫn bạn đang tìm kiếm không có trên trang web này.
      </p>
      <code
        className="mt-5 max-w-full animate-rise truncate rounded-md border border-border bg-field px-3 py-1.5 font-mono text-xs text-muted-foreground"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        {location.pathname}
      </code>

      <Button asChild size="lg" className="group mt-8 animate-rise" style={{ "--i": 3 } as React.CSSProperties}>
        <Link to={homePath}>
          <ArrowLeft className="transition-transform group-hover:-translate-x-1" />
          Quay về {isAdmin ? 'Bảng điều khiển' : 'Trang chủ'}
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
