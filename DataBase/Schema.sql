CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PURCHASE', 'REFUND');
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE attachment_type AS ENUM ('IMAGE', 'VIDEO');

-------------------------------------------------
-- Bảng 1: Bảng Người dùng (Accounts)
-------------------------------------------------
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    date_of_birth DATE,
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để tăng tốc độ đăng nhập/tìm kiếm
CREATE INDEX idx_accounts_email ON accounts(email);

-------------------------------------------------
-- Bảng 2: Sổ địa chỉ (Addresses)
-------------------------------------------------
CREATE TABLE addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    recipient_full_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    street_address TEXT NOT NULL,
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Vietnam',
    note TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-------------------------------------------------
-- Bảng 3: Ví điện tử (Wallets)
-------------------------------------------------
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    pin_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index đã được tạo bởi UNIQUE constraint trên user_id

-------------------------------------------------
-- Bảng 4: Lịch sử giao dịch ví (Wallet Transactions)
-------------------------------------------------
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL,
    transaction_type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'PENDING',
    related_order_id UUID,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT
);

-- Index để xem lịch sử giao dịch
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_date ON wallet_transactions(transaction_date DESC);

-------------------------------------------------
-- Bảng 5: Phương thức thanh toán (Payment Methods)
-------------------------------------------------
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    method_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Thêm các phương thức cơ bản
INSERT INTO payment_methods (method_name, is_active) VALUES
('Thanh toán khi nhận hàng (COD)', true),
('Thanh toán bằng Ví', true),
('Thẻ tín dụng/Ghi nợ (VNPay)', false);

-------------------------------------------------
-- Bảng 6: Thương hiệu (Brands)
-------------------------------------------------
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT
);

-------------------------------------------------
-- Bảng 7: Danh mục (Categories)
-------------------------------------------------
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    parent_category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Index cho danh mục cha và tên
CREATE INDEX idx_categories_parent_id ON categories(parent_category_id);
CREATE INDEX idx_categories_name ON categories(name);

-------------------------------------------------
-- Bảng 8: Sản phẩm (Products)
-------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand_id INT REFERENCES brands(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để tìm sản phẩm
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
-- Index GIN cho Full-Text Search (tìm kiếm theo tên)
CREATE INDEX idx_products_name_fts ON products USING gin(to_tsvector('simple', name));


-------------------------------------------------
-- Bảng 9: Biến thể sản phẩm (Product Variants)
-------------------------------------------------
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    attributes JSONB, -- {"color": "Blue", "storage": "256GB", "ram": "16GB"}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để tìm biến thể
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
-- Index GIN trên JSONB (nếu bạn muốn tìm theo thuộc tính)
CREATE INDEX idx_product_variants_attributes ON product_variants USING gin(attributes);

-------------------------------------------------
-- Bảng 10: Ảnh sản phẩm (Product Images)
-------------------------------------------------
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    cloudinary_public_id TEXT,
    is_thumbnail BOOLEAN NOT NULL DEFAULT false,
    alt_text VARCHAR(255)
);

CREATE INDEX idx_product_images_variant_id ON product_images(product_variant_id);

-------------------------------------------------
-- Bảng 11: Giỏ hàng (Shopping Carts)
-------------------------------------------------
CREATE TABLE shopping_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-------------------------------------------------
-- Bảng 12: Chi tiết giỏ hàng (Cart Items)
-------------------------------------------------
CREATE TABLE cart_items (
    cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cart_id, product_variant_id) 
);

-------------------------------------------------
-- Bảng 13: Đơn hàng (Orders)
-------------------------------------------------
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    address_id BIGINT NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    payment_method_id INT NOT NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
    
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    note TEXT,
    
    status order_status NOT NULL DEFAULT 'PENDING',
    
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date DATE,
    shipped_date TIMESTAMPTZ
);

-- Index để tìm đơn hàng
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);

-------------------------------------------------
-- Bảng 14: Chi tiết đơn hàng (Order Details)
-------------------------------------------------
CREATE TABLE order_details (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
    price_each NUMERIC(15, 2) NOT NULL,
    
    UNIQUE (order_id, product_variant_id)
);

-- Index để join nhanh
CREATE INDEX idx_order_details_order_id ON order_details(order_id);
CREATE INDEX idx_order_details_variant_id ON order_details(product_variant_id);

-------------------------------------------------
-- Bảng 15: Đánh giá (Reviews)
-------------------------------------------------
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_detail_id BIGINT UNIQUE,
    
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để lấy review
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);

-------------------------------------------------
-- Bảng 16: File đính kèm của Review (Review Attachments)
-------------------------------------------------
CREATE TABLE review_attachments (
    id BIGSERIAL PRIMARY KEY,
    review_id BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    attachment_url TEXT NOT NULL, -- URL từ Cloudinary
    cloudinary_public_id TEXT,
    attachment_type attachment_type NOT NULL DEFAULT 'IMAGE'
);

-- Index
CREATE INDEX idx_review_attachments_review_id ON review_attachments(review_id);