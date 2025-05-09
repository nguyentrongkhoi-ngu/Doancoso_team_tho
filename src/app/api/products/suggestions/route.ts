import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Cache cho các gợi ý tìm kiếm để tăng tốc độ phản hồi
const suggestionsCache = new Map();
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 phút
const MAX_CACHE_SIZE = 1000; // Giới hạn số lượng cache để tránh memory leak

// Mock suggestions for fallback
const mockSuggestions = [
  'iPhone',
  'Samsung Galaxy',
  'MacBook Pro',
  'Dell XPS',
  'iPad',
  'Apple Watch',
  'Điện thoại',
  'Laptop gaming',
  'Tai nghe không dây',
  'Máy tính bảng'
];

// Danh sách từ khóa phổ biến có thể gợi ý
const popularKeywords = [
  'smartphone', 'điện thoại', 'laptop', 'máy tính', 'tai nghe', 'máy ảnh', 
  'apple', 'samsung', 'xiaomi', 'oppo', 'vivo', 'asus', 'dell', 'hp', 'lenovo',
  'gaming', 'chơi game', 'bluetooth', 'không dây', 'pin trâu', 'sạc nhanh', 
  'camera', 'chụp ảnh', 'màn hình', 'bàn phím', 'chuột', 'loa', 'âm thanh',
  'giá rẻ', 'cao cấp', 'mỏng nhẹ', 'chống nước', 'chống va đập'
];

// Các từ khóa xu hướng hot (có thể cập nhật định kỳ)
const trendingKeywords = [
  'iPhone 15',
  'Galaxy S24',
  'MacBook M3',
  'Tai nghe AirPods',
  'Laptop gaming',
  'Màn hình gaming',
  'Bàn phím cơ'
];

// Danh sách các sản phẩm nổi bật (có thể cập nhật từ database)
const featuredProducts = [
  'iPhone 15 Pro Max',
  'Samsung Galaxy S24 Ultra',
  'MacBook Pro 16 inch',
  'iPad Pro M2',
  'Apple Watch Series 9',
  'AirPods Pro 2',
  'Sony WH-1000XM5'
];

// Tính điểm phù hợp cho từng gợi ý
function scoreSuggestion(suggestion: string, query: string): number {
  if (!query) return 0;
  
  const queryLower = query.toLowerCase().trim();
  const normalizedQuery = normalizeString(queryLower);
  
  const suggestionLower = suggestion.toLowerCase();
  const normalizedSuggestion = normalizeString(suggestionLower);
  
  let score = 0;
  
  // Trùng khớp chính xác (với và không có dấu)
  if (suggestionLower === queryLower) {
    score += 1000; // Điểm cao nhất cho trùng khớp chính xác
  }
  
  if (normalizedSuggestion === normalizedQuery) {
    score += 900;
  }
  
  // Bắt đầu bằng query (với và không có dấu)
  if (suggestionLower.startsWith(queryLower)) {
    score += 800;
  }
  
  if (normalizedSuggestion.startsWith(normalizedQuery)) {
    score += 700;
  }
  
  // Chứa query dưới dạng một từ riêng biệt
  const suggestionWords = suggestionLower.split(/\s+/);
  if (suggestionWords.includes(queryLower)) {
    score += 600;
  }
  
  // Chỉ chứa query đâu đó trong chuỗi
  if (suggestionLower.includes(queryLower)) {
    score += 500;
  }
  
  if (normalizedSuggestion.includes(normalizedQuery)) {
    score += 400;
  }
  
  // Độ dài của gợi ý (ưu tiên gợi ý ngắn hơn)
  // Điều này giúp đưa các từ khóa tìm kiếm phổ biến lên trước các cụm từ dài
  const lengthPenalty = Math.min(suggestionLower.length / 10, 5);
  score -= lengthPenalty;
  
  // Nếu gợi ý có từ "mua" hoặc "giá", tăng điểm nếu query liên quan đến mua sắm
  if ((suggestionLower.includes('mua') || suggestionLower.includes('giá')) && 
      (queryLower.includes('mua') || queryLower.includes('giá'))) {
    score += 200;
  }
  
  // Ưu tiên cao cho gợi ý trending
  if (trendingKeywords.map(k => k.toLowerCase()).includes(suggestionLower)) {
    score += 300;
  }
  
  // Ưu tiên cao cho gợi ý là các sản phẩm nổi bật
  if (featuredProducts.map(p => p.toLowerCase()).includes(suggestionLower)) {
    score += 250;
  }
  
  return score;
}

// Hàm chuẩn hóa tiếng Việt (bỏ dấu)
function normalizeString(str: string): string {
  if (!str) return '';
  
  // Loại bỏ dấu trong tiếng Việt và chuyển thành chữ thường
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Hàm dọn dẹp cache để tránh memory leak
function cleanupCache() {
  if (suggestionsCache.size > MAX_CACHE_SIZE) {
    // Sắp xếp cache theo thời gian và giữ lại một nửa mới nhất
    const entries = Array.from(suggestionsCache.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, MAX_CACHE_SIZE / 2);
    
    // Xóa cache cũ và thêm lại các mục mới nhất
    suggestionsCache.clear();
    for (const [key, value] of entries) {
      suggestionsCache.set(key, value);
    }
  }
}

// Định kỳ dọn dẹp cache nếu API được gọi thường xuyên
setInterval(cleanupCache, CACHE_EXPIRY_TIME);

export async function GET(request: Request) {
  try {
    const startTime = Date.now();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    // Kiểm tra cache trước
    const cacheKey = query.toLowerCase().trim();
    if (suggestionsCache.has(cacheKey)) {
      const cachedData = suggestionsCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_TIME) {
        console.log(`[CACHE HIT] Sử dụng kết quả gợi ý từ cache: ${cacheKey} (${Date.now() - startTime}ms)`);
        
        // Cập nhật thời gian truy cập gần nhất
        cachedData.lastAccessed = Date.now();
        
        return NextResponse.json(cachedData.data);
      } else {
        // Cache expired, remove it
        suggestionsCache.delete(cacheKey);
      }
    }
    
    if (!query || query.trim().length < 2) {
      // Nếu không có từ khóa hoặc từ khóa quá ngắn, trả về gợi ý xu hướng hàng đầu
      try {
        // Lấy các từ khóa tìm kiếm gần đây nhất từ database
        const topSearches = await prisma.searchQuery.findMany({
          orderBy: [
            { count: 'desc' },
            { createdAt: 'desc' }
          ],
          distinct: ['query'],
          take: 7
        });
        
        const trendingSearches = topSearches.map(s => s.query);
        
        // Kết hợp với từ khóa trending
        const combinedTrending = [...new Set([...trendingSearches, ...trendingKeywords])].slice(0, 10);
        
        const result = { suggestions: combinedTrending.length > 0 ? combinedTrending : mockSuggestions.slice(0, 7) };
        
        // Cache kết quả
        suggestionsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          lastAccessed: Date.now()
        });
        
        console.log(`[API] Trả về xu hướng tìm kiếm (${Date.now() - startTime}ms)`);
        return NextResponse.json(result);
      } catch (err) {
        console.error('Lỗi khi lấy xu hướng tìm kiếm:', err);
        
        const result = { suggestions: mockSuggestions.slice(0, 7) };
        
        // Cache kết quả
        suggestionsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          lastAccessed: Date.now()
        });
        
        return NextResponse.json(result);
      }
    }
    
    try {
      // Tìm kiếm sản phẩm phù hợp với query
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { name: { startsWith: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          name: true,
          category: {
            select: {
              name: true
            }
          }
        },
        take: 30, // Tăng số lượng để có nhiều lựa chọn hơn trước khi lọc và sắp xếp
      });
      
      // Trích xuất tên sản phẩm độc nhất
      const productNames = [...new Set(products.map(p => p.name))];
      
      // Thêm từ gợi ý từ danh mục
      const categoryNames = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
      const categoryQueries = categoryNames.map(cat => `${query} ${cat}`);
      
      try {
        // Lấy các truy vấn tìm kiếm phổ biến từ database
        const popularSearches = await prisma.searchQuery.findMany({
          where: {
            OR: [
              { query: { contains: query, mode: 'insensitive' } },
              { query: { startsWith: query, mode: 'insensitive' } }
            ]
          },
          select: {
            query: true,
            count: true
          },
          orderBy: [
            { count: 'desc' },
            { createdAt: 'desc' }
          ],
          distinct: ['query'],
          take: 15
        });
        
        // Lấy các truy vấn tìm kiếm từ database
        const searchTerms = popularSearches.map(s => s.query);
        
        // Thêm biến thể "Mua [query]" nếu query có ý nghĩa
        const buyingSuggestions = query.trim().length > 3 ? [`Mua ${query}`, `${query} giá rẻ`] : [];
        
        // Thêm từ khóa phổ biến phù hợp với query
        const relevantKeywords = popularKeywords.filter(keyword => 
          keyword.includes(query.toLowerCase()) || normalizeString(keyword).includes(normalizeString(query))
        );
        
        // Tạo biến thể của query kết hợp với từ khóa phổ biến
        const variants = relevantKeywords
          .filter(keyword => keyword.length > 3)
          .map(keyword => query.includes(keyword) ? query : `${query} ${keyword}`)
          .slice(0, 5);
        
        // Tìm các từ khóa trending phù hợp
        const relevantTrending = trendingKeywords.filter(keyword => 
          keyword.toLowerCase().includes(query.toLowerCase()) || 
          normalizeString(keyword).includes(normalizeString(query))
        );
        
        // Kết hợp tất cả các gợi ý và loại bỏ trùng lặp
        let allSuggestions = [
          ...new Set([
            ...productNames, 
            ...searchTerms, 
            ...categoryQueries, 
            ...variants,
            ...relevantTrending,
            ...buyingSuggestions,
            ...relevantKeywords
          ])
        ];
        
        // Lọc ra những gợi ý quá ngắn
        allSuggestions = allSuggestions.filter(suggestion => suggestion && suggestion.trim().length > 2);
        
        // Tính điểm phù hợp cho mỗi gợi ý và sắp xếp
        const scoredSuggestions = allSuggestions
          .map(suggestion => ({
            text: suggestion,
            score: scoreSuggestion(suggestion, query)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(item => item.text);
        
        const result = { suggestions: scoredSuggestions };
        
        // Cache kết quả
        suggestionsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          lastAccessed: Date.now()
        });
        
        console.log(`[API] Đã tạo ${scoredSuggestions.length} gợi ý cho "${query}" (${Date.now() - startTime}ms)`);
        return NextResponse.json(result);
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu tìm kiếm từ database:', err);
        
        // Kiểm tra lỗi Prisma cụ thể và thử lại với truy vấn đơn giản hơn nếu cần
        let productNames: string[] = [];
        let categoryNames: string[] = [];
        
        if (err.message && (
            err.message.includes('Unknown argument') || 
            err.message.includes('mode') ||
            err.message.includes('insensitive')
        )) {
          // Thử lại với truy vấn đơn giản hơn
          try {
            const simpleProducts = await prisma.product.findMany({
              where: {
                OR: [
                  { name: { contains: query } },
                  { description: { contains: query } }
                ],
              },
              select: { 
                name: true,
                category: {
                  select: { name: true }
                }
              },
              take: 20,
            });
            
            productNames = [...new Set(simpleProducts.map(p => p.name))];
            categoryNames = [...new Set(simpleProducts.map(p => p.category?.name).filter(Boolean))];
          } catch (retryError) {
            console.error('Lỗi sau khi thử truy vấn đơn giản:', retryError);
            // Tiếp tục sử dụng mock data
          }
        }
        
        // Nếu có lỗi, trả về các gợi ý dựa trên tên sản phẩm
        const scoredSuggestions = productNames
          .map(suggestion => ({
            text: suggestion,
            score: scoreSuggestion(suggestion, query)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(item => item.text);
        
        // Thêm gợi ý từ từ khóa phổ biến nếu danh sách còn ít
        if (scoredSuggestions.length < 5) {
          const relevantKeywords = popularKeywords.filter(keyword => 
            keyword.includes(query.toLowerCase()) || normalizeString(keyword).includes(normalizeString(query))
          ).slice(0, 5);
          
          // Thêm vào danh sách gợi ý
          scoredSuggestions.push(...relevantKeywords);
        }
        
        const result = { suggestions: scoredSuggestions };
        
        // Cache kết quả
        suggestionsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          lastAccessed: Date.now()
        });
        
        return NextResponse.json(result);
      }
    } catch (dbError) {
      console.error('Lỗi kết nối database:', dbError);
      
      // Kiểm tra lỗi Prisma cụ thể và thử lại với truy vấn đơn giản hơn nếu cần
      let productNames: string[] = [];
      let categoryNames: string[] = [];
      
      if (dbError.message && (
          dbError.message.includes('Unknown argument') || 
          dbError.message.includes('mode') ||
          dbError.message.includes('insensitive')
      )) {
        // Thử lại với truy vấn đơn giản hơn
        try {
          const simpleProducts = await prisma.product.findMany({
            where: {
              OR: [
                { name: { contains: query } },
                { description: { contains: query } }
              ],
            },
            select: { 
              name: true,
              category: {
                select: { name: true }
              }
            },
            take: 20,
          });
          
          productNames = [...new Set(simpleProducts.map(p => p.name))];
          categoryNames = [...new Set(simpleProducts.map(p => p.category?.name).filter(Boolean))];
        } catch (retryError) {
          console.error('Lỗi sau khi thử truy vấn đơn giản:', retryError);
          // Tiếp tục sử dụng mock data
        }
      }
      
      // Sử dụng mock data khi có lỗi database
      const filteredSuggestions = mockSuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase()) ||
        normalizeString(suggestion).includes(normalizeString(query))
      );
      
      // Thêm các biến thể từ danh sách từ khóa phổ biến
      const variants = popularKeywords
        .filter(keyword => keyword.includes(query) || query.includes(keyword))
        .map(keyword => query.includes(keyword) ? query : `${query} ${keyword}`)
        .slice(0, 3);
      
      // Kết hợp và sắp xếp theo điểm số
      const combinedSuggestions = [...new Set([...filteredSuggestions, ...variants])];
      const scoredSuggestions = combinedSuggestions
        .map(suggestion => ({
          text: suggestion,
          score: scoreSuggestion(suggestion, query)
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.text)
        .slice(0, 10);
      
      const result = { suggestions: scoredSuggestions };
      
      // Cache kết quả
      suggestionsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        lastAccessed: Date.now()
      });
      
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Lỗi xử lý API suggestions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', suggestions: [] },
      { status: 500 }
    );
  }
} 