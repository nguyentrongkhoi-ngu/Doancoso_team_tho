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
    isFeatured: true,
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
    isFeatured: false,
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
    isFeatured: true,
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
    isFeatured: false,
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
    isFeatured: false,
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
    isFeatured: true,
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
    isFeatured: true,
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
    isFeatured: false,
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
  brand: z.string().optional(),
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
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '1000'); // Tăng giới hạn mặc định lên 1000
    const page = parseInt(searchParams.get('page') || '1');
    const featured = searchParams.get('featured') === 'true';
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : null;
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : null;
    const brand = searchParams.get('brand');
    const skip = (page - 1) * limit;

    const timestamp = searchParams.get('_ts') || Date.now().toString();
    console.log(`API: Timestamp request: ${timestamp}, Featured: ${featured}`);

    try {
      // Xây dựng điều kiện tìm kiếm
      let where: any = {};

      if (category) {
        // Kiểm tra xem category là ID hay name
        // Nếu category có dạng ID (chuỗi dài với ký tự đặc biệt), sử dụng categoryId
        // Nếu không, tìm theo category name hoặc ID
        if (category.length > 10 && (category.includes('cm9ad') || category.includes('cm9'))) {
          // Đây có vẻ là category ID
          where.categoryId = category;
        } else {
          // Đây có vẻ là category name hoặc slug, tìm category theo nhiều cách
          let categoryRecord = null;

          // Thử tìm theo ID trước (nếu category là slug như 'camera', 'smartphone')
          categoryRecord = await prisma.category.findFirst({
            where: { id: category }
          });

          // Nếu không tìm thấy theo ID, thử tìm theo name
          if (!categoryRecord) {
            categoryRecord = await prisma.category.findFirst({
              where: {
                OR: [
                  { name: { contains: category } },
                  { name: { contains: category === 'camera' ? 'Máy ảnh' : category } },
                  { name: { contains: category === 'smartphone' ? 'Điện thoại' : category } },
                  { name: { contains: category === 'laptop' ? 'Laptop' : category } },
                  { name: { contains: category === 'tablet' ? 'Máy tính bảng' : category } },
                  { name: { contains: category === 'wearable' ? 'Thiết bị đeo' : category } },
                  { name: { contains: category === 'audio' ? 'Âm thanh' : category } },
                  { name: { contains: category === 'gaming' ? 'Gaming' : category } }
                ]
              }
            });
          }

          if (categoryRecord) {
            where.categoryId = categoryRecord.id;
          } else {
            // Nếu không tìm thấy category, trả về empty result
            where.categoryId = 'non-existent-category';
          }
        }
      }

      // Tạo điều kiện AND cho search và brand
      const andConditions = [];

      if (search) {
        andConditions.push({
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ]
        });
      }

      // Lọc theo thương hiệu - đơn giản hóa logic
      if (brand) {
        console.log(`API: Lọc theo thương hiệu "${brand}"`);

        // Ưu tiên lọc theo trường brand trước
        andConditions.push({
          OR: [
            // Điều kiện 1: Có trường brand khớp chính xác
            { brand: brand },
            // Điều kiện 2: Fallback theo tên sản phẩm
            { name: { contains: brand } }
          ]
        });
      }

      // Áp dụng điều kiện AND
      if (andConditions.length > 0) {
        where.AND = andConditions;
      }

      // Lọc theo khoảng giá
      if (minPrice !== null || maxPrice !== null) {
        where.price = {};
        if (minPrice !== null) {
          where.price.gte = minPrice;
        }
        if (maxPrice !== null) {
          where.price.lte = maxPrice;
        }
        console.log(`API: Lọc theo giá từ ${minPrice || 'không giới hạn'} đến ${maxPrice || 'không giới hạn'}`);
      }

      // Lọc sản phẩm nổi bật nếu có tham số featured=true
      // Thay đổi: Lấy sản phẩm dựa trên lượt xem thay vì trường isFeatured
      if (featured) {
        console.log("API: Đang lấy sản phẩm nổi bật dựa trên lượt xem");

        // Lấy 10 sản phẩm có tổng lượt xem cao nhất
        const topViewedProducts = await prisma.productView.groupBy({
          by: ['productId'],
          _sum: {
            viewCount: true,
          },
          orderBy: {
            _sum: {
              viewCount: 'desc',
            },
          },
          take: 10,
        });

        const topProductIds = topViewedProducts.map(item => item.productId);

        if (topProductIds.length > 0) {
          where.id = { in: topProductIds };
          console.log(`API: Tìm thấy ${topProductIds.length} sản phẩm có lượt xem cao nhất`);

          // Lưu thông tin về thứ tự lượt xem để sắp xếp lại sau
          where._viewOrderMap = new Map(
            topViewedProducts.map((item, index) => [item.productId, {
              order: index,
              totalViews: item._sum.viewCount || 0
            }])
          );
        } else {
          // Nếu không có sản phẩm nào được xem, fallback về sản phẩm mới nhất
          console.log("API: Không có sản phẩm nào được xem, fallback về sản phẩm mới nhất");
          orderBy = { createdAt: 'desc' };
        }
      }

      // Xác định cách sắp xếp
      let orderBy: any = {};

      // Nếu là featured products và có sản phẩm theo lượt xem, không cần sắp xếp thêm
      // vì sẽ được sắp xếp lại sau khi lấy dữ liệu
      if (featured && where.id?.in) {
        // Giữ thứ tự mặc định, sẽ sắp xếp lại theo lượt xem sau
        orderBy = { createdAt: 'desc' };
      } else {
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
      }

      // Lưu thông tin về thứ tự lượt xem trước khi xóa khỏi where
      const viewOrderMap = where._viewOrderMap;

      // Xóa thuộc tính _viewOrderMap khỏi where để tránh lỗi trong query
      if (where._viewOrderMap) {
        delete where._viewOrderMap;
      }

      // Đếm tổng số sản phẩm thỏa mãn điều kiện
      const totalCount = await prisma.product.count({ where });

      // Lấy danh sách sản phẩm - luôn truy vấn trực tiếp từ database, không sử dụng cache
      let products = await prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
        },
      });

      // Sắp xếp lại sản phẩm theo thứ tự lượt xem nếu là featured products
      if (featured && viewOrderMap) {
        products.sort((a, b) => {
          const orderA = viewOrderMap.get(a.id)?.order ?? 999;
          const orderB = viewOrderMap.get(b.id)?.order ?? 999;
          return orderA - orderB;
        });

        console.log("API: Đã sắp xếp lại sản phẩm theo thứ tự lượt xem");
        products.forEach((product, index) => {
          const viewInfo = viewOrderMap.get(product.id);
          console.log(`${index + 1}. ${product.name} - ${viewInfo?.totalViews || 0} lượt xem`);
        });
      }

      // Kiểm tra và log trạng thái isFeatured
      if (featured) {
        console.log(`API: Đã tìm thấy ${products.length} sản phẩm nổi bật`);
        products.forEach(product => {
          // Đảm bảo isFeatured luôn là boolean
          product.isFeatured = Boolean(product.isFeatured);
          console.log(`- ${product.name} (ID: ${product.id}, Nổi bật: ${product.isFeatured})`);
        });
      } else {
        console.log(`API: Đã tìm thấy ${products.length} sản phẩm`);
        // Đảm bảo isFeatured luôn là boolean cho tất cả sản phẩm
        products.forEach(product => {
          product.isFeatured = Boolean(product.isFeatured);
        });
      }

      // Thêm thông tin phân trang vào header
      const totalPages = Math.ceil(totalCount / limit);

      // Trả về danh sách sản phẩm và thông tin phân trang với headers ngăn caching
      return NextResponse.json(products, {
        headers: {
          'x-total-count': totalCount.toString(),
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
        filteredProducts = filteredProducts.filter(p =>
          p.categoryId === category || p.category.name.toLowerCase() === category.toLowerCase()
        );
      }

      // Lọc theo từ khóa tìm kiếm
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
        );
      }

      // Lọc theo khoảng giá
      if (minPrice !== null || maxPrice !== null) {
        filteredProducts = filteredProducts.filter(p => {
          if (minPrice !== null && p.price < minPrice) return false;
          if (maxPrice !== null && p.price > maxPrice) return false;
          return true;
        });
      }

      // Lọc theo thương hiệu - đơn giản hóa
      if (brand) {
        const brandLower = brand.toLowerCase();
        filteredProducts = filteredProducts.filter(p => {
          // Kiểm tra trường brand trước
          if (p.brand && p.brand.toLowerCase() === brandLower) {
            return true;
          }
          // Fallback kiểm tra tên sản phẩm
          return p.name.toLowerCase().includes(brandLower);
        });
      }

      // Lọc sản phẩm nổi bật - fallback vẫn sử dụng isFeatured
      if (featured) {
        filteredProducts = filteredProducts.filter(p => p.isFeatured === true);
        console.log("API Fallback: Sử dụng dữ liệu mẫu cho sản phẩm nổi bật");
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
        brand: data.brand || null,
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