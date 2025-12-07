//==========================================
//1. COMMON TYPES & ALIASES
//==========================================

export type BigDecimal = number;
export type UUID = string;
export type ISODateTime = string;
export type ISODate = string;


export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  status: string | number;
  timestamp: ISODateTime;
}


export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

//==========================================
//2. ENUMS (Khớp 1:1)
//==========================================

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum OtpType {
  REGISTER = 'REGISTER',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  VERIFICATION = 'VERIFICATION',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

//==========================================
//3. RESPONSE DTOs (Khớp 1:1 với ResponseDto.java)
//==========================================

//--- Auth & User Responses ---

export interface IntrospectResponse {
  valid: boolean;
}


export interface WalletSummaryResponse {
  id: UUID;
  balance: BigDecimal;
  isActive: boolean;
  pinSet: boolean;
}


export interface UserResponse {
  id: UUID;
  email: string;
  fullName: string;
  dateOfBirth: ISODate;
  role: UserRole;
  active: boolean;
  wallet: WalletSummaryResponse;
}


export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;

  user: Partial<UserResponse>;
}

//--- Wallet Responses ---


export interface WalletTransactionResponse {
  id: UUID;
  type: TransactionType;
  status: TransactionStatus;
  orderId?: UUID;
  transactionDate: ISODateTime;
  description: string;
  amount: BigDecimal;
}


export interface WalletResponse {
  id: UUID;
  balance: BigDecimal;
  isActive: boolean;
  pinSet: boolean;
  recentTransactions: WalletTransactionResponse[];
}

//--- Address Responses ---


export interface AddressResponse {
  id: number;
  recipientFullName: string;
  recipientPhone: string;
  district: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  isDefault: boolean;
}

//--- Product, Category, Brand Responses ---


export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  cloudinaryPublicId: string;
  isThumbnail: boolean;
  altText?: string;
}


export interface ProductVariantResponse {
  id: UUID;
  sku: string;
  price?: BigDecimal;
  attributes: Record<string, string>;
  images: ProductImageResponse[];
  stock: number;
}


export interface ReviewResponse {
  id: number;
  userId: UUID;
  userName: string;
  rating: number;
  comment?: string;
  attachmentUrls: string[];
  createdAt: ISODateTime;
}


export interface ProductSummaryResponse {
  id: UUID;
  name: string;
  price?: BigDecimal;
  averageRating: number;
  thumbnailUrl?: string;
}


export interface ProductResponse {
  id: UUID;
  name: string;
  description?: string;
  categoryId: number;
  brandId: number;
  quantityInStock: number;
  quantitySales: number;
  isPublished: boolean;
  averageRating: number;
  variants: ProductVariantResponse[];
  recentReviews: ReviewResponse[];
}


export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  parentCategoryId?: number;
  children: CategoryResponse[];
  products: ProductSummaryResponse[];
}


export interface BrandResponse {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  products: ProductSummaryResponse[];
}

//--- Cart Responses ---


export interface CartItemResponse {
  productVariantId: UUID;
  productName: string;
  price?: BigDecimal;
  quantity: number;
  addedAt: ISODateTime;
  imageUrls: string[];
}


export interface CartResponse {
  id: UUID;
  items: CartItemResponse[];
  totalAmount: BigDecimal;
  totalItems: number;
}

//--- Order Responses ---


export interface PaymentMethodResponse {
  id: number;
  methodName: string;
  description?: string;
  isActive?: boolean;
  active?: boolean; // Backend returns 'active'
}


export interface OrderDetailResponse {
  id: number;
  productVariantId: UUID;
  productName: string;
  quantity: number;
  priceEach?: BigDecimal;
  review?: ReviewResponse;
}


export interface OrderResponse {
  id: UUID;
  userId: UUID;
  addressId: number;
  paymentMethodId: number;
  totalAmount: BigDecimal;
  shippingFee: BigDecimal;
  status: OrderStatus;
  orderDate: ISODateTime;
  dueDate?: ISODateTime;
  shippedDate?: ISODateTime;
  trackingNumber?: string;
  estimatedDeliveryDate?: ISODateTime;
  latitude?: number;
  longitude?: number;
  details: OrderDetailResponse[];
}

//--- Analytics Responses ---


export interface ReportDailyResponse {
  reportDate: ISODate;
  totalRevenue: BigDecimal;
  totalOrders: number;
  totalProductsSold: number;
  newUsersRegistered: number;
  totalItemsInActiveCart: number;
  positiveReviews: number;
  negativeReviews: number;
  bestSellingProducts: string;
}


export interface AnalyticsOverviewResponse {
  todayRevenue: BigDecimal;
  todayOrders: number;
  activeUsers: number;
  totalBalance: BigDecimal;
}

//==========================================
//4. REQUEST DTOs (Khớp 1:1 với RequestDto.java)
//==========================================

//--- Auth Requests ---
export interface IntrospectRequest {
  token: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth?: ISODate;
}
export interface RefreshTokenRequest {
  refreshToken: string;
}
export interface OtpValidationRequest {
  code: string;
  email: string;
  type: OtpType;
}
export interface ForgotPasswordRequest {
  email: string;
}
export interface ResetPasswordRequest {
  newPassword: string;
  email: string;
}

//--- User Requests ---
export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth?: ISODate;
  role?: UserRole;
}
export interface UpdateUserRequest {
  fullName?: string;
  dateOfBirth?: ISODate;
  active?: boolean;
  role?: UserRole;
}
export interface UpdateProfileRequest {
  fullName?: string;
  dateOfBirth?: ISODate;
}

//--- Address Requests ---
export interface CreateAddressRequest {
  recipientFullName: string;
  recipientPhone: string;
  district: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  note?: string;
}
export interface UpdateAddressRequest {
  recipientFullName?: string;
  recipientPhone?: string;
  district?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  note?: string;
  isDefault?: boolean;
}

//--- Wallet Requests ---
export interface ActivateWalletRequest {
  newPin: string;
  confirmPin: string;
}
export interface DepositRequest {
  amount: BigDecimal;
  paymentMethod: string;
}
export interface WithdrawalRequest {
  amount: BigDecimal;
  pin: string;
}
export interface ValidatePinRequest {
  pin: string;
}

//--- Cart Requests ---
export interface AddCartItemRequest {
  productVariantId: UUID;
  quantity: number;
}
export interface UpdateCartItemRequest {
  quantity: number;
}

//--- Category/Brand Requests ---
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: number;
}
export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;

}

export interface UpdateBrandRequest {
  name?: string;
  description?: string;

}

//--- Product Requests ---
export interface CreateProductRequest {
  name: string;
  description?: string;
  categoryId: number;
  brandId: number;
  isPublished?: boolean;
}
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  isPublished?: boolean;
  quantityInStock?: number;
}
export interface ProductSearchRequest {
  search?: string;
  categoryId?: number;
  brandId?: number;
  attributes?: Record<string, string>;
  minPrice?: BigDecimal;
  maxPrice?: BigDecimal;
  page?: number;
  size?: number;
  sort?: string;
}
export interface CreateVariantRequest {
  sku: string;
  price?: BigDecimal;
  attributes: Record<string, string>;
}
export interface UpdateVariantRequest {
  sku?: string;
  price?: BigDecimal;
  attributes?: Record<string, string>;
}

export interface UploadImageRequest {
  altText?: string;
  isThumbnail?: boolean;
  targetId: UUID;
}
export interface ImageActionRequest {
  altText?: string;
  isThumbnail?: boolean;
}

//--- Review Requests ---
export interface CreateReviewRequest {
  rating: number;
  comment?: string;

}
export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

//--- Order Requests ---
export interface CreateOrderRequest {
  addressId: number;
  paymentMethodId: number;
  note?: string;
}
export interface OrderSearchRequest {
  status?: OrderStatus;
  fromDate?: ISODate;
  toDate?: ISODate;
}
export interface AdminOrderSearchRequest {
  userId?: UUID;
  search?: OrderSearchRequest;
}
export interface CancelOrderRequest {
  reason?: string;
}
export interface ShipOrderRequest {
  trackingNumber: string;
  estimatedDeliveryDate?: ISODateTime;
}
export interface UpdateOrderLocationRequest {
  latitude: number;
  longitude: number;
}

export type CreatePaymentRequest = {
  methodName: string;
  description?: string;
};

//--- Transaction Requests ---
export interface TransactionSearchRequest {
  type?: TransactionType;
  status?: TransactionStatus;
  fromDate?: ISODate;
  toDate?: ISODate;
}
export interface AdminTransactionSearchRequest {
  walletId?: UUID;
  search?: TransactionSearchRequest;
}
export interface CreateTransactionRequest {
  walletId: UUID;
  type: TransactionType;
  amount: BigDecimal;
  orderId?: UUID;
  description?: string;
}
export interface UpdateTransactionRequest {
  status?: TransactionStatus;
  description?: string;
}

//--- Analytics Requests ---
export interface ReportSearchRequest {
  fromDate?: ISODate;
  toDate?: ISODate;
}