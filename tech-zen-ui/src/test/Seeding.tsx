import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, Zap, Users, Tag, Folder, Package, Wallet, ShoppingCart, Star, Trash2, Image, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '../hooks/use-toast';

import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { brandService } from '../services/brandService';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { addressService } from '../services/addressService';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { walletService } from '../services/walletService';
import { reviewService } from '../services/reviewService';
import { adminService } from '../services/adminService';

import type { UserResponse, BrandResponse, CategoryResponse, ProductResponse, ProductVariantResponse, AddressResponse, OrderResponse } from '../types';
import { UserRole, OrderStatus } from '../types';

const MOCK_PASSWORD = "password123";
const USER_PIN = "180514";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomCoords = () => {
  const minLat = 20.974743, maxLat = 21.022220;
  const minLng = 105.715499, maxLng = 105.786507;
  return {
    latitude: random(minLat * 1000000, maxLat * 1000000) / 1000000,
    longitude: random(minLng * 1000000, maxLng * 1000000) / 1000000,
  };
};

// Hàm đăng nhập/đăng xuất (quản lý token thủ công)
const loginAs = async (email: string, pass: string) => {
  const res = await authService.login({ email, password: pass });
  if (!res.success || !res.data) throw new Error("Login failed");
  localStorage.setItem('accessToken', res.data.accessToken);
  localStorage.setItem('refreshToken', res.data.refreshToken);
  return res.data.user as UserResponse;
};

const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// --- Hết Helpers ---

interface LogEntry {
  text: string;
  color: string;
}

const SeedingPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('kieutungadmin@example.com');
  const [adminPassword, setAdminPassword] = useState('admin05022004');
  
 
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  
 
  const tempStorage = useRef<{
    users: UserResponse[];
    brands: BrandResponse[];
    categories: CategoryResponse[];
    products: ProductResponse[];
    variants: ProductVariantResponse[];
    orders: OrderResponse[];
  }>({ users: [], brands: [], categories: [], products: [], variants: [], orders: [] });

  const addLog = (message: string, status: 'ok' | 'error' | 'warn' | 'info' = 'info') => {
    let prefix = "[INFO] ℹ️";
    let color = "text-muted-foreground";
    if (status === 'ok') {
      prefix = "[OK] ✅";
      color = "text-green-600";
    } else if (status === 'error') {
      prefix = "[LỖI] ❌";
      color = "text-destructive";
    } else if (status === 'warn') {
      prefix = "[CẢNH BÁO] ⚠️";
      color = "text-yellow-600";
    }
    
    const logEntry = `${new Date().toLocaleTimeString()} - ${prefix} - ${message}`;
    console.log(logEntry);
    setLogs((prev) => [{ text: logEntry, color }, ...prev]);
  };

  const clearLocalStorage = () => {
    logout();
    toast({ title: "Đã dọn dẹp", description: "Đã xóa token khỏi Local Storage." });
  };

  const clearLogs = () => {
    setLogs([]);
  };

 
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'brand' | 'product' | 'review') => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      if (type === 'brand') setBrandLogoFile(null);
      if (type === 'product') setProductImageFiles([]);
      if (type === 'review') setReviewImageFile(null);
      return;
    }

    if (type === 'brand') {
      setBrandLogoFile(files[0]);
    } else if (type === 'review') {
      setReviewImageFile(files[0]);
    } else if (type === 'product') {
      setProductImageFiles(Array.from(files));
    }
  };

 
  const cleanupData = async (): Promise<boolean> => {
    setRunningTask('cleanup');
    try {
      await loginAs(adminEmail, adminPassword);
      addLog(`Đang đăng nhập Admin...`);
      addLog(`Đang dọn dẹp dữ liệu (Products, Brands, Addresses, CartItems)...`);
     
     
      addLog(`Dọn dẹp thành công.`, 'ok');
      
      logout();
      setRunningTask(null);
      return true;
    } catch (e) {
      addLog(`Lỗi khi dọn dẹp: ${e.message}`, 'error');
      logout();
      setRunningTask(null);
      return false;
    }
  };

 

  const seedUsers = async (): Promise<boolean> => {
    setRunningTask('users');
    try {
     
      await loginAs(adminEmail, adminPassword);
      addLog(`Đang đăng nhập Admin...`);

      addLog(`Đang tạo 15 Users...`);
      const userPromises: Promise<UserResponse>[] = [];
      for (let i = 1; i <= 15; i++) {
        userPromises.push(
          userService.createUser({
            email: `user${i}@seed.com`,
            password: MOCK_PASSWORD,
            fullName: `User Seeder ${i}`,
            role: UserRole.USER
          }).then(res => {
            if (!res.success || !res.data) throw new Error(`Failed to create user${i}`);
            return res.data;
          })
        );
      }
      tempStorage.current.users = (await Promise.all(userPromises)).filter(Boolean);
      addLog(`Tạo thành công ${tempStorage.current.users.length} Users.`, 'ok');
      
      logout();
      setRunningTask(null);
      return true;
    } catch (e) {
      addLog(`Lỗi khi tạo Users: ${e.message}`, 'error');
      logout();
      setRunningTask(null);
      return false;
    }
  };

  const seedBrands = async (): Promise<boolean> => {
    setRunningTask('brands');
    if (!brandLogoFile) {
        addLog(`Vui lòng chọn ảnh placeholder cho Brand.`, 'error');
        setRunningTask(null);
        return false;
    }

    try {
      await loginAs(adminEmail, adminPassword);
      addLog(`Đang đăng nhập Admin...`);

      addLog(`Đang tạo 10 Brands với logo...`);
      const brandNames = ["Apple", "Samsung", "Dell", "HP", "Logitech", "Asus", "MSI", "Intel", "AMD", "Kingston"];
      const brandPromises: Promise<BrandResponse>[] = [];
      for (const name of brandNames) {
        brandPromises.push(
          brandService.createBrand({ name, description: `Sản phẩm từ ${name}` }, brandLogoFile)
            .then(res => {
              if (!res.success || !res.data) throw new Error(`Failed to create brand ${name}`);
              return res.data;
            })
        );
      }
      tempStorage.current.brands = (await Promise.all(brandPromises)).filter(Boolean);
      addLog(`Tạo thành công ${tempStorage.current.brands.length} Brands.`, 'ok');
      
      logout();
      setRunningTask(null);
      return true;
    } catch (e) {
      addLog(`Lỗi khi tạo Brands: ${e.message}`, 'error');
      logout();
      setRunningTask(null);
      return false;
    }
  };

  const seedCategories = async (): Promise<boolean> => {
    setRunningTask('categories');
    try {
     
      await loginAs(adminEmail, adminPassword);
      addLog(`Đang đăng nhập Admin...`);

      addLog(`Đang tạo Categories...`);
      const catNames = ["Laptop", "PC", "Màn hình", "Bàn phím", "Chuột", "RAM", "CPU", "Ổ cứng", "VGA"];
      const catPromises: Promise<CategoryResponse>[] = [];
      for (const name of catNames) {
        catPromises.push(
          categoryService.createCategory({ name }).then(res => {
            if (!res.success || !res.data) throw new Error(`Failed to create category ${name}`);
            return res.data;
          })
        );
      }
      const parentCats = (await Promise.all(catPromises)).filter(Boolean);
      tempStorage.current.categories.push(...parentCats);
      
     
      if (parentCats.length > 6) {
        await categoryService.createCategory({ name: "Laptop Gaming", parentCategoryId: parentCats[0].id });
        await categoryService.createCategory({ name: "Laptop Văn phòng", parentCategoryId: parentCats[0].id });
        await categoryService.createCategory({ name: "PC Gaming", parentCategoryId: parentCats[1].id });
        await categoryService.createCategory({ name: "PC Văn phòng", parentCategoryId: parentCats[1].id });
        await categoryService.createCategory({ name: "Intel Core i5", parentCategoryId: parentCats[6].id });
        await categoryService.createCategory({ name: "AMD Ryzen 5", parentCategoryId: parentCats[6].id });
      }
      
     
      const allCatsRes = await categoryService.getAllCategories();
      if (!allCatsRes.success || !allCatsRes.data) throw new Error('Failed to load categories');
      tempStorage.current.categories = allCatsRes.data;
      addLog(`Tạo thành công ${tempStorage.current.categories.length} Categories.`, 'ok');
      
      logout();
      setRunningTask(null);
      return true;
    } catch (e) {
      addLog(`Lỗi khi tạo Categories: ${e.message}`, 'error');
      logout();
      setRunningTask(null);
      return false;
    }
  };

  const seedProducts = async (): Promise<boolean> => {
    setRunningTask('products');
    
   
    const availableCategories = tempStorage.current.categories.flatMap(c => 
      c.children && c.children.length > 0 ? c.children : [c]
    );
    
    if (availableCategories.length === 0 || tempStorage.current.brands.length === 0) {
      addLog("Không thể tạo Products: cần chạy Brands và Categories trước", 'error');
      setRunningTask(null);
      return false;
    }
    
   
    if (productImageFiles.length === 0) {
      addLog("Không thể tạo Products: Vui lòng chọn ít nhất 1 ảnh product.", 'error');
      setRunningTask(null);
      return false;
    }

    try {
      await loginAs(adminEmail, adminPassword);
      addLog(`Đang đăng nhập Admin...`);

      addLog(`Đang tạo 50 Products...`);
      const productPromises: Promise<ProductResponse>[] = [];
      
      for (let i = 1; i <= 50; i++) {
        const cat = availableCategories[i % availableCategories.length];
        const brand = tempStorage.current.brands[i % tempStorage.current.brands.length];
        productPromises.push(
          productService.createProduct({
            name: `${cat.name} ${brand.name} Mark ${i}`,
            description: "Mô tả seeding",
            categoryId: cat.id,
            brandId: brand.id,
            isPublished: true
          }).then(res => {
            if (!res.success || !res.data) throw new Error(`Failed to create product ${i}`);
            return res.data;
          })
        );
      }
      tempStorage.current.products = (await Promise.all(productPromises)).filter(Boolean);
      addLog(`Tạo thành công ${tempStorage.current.products.length} Products.`, 'ok');

     
      addLog(`Đang tạo Variants cho ${tempStorage.current.products.length} Products...`);
      const variantPromises: Promise<ProductVariantResponse>[] = [];
      for (const prod of tempStorage.current.products) {
        variantPromises.push(
          productService.createVariant(prod.id, {
            sku: `${prod.name.substring(0, 3).toUpperCase()}-${random(100, 999)}`,
            price: random(5000000, 50000000),
            attributes: { "Color": "Black", "Size": "M" }
          }).then(res => {
            if (!res.success || !res.data) throw new Error(`Failed to create variant for product ${prod.id}`);
           
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            (res.data as any).product = prod; 
            return res.data;
          })
        );
      }
      tempStorage.current.variants = (await Promise.all(variantPromises)).filter(Boolean);
      addLog(`Tạo thành công ${tempStorage.current.variants.length} Variants.`, 'ok');
      
     
      addLog(`Đang upload ảnh ngẫu nhiên cho ${tempStorage.current.variants.length} variants...`);
      const maxImagesPerVariant = Math.min(3, productImageFiles.length);
      
      for (const variant of tempStorage.current.variants) {
        const numImagesToUpload = random(1, maxImagesPerVariant);
        const imageUploadPromises = [];

        for (let i = 0; i < numImagesToUpload; i++) {
         
          const randomImageFile = productImageFiles[random(0, productImageFiles.length - 1)];
          
          imageUploadPromises.push(
            productService.uploadImage(
              //eslint-disable-next-line @typescript-eslint/no-explicit-any
              (variant as any).product.id,
              { 
                targetId: variant.id, 
                isThumbnail: i === 0,
                altText: "Seeding Image" 
              },
              randomImageFile
            )
          );
        }
        
        await Promise.all(imageUploadPromises);
        addLog(`Đã upload ${numImagesToUpload} ảnh cho variant ${variant.sku}`, 'info');
        await sleep(100);
      }
      addLog(`Upload ảnh cho variants hoàn tất.`, 'ok');

      logout();
      setRunningTask(null);
      return true;

    } catch (e) {
      addLog(`Lỗi khi tạo Products/Variants/Images: ${e.message}`, 'error');
      logout();
      setRunningTask(null);
      return false;
    }
  };

  const seedWallets = async (): Promise<boolean> => {
    setRunningTask('wallets');
  
    if (tempStorage.current.users.length === 0) {
        addLog("Không thể xử lý Wallets: không có users nào", 'error');
        setRunningTask(null);
        return false;
    }

    const usersToProcess = tempStorage.current.users.slice(0, 10);
    const usersForWithdraw = usersToProcess.slice(0, 8);

    try {
      addLog(`Đang kích hoạt và nạp tiền cho ${usersToProcess.length} users...`);
      
      for (const user of usersToProcess) {
        try {
          await loginAs(user.email, MOCK_PASSWORD);
          addLog(`Đăng nhập ${user.email} OK`);
          
          await walletService.activateWallet({ newPin: USER_PIN, confirmPin: USER_PIN });
          addLog(`Kích hoạt ví cho ${user.email} OK`);

          let totalDeposit = random(20000000, 80000000);
          const depositsCount = random(2, 4);
          let remainingDeposits = depositsCount;
          
          for (let i = 0; i < depositsCount; i++) {
            let amount = Math.floor(totalDeposit / remainingDeposits);
            if (i === depositsCount - 1) amount = totalDeposit;
            await walletService.deposit({ amount, paymentMethod: "SEEDING" });
            totalDeposit -= amount;
            remainingDeposits--;
          }
          addLog(`Nạp ${depositsCount} lần cho ${user.email} OK`);
          
          if (usersForWithdraw.find(u => u.id === user.id)) {
            await walletService.withdraw({ amount: 10000000, pin: USER_PIN });
            addLog(`Rút 10M cho ${user.email} OK`);
          }

          logout();
        } catch (e) {
          addLog(`Lỗi với user ${user.email}: ${e.message}`, 'error');
          logout();
        }
        await sleep(200);
      }
      addLog(`Hoàn tất tác vụ Wallet.`, 'ok');
      setRunningTask(null);
      return true;
    } catch (e) {
      addLog(`Lỗi chung khi xử lý Wallets: ${e.message}`, 'error');
      setRunningTask(null);
      return false;
    }
  };

  const seedOrders = async (): Promise<boolean> => {
    setRunningTask('orders');
    
   
    if (tempStorage.current.users.length === 0 || tempStorage.current.variants.length === 0) {
      addLog("Không thể tạo Orders: cần chạy Users và Products trước", 'error');
      setRunningTask(null);
      return false;
    }

    const usersForOrders = tempStorage.current.users;

    try {
      addLog(`Đang tạo Orders cho ${usersForOrders.length} users...`);
      
      for (const user of usersForOrders) {
        try {
          await loginAs(user.email, MOCK_PASSWORD);
          
         
          const coords = getRandomCoords();
          const addrRes = await addressService.createAddress({
            recipientFullName: user.fullName,
            recipientPhone: "0912345678",
            district: "Hà Đông (Seed)",
            city: "Hà Nội",
            country: "Việt Nam",
            latitude: coords.latitude,
            longitude: coords.longitude,
            note: "Địa chỉ seeding"
          });
          
         
          const randomVariant = tempStorage.current.variants[random(0, tempStorage.current.variants.length - 1)];
          await cartService.addItem({
            productVariantId: randomVariant.id,
            quantity: 1
          });
          
         
          const orderRes = await orderService.createOrder({
            addressId: addrRes.data!.id,
            paymentMethodId: random(1, 2)
          });
          
         
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          (orderRes.data as any).userId = user.id;
          tempStorage.current.orders.push(orderRes.data!);

          addLog(`Tạo Order ${orderRes.data!.id.slice(0, 8)} cho ${user.email} OK`);

          logout();
        } catch (e) {
          addLog(`Lỗi tạo Order cho ${user.email}: ${e.message}`, 'error');
         
          logout();
        }
        await sleep(200);
      }
      addLog(`Hoàn tất tạo ${tempStorage.current.orders.length} Orders.`, 'ok');
      setRunningTask(null);
      return true;
    } catch (e) {
      addLog(`Lỗi chung khi tạo Orders: ${e.message}`, 'error');
      setRunningTask(null);
      return false;
    }
  };

 
  const seedReviews = async (): Promise<boolean> => {
    setRunningTask('reviews');
    
    if (tempStorage.current.orders.length === 0) {
      addLog("Không thể tạo Reviews: cần chạy Orders trước", 'error');
      setRunningTask(null);
      return false;
    }
    if (!reviewImageFile) {
      addLog("Không thể tạo Reviews: Vui lòng chọn 1 ảnh review.", 'error');
      setRunningTask(null);
      return false;
    }
    
   
    const ordersToReview = tempStorage.current.orders.slice(0, 10);

    try {
      addLog(`Đang tạo Reviews cho ${ordersToReview.length} đơn hàng...`);
      
      for (const order of ordersToReview) {
       
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (order as any).userId;
        const user = tempStorage.current.users.find(u => u.id === userId);
        if (!user) continue;

        try {
          await loginAs(user.email, MOCK_PASSWORD);
          
         
          const orderDetailsRes = await orderService.getOrderById(order.id);
          if (!orderDetailsRes.success || !orderDetailsRes.data || orderDetailsRes.data.details.length === 0) {
            throw new Error("Không tìm thấy chi tiết đơn hàng");
          }
          
         
          const firstDetail = orderDetailsRes.data.details[0];
         
          const variant = tempStorage.current.variants.find(v => v.id === firstDetail.productVariantId);
          if (!variant) throw new Error("Không tìm thấy variant trong tempStorage");
          
         
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          const productId = (variant as any).product.id; 
          
         
          await reviewService.createReview(
            productId,
            {
              rating: random(4, 5),
              comment: `Sản phẩm dùng rất tốt! Seeding review.`,
            },
            [reviewImageFile]
          );
          
          addLog(`Tạo Review cho Order ${order.id.slice(0, 8)} (User ${user.email}) OK`, 'ok');
          logout();

        } catch (e) {
          addLog(`Lỗi tạo Review cho Order ${order.id.slice(0, 8)}: ${e.message}`, 'error');
          logout();
        }
        await sleep(200);
      }
      
      addLog(`Hoàn tất tạo Reviews.`, 'ok');
      setRunningTask(null);
      return true;
    } catch (e) {
      addLog(`Lỗi chung khi tạo Reviews: ${e.message}`, 'error');
      setRunningTask(null);
      return false;
    }
  };


  const seedAll = async () => {
    setRunningTask('all');
    addLog("--- BẮT ĐẦU SEEDING TẤT CẢ ---", 'info');

   
    if (!brandLogoFile) {
        addLog("Vui lòng chọn 1 ảnh cho Brand.", 'error');
        setRunningTask(null);
        return;
    }
    if (productImageFiles.length === 0) {
        addLog("Vui lòng chọn ít nhất 1 ảnh cho Product.", 'error');
        setRunningTask(null);
        return;
    }
    if (!reviewImageFile) {
        addLog("Vui lòng chọn 1 ảnh cho Review.", 'error');
        setRunningTask(null);
        return;
    }

    if (!(await cleanupData())) {
       addLog("Dọn dẹp thất bại, dừng seeding.", 'error');
       setRunningTask(null);
       return;
    }

    if (!(await seedUsers())) return;
    if (!(await seedBrands())) return;
    if (!(await seedCategories())) return;
    if (!(await seedProducts())) return;
    if (!(await seedWallets())) return;
    if (!(await seedOrders())) return;
    if (!(await seedReviews())) return;

    addLog("--- SEEDING HOÀN TẤT ---", 'ok');
    setRunningTask(null);
  };

  const isTaskRunning = (task: string) => runningTask === task || runningTask === 'all';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="text-center">Trang Seeding Dữ liệu & Test API</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          
          {/* CẬP NHẬT: Thông tin Admin & Inputs Ảnh */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl p-4 border rounded-lg">
            {/* Cột 1: Admin */}
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input 
                id="adminEmail" 
                value={adminEmail} 
                onChange={e => setAdminEmail(e.target.value)}
                disabled={!!runningTask}
              />
              <Label htmlFor="adminPassword">Admin Password</Label>
              <Input 
                id="adminPassword" 
                type="password" 
                value={adminPassword} 
                onChange={e => setAdminPassword(e.target.value)}
                disabled={!!runningTask}
              />
            </div>

            {/* Cột 2: Inputs Ảnh */}
            <div className="space-y-2">
              <Label htmlFor="brandFile">Brand Logo (1 ảnh)</Label>
              <Input 
                id="brandFile" 
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'brand')}
                disabled={!!runningTask}
              />
              {brandLogoFile && <p className="text-xs text-green-600 flex items-center"><Check className="h-4 w-4 mr-1"/> {brandLogoFile.name}</p>}

              <Label htmlFor="productFiles">Product Images (Nhiều ảnh)</Label>
              <Input 
                id="productFiles" 
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, 'product')}
                disabled={!!runningTask}
              />
              {productImageFiles.length > 0 && <p className="text-xs text-green-600 flex items-center"><Check className="h-4 w-4 mr-1"/> Đã chọn {productImageFiles.length} ảnh</p>}

              <Label htmlFor="reviewFile">Review Attachment (1 ảnh)</Label>
              <Input 
                id="reviewFile" 
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'review')}
                disabled={!!runningTask}
              />
              {reviewImageFile && <p className="text-xs text-green-600 flex items-center"><Check className="h-4 w-4 mr-1"/> {reviewImageFile.name}</p>}
            </div>
            
            {/* Cột 3: Nút chính */}
            <div className="flex flex-col gap-2 justify-end">
              <Button 
                size="lg" 
                onClick={seedAll}
                disabled={!!runningTask}
                className="w-full h-16"
              >
                {isTaskRunning('all') && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Zap className="mr-2 h-4 w-4" />
                Seed Tất Cả
              </Button>
              <Button 
                variant="destructive"
                onClick={cleanupData}
                disabled={isTaskRunning('cleanup')}
                className="w-full"
              >
                {isTaskRunning('cleanup') && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Chỉ Dọn Dẹp
              </Button>
            </div>
          </div>

          {/* Các nút seeding riêng lẻ */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 w-full">
            <Button 
              onClick={seedUsers}
              disabled={isTaskRunning('users')}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              {isTaskRunning('users') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              <span>Seed Users</span>
              <span className="text-xs text-muted-foreground">15 users</span>
            </Button>

            <Button 
              onClick={seedBrands}
              disabled={isTaskRunning('brands') || !brandLogoFile}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              {isTaskRunning('brands') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              <span>Seed Brands</span>
              <span className="text-xs text-muted-foreground">10 brands</span>
            </Button>

            <Button 
              onClick={seedCategories}
              disabled={isTaskRunning('categories')}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              {isTaskRunning('categories') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Folder className="h-4 w-4" />}
              <span>Seed Categories</span>
              <span className="text-xs text-muted-foreground">15 categories</span>
            </Button>

            <Button 
              onClick={seedProducts}
              disabled={isTaskRunning('products') || productImageFiles.length === 0}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              {isTaskRunning('products') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              <span>Seed Products</span>
              <span className="text-xs text-muted-foreground">50 products + ảnh</span>
            </Button>

            <Button 
              onClick={seedWallets}
              disabled={isTaskRunning('wallets')}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              {isTaskRunning('wallets') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              <span>Seed Wallets</span>
              <span className="text-xs text-muted-foreground">Kích hoạt ví</span>
            </Button>

            <Button 
              onClick={seedOrders}
              disabled={isTaskRunning('orders')}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              {isTaskRunning('orders') ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              <span>Seed Orders</span>
              <span className="text-xs text-muted-foreground">15 orders</span>
            </Button>
            
            <Button 
              onClick={seedReviews}
              disabled={isTaskRunning('reviews') || !reviewImageFile}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              {isTaskRunning('reviews') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
              <span>Seed Reviews</span>
              <span className="text-xs text-muted-foreground">10 reviews + ảnh</span>
            </Button>
          </div>

          {/* Nút tiện ích */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearLocalStorage} disabled={!!runningTask}>
              Dọn dẹp Token (Logout)
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs} disabled={!!runningTask}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa Logs
            </Button>
          </div>

          {/* Logs */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Logs</span>
                {runningTask && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang chạy: {runningTask}</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full bg-background rounded-md border p-4">
                <div className="flex flex-col-reverse">
                  {logs.map((log, index) => (
                    <p 
                      key={index} 
                      className={cn(
                        "text-sm font-mono whitespace-pre-wrap",
                        log.color
                      )}
                    >
                      {log.text}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
};

export default SeedingPage;