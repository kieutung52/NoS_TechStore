import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Target, Users, GraduationCap, Sparkles } from 'lucide-react';

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

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5OTk5OTkiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Về TechStore
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Chúng tôi là nhà cung cấp linh kiện máy tính hàng đầu, cam kết mang đến sản phẩm chất lượng và dịch vụ uy tín. 
                Được phát triển bởi đội ngũ sinh viên đam mê công nghệ.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Giá trị của chúng tôi</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Những nguyên tắc và cam kết mà chúng tôi luôn tuân thủ
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Sứ mệnh</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Cung cấp các giải pháp công nghệ và linh kiện PC tốt nhất, giúp khách hàng xây dựng hệ thống mơ ước của họ với giá cả hợp lý và dịch vụ chuyên nghiệp.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Giá trị cốt lõi</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Chất lượng, Uy tín, Tận tâm. Chúng tôi đặt lợi ích và sự hài lòng của khách hàng lên hàng đầu, cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Đội ngũ</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Các chuyên gia đam mê công nghệ, luôn sẵn sàng tư vấn và hỗ trợ bạn 24/7. Chúng tôi không ngừng học hỏi và cải thiện để phục vụ bạn tốt hơn.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Team Section */}
        <section className="py-16 md:py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Đội ngũ phát triển</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Gặp gỡ các thành viên đã tạo nên TechStore
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {teamMembers.map((member) => (
                <Card 
                  key={member.id} 
                  className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      <div className="relative mb-4">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <AvatarImage 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0071C5&color=fff&size=128&bold=true`} 
                            alt={member.name}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                          <div className="bg-primary rounded-full p-1.5 shadow-md">
                            <GraduationCap className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Name */}
                      <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      
                      {/* Student ID Badge */}
                      <Badge variant="secondary" className="mb-3 font-mono text-xs">
                        {member.studentId}
                      </Badge>
                      
                      {/* Role */}
                      <p className="text-sm text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <Card className="text-center border-2">
                <CardContent className="p-6">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">4</div>
                  <p className="text-sm text-muted-foreground">Thành viên</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2">
                <CardContent className="p-6">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
                  <p className="text-sm text-muted-foreground">Tận tâm</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2">
                <CardContent className="p-6">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Hỗ trợ</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2">
                <CardContent className="p-6">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">∞</div>
                  <p className="text-sm text-muted-foreground">Đam mê</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;