import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { websiteConfig } from "@/config/website";

export const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">{websiteConfig.storeName}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {websiteConfig.description}
            </p>
            <div className="flex gap-3">
              <a
                href={websiteConfig.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={websiteConfig.socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={websiteConfig.socialMedia.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">Liên kết</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/products" className="hover:text-foreground transition-colors">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-foreground transition-colors">
                  Danh mục
                </Link>
              </li>
              <li>
                <Link to="/brands" className="hover:text-foreground transition-colors">
                  Thương hiệu
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">Chính sách</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {websiteConfig.policies.map((policy, index) => (
                <li key={index}>
                  <Link to={`/policy/${index}`} className="hover:text-foreground transition-colors">
                    {policy.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">Liên hệ</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary" />
                <span>{websiteConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <span>{websiteConfig.contact.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <span>{websiteConfig.contact.email}</span>
              </li>
            </ul>
            <div className="mt-4 text-sm">
              <p className="font-medium text-foreground">Giờ làm việc:</p>
              <p className="text-muted-foreground">T2-T6: {websiteConfig.businessHours.weekdays}</p>
              <p className="text-muted-foreground">T7-CN: {websiteConfig.businessHours.weekend}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {websiteConfig.storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
