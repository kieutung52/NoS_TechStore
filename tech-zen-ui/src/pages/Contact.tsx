import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapComponent } from '@/components/MapComponent';
import { websiteConfig } from '@/config/website';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const mapMarkers = [
    {
      lat: websiteConfig.contact.coordinates.lat,
      lng: websiteConfig.contact.coordinates.lng,
      label: "TechStore - Cửa hàng",
      popupContent: `<b>TechStore</b><br/>${websiteConfig.contact.address}`
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Map Section */}
        <section className="h-[400px] w-full">
          <MapComponent
            center={[websiteConfig.contact.coordinates.lat, websiteConfig.contact.coordinates.lng]}
            zoom={30}
            markers={mapMarkers}
            className="h-full w-full z-10"
          />
        </section>

        {/* Contact Info & Form Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Info */}
              <div className="space-y-6">
                <h1 className="text-4xl font-bold text-primary">Liên hệ</h1>
                <p className="text-lg text-muted-foreground">
                  Chúng tôi luôn sẵn sàng lắng nghe bạn. Vui lòng liên hệ qua thông tin bên dưới hoặc gửi biểu mẫu.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Địa chỉ</h3>
                      <p className="text-muted-foreground">{websiteConfig.contact.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Email</h3>
                      <p className="text-muted-foreground">{websiteConfig.contact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Điện thoại</h3>
                      <p className="text-muted-foreground">{websiteConfig.contact.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Form */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Gửi tin nhắn cho chúng tôi</CardTitle>
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
                        Gửi tin nhắn <Send className="h-4 w-4 ml-2" />
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