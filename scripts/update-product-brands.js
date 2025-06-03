const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Hàm trích xuất thương hiệu từ tên sản phẩm
function extractBrandFromProductName(productName) {
  const name = productName.toLowerCase();
  
  // Các thương hiệu phổ biến
  if (name.includes('iphone') || name.includes('apple') || name.includes('macbook') || name.includes('ipad') || name.includes('airpods') || name.includes('watch')) return 'Apple';
  if (name.includes('samsung') || name.includes('galaxy')) return 'Samsung';
  if (name.includes('xiaomi') || name.includes('redmi') || name.includes('mi ')) return 'Xiaomi';
  if (name.includes('dell')) return 'Dell';
  if (name.includes('sony')) return 'Sony';
  if (name.includes('asus')) return 'ASUS';
  if (name.includes('hp ') || name.includes('hewlett')) return 'HP';
  if (name.includes('lenovo') || name.includes('thinkpad')) return 'Lenovo';
  if (name.includes('acer')) return 'Acer';
  if (name.includes('msi')) return 'MSI';
  if (name.includes('lg')) return 'LG';
  if (name.includes('huawei')) return 'Huawei';
  if (name.includes('oppo')) return 'OPPO';
  if (name.includes('vivo')) return 'Vivo';
  if (name.includes('realme')) return 'Realme';
  if (name.includes('oneplus')) return 'OnePlus';
  if (name.includes('google') || name.includes('pixel')) return 'Google';
  if (name.includes('microsoft') || name.includes('surface')) return 'Microsoft';
  if (name.includes('nintendo')) return 'Nintendo';
  if (name.includes('playstation') || name.includes('ps5') || name.includes('ps4')) return 'Sony PlayStation';
  if (name.includes('xbox')) return 'Microsoft Xbox';
  if (name.includes('razer')) return 'Razer';
  if (name.includes('logitech')) return 'Logitech';
  if (name.includes('corsair')) return 'Corsair';
  if (name.includes('steelseries')) return 'SteelSeries';
  if (name.includes('hyperx')) return 'HyperX';
  if (name.includes('jbl')) return 'JBL';
  if (name.includes('bose')) return 'Bose';
  if (name.includes('sennheiser')) return 'Sennheiser';
  if (name.includes('audio-technica')) return 'Audio-Technica';
  if (name.includes('beats')) return 'Beats';
  if (name.includes('anker')) return 'Anker';
  if (name.includes('baseus')) return 'Baseus';
  if (name.includes('ugreen')) return 'UGREEN';
  if (name.includes('belkin')) return 'Belkin';
  if (name.includes('sandisk')) return 'SanDisk';
  if (name.includes('western digital') || name.includes('wd ')) return 'Western Digital';
  if (name.includes('seagate')) return 'Seagate';
  if (name.includes('kingston')) return 'Kingston';
  if (name.includes('crucial')) return 'Crucial';
  if (name.includes('intel')) return 'Intel';
  if (name.includes('amd')) return 'AMD';
  if (name.includes('nvidia') || name.includes('geforce')) return 'NVIDIA';
  if (name.includes('gigabyte')) return 'Gigabyte';
  if (name.includes('evga')) return 'EVGA';
  if (name.includes('zotac')) return 'ZOTAC';
  if (name.includes('palit')) return 'Palit';
  if (name.includes('galax')) return 'GALAX';
  if (name.includes('colorful')) return 'Colorful';
  if (name.includes('inno3d')) return 'Inno3D';
  if (name.includes('gainward')) return 'Gainward';
  
  return null;
}

async function updateProductBrands() {
  try {
    console.log('🚀 Bắt đầu cập nhật brands cho sản phẩm...');
    
    // Lấy tất cả sản phẩm chưa có brand
    const products = await prisma.product.findMany({
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
    
    console.log(`📦 Tìm thấy ${products.length} sản phẩm cần cập nhật brand`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const product of products) {
      const extractedBrand = extractBrandFromProductName(product.name);
      
      if (extractedBrand) {
        await prisma.product.update({
          where: { id: product.id },
          data: { brand: extractedBrand }
        });
        
        console.log(`✅ ${product.name} → ${extractedBrand}`);
        updatedCount++;
      } else {
        console.log(`⚠️  Không thể xác định brand cho: ${product.name}`);
        skippedCount++;
      }
    }
    
    console.log('\n📊 Kết quả:');
    console.log(`✅ Đã cập nhật: ${updatedCount} sản phẩm`);
    console.log(`⚠️  Bỏ qua: ${skippedCount} sản phẩm`);
    console.log('🎉 Hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật brands:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
updateProductBrands();
