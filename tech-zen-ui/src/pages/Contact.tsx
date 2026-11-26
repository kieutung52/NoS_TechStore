import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MapComponent } from '@/components/MapComponent';
import { websiteConfig } from '@/config/website';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const Contact = () => {
  const mapMarkers = [
    {
      lat: websiteConfig.contact.coordinates.lat,
      lng: websiteConfig.contact.coordinates.lng,
      label: "TechStore - Cửa hàng",
      popupContent: `<b>TechStore</b><br/>${websiteConfig.contact.address}`
    }
  ];

  // Không có form: email/điện thoại là liên kết mở thẳng ứng dụng mail/gọi điện
  const contactItems = [
    { Icon: MapPin, label: 'Địa chỉ', value: websiteConfig.contact.address, mono: false },
    { Icon: Mail, label: 'Email', value: websiteConfig.contact.email, mono: false, href: `mailto:${websiteConfig.contact.email}` },
    {
      Icon: Phone,
      label: 'Điện thoại',
      value: websiteConfig.contact.phone,
      mono: true,
      href: `tel:${websiteConfig.contact.phone.replace(/\s/g, '')}`,
    },
    {
      Icon: Clock,
      label: 'Giờ làm việc',
      value: `T2–T6 ${websiteConfig.businessHours.weekdays} · T7–CN ${websiteConfig.businessHours.weekend}`,
      mono: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Bản đồ; isolate giữ z-index của Leaflet bên dưới header dính */}
        <section className="isolate h-[360px] w-full border-b border-border">
          <MapComponent
            center={[websiteConfig.contact.coordinates.lat, websiteConfig.contact.coordinates.lng]}
            zoom={17}
            markers={mapMarkers}
            className="h-full w-full"
          />
        </section>

        {/* Thông tin liên hệ */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl space-y-4">
              <p className="eyebrow">Hỗ trợ khách hàng</p>
              <h1 className="text-4xl font-bold md:text-5xl">Liên hệ</h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Chúng tôi luôn sẵn sàng lắng nghe bạn. Gọi hotline, gửi email hoặc ghé cửa hàng theo thông tin bên dưới.
              </p>
            </div>

            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {contactItems.map(({ Icon, label, value, mono, href }) => (
                <li key={label} className="flex items-start gap-4 rounded-xl border border-border bg-card/60 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</h3>
                    {href ? (
                      <a
                        href={href}
                        className={`mt-1 block break-words text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline ${mono ? 'font-mono text-sm' : ''}`}
                      >
                        {value}
                      </a>
                    ) : (
                      <p className={mono ? "mt-1 font-mono text-sm text-foreground" : "mt-1 text-foreground"}>{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
