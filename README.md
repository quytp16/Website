# Sữa Chua Nhà Phú – Website đặt hàng online

Website tĩnh (HTML/CSS/JS) cho phép:
- Xem menu sản phẩm
- Thêm vào giỏ hàng
- Đặt hàng (in hóa đơn / tải file JSON)

## Cấu trúc
```
.
├── index.html
├── style.css
├── script.js
└── README.md
```

## Chạy cục bộ
Mở trực tiếp `index.html` trên trình duyệt.

## Triển khai nhanh
- **GitHub Pages**: Settings → Pages → Build từ branch `main` (thư mục root).
- **Netlify/Vercel**: tạo site mới, kéo-thả cả thư mục, trỏ custom domain.

## Tuỳ biến
- Giá, ưu đãi: sửa mảng `PRODUCTS` và hằng số `FREE_SHIP_THRESHOLD`, `SHIPPING_FEE` trong `script.js`.
- Nhận đơn vào Google Sheets/Zalo OA/Email: tạo issue, mình sẽ gắn webhook/Formspree/Apps Script giúp bạn.
