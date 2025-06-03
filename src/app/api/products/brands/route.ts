import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";

// Hàm trích xuất thương hiệu từ tên sản phẩm
function extractBrandFromProductName(productName: string): string | null {
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

export async function GET(request: NextRequest) {
  try {
    // Lấy tất cả brands từ database (ưu tiên trường brand)
    const products = await prisma.product.findMany({
      select: {
        name: true,
        brand: true,
      },
    });

    // Lấy brands từ trường brand hoặc trích xuất từ tên sản phẩm
    const brands = products
      .map(product => {
        // Ưu tiên trường brand nếu có
        if (product.brand) {
          return product.brand;
        }
        // Fallback: trích xuất từ tên sản phẩm
        return extractBrandFromProductName(product.name);
      })
      .filter(Boolean) // Loại bỏ null values
      .filter((brand, index, array) => array.indexOf(brand) === index) // Loại bỏ duplicates
      .sort(); // Sắp xếp theo alphabet

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thương hiệu:', error);
    
    // Fallback: trả về danh sách thương hiệu mặc định
    const fallbackBrands = [
      'Apple',
      'Samsung', 
      'Xiaomi',
      'Dell',
      'HP',
      'Lenovo',
      'ASUS',
      'Acer',
      'Sony',
      'LG',
      'Microsoft',
      'Google',
      'Huawei',
      'OPPO',
      'Vivo',
      'OnePlus',
      'Realme',
      'MSI',
      'Razer',
      'Logitech',
      'JBL',
      'Bose',
      'Nintendo'
    ].sort();
    
    return NextResponse.json(fallbackBrands);
  }
}
