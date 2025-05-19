# API Documentation - E-Commerce AI

Tài liệu này mô tả các API endpoints có sẵn trong dự án E-Commerce AI. Các API này cung cấp chức năng để tương tác với sản phẩm, quản lý người dùng, tích hợp hệ thống gợi ý sản phẩm và theo dõi hành vi người dùng.

## Base URL

```
https://your-domain.com/api
```

Thay thế `your-domain.com` bằng domain thực tế của bạn.

## Authentication

Hầu hết các endpoints yêu cầu xác thực. Sử dụng một trong các phương thức sau:

### Bearer Token

```
Authorization: Bearer <token>
```

Token JWT nhận được sau khi đăng nhập thành công.

### Session Cookie

Cookie session sẽ được tự động gửi khi người dùng đã đăng nhập qua giao diện website.

## Định dạng phản hồi

Tất cả API trả về dữ liệu dưới dạng JSON với cấu trúc:

```json
{
  "success": true|false,
  "data": {}, // Dữ liệu phản hồi khi thành công
  "error": {  // Chỉ có khi success = false
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi"
  }
}
```

## Rate Limiting

API có giới hạn 100 request/phút cho mỗi IP. Khi vượt quá, API sẽ trả về mã lỗi 429 (Too Many Requests).

---

## Products API

### Lấy danh sách sản phẩm

```
GET /products
```

**Query Parameters:**

| Parameter    | Type     | Description                                      |
|--------------|----------|--------------------------------------------------|
| limit        | number   | Số lượng sản phẩm tối đa (mặc định: 20, tối đa: 100) |
| page         | number   | Trang hiện tại (mặc định: 1)                     |
| category     | string   | Lọc theo ID danh mục                             |
| search       | string   | Tìm kiếm theo tên sản phẩm                       |
| minPrice     | number   | Giá tối thiểu                                    |
| maxPrice     | number   | Giá tối đa                                       |
| sort         | string   | Sắp xếp: price_asc, price_desc, newest, popularity |

**Response:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "images": ["url1", "url2"],
        "category": {
          "id": "category_id",
          "name": "Category Name"
        },
        "inStock": true,
        "ratings": 4.5,
        "reviewCount": 10
      }
    ],
    "pagination": {
      "total": 100,
      "pages": 5,
      "currentPage": 1,
      "limit": 20
    }
  }
}
```

### Lấy chi tiết sản phẩm

```
GET /products/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "product_id",
    "name": "Product Name",
    "description": "Full product description",
    "price": 99.99,
    "images": ["url1", "url2", "url3"],
    "category": {
      "id": "category_id",
      "name": "Category Name"
    },
    "inStock": true,
    "attributes": [
      {
        "name": "Color",
        "value": "Red"
      },
      {
        "name": "Size",
        "value": "Large"
      }
    ],
    "ratings": 4.5,
    "reviews": [
      {
        "id": "review_id",
        "userId": "user_id",
        "userName": "John Doe",
        "rating": 5,
        "comment": "Great product!",
        "createdAt": "2023-06-15T10:30:00Z"
      }
    ]
  }
}
```

### Thêm sản phẩm mới (Admin)

```
POST /products
```

**Request Body:**

```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 149.99,
  "categoryId": "category_id",
  "images": ["url1", "url2"],
  "attributes": [
    {
      "name": "Color",
      "value": "Blue"
    },
    {
      "name": "Size",
      "value": "Medium"
    }
  ],
  "stock": 100
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new_product_id",
    "name": "New Product",
    "description": "Product description",
    "price": 149.99,
    "images": ["url1", "url2"],
    "categoryId": "category_id",
    "stock": 100,
    "createdAt": "2023-06-20T15:30:00Z"
  }
}
```

### Cập nhật sản phẩm (Admin)

```
PUT /products/:id
```

**Request Body:** (Chỉ cần gửi các trường cần cập nhật)

```json
{
  "price": 129.99,
  "stock": 50
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "product_id",
    "name": "Product Name",
    "price": 129.99,
    "stock": 50,
    "updatedAt": "2023-06-20T16:15:00Z"
  }
}
```

### Xóa sản phẩm (Admin)

```
DELETE /products/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Đã xóa sản phẩm thành công"
  }
}
```

---

## Recommendations API

### Lấy sản phẩm gợi ý cho người dùng

```
GET /recommendations
```

**Query Parameters:**

| Parameter     | Type     | Description                                       |
|---------------|----------|---------------------------------------------------|
| limit         | number   | Số lượng sản phẩm gợi ý (mặc định: 10, tối đa: 50)|
| useTensorflow | boolean  | Sử dụng TensorFlow.js (mặc định: true)            |
| useHybrid     | boolean  | Sử dụng hệ thống lai (mặc định: true)             |

**Response:**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "product_id",
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "image": "url1",
        "category": "Category Name",
        "score": 0.95
      }
    ],
    "recommendationType": "hybrid",
    "recommendationTitle": "Sản phẩm dành riêng cho bạn",
    "recommendationDescription": "Dựa trên phân tích nâng cao về hành vi của bạn"
  }
}
```

### Ghi lại tương tác với gợi ý

```
POST /recommendations/interactions
```

**Request Body:**

```json
{
  "productId": "product_id",
  "interactionType": "view|cart|purchase",
  "recommendationType": "hybrid|tensorflow|collaborative|content"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Đã ghi lại tương tác thành công",
    "interactionId": "interaction_id"
  }
}
```

### Lấy báo cáo hiệu quả gợi ý (Admin)

```
GET /recommendations/metrics
```

**Query Parameters:**

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| period    | string | Khoảng thời gian: day, week, month   |
| format    | string | Định dạng: json, report (mặc định: json) |

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "week",
    "startDate": "2023-06-10T00:00:00Z",
    "endDate": "2023-06-17T23:59:59Z",
    "totalImpressions": 5642,
    "totalClicks": 423,
    "totalPurchases": 65,
    "ctr": 0.075,
    "conversionRate": 0.015,
    "byAlgorithm": [
      {
        "type": "hybrid",
        "impressions": 3200,
        "clicks": 285,
        "purchases": 42,
        "ctr": 0.089,
        "conversionRate": 0.013
      },
      {
        "type": "tensorflow",
        "impressions": 1500,
        "clicks": 98,
        "purchases": 15,
        "ctr": 0.065,
        "conversionRate": 0.01
      }
    ]
  }
}
```

---

## User Behavior API

### Ghi lại hành vi người dùng

```
POST /user-behavior
```

**Request Body:**

```json
{
  "action": "view_product|search|add_to_cart|purchase",
  "productId": "product_id",  // nếu liên quan đến sản phẩm
  "searchQuery": "query",     // nếu action là search
  "metadata": {               // thông tin bổ sung
    "referrer": "homepage",
    "duration": 120
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Đã ghi lại hành vi thành công",
    "eventId": "event_id"
  }
}
```

### Lấy thông tin hành vi người dùng (Admin hoặc User xem dữ liệu của chính mình)

```
GET /user-behavior/:userId
```

**Query Parameters:**

| Parameter  | Type     | Description                               |
|------------|----------|-------------------------------------------|
| startDate  | string   | Ngày bắt đầu (YYYY-MM-DD)                 |
| endDate    | string   | Ngày kết thúc (YYYY-MM-DD)                |
| action     | string   | Lọc theo loại hành vi                     |

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "events": [
      {
        "id": "event_id",
        "action": "view_product",
        "productId": "product_id",
        "productName": "Product Name",
        "timestamp": "2023-06-18T14:30:00Z",
        "metadata": {
          "referrer": "homepage",
          "duration": 120
        }
      }
    ],
    "summary": {
      "totalViews": 45,
      "totalSearches": 10,
      "totalAddToCart": 5,
      "totalPurchases": 2,
      "favoriteCategories": [
        {
          "name": "Electronics",
          "viewCount": 23
        }
      ]
    }
  }
}
```

---

## Auth API

### Đăng ký

```
POST /auth/register
```

**Request Body:**

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "securepassword",
  "phoneNumber": "+84xxxxxxxxx" // tùy chọn
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "jwt_token"
  }
}
```

### Đăng nhập

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user|admin"
    },
    "token": "jwt_token"
  }
}
```

### Đăng xuất

```
POST /auth/logout
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Đã đăng xuất thành công"
  }
}
```

### Lấy thông tin người dùng hiện tại

```
GET /auth/me
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user|admin",
      "phoneNumber": "+84xxxxxxxxx",
      "createdAt": "2023-01-15T08:30:00Z"
    }
  }
}
```

---

## Orders API

### Tạo đơn hàng mới

```
POST /orders
```

**Request Body:**

```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "name": "Recipient Name",
    "address": "123 Street Name",
    "city": "City",
    "state": "State",
    "zipCode": "10000",
    "country": "Country",
    "phoneNumber": "+84xxxxxxxxx"
  },
  "paymentMethod": "stripe|cod"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_id",
      "status": "pending",
      "total": 199.98,
      "items": [
        {
          "productId": "product_id",
          "name": "Product Name",
          "price": 99.99,
          "quantity": 2,
          "subtotal": 199.98
        }
      ],
      "createdAt": "2023-06-20T10:15:00Z",
      "paymentStatus": "pending",
      "paymentMethod": "stripe"
    },
    "paymentInfo": {
      "clientSecret": "stripe_client_secret" // nếu paymentMethod là stripe
    }
  }
}
```

### Lấy danh sách đơn hàng

```
GET /orders
```

**Query Parameters:**

| Parameter | Type   | Description                                  |
|-----------|--------|----------------------------------------------|
| limit     | number | Số lượng đơn hàng (mặc định: 10, tối đa: 50) |
| page      | number | Trang hiện tại (mặc định: 1)                 |
| status    | string | Lọc theo trạng thái                          |

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_id",
        "status": "processing",
        "total": 199.98,
        "itemCount": 2,
        "createdAt": "2023-06-20T10:15:00Z",
        "paymentStatus": "paid"
      }
    ],
    "pagination": {
      "total": 5,
      "pages": 1,
      "currentPage": 1,
      "limit": 10
    }
  }
}
```

### Lấy chi tiết đơn hàng

```
GET /orders/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "status": "processing",
    "total": 199.98,
    "items": [
      {
        "productId": "product_id",
        "name": "Product Name",
        "price": 99.99,
        "quantity": 2,
        "subtotal": 199.98,
        "image": "url1"
      }
    ],
    "shippingAddress": {
      "name": "Recipient Name",
      "address": "123 Street Name",
      "city": "City",
      "state": "State",
      "zipCode": "10000",
      "country": "Country",
      "phoneNumber": "+84xxxxxxxxx"
    },
    "paymentMethod": "stripe",
    "paymentStatus": "paid",
    "createdAt": "2023-06-20T10:15:00Z",
    "updatedAt": "2023-06-20T10:20:00Z",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2023-06-20T10:15:00Z"
      },
      {
        "status": "processing",
        "timestamp": "2023-06-20T10:20:00Z"
      }
    ]
  }
}
```

### Cập nhật trạng thái đơn hàng (Admin)

```
PUT /orders/:id/status
```

**Request Body:**

```json
{
  "status": "processing|shipped|delivered|cancelled",
  "note": "Order has been shipped via DHL. Tracking: XXX" // tùy chọn
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "order_id",
    "status": "shipped",
    "updatedAt": "2023-06-21T09:30:00Z",
    "note": "Order has been shipped via DHL. Tracking: XXX"
  }
}
```

---

## Lỗi thường gặp

| Mã lỗi               | Mã HTTP | Mô tả                                           |
|----------------------|---------|------------------------------------------------|
| INVALID_CREDENTIALS  | 401     | Thông tin đăng nhập không hợp lệ               |
| UNAUTHORIZED         | 401     | Không có quyền truy cập                        |
| FORBIDDEN            | 403     | Không có quyền thực hiện hành động này         |
| NOT_FOUND            | 404     | Không tìm thấy tài nguyên                      |
| VALIDATION_ERROR     | 400     | Dữ liệu gửi lên không hợp lệ                   |
| INTERNAL_ERROR       | 500     | Lỗi máy chủ                                    |
| PRODUCT_OUT_OF_STOCK | 400     | Sản phẩm đã hết hàng                           |
| RATE_LIMIT_EXCEEDED  | 429     | Đã vượt quá giới hạn yêu cầu                   |

## Sử dụng API

### Ví dụ sử dụng với JavaScript

```javascript
// Lấy sản phẩm gợi ý
async function getRecommendations() {
  const response = await fetch('https://your-domain.com/api/recommendations?limit=5&useHybrid=true', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data.recommendations;
  } else {
    throw new Error(data.error.message);
  }
}

// Ghi lại tương tác người dùng
async function logUserInteraction(productId, action) {
  const response = await fetch('https://your-domain.com/api/user-behavior', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: action,
      productId: productId,
      metadata: {
        referrer: document.referrer
      }
    })
  });
  
  return await response.json();
}
```

## Phiên bản API

API hiện đang ở phiên bản v1. Khi có thay đổi lớn, chúng tôi sẽ cập nhật lên phiên bản mới (v2, v3, ...) và duy trì phiên bản cũ trong một khoảng thời gian hợp lý.

## Liên hệ

Nếu bạn có câu hỏi hoặc gặp vấn đề với API, vui lòng liên hệ:
- Email: api-support@example.com
- Hotline: 1900-xxx-xxx 