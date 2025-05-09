import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateUserBehaviorAnalysis } from "@/lib/recommendation-engine/user-behavior-analyzer";
import { logRecommendationInteraction } from "@/lib/recommendation-engine/recommendation-metrics";

// API để ghi lại hành vi người dùng
export async function POST(req: NextRequest) {
  try {
    // Ghi log bắt đầu request với timestamp
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    console.log(`API User Behavior [${requestId}]: Bắt đầu xử lý request - ${new Date().toISOString()}`);
    
    // Kiểm tra phương thức
    if (req.method !== 'POST') {
      console.warn(`API User Behavior [${requestId}]: Phương thức không được hỗ trợ - ${req.method}`);
      return NextResponse.json(
        { error: "Phương thức không được hỗ trợ" },
        { status: 405 }
      );
    }
    
    let requestData;
    try {
      requestData = await req.json();
      console.log(`API User Behavior [${requestId}]: Dữ liệu đầu vào:`, JSON.stringify(requestData));
    } catch (parseError) {
      console.error(`API User Behavior [${requestId}]: Lỗi khi phân tích dữ liệu JSON:`, parseError);
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }
    
    const { productId, action, duration, searchQuery, recommendationType } = requestData;
    
    // Kiểm tra dữ liệu đầu vào
    if (!action) {
      console.warn(`API User Behavior [${requestId}]: Thiếu thông tin hành động`);
      return NextResponse.json(
        { error: "Thiếu thông tin hành động" },
        { status: 400 }
      );
    }
    
    // Lấy thông tin phiên đăng nhập
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Log thông tin người dùng
    if (userId) {
      console.log(`API User Behavior [${requestId}]: Xử lý cho userId=${userId}, email=${session?.user?.email}`);
    } else {
      console.log(`API User Behavior [${requestId}]: User chưa đăng nhập, tiếp tục xử lý với user ẩn danh`);
    }
    
    // Tạo userId ẩn danh nếu chưa đăng nhập (dựa vào header)
    const anonymousId = userId || req.headers.get('x-anonymous-id') || 'anonymous';
    
    // Xử lý các loại hành vi khác nhau
    switch (action) {
      case "view_product":
        if (!productId) {
          console.warn(`API User Behavior [${requestId}]: Thiếu mã sản phẩm`);
          return NextResponse.json(
            { error: "Thiếu mã sản phẩm" },
            { status: 400 }
          );
        }
        
        try {
          // Kiểm tra sản phẩm tồn tại
          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true, categoryId: true }
          });
          
          if (!product) {
            console.warn(`API User Behavior [${requestId}]: Sản phẩm không tồn tại - ID=${productId}`);
            return NextResponse.json(
              { error: "Sản phẩm không tồn tại" },
              { status: 404 }
            );
          }
          
          console.log(`API User Behavior [${requestId}]: Đang ghi lại view cho sản phẩm "${product.name}" (ID=${productId}), user ID=${userId || anonymousId}`);
          
          if (!userId) {
            // Nếu không có userId (chưa đăng nhập), chỉ ghi log nhưng không lưu vào DB
            console.log(`API User Behavior [${requestId}]: User chưa đăng nhập, chỉ ghi log hoạt động view sản phẩm`);
            return NextResponse.json({ success: true, tracked: false, reason: "anonymous_user" });
          }
          
          // Tìm hoặc tạo bản ghi xem sản phẩm
          const productUserKey = { userId, productId };
          
          try {
            const existingView = await prisma.productView.findUnique({
              where: {
                userId_productId: productUserKey,
              },
            });
            
            if (existingView) {
              // Cập nhật bản ghi hiện có
              console.log(`API User Behavior [${requestId}]: Cập nhật lượt xem hiện có - viewId=${existingView.id}, lượt xem hiện tại=${existingView.viewCount}`);
              
              const updatedView = await prisma.productView.update({
                where: { id: existingView.id },
                data: {
                  viewCount: existingView.viewCount + 1,
                  duration: duration ? (existingView.duration || 0) + duration : existingView.duration,
                  updatedAt: new Date(), // Đảm bảo updatedAt luôn được cập nhật
                },
              });
              
              console.log(`API User Behavior [${requestId}]: Đã cập nhật lượt xem thành ${updatedView.viewCount}`);
            } else {
              // Tạo bản ghi mới
              console.log(`API User Behavior [${requestId}]: Tạo lượt xem mới cho sản phẩm ID=${productId}`);
              
              const newView = await prisma.productView.create({
                data: {
                  userId,
                  productId,
                  viewCount: 1,
                  duration: duration || 0,
                },
              });
              
              console.log(`API User Behavior [${requestId}]: Đã tạo bản ghi viewId=${newView.id}`);
            }
            
            // Cập nhật phân tích hành vi người dùng
            try {
              // Sử dụng module phân tích hành vi để cập nhật thông tin
              const updated = await updateUserBehaviorAnalysis(userId);
              
              if (updated) {
                console.log(`API User Behavior [${requestId}]: Đã cập nhật phân tích hành vi người dùng thành công`);
              } else {
                console.warn(`API User Behavior [${requestId}]: Không thể cập nhật phân tích hành vi`);
              }
            } catch (analysisError) {
              // Chỉ ghi log lỗi nhưng không ảnh hưởng đến kết quả trả về
              console.error(`API User Behavior [${requestId}]: Lỗi khi cập nhật phân tích hành vi người dùng:`, analysisError);
            }
            
            // Ghi lại tương tác với gợi ý nếu sản phẩm được xem từ gợi ý
            if (recommendationType) {
              await logRecommendationInteraction(userId, productId, recommendationType, 'view');
              console.log(`API User Behavior [${requestId}]: Đã ghi lại tương tác với gợi ý loại ${recommendationType}`);
            }
            
            console.log(`API User Behavior [${requestId}]: Đã ghi lại thành công lượt xem sản phẩm ID=${productId}`);
            return NextResponse.json({ success: true, tracked: true, productId });
          } catch (dbError) {
            console.error(`API User Behavior [${requestId}]: Lỗi database khi xử lý lượt xem:`, dbError);
            // Không throw lỗi, chỉ ghi log và trả về lỗi
            return NextResponse.json(
              { 
                error: "Đã xảy ra lỗi khi lưu thông tin xem sản phẩm",
                message: (dbError as Error).message
              },
              { status: 500 }
            );
          }
        } catch (viewError) {
          console.error(`API User Behavior [${requestId}]: Lỗi khi xử lý lượt xem sản phẩm:`, viewError);
          return NextResponse.json(
            { 
              error: "Đã xảy ra lỗi khi xử lý lượt xem sản phẩm",
              message: (viewError as Error).message
            },
            { status: 500 }
          );
        }
        break;
        
      case "product_click":
        if (!productId) {
          console.warn(`API User Behavior [${requestId}]: Thiếu mã sản phẩm`);
          return NextResponse.json(
            { error: "Thiếu mã sản phẩm" },
            { status: 400 }
          );
        }
        
        try {
          // Kiểm tra sản phẩm tồn tại
          const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true }
          });
          
          if (!product) {
            console.warn(`API User Behavior [${requestId}]: Sản phẩm không tồn tại - ID=${productId}`);
            return NextResponse.json(
              { error: "Sản phẩm không tồn tại" },
              { status: 404 }
            );
          }
          
          console.log(`API User Behavior [${requestId}]: Đang ghi lại click vào sản phẩm "${product.name}" (ID=${productId}), user ID=${userId || anonymousId}`);
          
          if (!userId) {
            // Nếu không có userId (chưa đăng nhập), chỉ ghi log nhưng không lưu vào DB
            console.log(`API User Behavior [${requestId}]: User chưa đăng nhập, chỉ ghi log hoạt động click sản phẩm`);
            return NextResponse.json({ success: true, tracked: false, reason: "anonymous_user" });
          }
          
          // Cập nhật phân tích hành vi - chúng ta không lưu thông tin click vào DB riêng
          // mà sẽ tận dụng để tính toán độ quan tâm tới sản phẩm trong phần phân tích
          try {
            const updated = await updateUserBehaviorAnalysis(userId);
            
            if (updated) {
              console.log(`API User Behavior [${requestId}]: Đã cập nhật phân tích hành vi người dùng thành công sau khi click sản phẩm`);
            } else {
              console.warn(`API User Behavior [${requestId}]: Không thể cập nhật phân tích hành vi sau khi click sản phẩm`);
            }
          } catch (analysisError) {
            console.error(`API User Behavior [${requestId}]: Lỗi khi cập nhật phân tích hành vi người dùng:`, analysisError);
          }
          
          // Ghi lại tương tác với gợi ý nếu sản phẩm được click từ gợi ý
          if (recommendationType) {
            await logRecommendationInteraction(userId, productId, recommendationType, 'view');
            console.log(`API User Behavior [${requestId}]: Đã ghi lại tương tác click với gợi ý loại ${recommendationType}`);
          }
          
          return NextResponse.json({ success: true, tracked: true, productId });
        } catch (clickError) {
          console.error(`API User Behavior [${requestId}]: Lỗi khi xử lý click sản phẩm:`, clickError);
          return NextResponse.json(
            { 
              error: "Đã xảy ra lỗi khi xử lý click sản phẩm",
              message: (clickError as Error).message
            },
            { status: 500 }
          );
        }
        break;
        
      case "search":
        if (!searchQuery) {
          console.warn(`API User Behavior [${requestId}]: Thiếu từ khóa tìm kiếm`);
          return NextResponse.json(
            { error: "Thiếu từ khóa tìm kiếm" },
            { status: 400 }
          );
        }
        
        // Chuẩn hóa từ khóa tìm kiếm
        const normalizedQuery = searchQuery.trim();
        
        // Bỏ qua từ khóa quá ngắn
        if (normalizedQuery.length < 2) {
          console.log(`API User Behavior [${requestId}]: Từ khóa tìm kiếm quá ngắn "${normalizedQuery}"`);
          return NextResponse.json({ success: true, tracked: false, reason: "query_too_short" });
        }
        
        try {
          console.log(`API User Behavior [${requestId}]: Đang ghi lại tìm kiếm "${normalizedQuery}" cho user ID=${userId || anonymousId}`);
          
          if (!userId) {
            // Nếu không có userId (chưa đăng nhập), chỉ ghi log
            console.log(`API User Behavior [${requestId}]: User chưa đăng nhập, chỉ ghi log tìm kiếm`);
            return NextResponse.json({ success: true, tracked: false, reason: "anonymous_user" });
          }
          
          // Lưu truy vấn tìm kiếm
          const searchRecord = await prisma.searchQuery.create({
            data: {
              userId,
              query: normalizedQuery,
            },
          });
          
          console.log(`API User Behavior [${requestId}]: Đã lưu tìm kiếm ID=${searchRecord.id}`);
          
          // Cập nhật phân tích hành vi người dùng
          await updateUserBehaviorAnalysis(userId);
          
          return NextResponse.json({ success: true, tracked: true, searchId: searchRecord.id });
        } catch (searchError) {
          console.error(`API User Behavior [${requestId}]: Lỗi khi lưu tìm kiếm:`, searchError);
          return NextResponse.json(
            { 
              error: "Đã xảy ra lỗi khi lưu thông tin tìm kiếm",
              message: (searchError as Error).message
            },
            { status: 500 }
          );
        }
        break;
        
      case "add_to_cart":
        if (!productId) {
          console.warn(`API User Behavior [${requestId}]: Thiếu mã sản phẩm`);
          return NextResponse.json(
            { error: "Thiếu mã sản phẩm" },
            { status: 400 }
          );
        }
        
        try {
          console.log(`API User Behavior [${requestId}]: Ghi nhận hành động thêm vào giỏ hàng sản phẩm ID=${productId}`);
          
          if (!userId) {
            console.log(`API User Behavior [${requestId}]: User chưa đăng nhập, không thể lưu thông tin giỏ hàng`);
            return NextResponse.json({ success: true, tracked: false, reason: "anonymous_user" });
          }
          
          // Cập nhật phân tích hành vi
          await updateUserBehaviorAnalysis(userId);
          
          // Ghi lại tương tác với gợi ý nếu sản phẩm được thêm vào giỏ hàng từ gợi ý
          if (recommendationType) {
            await logRecommendationInteraction(userId, productId, recommendationType, 'cart');
            console.log(`API User Behavior [${requestId}]: Đã ghi lại tương tác add_to_cart với gợi ý loại ${recommendationType}`);
          }
          
          return NextResponse.json({ success: true, tracked: true });
        } catch (cartError) {
          console.error(`API User Behavior [${requestId}]: Lỗi khi xử lý thêm vào giỏ hàng:`, cartError);
          return NextResponse.json(
            { 
              error: "Đã xảy ra lỗi khi ghi nhận thêm vào giỏ hàng",
              message: (cartError as Error).message
            },
            { status: 500 }
          );
        }
        break;
      
      case "purchase":
        try {
          console.log(`API User Behavior [${requestId}]: Ghi nhận hành động mua hàng`);
          
          if (!userId) {
            console.log(`API User Behavior [${requestId}]: User chưa đăng nhập, không thể lưu thông tin mua hàng`);
            return NextResponse.json({ success: true, tracked: false, reason: "anonymous_user" });
          }
          
          // Cập nhật phân tích hành vi
          await updateUserBehaviorAnalysis(userId);
          
          // Nếu có productId và recommendationType, ghi lại tương tác mua hàng từ gợi ý
          if (productId && recommendationType) {
            await logRecommendationInteraction(userId, productId, recommendationType, 'purchase');
            console.log(`API User Behavior [${requestId}]: Đã ghi lại tương tác purchase với gợi ý loại ${recommendationType}`);
          }
          
          return NextResponse.json({ success: true, tracked: true });
        } catch (purchaseError) {
          console.error(`API User Behavior [${requestId}]: Lỗi khi xử lý mua hàng:`, purchaseError);
          return NextResponse.json(
            { 
              error: "Đã xảy ra lỗi khi ghi nhận mua hàng",
              message: (purchaseError as Error).message
            },
            { status: 500 }
          );
        }
        break;
        
      default:
        console.warn(`API User Behavior [${requestId}]: Hành động không được hỗ trợ: ${action}`);
        return NextResponse.json(
          { error: "Hành động không được hỗ trợ" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Lỗi khi xử lý hành vi người dùng:", error);
    return NextResponse.json(
      { 
        error: "Đã xảy ra lỗi khi xử lý hành vi người dùng",
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
} 