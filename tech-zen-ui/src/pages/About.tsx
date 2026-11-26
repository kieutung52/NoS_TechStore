import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Target, Users, GraduationCap } from 'lucide-react';

// Thông tin team members
const teamMembers = [
  {
    id: 1,
    name: 'Kiều Thanh Tùng',
    studentId: '22010214',
    avatar: 'KT',
    role: 'Team Lead',
  },
  {
    id: 2,
    name: 'Hoàng Thị Linh Chi',
    studentId: '22010099',
    avatar: 'LC',
    role: 'Backend Developer',
  },
  {
    id: 3,
    name: 'Vũ Thành Nam',
    studentId: '22010003',
    avatar: 'TN',
    role: 'Frontend Developer',
  },
  {
    id: 4,
    name: 'Nguyễn Hoàng Dương',
    studentId: '22012865',
    avatar: 'HD',
    role: 'Full-stack Developer',
  },
];

const values = [
  {
    Icon: Target,
    title: 'Sứ mệnh',
    text: 'Cung cấp các giải pháp công nghệ và linh kiện PC tốt nhất, giúp khách hàng xây dựng hệ thống mơ ước của họ với giá cả hợp lý và dịch vụ chuyên nghiệp.',
  },
  {
    Icon: ShieldCheck,
    title: 'Giá trị cốt lõi',
    text: 'Chất lượng, Uy tín, Tận tâm. Chúng tôi đặt lợi ích và sự hài lòng của khách hàng lên hàng đầu, cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất.',
  },
  {
    Icon: Users,
    title: 'Đội ngũ',
    text: 'Các chuyên gia đam mê công nghệ, luôn sẵn sàng tư vấn và hỗ trợ bạn 24/7. Chúng tôi không ngừng học hỏi và cải thiện để phục vụ bạn tốt hơn.',
  },
];

const stats = [
  { value: '4', label: 'Thành viên' },
  { value: '100%', label: 'Tận tâm' },
  { value: '24/7', label: 'Hỗ trợ' },
  { value: '∞', label: 'Đam mê' },
];

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow mb-5 animate-rise">Về chúng tôi</p>
              <h1
                className="mb-6 animate-rise text-4xl font-bold leading-[1.05] text-foreground md:text-6xl"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                Về <span className="text-gradient">TechStore</span>
              </h1>
              <p
                className="mx-auto max-w-2xl animate-rise text-lg leading-relaxed text-muted-foreground md:text-xl"
                style={{ "--i": 2 } as React.CSSProperties}
              >
                Chúng tôi là nhà cung cấp linh kiện máy tính hàng đầu, cam kết mang đến sản phẩm chất lượng và dịch vụ uy tín.
                Được phát triển bởi đội ngũ sinh viên đam mê công nghệ.
              </p>
            </div>

            {/* Dải chỉ số: gap-px trên nền viền tạo đường kẻ mảnh giữa các ô */}
            <div
              className="mx-auto mt-14 grid max-w-4xl animate-rise grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow md:grid-cols-4"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card px-4 py-6 text-center">
                  <div className="text-gradient font-display text-3xl font-bold md:text-4xl">{stat.value}</div>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Giá trị */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">Giá trị của chúng tôi</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Những nguyên tắc và cam kết mà chúng tôi luôn tuân thủ
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
              {values.map(({ Icon, title, text }) => (
                <Card key={title} className="transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="p-7">
                    <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold">{title}</h3>
                    <p className="leading-relaxed text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Đội ngũ */}
        <section className="border-y border-border/60 bg-[linear-gradient(180deg,hsl(var(--card)/0.55),hsl(var(--background)/0))] py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">Đội ngũ phát triển</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Gặp gỡ các thành viên đã tạo nên TechStore
              </p>
            </div>
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member, i) => (
                <Card
                  key={member.id}
                  className="group animate-rise transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="relative mb-5">
                      <Avatar className="h-20 w-20 ring-1 ring-primary/40 transition-shadow duration-300 group-hover:shadow-glow-sm">
                        <AvatarFallback className="bg-[linear-gradient(135deg,hsl(var(--primary)/0.35),hsl(var(--plasma)/0.35))] font-display text-xl font-bold text-foreground">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-2 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border border-border bg-popover text-primary">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-foreground">{member.name}</h3>
                    <Badge variant="secondary" className="mb-3 font-mono">{member.studentId}</Badge>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
