import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Mock data for fallback if database connection fails
const mockProducts = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    description: 'Smartphone cao cấp từ Apple với chip A17 Pro, màn hình Super Retina XDR 6.7 inch và hệ thống camera chuyên nghiệp.',
    price: 34990000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484428d1',
    categoryId: 'smartphone',
    category: {
      id: 'smartphone',
      name: 'Điện thoại'
    }
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship của Samsung với bút S-Pen tích hợp, màn hình Dynamic AMOLED 2X và khả năng zoom quang học 10x.',
    price: 31990000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1707412911484-7b0440f2830a',
    categoryId: 'smartphone',
    category: {
      id: 'smartphone',
      name: 'Điện thoại'
    }
  },
  {
    id: '3',
    name: 'MacBook Pro 16 inch M3 Max',
    description: 'Laptop chuyên dụng cho sáng tạo nội dung với chip M3 Max, màn hình Liquid Retina XDR và thời lượng pin lên đến 22 giờ.',
    price: 75990000,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1628556270448-4d4e4769a38c',
    categoryId: 'laptop',
    category: {
      id: 'laptop',
      name: 'Laptop'
    }
  },
  {
    id: '4',
    name: 'Dell XPS 15',
    description: 'Laptop cao cấp với màn hình OLED 4K, chip Intel Core i9 và card đồ họa NVIDIA RTX 4070.',
    price: 52990000,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45',
    categoryId: 'laptop',
    category: {
      id: 'laptop',
      name: 'Laptop'
    }
  },
  {
    id: '5',
    name: 'Xiaomi 14 Ultra',
    description: 'Smartphone cao cấp với hệ thống camera Leica, màn hình AMOLED 120Hz và pin lớn.',
    price: 19990000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1671920090611-9a40303b52cb',
    categoryId: 'smartphone',
    category: {
      id: 'smartphone',
      name: 'Điện thoại'
    }
  },
  {
    id: '6',
    name: 'iPad Pro M2',
    description: 'Máy tính bảng mạnh mẽ với chip M2, màn hình Liquid Retina XDR và Apple Pencil 2.',
    price: 23990000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
    categoryId: 'tablet',
    category: {
      id: 'tablet',
      name: 'Máy tính bảng'
    }
  },
  {
    id: '7',
    name: 'Sony WH-1000XM5',
    description: 'Tai nghe chụp tai chống ồn hàng đầu với chất lượng âm thanh vượt trội và thời lượng pin dài.',
    price: 8990000,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1618066346137-23e4135702ab',
    categoryId: 'audio',
    category: {
      id: 'audio',
      name: 'Âm thanh'
    }
  },
  {
    id: '8',
    name: 'Apple Watch Series 9',
    description: 'Đồng hồ thông minh cao cấp với tính năng theo dõi sức khỏe và tích hợp với hệ sinh thái Apple.',
    price: 10990000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
    categoryId: 'wearable',
    category: {
      id: 'wearable',
      name: 'Thiết bị đeo'
    }
  }
];

// Schema xác thực sản phẩm
const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().optional(),
  price: z.number().positive("Giá phải là số dương"),
  stock: z.number().int().nonnegative("Số lượng không được âm"),
  categoryId: z.string().min(1, "Danh mục là bắt buộc"),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
});

// API để lấy danh sách sản phẩm
export async function GET(req: NextRequest) {
  try {
    console.log("API: Đang lấy danh sách sản phẩm");

    // Lấy các tham số truy vấn từ URL
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    console.log('API: Received category parameter:', category);
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    // Tăng số lượng sản phẩm mặc định trả về
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const featured = searchParams.get('featured') === 'true';
    const skip = (page - 1) * limit;

    // Lấy các tham số lọc bổ sung
    // Chỉ lấy giá trị khi tham số tồn tại trong URL
    const minPrice = searchParams.has('minPrice') && searchParams.get('minPrice') !== ''
      ? parseFloat(searchParams.get('minPrice') || '0')
      : null;

    const maxPrice = searchParams.has('maxPrice') && searchParams.get('maxPrice') !== ''
      ? parseFloat(searchParams.get('maxPrice') || '10000000')
      : null;

    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating') || '0') : null;
    const brand = searchParams.get('brand');

    console.log('API: Additional filter parameters:', { minPrice, maxPrice, rating, brand });

    const timestamp = searchParams.get('_ts') || Date.now().toString();
    console.log(`API: Timestamp request: ${timestamp}, Featured: ${featured}`);

    try {
      // Xây dựng điều kiện tìm kiếm
      let where: any = {};

      if (category) {
        where.categoryId = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Lọc sản phẩm nổi bật nếu có tham số featured=true
      if (featured) {
        where.isFeatured = true;
        console.log("API: Đang lấy sản phẩm nổi bật");
      }

      // Lọc theo khoảng giá
      if (minPrice !== null || maxPrice !== null) {
        where.price = {};

        if (minPrice !== null) {
          where.price.gte = minPrice;
          console.log(`API: Lọc sản phẩm có giá >= ${minPrice}`);
        }

        if (maxPrice !== null) {
          where.price.lte = maxPrice;
          console.log(`API: Lọc sản phẩm có giá <= ${maxPrice}`);
        }
      }

      // Lọc theo thương hiệu (brand)
      if (brand) {
        // Trong schema, brand được lưu trong bảng Category
        where.category = {
          name: brand
        };
        console.log(`API: Lọc sản phẩm theo thương hiệu: ${brand}`);
      }

      // Lọc theo đánh giá sẽ được xử lý sau khi lấy dữ liệu
      // vì cần tính trung bình đánh giá từ bảng Review

      // Xác định cách sắp xếp
      let orderBy: any = {};

      switch (sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'name_asc':
          orderBy = { name: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      // Đếm tổng số sản phẩm thỏa mãn điều kiện
      const totalCount = await prisma.product.count({ where });

      // Lấy danh sách sản phẩm - luôn truy vấn trực tiếp từ database, không sử dụng cache
      console.log("API: Conditions for fetching products:", where);
      console.log("API: Truy vấn database cho sản phẩm với điều kiện:", where);

      // Nếu có lọc theo đánh giá, cần lấy thêm thông tin reviews
      const includeReviews = rating !== null;

      const products = await prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          ...(includeReviews ? { reviews: true } : {})
        },
      });

      // Lọc theo đánh giá nếu cần
      let filteredProducts = products;
      if (rating !== null) {
        console.log(`API: Lọc sản phẩm theo đánh giá >= ${rating}`);
        filteredProducts = products.filter(product => {
          if (!product.reviews || product.reviews.length === 0) {
            return false; // Không có đánh giá nào
          }

          const avgRating = product.reviews.reduce(
            (sum: number, review: any) => sum + review.rating,
            0
          ) / product.reviews.length;

          return avgRating >= rating;
        });

        console.log(`API: Sau khi lọc theo đánh giá: ${filteredProducts.length}/${products.length} sản phẩm`);
      }

      // Kiểm tra và log trạng thái isFeatured
      if (featured) {
        console.log(`API: Đã tìm thấy ${filteredProducts.length} sản phẩm nổi bật`);
        filteredProducts.forEach(product => {
          // Đảm bảo isFeatured luôn là boolean
          product.isFeatured = Boolean(product.isFeatured);
          console.log(`- ${product.name} (ID: ${product.id}, Nổi bật: ${product.isFeatured})`);
        });
      } else {
        console.log(`API: Đã tìm thấy ${filteredProducts.length} sản phẩm`);
        // Đảm bảo isFeatured luôn là boolean cho tất cả sản phẩm
        filteredProducts.forEach(product => {
          product.isFeatured = Boolean(product.isFeatured);
        });
      }

      // Tính toán lại thông tin phân trang nếu đã lọc theo đánh giá
      let adjustedTotalCount = totalCount;
      if (rating !== null) {
        // Nếu đã lọc theo đánh giá, cần điều chỉnh tổng số sản phẩm
        // Đây là ước tính vì chúng ta không thể biết chính xác tổng số sản phẩm thỏa mãn điều kiện đánh giá
        // mà không truy vấn tất cả sản phẩm
        const filterRatio = filteredProducts.length / products.length;
        adjustedTotalCount = Math.ceil(totalCount * filterRatio);
      }

      // Thêm thông tin phân trang vào header
      const totalPages = Math.ceil(adjustedTotalCount / limit);

      // Trả về danh sách sản phẩm và thông tin phân trang với headers ngăn caching
      return NextResponse.json(filteredProducts, {
        headers: {
          'x-total-count': adjustedTotalCount.toString(),
          'x-total-pages': totalPages.toString(),
          'x-current-page': page.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'x-timestamp': new Date().toISOString()
        },
      });
    } catch (dbError) {
      console.error("Lỗi kết nối cơ sở dữ liệu:", dbError);

      // Fallback với dữ liệu giả
      console.log("Sử dụng dữ liệu mẫu để fallback");
      let filteredProducts = [...mockProducts];

      // Lọc theo danh mục
      if (category) {
        console.log(`Fallback: Lọc theo danh mục ${category}`);
        filteredProducts = filteredProducts.filter(p => p.categoryId === category);
      }

      // Lọc theo từ khóa tìm kiếm
      if (search) {
        console.log(`Fallback: Lọc theo từ khóa ${search}`);
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
        );
      }

      // Lọc theo khoảng giá
      if (minPrice !== null || maxPrice !== null) {
        console.log(`Fallback: Lọc theo giá ${minPrice || 0} - ${maxPrice || 'không giới hạn'}`);
        filteredProducts = filteredProducts.filter(p => {
          let matches = true;
          if (minPrice !== null) matches = matches && p.price >= minPrice;
          if (maxPrice !== null) matches = matches && p.price <= maxPrice;
          return matches;
        });
      }

      // Lọc theo thương hiệu
      if (brand) {
        console.log(`Fallback: Lọc theo thương hiệu ${brand}`);
        filteredProducts = filteredProducts.filter(p => p.category.name === brand);
      }

      // Lọc sản phẩm nổi bật
      if (featured) {
        console.log(`Fallback: Lọc sản phẩm nổi bật`);
        // Giả định một số sản phẩm là nổi bật
        const featuredIds = ['1', '3', '5', '7'];
        filteredProducts = filteredProducts.filter(p => featuredIds.includes(p.id));
      }

      // Sắp xếp
      if (sort === 'price_asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sort === 'price_desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
      } else if (sort === 'name_asc') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Phân trang
      const totalCount = filteredProducts.length;
      const totalPages = Math.ceil(totalCount / limit);
      const products = filteredProducts.slice(skip, skip + limit);

      return NextResponse.json(products, {
        headers: {
          'x-total-count': totalCount.toString(),
          'x-total-pages': totalPages.toString(),
          'x-current-page': page.toString(),
          'x-is-mock-data': 'true',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'x-timestamp': new Date().toISOString()
        },
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách sản phẩm", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Thêm sản phẩm mới
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Kiểm tra xác thực và quyền admin
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    const data = await req.json();

    // Xác thực dữ liệu
    const validationResult = productSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Kiểm tra categoryId có tồn tại
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Danh mục không tồn tại" },
        { status: 400 }
      );
    }

    // Tạo sản phẩm mới
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        isFeatured: data.isFeatured || false,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo sản phẩm:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo sản phẩm" },
      { status: 500 }
    );
  }
}