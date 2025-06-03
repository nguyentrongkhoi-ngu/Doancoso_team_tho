const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBrandFilter() {
  try {
    console.log('🧪 Test bộ lọc brand...\n');

    // Test 1: Lấy tất cả brands
    console.log('📋 Test 1: Lấy danh sách brands');
    const allProducts = await prisma.product.findMany({
      select: { brand: true, name: true }
    });

    const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort();
    console.log(`Tìm thấy ${brands.length} brands:`, brands);
    console.log('');

    // Test 2: Lọc theo brand cụ thể
    const testBrands = ['Apple', 'Samsung', 'Xiaomi', 'Dell', 'Sony'];
    
    for (const brand of testBrands) {
      console.log(`📋 Test lọc brand: "${brand}"`);
      
      // Lọc theo trường brand
      const productsByBrand = await prisma.product.findMany({
        where: {
          OR: [
            { brand: brand },
            { name: { contains: brand } }
          ]
        },
        select: { name: true, brand: true }
      });

      console.log(`  Tìm thấy ${productsByBrand.length} sản phẩm:`);
      productsByBrand.forEach(p => {
        console.log(`    - ${p.name} (brand: ${p.brand || 'null'})`);
      });
      console.log('');
    }

    // Test 3: Kiểm tra sản phẩm không có brand
    const productsWithoutBrand = await prisma.product.findMany({
      where: {
        OR: [
          { brand: null },
          { brand: '' }
        ]
      },
      select: { name: true, brand: true }
    });

    console.log(`📋 Sản phẩm không có brand: ${productsWithoutBrand.length}`);
    productsWithoutBrand.forEach(p => {
      console.log(`  - ${p.name}`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBrandFilter();
