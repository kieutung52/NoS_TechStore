/**
 * Website Configuration
 * Tất cả thông tin liên hệ và cấu hình website
 */

export const websiteConfig = {
  storeName: "TechStore",
  tagline: "Linh kiện máy tính chất lượng cao",
  description: "Chuyên cung cấp CPU, RAM, Bo mạch chủ, Card đồ họa và các linh kiện máy tính chính hãng",
  
  contact: {
    phone: "+84 24 3856 9999",
    email: "support@techstore.vn",
    address: "P. Nguyễn Trác, Yên Nghĩa, Hà Đông, Hà Nội, Việt Nam",
    coordinates: {
      lat: 20.9628333, // 20°57'46.2"N
      lng: 105.7483611 // 105°44'54.1"E
    }
  },
  
  socialMedia: {
    facebook: "https://facebook.com/techstore",
    instagram: "https://instagram.com/techstore",
    youtube: "https://youtube.com/@techstore",
    zalo: "https://zalo.me/techstore"
  },
  
  businessHours: {
    weekdays: "8:00 - 20:00",
    weekend: "8:00 - 18:00"
  },
  
  policies: [
    {
      title: "Chính sách đổi trả",
      description: "Đổi trả trong 7 ngày nếu có lỗi từ nhà sản xuất"
    },
    {
      title: "Chính sách bảo hành",
      description: "Bảo hành chính hãng từ 12-36 tháng tùy sản phẩm"
    },
    {
      title: "Chính sách giao hàng",
      description: "Giao hàng toàn quốc, miễn phí trong nội thành Hà Nội"
    },
    {
      title: "Chính sách thanh toán",
      description: "Hỗ trợ thanh toán COD, chuyển khoản, ví điện tử"
    }
  ]
};
