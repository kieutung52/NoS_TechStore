import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoMark } from "@/components/Header";
import { websiteConfig } from "@/config/website";

interface AuthShellProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Khung chung cho các trang xác thực (đăng nhập, đăng ký, OTP, quên/đặt lại mật khẩu):
 * logo về trang chủ, card nổi trên quầng sáng, vạch LED ở mép trên.
 */
export const AuthShell = ({ icon: Icon, title, description, children }: AuthShellProps) => (
  // overflow-x-clip: quầng sáng (-inset-16) không được đẩy trang rộng ra trên mobile
  <div className="flex min-h-screen flex-col items-center justify-center overflow-x-clip px-4 py-10">
    <Link
      to="/"
      className="mb-8 flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight text-foreground">{websiteConfig.storeName}</span>
    </Link>

    <div className="relative isolate w-full max-w-md animate-rise">
      <div
        aria-hidden="true"
        className="absolute -inset-16 -z-10 bg-[radial-gradient(closest-side,hsl(var(--primary)/0.16),hsl(var(--plasma)/0.08)_60%,transparent)] blur-2xl"
      />
      <Card className="relative overflow-hidden shadow-xl">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)),hsl(var(--plasma)),transparent)]"
        />
        <CardHeader className="items-center space-y-1.5 pb-4 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-glow-sm">
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardHeader>
        {children}
      </Card>
    </div>

    <p className="mt-8 font-mono text-[11px] text-muted-foreground">
      © {new Date().getFullYear()} {websiteConfig.storeName}
    </p>
  </div>
);
