import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock } from "lucide-react";
import { websiteConfig } from "@/config/website";
import { LogoMark } from "@/components/Header";

const socialLinks = [
  { href: websiteConfig.socialMedia.facebook, label: "Facebook", Icon: Facebook },
  { href: websiteConfig.socialMedia.instagram, label: "Instagram", Icon: Instagram },
  { href: websiteConfig.socialMedia.youtube, label: "YouTube", Icon: Youtube },
];

const quickLinks = [
  { to: "/products", label: "Sản phẩm" },
  { to: "/categories", label: "Danh mục" },
  { to: "/brands", label: "Thương hiệu" },
  { to: "/about", label: "Về chúng tôi" },
];

const headingClass = "mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";
const linkClass = "text-muted-foreground transition-colors hover:text-foreground";

export const Footer = () => {
  return (
    <footer className="relative mt-auto border-t border-border/70 bg-card/50">
      {/* Đường sáng mảnh ở mép trên, như dải LED chạy dọc mép case */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.7),hsl(var(--plasma)/0.7),transparent)]" />

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          {/* Giới thiệu */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <LogoMark />
              <span className="font-display text-lg font-bold tracking-tight text-foreground">{websiteConfig.storeName}</span>
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {websiteConfig.description}
            </p>
            <div className="flex gap-2">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-field text-muted-foreground transition-all duration-200 hover:border-primary/60 hover:text-primary hover:shadow-glow-sm"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Liên kết */}
          <div>
            <h3 className={headingClass}>Liên kết</h3>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Chính sách */}
          <div>
            <h3 className={headingClass}>Chính sách</h3>
            <ul className="space-y-2.5 text-sm">
              {websiteConfig.policies.map((policy, index) => (
                <li key={index}>
                  <Link to={`/policy/${index}`} className={linkClass}>
                    {policy.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className={headingClass}>Liên hệ</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{websiteConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-mono text-xs">{websiteConfig.contact.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>{websiteConfig.contact.email}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="font-mono text-xs leading-5">
                  T2–T6 {websiteConfig.businessHours.weekdays}
                  <br />
                  T7–CN {websiteConfig.businessHours.weekend}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {websiteConfig.storeName}. Bảo lưu mọi quyền.</p>
          <p className="font-mono">{websiteConfig.tagline}</p>
        </div>
      </div>
    </footer>
  );
};
