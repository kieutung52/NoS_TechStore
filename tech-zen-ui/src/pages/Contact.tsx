import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapComponent } from '@/components/MapComponent';
import { websiteConfig } from '@/config/website';
import { Phone, Mail, MapPin, Send, Clock } from 'lucide-react';

const Contact = () => {
  const mapMarkers = [
    {
      lat: websiteConfig.contact.coordinates.lat,
      lng: websiteConfig.contact.coordinates.lng,
      label: "TechStore - Cửa hàng",
      popupContent: `<b>TechStore</b><br/>${websiteConfig.contact.address}`
    }
  ];

  const contactItems = [
    { Icon: MapPin, label: 'Địa chỉ', value: websiteConfig.contact.address, mono: false },
    { Icon: Mail, label: 'Email', value: websiteConfig.contact.email, mono: false },
    { Icon: Phone, label: 'Điện thoại', value: websiteConfig.contact.phone, mono: true },
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

        {/* Thông tin & biểu mẫu */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <p className="eyebrow">Hỗ trợ khách hàng</p>
                <h1 className="text-4xl font-bold md:text-5xl">Liên hệ</h1>
                <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Chúng tôi luôn sẵn sàng lắng nghe bạn. Vui lòng liên hệ qua thông tin bên dưới hoặc gửi biểu mẫu.
                </p>

                <ul className="space-y-3">
                  {contactItems.map(({ Icon, label, value, mono }) => (
                    <li key={label} className="flex items-start gap-4 rounded-xl border border-border bg-card/60 p-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</h3>
                        <p className={mono ? "mt-1 font-mono text-sm text-foreground" : "mt-1 text-foreground"}>{value}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Card className="relative overflow-hidden shadow-lg">
                  <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)),hsl(var(--plasma)),transparent)]" />
                  <CardHeader>
                    <CardTitle className="text-xl">Gửi tin nhắn cho chúng tôi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên</Label>
                        <Input id="name" placeholder="Nguyễn Văn A" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="email@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Nội dung</Label>
                        <Textarea id="message" placeholder="Tin nhắn của bạn..." rows={5} />
                      </div>
                      <Button type="submit" className="w-full" size="lg">
                        Gửi tin nhắn <Send />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
