const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixWrongBrands() {
  try {
    console.log('🔧 Sửa brand sai...\n');

    // Định nghĩa các sửa chữa cần thiết
    const fixes = [
      {
        nameContains: 'Samsung Galaxy Watch',
        correctBrand: 'Samsung',
        reason: 'Samsung Galaxy Watch phải là Samsung, không phải Apple'
      },
      {
        nameContains: 'Huawei Watch GT 5',
        correctBrand: 'Huawei', 
        reason: 'Huawei Watch phải là Huawei, không phải Apple'
      }
    ];

    console.log('📋 Các sửa chữa sẽ thực hiện:');
    
    for (const fix of fixes) {
      // Tìm sản phẩm cần sửa
      const products = await prisma.product.findMany({
        where: {
          name: { contains: fix.nameContains }
        },
        select: { id: true, name: true, brand: true }
      });

      console.log(`\n🔍 Tìm kiếm: "${fix.nameContains}"`);
      console.log(`  Tìm thấy ${products.length} sản phẩm:`);
      
      for (const product of products) {
        console.log(`    - ${product.name}`);
        console.log(`      Brand hiện tại: ${product.brand}`);
        console.log(`      Brand đúng: ${fix.correctBrand}`);
        
        if (product.brand !== fix.correctBrand) {
          console.log(`      ⚠️ Cần sửa: ${product.brand} → ${fix.correctBrand}`);
          
          // Thực hiện sửa
          await prisma.product.update({
            where: { id: product.id },
            data: { brand: fix.correctBrand }
          });
          
          console.log(`      ✅ Đã sửa thành công!`);
        } else {
          console.log(`      ✅ Brand đã đúng`);
        }
      }
    }

    console.log('\n🎉 Hoàn thành sửa brand sai!');

  } catch (error) {
    console.error('❌ Lỗi khi sửa brand:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWrongBrands();
