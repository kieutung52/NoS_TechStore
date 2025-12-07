import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

import { orderService } from '../../services/orderService';
import type { OrderResponse } from '../../types';
import { Package, ShoppingCart, Users, DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts'; 
import { OrderStatusBadge } from '../../lib/badgeUtils';
import { toast } from '../../hooks/use-toast';


const MOCK_REVENUE_DATA = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    revenue: Math.floor(Math.random() * (15000000 - 5000000) + 5000000), 
    orders: Math.floor(Math.random() * (20 - 5) + 5), 
  };
});

const MOCK_CATEGORY_DATA = [
  { name: 'CPU', value: 35 },
  { name: 'VGA', value: 25 },
  { name: 'RAM', value: 20 },
  { name: 'Mainboard', value: 15 },
  { name: 'Khác', value: 5 },
];
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  
  const stats = {
    todayRevenue: 12500000,
    todayOrders: 18,
    activeUsers: 1240,
    totalBalance: 45000000
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      
      
      const ordersRes = await orderService.getAdminOrders({ page: 0, size: 5 });
      
      if (ordersRes.success && ordersRes.data) {
        setRecentOrders(ordersRes.data.content);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ title: "Lỗi tải dữ liệu", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return value.toLocaleString('vi-VN');
  }

  const statCards = [
    { title: 'Doanh thu hôm nay', value: `${formatCurrency(stats.todayRevenue)}₫`, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'Đơn hàng hôm nay', value: stats.todayOrders, icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'User kích hoạt', value: stats.activeUsers, icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { title: 'Tổng số dư ví', value: `${formatCurrency(stats.totalBalance)}₫`, icon: CreditCard, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động kinh doanh (Dữ liệu mô phỏng)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* Biểu đồ Doanh thu & Đơn hàng (Area Chart) */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary"/> Doanh thu 7 ngày qua
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" fontSize={12} stroke="#888888" />
                <YAxis fontSize={12} stroke="#888888" tickFormatter={(val) => `${val/1000000}M`} />
                <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString('vi-VN')}₫`, 'Doanh thu']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}
                />
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ Tỷ trọng Danh mục (Pie Chart) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary"/> Tỷ trọng bán hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={MOCK_CATEGORY_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                    >
                        {MOCK_CATEGORY_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Đơn hàng gần đây */}
      <Card>
        <CardHeader>
          <CardTitle>Đơn hàng mới nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 && <p className="text-muted-foreground text-center py-4">Chưa có đơn hàng nào.</p>}
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">Đơn hàng #{String(order.id).slice(0, 8)}...</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatCurrency(order.totalAmount)}₫</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;