const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateBrandData() {
  try {
    console.log('🔄 Bắt đầu cập nhật brand cho sản phẩm...\n');

    // Lấy sản phẩm chưa có brand
    const productsWithoutBrand = await prisma.product.findMany({
      where: {
        OR: [
          { brand: null },
          { brand: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        brand: true
      }
    });

    console.log(`📋 Tìm thấy ${productsWithoutBrand.length} sản phẩm chưa có brand\n`);

    // Định nghĩa các cập nhật an toàn
    const updates = [];

    productsWithoutBrand.forEach(product => {
      const name = product.name.toLowerCase();
      let suggestedBrand = null;

      // Chỉ cập nhật những brand rõ ràng, dễ xác định
      if (name.includes('aukey')) {
        suggestedBrand = 'Aukey';
      } else if (name.includes('garmin')) {
        suggestedBrand = 'Garmin';
      } else if (name.includes('amazfit')) {
        suggestedBrand = 'Amazfit';
      } else if (name.includes('dji')) {
        suggestedBrand = 'DJI';
      } else if (name.includes('nubia')) {
        suggestedBrand = 'Nubia';
      } else if (name.includes('flydigi')) {
        suggestedBrand = 'Flydigi';
      } else if (name.includes('e-dra')) {
        suggestedBrand = 'E-DRA';
      } else if (name.includes('aula')) {
        suggestedBrand = 'AULA';
      }

      if (suggestedBrand) {
        updates.push({
          id: product.id,
          name: product.name,
          currentBrand: product.brand,
          newBrand: suggestedBrand
        });
      }
    });

    // Hiển thị preview cập nhật
    console.log('📋 Preview các cập nhật sẽ thực hiện:');
    if (updates.length === 0) {
      console.log('  Không có sản phẩm nào cần cập nhật.');
      return;
    }

    updates.forEach((update, index) => {
      console.log(`  ${index + 1}. "${update.name}"`);
      console.log(`     Từ: ${update.currentBrand || 'null'} → Thành: ${update.newBrand}`);
      console.log('');
    });

    console.log(`📊 Tổng cộng: ${updates.length} sản phẩm sẽ được cập nhật\n`);

    // Thực hiện cập nhật
    console.log('🔄 Bắt đầu cập nhật...');
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        await prisma.product.update({
          where: { id: update.id },
          data: { brand: update.newBrand }
        });
        
        console.log(`✅ Cập nhật thành công: ${update.name} → ${update.newBrand}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Lỗi cập nhật ${update.name}:`, error.message);
        errorCount++;
      }
    }

    // Tổng kết
    console.log('\n📈 Kết quả cập nhật:');
    console.log(`  ✅ Thành công: ${successCount} sản phẩm`);
    console.log(`  ❌ Lỗi: ${errorCount} sản phẩm`);

    if (successCount > 0) {
      console.log('\n🎉 Cập nhật brand hoàn tất!');
      console.log('💡 Bây giờ bộ lọc brand sẽ hoạt động chính xác hơn.');
    }

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
updateBrandData();
