import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WalletProvider } from "./contexts/WalletContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import WalletDeposit from "./pages/WalletDeposit";
import NotFound from "./pages/NotFound";
import Brands from "./pages/Brands";
import About from "./pages/About";
import Contact from "./pages/Contact";
import UserOrderDetail from "./pages/OrderDetail";

// === TÍNH NĂNG MỚI (Thêm 3 file) ===
import ForgotPassword from "./pages/ForgotPassword";
import ValidateOtp from "./pages/ValidateOtp";
import ResetPassword from "./pages/ResetPassword";

import SeedingPage from "./test/Seeding";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductsManagement from "./pages/admin/ProductsManagement";
import ProductForm from "./pages/admin/ProductForm";
import OrdersManagement from "./pages/admin/OrdersManagement";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import UsersManagement from "./pages/admin/UsersManagement";
import UserForm from "./pages/admin/UserForm";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import BrandsManagement from "./pages/admin/BrandsManagement";
import BrandForm from "./pages/admin/BrandForm";
import PaymentMethodsManagement from "./pages/admin/PaymentMethodsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WalletProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/test" element={<SeedingPage />} />

                {/* === TÍNH NĂNG MỚI (Routes) === */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/validate-otp" element={<ValidateOtp />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                {/* Protected Routes (User) */}
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><UserOrderDetail /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/wallet/deposit" element={<ProtectedRoute><WalletDeposit /></ProtectedRoute>} />

                {/* Protected Routes (Admin) */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<ProductsManagement />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id" element={<ProductForm />} />
                  <Route path="orders" element={<OrdersManagement />} />
                  <Route path="orders/:id" element={<AdminOrderDetail />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="users/new" element={<UserForm />} />
                  <Route path="users/:id" element={<UserForm />} />
                  <Route path="categories" element={<CategoriesManagement />} />
                  <Route path="brands" element={<BrandsManagement />} />
                  <Route path="brands/new" element={<BrandForm />} />
                  <Route path="brands/:id" element={<BrandForm />} />
                  <Route path="payment-methods" element={<PaymentMethodsManagement />} />
                </Route>

                {/* Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </WalletProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;