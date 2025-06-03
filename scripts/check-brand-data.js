const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBrandData() {
  try {
    console.log('🔍 Kiểm tra dữ liệu brand hiện tại...\n');

    // Lấy tất cả sản phẩm
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        brand: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Tổng số sản phẩm: ${allProducts.length}\n`);

    // Phân loại sản phẩm
    const productsWithBrand = allProducts.filter(p => p.brand && p.brand.trim() !== '');
    const productsWithoutBrand = allProducts.filter(p => !p.brand || p.brand.trim() === '');

    console.log(`✅ Sản phẩm đã có brand: ${productsWithBrand.length}`);
    console.log(`❌ Sản phẩm chưa có brand: ${productsWithoutBrand.length}\n`);

    // Hiển thị sản phẩm đã có brand
    if (productsWithBrand.length > 0) {
      console.log('📋 Sản phẩm đã có brand:');
      productsWithBrand.forEach(p => {
        console.log(`  - ${p.name} → ${p.brand}`);
      });
      console.log('');
    }

    // Hiển thị sản phẩm chưa có brand
    if (productsWithoutBrand.length > 0) {
      console.log('📋 Sản phẩm chưa có brand:');
      productsWithoutBrand.forEach(p => {
        console.log(`  - ${p.name}`);
      });
      console.log('');
    }

    // Phân tích brand có thể được gán
    console.log('🎯 Phân tích brand có thể được gán:');
    const brandAnalysis = {};

    productsWithoutBrand.forEach(product => {
      const name = product.name.toLowerCase();
      let suggestedBrand = null;

      if (name.includes('iphone') || name.includes('apple') || name.includes('macbook') || name.includes('ipad') || name.includes('airpods')) {
        suggestedBrand = 'Apple';
      } else if (name.includes('samsung') || name.includes('galaxy')) {
        suggestedBrand = 'Samsung';
      } else if (name.includes('xiaomi') || name.includes('redmi')) {
        suggestedBrand = 'Xiaomi';
      } else if (name.includes('dell')) {
        suggestedBrand = 'Dell';
      } else if (name.includes('sony')) {
        suggestedBrand = 'Sony';
      } else if (name.includes('asus')) {
        suggestedBrand = 'ASUS';
      } else if (name.includes('hp')) {
        suggestedBrand = 'HP';
      } else if (name.includes('lenovo')) {
        suggestedBrand = 'Lenovo';
      } else if (name.includes('acer')) {
        suggestedBrand = 'Acer';
      } else if (name.includes('msi')) {
        suggestedBrand = 'MSI';
      } else if (name.includes('lg')) {
        suggestedBrand = 'LG';
      } else if (name.includes('huawei')) {
        suggestedBrand = 'Huawei';
      } else if (name.includes('oppo')) {
        suggestedBrand = 'OPPO';
      } else if (name.includes('vivo')) {
        suggestedBrand = 'Vivo';
      } else if (name.includes('realme')) {
        suggestedBrand = 'Realme';
      } else if (name.includes('oneplus')) {
        suggestedBrand = 'OnePlus';
      } else if (name.includes('google') || name.includes('pixel')) {
        suggestedBrand = 'Google';
      } else if (name.includes('microsoft') || name.includes('surface')) {
        suggestedBrand = 'Microsoft';
      } else if (name.includes('nintendo')) {
        suggestedBrand = 'Nintendo';
      } else if (name.includes('baseus')) {
        suggestedBrand = 'Baseus';
      } else if (name.includes('anker')) {
        suggestedBrand = 'Anker';
      } else if (name.includes('aukey')) {
        suggestedBrand = 'Aukey';
      } else if (name.includes('garmin')) {
        suggestedBrand = 'Garmin';
      }

      if (suggestedBrand) {
        if (!brandAnalysis[suggestedBrand]) {
          brandAnalysis[suggestedBrand] = [];
        }
        brandAnalysis[suggestedBrand].push({
          id: product.id,
          name: product.name
        });
      }
    });

    // Hiển thị phân tích
    Object.keys(brandAnalysis).forEach(brand => {
      console.log(`\n${brand} (${brandAnalysis[brand].length} sản phẩm):`);
      brandAnalysis[brand].forEach(product => {
        console.log(`  - ${product.name}`);
      });
    });

    // Tổng kết
    const totalCanUpdate = Object.values(brandAnalysis).reduce((sum, products) => sum + products.length, 0);
    console.log(`\n📈 Tổng kết:`);
    console.log(`  - Có thể cập nhật brand cho: ${totalCanUpdate} sản phẩm`);
    console.log(`  - Không xác định được brand: ${productsWithoutBrand.length - totalCanUpdate} sản phẩm`);

    return {
      total: allProducts.length,
      withBrand: productsWithBrand.length,
      withoutBrand: productsWithoutBrand.length,
      canUpdate: totalCanUpdate,
      brandAnalysis
    };

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
checkBrandData();
