import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ProductSuggestion } from '@/types/chat';

// Cache for search results to improve performance
const searchCache = new Map();
const CACHE_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

// Function to generate cache key based on search parameters
function generateCacheKey(params) {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== '')
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
}

// Mock data for fallback if database connection fails
const mockProducts = [
  {
    id: 'p1',
    name: 'Điện thoại iPhone 14 Pro Max',
    price: 27990000,
    currency: 'VND',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
    description: 'iPhone 14 Pro Max với chip A16 Bionic mạnh mẽ, camera 48MP, màn hình Dynamic Island',
    url: '/products/iphone-14-pro-max',
    discount: 5,
    rating: 4.9,
    averageRating: 4.9,
    inStock: true,
    stock: 25,
    categoryId: 'cat1',
    category: {
      id: 'cat1',
      name: 'Điện thoại'
    }
  },
  {
    id: 'p2',
    name: 'Laptop MacBook Air M2',
    price: 28990000,
    currency: 'VND',
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop',
    description: 'MacBook Air M2 mỏng nhẹ, hiệu năng mạnh mẽ, thời lượng pin cả ngày',
    url: '/products/macbook-air-m2',
    discount: 10,
    rating: 4.8,
    averageRating: 4.8,
    inStock: true,
    stock: 15,
    categoryId: 'cat2',
    category: {
      id: 'cat2',
      name: 'Laptop'
    }
  },
  {
    id: 'p3',
    name: 'Samsung Galaxy S23 Ultra',
    price: 25990000,
    currency: 'VND',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    description: 'Samsung Galaxy S23 Ultra với camera 200MP, bút S-Pen tích hợp, pin 5000mAh',
    url: '/products/samsung-s23-ultra',
    rating: 4.7,
    averageRating: 4.7,
    inStock: true,
    stock: 30,
    categoryId: 'cat1',
    category: {
      id: 'cat1',
      name: 'Điện thoại'
    }
  },
  {
    id: 'p4',
    name: 'Tai nghe AirPods Pro 2',
    price: 6290000,
    currency: 'VND',
    imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop',
    description: 'AirPods Pro 2 với khả năng chống ồn chủ động, âm thanh không gian, chống nước IPX4',
    url: '/products/airpods-pro-2',
    discount: 15,
    rating: 4.8,
    averageRating: 4.8,
    inStock: true,
    stock: 50,
    categoryId: 'cat3',
    category: {
      id: 'cat3',
      name: 'Tai nghe'
    }
  },
  {
    id: 'p5',
    name: 'iPad Air 5',
    price: 15990000,
    currency: 'VND',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
    description: 'iPad Air 5 với chip M1, màn hình Liquid Retina 10.9 inch, hỗ trợ Apple Pencil 2',
    url: '/products/ipad-air-5',
    rating: 4.7,
    averageRating: 4.7,
    inStock: false,
    stock: 0,
    categoryId: 'cat4',
    category: {
      id: 'cat4',
      name: 'Tablet'
    }
  },
  {
    id: 'p6',
    name: 'Apple Watch Series 8',
    price: 10990000,
    currency: 'VND',
    imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop',
    description: 'Apple Watch Series 8 với tính năng đo nhiệt độ, phát hiện va chạm, theo dõi sức khỏe nâng cao',
    url: '/products/apple-watch-series-8',
    discount: 8,
    rating: 4.6,
    averageRating: 4.6,
    inStock: true,
    stock: 8,
    categoryId: 'cat5',
    category: {
      id: 'cat5',
      name: 'Đồng hồ thông minh'
    }
  },
  {
    id: 'p7',
    name: 'Samsung Galaxy Tab S8 Ultra',
    price: 24990000,
    currency: 'VND',
    imageUrl: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=400&fit=crop',
    description: 'Samsung Galaxy Tab S8 Ultra với màn hình 14.6 inch, bút S-Pen, hiệu năng mạnh mẽ',
    url: '/products/samsung-tab-s8-ultra',
    discount: 12,
    rating: 4.5,
    averageRating: 4.5,
    inStock: true,
    stock: 12,
    categoryId: 'cat4',
    category: {
      id: 'cat4',
      name: 'Tablet'
    }
  },
  {
    id: 'p8',
    name: 'Xiaomi 13 Pro',
    price: 19990000,
    currency: 'VND',
    imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop',
    description: 'Xiaomi 13 Pro với camera Leica, chip Snapdragon 8 Gen 2, sạc nhanh 120W',
    url: '/products/xiaomi-13-pro',
    rating: 4.4,
    averageRating: 4.4,
    inStock: true,
    stock: 20,
    categoryId: 'cat1',
    category: {
      id: 'cat1',
      name: 'Điện thoại'
    }
  }
];

// Các từ khóa tiếng Việt và tiếng Anh cho từng sản phẩm để tìm kiếm
const productKeywords: Record<string, string[]> = {
  'p1': ['iphone', 'iphone 14', 'iphone 14 pro', 'iphone 14 pro max', 'điện thoại apple', 'điện thoại iphone', 'apple', 'smartphone', 'điện thoại'],
  'p2': ['macbook', 'macbook air', 'macbook air m2', 'laptop apple', 'laptop', 'máy tính xách tay', 'apple'],
  'p3': ['samsung', 'galaxy', 's23', 'ultra', 'galaxy s23', 's23 ultra', 'samsung galaxy', 'điện thoại samsung', 'điện thoại', 'smartphone'],
  'p4': ['airpods', 'airpods pro', 'airpods pro 2', 'tai nghe', 'tai nghe apple', 'tai nghe không dây', 'apple'],
  'p5': ['ipad', 'ipad air', 'ipad air 5', 'máy tính bảng', 'tablet', 'apple'],
  'p6': ['apple watch', 'watch', 'đồng hồ', 'đồng hồ thông minh', 'apple watch series 8', 'series 8', 'smartwatch', 'apple'],
  'p7': ['samsung', 'galaxy tab', 'tab s8', 'tab s8 ultra', 'máy tính bảng', 'tablet', 'samsung galaxy'],
  'p8': ['xiaomi', 'xiaomi 13', 'xiaomi 13 pro', 'điện thoại xiaomi', 'điện thoại', 'smartphone']
};

// Hàm tính điểm phù hợp cho kết quả tìm kiếm
function calculateRelevanceScore(product, query) {
  if (!query) return 0;

  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);
  const normalizedQuery = normalizeString(queryLower);

  const nameLower = product.name.toLowerCase();
  const descriptionLower = product.description ? product.description.toLowerCase() : '';
  const normalizedName = normalizeString(nameLower);
  const normalizedDesc = normalizeString(descriptionLower);

  let score = 0;

  // Trùng khớp chính xác với tên (ưu tiên cao nhất)
  if (nameLower === queryLower) {
    score += 200; // Tăng điểm cho trùng khớp chính xác
  }

  // Tên bắt đầu bằng từ khóa (rất quan trọng)
  if (nameLower.startsWith(queryLower)) {
    score += 100; // Tăng điểm vì đây là một dấu hiệu quan trọng của sự liên quan
  }

  // Tên chứa từ khóa
  if (nameLower.includes(queryLower)) {
    score += 80; // Tăng điểm vì đây là dấu hiệu mạnh của sự liên quan
  }

  // Tìm kiếm với tên và từ khóa đã chuẩn hóa
  if (normalizedName === normalizedQuery) {
    score += 180; // Điểm cho trùng khớp chính xác sau khi chuẩn hóa
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    score += 90; // Điểm cho bắt đầu bằng từ khóa sau khi chuẩn hóa
  }

  if (normalizedName.includes(normalizedQuery)) {
    score += 70; // Điểm cho chứa từ khóa sau khi chuẩn hóa
  }

  // Các từ trong tên trùng khớp với từ trong từ khóa
  const nameWords = nameLower.split(/\s+/).filter(w => w.length > 1);

  let totalMatchedWords = 0;
  let totalExactMatchedWords = 0;

  for (const queryWord of queryWords) {
    let wordMatched = false;
    let exactMatch = false;

    for (const nameWord of nameWords) {
      // Trùng khớp chính xác từng từ
      if (nameWord === queryWord) {
        score += 50; // Tăng điểm cho trùng khớp chính xác từng từ
        wordMatched = true;
        exactMatch = true;
      }
      // Từ bắt đầu bằng từ khóa
      else if (nameWord.startsWith(queryWord)) {
        score += 40;
        wordMatched = true;
      }
      // Từ chứa từ khóa
      else if (nameWord.includes(queryWord)) {
        score += 30;
        wordMatched = true;
      }

      // So khớp từ đã chuẩn hóa
      const normalizedNameWord = normalizeString(nameWord);
      const normalizedQueryWord = normalizeString(queryWord);
      if (normalizedNameWord === normalizedQueryWord && !wordMatched) {
        score += 40;
        wordMatched = true;
      }
    }

    if (wordMatched) {
      totalMatchedWords++;
      if (exactMatch) {
        totalExactMatchedWords++;
      }
    }
  }

  // Thưởng điểm nếu tất cả từ khóa tìm kiếm đều khớp với tên sản phẩm
  if (queryWords.length > 1 && totalMatchedWords === queryWords.length) {
    score += 100; // Cộng thêm điểm nếu tất cả từ khóa đều khớp
  }

  // Thưởng điểm nếu tất cả các từ khóa đều khớp chính xác
  if (queryWords.length > 1 && totalExactMatchedWords === queryWords.length) {
    score += 120;
  }

  // Kiểm tra tỷ lệ khớp với từ khóa đầy đủ
  if (queryWords.length > 1) {
    const matchRatio = totalMatchedWords / queryWords.length;
    score += Math.round(matchRatio * 50); // Cộng điểm dựa trên tỷ lệ khớp
  }

  // Mô tả chứa từ khóa (ưu tiên thấp hơn)
  if (descriptionLower.includes(queryLower)) {
    score += 25; // Tăng điểm cho mô tả khớp với từ khóa
  }

  if (normalizedDesc.includes(normalizedQuery)) {
    score += 20;
  }

  // Kiểm tra các từ trong mô tả
  if (descriptionLower) {
    const descWords = descriptionLower.split(/\s+/).filter(w => w.length > 1);
    let descWordMatches = 0;

    for (const queryWord of queryWords) {
      for (const descWord of descWords) {
        if (descWord === queryWord || descWord.includes(queryWord)) {
          descWordMatches++;
          break;
        }
      }
    }

    // Thưởng điểm nếu nhiều từ khóa khớp với mô tả
    if (descWordMatches > 0) {
      score += Math.min(descWordMatches * 5, 25);
    }
  }

  // Thêm điểm cho sản phẩm còn hàng
  if (product.inStock) {
    score += 10; // Ưu tiên sản phẩm còn hàng cao hơn
  }

  // Thưởng điểm cho sản phẩm có rating cao (nếu có)
  if (product.rating) {
    score += Math.min(product.rating * 3, 15); // Tối đa 15 điểm cho rating cao nhất (5 sao)
  }

  return score;
}

function normalizeString(str: string): string {
  if (!str) return '';

  // Loại bỏ dấu trong tiếng Việt và chuyển thành chữ thường
  let result = str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  // Thay thế các ký tự đặc biệt bằng khoảng trắng
  result = result.replace(/[^\w\s]/g, ' ');

  // Thay thế các chuỗi khoảng trắng liên tiếp bằng một khoảng trắng
  result = result.replace(/\s+/g, ' ');

  // Loại bỏ khoảng trắng ở đầu và cuối chuỗi
  result = result.trim();

  // Xử lý các từ tiếng Việt phổ biến bị viết sai hoặc thiếu dấu
  const vietnameseReplacements = {
    'dien thoai': 'dienthoai',
    'smartphone': 'dienthoai',
    'may tinh': 'maytinh',
    'may tinh bang': 'maytinhbang',
    'laptop': 'maytinh',
    'tai nghe': 'tainghe',
    'am thanh': 'amthanh',
    'loa': 'amthanh',
    'phu kien': 'phukien',
    'man hinh': 'manhinh',
    'choi game': 'game',
    'gaming': 'game',
    'ban phim': 'banphim',
    'chuot': 'chuot',
    'pin': 'pin',
    'sac': 'pin',
  };

  // Áp dụng các quy tắc thay thế
  for (const [pattern, replacement] of Object.entries(vietnameseReplacements)) {
    // Thay thế từ đầy đủ
    if (result === pattern) {
      return replacement;
    }

    // Thay thế khi từ xuất hiện là một phần riêng biệt
    result = result.replace(new RegExp(`\\b${pattern}\\b`, 'g'), replacement);
  }

  return result;
}

export async function GET(request: Request) {
  try {
    console.log("Bắt đầu xử lý API search request");
    const { searchParams } = new URL(request.url);

    // Get search parameters
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'relevance';
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');
    const inStockStr = searchParams.get('inStock');
    const ratingStr = searchParams.get('rating');

    // Parse numeric parameters
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 12;
    const skip = (page - 1) * limit;

    const minPrice = minPriceStr ? parseInt(minPriceStr, 10) : undefined;
    const maxPrice = maxPriceStr ? parseInt(maxPriceStr, 10) : undefined;
    const inStock = inStockStr === 'true';
    const rating = ratingStr ? parseInt(ratingStr, 10) : undefined;

    // Define search parameters for cache key generation
    const searchParamsForCache = {
      query,
      category,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
      inStock: inStockStr,
      rating
    };

    console.log("Tham số tìm kiếm:", searchParamsForCache);

    // Bypass cache for larger datasets and admin queries
    const bypassCache = searchParams.get('bypass_cache') === 'true' || limit > 50;

    // Generate cache key
    const cacheKey = generateCacheKey(searchParamsForCache);

    // Check if we have a valid cached result
    if (!bypassCache && searchCache.has(cacheKey)) {
      const cachedData = searchCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_TIME) {
        console.log("Sử dụng kết quả từ cache:", cacheKey);
        return NextResponse.json(cachedData.data);
      } else {
        // Cache expired, remove it
        searchCache.delete(cacheKey);
      }
    }

    console.log("USE_MOCK_DATA:", process.env.USE_MOCK_DATA);

    // Use mock data if explicitly configured in environment (always check process.env.USE_MOCK_DATA directly)
    if (process.env.USE_MOCK_DATA === 'true') {
      console.log("Đang sử dụng mock data theo cấu hình");

      // Use timeout to simulate network delay for development testing
      await new Promise(resolve => setTimeout(resolve, 500));

      let filteredProducts = [...mockProducts];

      // Lọc theo tên và mô tả nếu có query
      if (query) {
        const normalizedQuery = normalizeString(query.toLowerCase());
        const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);

        filteredProducts = mockProducts.filter(product => {
          const nameLower = product.name.toLowerCase();
          const descriptionLower = product.description ? product.description.toLowerCase() : '';
          const normalizedName = normalizeString(nameLower);
          const normalizedDesc = normalizeString(descriptionLower);

          // Tạo mảng các điều kiện kiểm tra
          const conditions = [];

          // Kiểm tra tên sản phẩm (ưu tiên cao nhất)
          conditions.push(
            // Trùng khớp chính xác tên
            nameLower === query.toLowerCase(),
            // Tên bắt đầu bằng query
            nameLower.startsWith(query.toLowerCase()),
            // Tên chứa query
            nameLower.includes(query.toLowerCase()),
            // Tên sau khi chuẩn hóa trùng khớp query
            normalizedName === normalizedQuery,
            // Tên sau khi chuẩn hóa bắt đầu bằng query
            normalizedName.startsWith(normalizedQuery),
            // Tên sau khi chuẩn hóa chứa query
            normalizedName.includes(normalizedQuery)
          );

          // Kiểm tra mô tả sản phẩm (ưu tiên thấp hơn)
          conditions.push(
            // Mô tả chứa query
            descriptionLower.includes(query.toLowerCase()),
            // Mô tả sau khi chuẩn hóa chứa query
            normalizedDesc.includes(normalizedQuery)
          );

          // Kiểm tra từng từ trong query
          for (const word of queryWords) {
            if (word.length > 1) {
              const normalizedWord = normalizeString(word);

              // Kiểm tra từng từ trong tên
              const nameWords = nameLower.split(/\s+/).filter(w => w.length > 1);
              for (const nameWord of nameWords) {
                const normalizedNameWord = normalizeString(nameWord);
                conditions.push(
                  // Từ trong tên trùng khớp với từ trong query
                  nameWord === word,
                  // Từ trong tên bắt đầu bằng từ trong query
                  nameWord.startsWith(word),
                  // Từ trong tên chứa từ trong query
                  nameWord.includes(word),
                  // Từ trong tên sau khi chuẩn hóa trùng khớp với từ trong query
                  normalizedNameWord === normalizedWord,
                  // Từ trong tên sau khi chuẩn hóa bắt đầu bằng từ trong query
                  normalizedNameWord.startsWith(normalizedWord)
                );
              }

              // Kiểm tra từng từ trong mô tả
              if (descriptionLower) {
                const descWords = descriptionLower.split(/\s+/).filter(w => w.length > 1);
                for (const descWord of descWords) {
                  conditions.push(
                    // Từ trong mô tả trùng khớp với từ trong query
                    descWord === word,
                    // Từ trong mô tả chứa từ trong query
                    descWord.includes(word)
                  );
                }
              }
            }
          }

          // Kiểm tra danh mục sản phẩm (nếu có)
          if (product.category && product.category.name) {
            const categoryName = product.category.name.toLowerCase();
            conditions.push(
              // Tên danh mục chứa query
              categoryName.includes(query.toLowerCase()),
              // Tên danh mục sau khi chuẩn hóa chứa query
              normalizeString(categoryName).includes(normalizedQuery)
            );
          }

          // Trả về true nếu thỏa mãn bất kỳ điều kiện nào
          return conditions.some(condition => condition === true);
        });

        // Tính điểm phù hợp cho mỗi sản phẩm
        filteredProducts.forEach(product => {
          product.relevanceScore = calculateRelevanceScore(product, query);
        });
      }

      // Lọc theo danh mục
      if (category) {
        filteredProducts = filteredProducts.filter(p => p.categoryId === category);
      }

      // Lọc theo khoảng giá
      if (minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price >= minPrice);
      }

      if (maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);
      }

      // Lọc theo tình trạng còn hàng
      if (inStock) {
        filteredProducts = filteredProducts.filter(p => p.inStock);
      }

      // Lọc theo đánh giá
      if (rating !== undefined) {
        // Giả lập đánh giá cho mock data
        filteredProducts = filteredProducts.filter(p => {
          // Giả định có trường avgRating hoặc tính toán thử nghiệm
          const mockRating = Math.floor(Math.random() * 5) + 1;
          return mockRating >= rating;
        });
      }

      // Sắp xếp theo các tiêu chí
      switch (sort) {
        case 'price_asc':
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          // Giả lập sắp xếp theo thời gian tạo mới nhất
          filteredProducts.reverse();
          break;
        case 'popular':
          // Giả lập sản phẩm phổ biến
          filteredProducts.sort(() => Math.random() - 0.5);
          break;
        case 'relevance':
        default:
          // Sắp xếp theo điểm phù hợp nếu có query
          if (query) {
            filteredProducts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
          }
          break;
      }

      // Phân trang kết quả
      const startIndex = skip;
      const endIndex = skip + limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      console.log(`Kết quả tìm kiếm: ${paginatedProducts.length}/${filteredProducts.length} sản phẩm`);

      // Thêm thông báo gợi ý nếu không tìm thấy kết quả phù hợp
      let suggestions = [];
      if (paginatedProducts.length === 0 && query && query.trim() !== '') {
        try {
          // Tìm các từ khóa tương tự để gợi ý
          const response = await fetch(`${request.url.split('/api')[0]}/api/products/suggestions?q=${encodeURIComponent(query)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.suggestions && Array.isArray(data.suggestions)) {
              suggestions = data.suggestions.slice(0, 5);
            }
          }
        } catch (suggestionError) {
          console.error('Lỗi khi lấy gợi ý tìm kiếm:', suggestionError);
        }
      }

      // Cache the results
      const result = {
        products: paginatedProducts,
        total: filteredProducts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredProducts.length / limit),
        ...(suggestions.length > 0 ? { suggestions } : {})
      };

      if (!bypassCache) {
        searchCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return NextResponse.json(result);
    }
    else {
      // Sử dụng Prisma để tìm kiếm trong database thực
      console.log("Đang tìm kiếm trong database thực với Prisma");

      // Xây dựng điều kiện tìm kiếm
      const where: any = { };

      // Nếu có query, thêm điều kiện tìm kiếm
      if (query && query.trim() !== '') {
        const normalizedQuery = normalizeString(query.toLowerCase());
        const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);

        // Mảng chứa tất cả các điều kiện tìm kiếm
        const searchConditions = [];

        // Điều kiện tìm kiếm chính xác và ưu tiên cao
        searchConditions.push(
          // Tìm kiếm chính xác trong tên (ưu tiên cao nhất)
          { name: { equals: query.toLowerCase() } },
          // Tìm kiếm tên bắt đầu bằng query (ưu tiên cao)
          { name: { startsWith: query.toLowerCase() } },
          // Tìm kiếm tên chứa query (ưu tiên trung bình)
          { name: { contains: query.toLowerCase() } }
        );

        // Tìm kiếm từng từ trong query trong tên và mô tả
        for (const word of queryWords) {
          if (word.length > 1) {
            searchConditions.push(
              { name: { contains: word.toLowerCase() } },
              { description: { contains: word.toLowerCase() } }
            );
          }
        }

        // Tìm kiếm cụm từ trong mô tả (ưu tiên thấp hơn)
        searchConditions.push({ description: { contains: query.toLowerCase() } });

        // Tạo điều kiện OR cho tất cả các điều kiện tìm kiếm
        where.OR = searchConditions;

        // Thêm tìm kiếm dựa trên mã sản phẩm hoặc SKU nếu có
        if (/^[a-zA-Z0-9-_]+$/.test(query)) {
          where.OR.push(
            { sku: { contains: query.toUpperCase() } },
            { productCode: { contains: query.toUpperCase() } }
          );
        }

        // Thêm tìm kiếm theo tên danh mục nếu phù hợp
        where.OR.push(
          {
            category: {
              name: {
                contains: query.toLowerCase()
              }
            }
          }
        );

        // Thêm tìm kiếm theo thương hiệu nếu phù hợp
        where.OR.push(
          {
            brand: {
              name: {
                contains: query.toLowerCase()
              }
            }
          }
        );

        // Nếu có từ khóa về giá trong query, thử áp dụng lọc giá
        if (
          query.includes('giá rẻ') ||
          query.includes('rẻ') ||
          query.includes('thấp') ||
          query.includes('tiết kiệm')
        ) {
          // Tạo điều kiện lọc giá thấp (có thể điều chỉnh ngưỡng giá)
          where.OR.push({ price: { lt: 5000000 } });
        }

        if (
          query.includes('cao cấp') ||
          query.includes('đắt') ||
          query.includes('premium') ||
          query.includes('sang trọng')
        ) {
          // Tạo điều kiện lọc giá cao (có thể điều chỉnh ngưỡng giá)
          where.OR.push({ price: { gt: 20000000 } });
        }
      }

      // Lọc theo danh mục nếu có
      if (category) {
        where.categoryId = category;
      }

      // Lọc theo khoảng giá nếu có
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};

        if (minPrice !== undefined) {
          where.price.gte = minPrice;
        }

        if (maxPrice !== undefined) {
          where.price.lte = maxPrice;
        }
      }

      // Lọc theo tình trạng còn hàng
      if (inStock) {
        where.inStock = true;
      }

      // Lọc theo đánh giá nếu có
      if (rating !== undefined) {
        where.rating = {
          gte: rating
        };
      }

      // Thiết lập điều kiện sắp xếp
      let orderBy: any = {};

      switch (sort) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'popular':
          orderBy = { createdAt: 'desc' }; // Đơn giản hóa, sau này có thể thay bằng lượt xem
          break;
        case 'relevance':
        default:
          // Mặc định sắp xếp theo thời gian tạo, sau đó sắp xếp lại theo điểm phù hợp
          orderBy = { createdAt: 'desc' };
          break;
      }

      try {
        // Lấy sản phẩm từ database
        console.log("Truy vấn Prisma với where:", JSON.stringify(where));
        console.log("Truy vấn Prisma với orderBy:", JSON.stringify(orderBy));

        // Thử truy vấn Prisma với xử lý lỗi tốt hơn
        let products = [];
        let total = 0;

        try {
          products = await prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
              category: true,
              images: {
                take: 1, // Chỉ lấy 1 ảnh đầu tiên nếu có nhiều
              },
            },
          });

          total = await prisma.product.count({ where });
        } catch (prismaError) {
          console.error('Lỗi Prisma cụ thể:', prismaError);

          // Kiểm tra xem có phải lỗi về cú pháp truy vấn không
          if (prismaError.message && (
              prismaError.message.includes('Unknown argument') ||
              prismaError.message.includes('mode') ||
              prismaError.message.includes('insensitive')
          )) {
            // Thử truy vấn với điều kiện đơn giản hơn
            console.log("Thử lại với truy vấn đơn giản hơn");

            // Xây dựng truy vấn đơn giản
            const simpleWhere: any = {};
            if (query && query.trim() !== '') {
              simpleWhere.OR = [
                { name: { contains: query.toLowerCase() } },
                { description: { contains: query.toLowerCase() } }
              ];
            }

            if (category) {
              simpleWhere.categoryId = category;
            }

            // Thử lại truy vấn với điều kiện đơn giản
            try {
              products = await prisma.product.findMany({
                where: simpleWhere,
                skip,
                take: limit,
                orderBy,
                include: {
                  category: true,
                  images: {
                    take: 1,
                  },
                },
              });

              total = await prisma.product.count({ where: simpleWhere });
            } catch (retryError) {
              console.error('Vẫn lỗi sau khi thử lại với truy vấn đơn giản:', retryError);
              throw retryError; // Ném lỗi để xử lý ở catch bên ngoài
            }
          } else {
            throw prismaError; // Ném lỗi để xử lý ở catch bên ngoài
          }
        }

        console.log(`Đã tìm thấy ${products.length} sản phẩm từ database`);

        // Tính điểm phù hợp cho mỗi sản phẩm nếu có query và sắp xếp theo relevance
        if (query && sort === 'relevance') {
          products.forEach(product => {
            product.relevanceScore = calculateRelevanceScore(product, query);
          });

          // Sắp xếp lại theo điểm phù hợp
          products.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }

        // Lưu lịch sử tìm kiếm nếu có query
        if (query && query.trim() !== '') {
          // Gọi hàm riêng biệt để xử lý, không ảnh hưởng đến quá trình tìm kiếm
          saveSearchHistory(query);
        }

        // Thêm thông báo gợi ý nếu không tìm thấy kết quả phù hợp
        let suggestions = [];
        if (total === 0 && query && query.trim() !== '') {
          try {
            // Tìm các từ khóa tương tự để gợi ý
            const response = await fetch(`${request.url.split('/api')[0]}/api/products/suggestions?q=${encodeURIComponent(query)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.suggestions && Array.isArray(data.suggestions)) {
                suggestions = data.suggestions.slice(0, 5);
              }
            }
          } catch (suggestionError) {
            console.error('Lỗi khi lấy gợi ý tìm kiếm:', suggestionError);
          }
        }

        // Cache the results
        const result = {
          products,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          ...(suggestions.length > 0 ? { suggestions } : {})
        };

        if (!bypassCache) {
          searchCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }

        return NextResponse.json(result);
      } catch (dbError) {
        console.error('Lỗi database:', dbError);

        // Always check process.env.ENABLE_FALLBACK_ON_ERROR directly
        if (process.env.ENABLE_FALLBACK_ON_ERROR === 'true') {
          console.log("Chuyển sang sử dụng dữ liệu mẫu do lỗi database (theo cấu hình)");

          // Use mock data silently without telling the user
          let filteredProducts = [...mockProducts];

          // Apply filters and sorting from the original mock data logic
          if (query) {
            const normalizedQuery = normalizeString(query.toLowerCase());
            const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);

            filteredProducts = mockProducts.filter(product => {
              // Sử dụng logic tìm kiếm đã cải tiến
              const nameLower = product.name.toLowerCase();
              const descriptionLower = product.description ? product.description.toLowerCase() : '';
              const normalizedName = normalizeString(nameLower);
              const normalizedDesc = normalizeString(descriptionLower);

              // Tạo mảng các điều kiện kiểm tra
              const conditions = [];

              // Kiểm tra tên sản phẩm (ưu tiên cao nhất)
              conditions.push(
                // Trùng khớp chính xác tên
                nameLower === query.toLowerCase(),
                // Tên bắt đầu bằng query
                nameLower.startsWith(query.toLowerCase()),
                // Tên chứa query
                nameLower.includes(query.toLowerCase()),
                // Tên sau khi chuẩn hóa trùng khớp query
                normalizedName === normalizedQuery,
                // Tên sau khi chuẩn hóa bắt đầu bằng query
                normalizedName.startsWith(normalizedQuery),
                // Tên sau khi chuẩn hóa chứa query
                normalizedName.includes(normalizedQuery)
              );

              // Kiểm tra mô tả sản phẩm (ưu tiên thấp hơn)
              conditions.push(
                // Mô tả chứa query
                descriptionLower.includes(query.toLowerCase()),
                // Mô tả sau khi chuẩn hóa chứa query
                normalizedDesc.includes(normalizedQuery)
              );

              // Trả về true nếu thỏa mãn bất kỳ điều kiện nào
              return conditions.some(condition => condition === true);
            });

            // Tính điểm phù hợp cho mỗi sản phẩm
            filteredProducts.forEach(product => {
              product.relevanceScore = calculateRelevanceScore(product, query);
            });
          }

          // Lọc theo danh mục và các điều kiện khác
          if (category) {
            filteredProducts = filteredProducts.filter(p => p.categoryId === category);
          }

          if (minPrice !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price >= minPrice);
          }

          if (maxPrice !== undefined) {
            filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);
          }

          if (inStock) {
            filteredProducts = filteredProducts.filter(p => p.inStock);
          }

          // Sắp xếp theo các tiêu chí
          switch (sort) {
            case 'price_asc':
              filteredProducts.sort((a, b) => a.price - b.price);
              break;
            case 'price_desc':
              filteredProducts.sort((a, b) => b.price - a.price);
              break;
            case 'newest':
              // Giả lập sắp xếp theo thời gian tạo mới nhất
              filteredProducts.reverse();
              break;
            case 'popular':
              // Giả lập sản phẩm phổ biến
              filteredProducts.sort(() => Math.random() - 0.5);
              break;
            case 'relevance':
            default:
              // Sắp xếp theo điểm phù hợp nếu có query
              if (query) {
                filteredProducts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
              }
              break;
          }

          // Phân trang kết quả
          const startIndex = skip;
          const endIndex = skip + limit;
          const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

          // Thêm thông báo gợi ý nếu không tìm thấy kết quả phù hợp
          let suggestions = [];
          if (paginatedProducts.length === 0 && query && query.trim() !== '') {
            try {
              // Tìm các từ khóa tương tự để gợi ý
              const response = await fetch(`${request.url.split('/api')[0]}/api/products/suggestions?q=${encodeURIComponent(query)}`);
              if (response.ok) {
                const data = await response.json();
                if (data.suggestions && Array.isArray(data.suggestions)) {
                  suggestions = data.suggestions.slice(0, 5);
                }
              }
            } catch (suggestionError) {
              console.error('Lỗi khi lấy gợi ý tìm kiếm:', suggestionError);
            }
          }

          // Cache the results
          const result = {
            products: paginatedProducts,
            total: filteredProducts.length,
            page,
            limit,
            totalPages: Math.ceil(filteredProducts.length / limit),
            ...(suggestions.length > 0 ? { suggestions } : {})
          };

          if (!bypassCache) {
            searchCache.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
          }

          return NextResponse.json(result);
        }

        // Return specific database error message
        return NextResponse.json(
          {
            error: 'Database Error',
            message: 'Lỗi kết nối cơ sở dữ liệu: ' + (dbError.message || 'Không xác định'),
            products: [],
            total: 0,
            page,
            limit,
            totalPages: 0
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.',
        products: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0
      },
      { status: 500 }
    );
  }
}

// Cache cleanup function
export function cleanupCache() {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Cleaning up search cache. Current size: ${searchCache.size} entries`);
  }
  const now = Date.now();
  let expiredCount = 0;

  // Lọc và xóa các cache hết hạn
  for (const [key, { timestamp }] of searchCache.entries()) {
    if (now - timestamp > CACHE_EXPIRY_TIME) {
      searchCache.delete(key);
      expiredCount++;
    }
  }

  // Nếu kích thước vẫn lớn, xóa các mục cũ nhất
  if (searchCache.size > 1000) {
    const entries = Array.from(searchCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Xóa 20% entry cũ nhất
    const toDelete = Math.ceil(searchCache.size * 0.2);
    for (let i = 0; i < toDelete; i++) {
      if (entries[i]) {
        searchCache.delete(entries[i][0]);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Deleted ${toDelete} oldest cache entries due to size limit`);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`Cache cleanup complete. Removed ${expiredCount} expired entries. New size: ${searchCache.size}`);
  }
}

// Thiết lập định kỳ dọn dẹp cache mỗi giờ
let cleanupInterval: NodeJS.Timeout;
if (typeof window === 'undefined') { // Chỉ chạy trên server
  clearInterval(cleanupInterval); // Đảm bảo không có interval đang chạy
  cleanupInterval = setInterval(cleanupCache, 60 * 60 * 1000);
}

// Tối ưu việc lưu lịch sử tìm kiếm
async function saveSearchHistory(query: string) {
  if (!query || query.trim().length < 2) return;

  try {
    // Kiểm tra xem query đã tồn tại chưa
    const existingQuery = await prisma.searchQuery.findFirst({
      where: {
        query: {
          equals: query.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingQuery) {
      // Nếu đã tồn tại, tăng count lên
      await prisma.searchQuery.update({
        where: { id: existingQuery.id },
        data: {
          count: existingQuery.count + 1,
          createdAt: new Date() // Cập nhật thời gian tìm kiếm mới nhất
        }
      });
    } else {
      // Nếu chưa tồn tại, tạo mới
      await prisma.searchQuery.create({
        data: {
          query: query.trim(),
          userId: 'anonymous', // Trong thực tế, đây sẽ là ID người dùng thực
          count: 1
        }
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Lỗi khi lưu lịch sử tìm kiếm:', error);
    }
    // Không throw error để không ảnh hưởng đến quá trình tìm kiếm
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, language = 'vi' } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const lowerQuery = query.toLowerCase();

    // Tìm các sản phẩm phù hợp với từ khóa tìm kiếm
    const matchedProducts = mockProducts.filter(product => {
      const keywords = productKeywords[product.id] || [];
      return keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()));
    });

    // Giới hạn kết quả để không quá nhiều
    const limitedResults = matchedProducts.slice(0, 3);

    // Thêm thông tin ngôn ngữ cho sản phẩm nếu là tiếng Anh
    if (language === 'en') {
      limitedResults.forEach(product => {
        // Chuyển đổi tên và mô tả sang tiếng Anh
        if (product.id === 'p1') {
          product.name = 'iPhone 14 Pro Max';
          product.description = 'iPhone 14 Pro Max with powerful A16 Bionic chip, 48MP camera, Dynamic Island display';
        } else if (product.id === 'p2') {
          product.name = 'MacBook Air M2';
          product.description = 'MacBook Air M2 thin and light, powerful performance, all-day battery life';
        }
        // Tương tự cho các sản phẩm khác...
      });
    }

    return NextResponse.json({ products: limitedResults });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}