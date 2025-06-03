import { NextRequest, NextResponse } from 'next/server';
import { VNPAY_CONFIG, VNPayUtils } from '@/lib/vnpay-config';

export async function GET(req: NextRequest) {
  try {
    // Validate VNPay configuration
    const configValidation = VNPayUtils.validateConfig();
    
    if (!configValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'VNPay configuration is invalid',
          details: configValidation.errors,
          success: false
        },
        { status: 400 }
      );
    }

    // Test configuration details (without exposing sensitive data)
    const configInfo = {
      tmnCode: VNPAY_CONFIG.TMN_CODE ? `${VNPAY_CONFIG.TMN_CODE.substring(0, 4)}****` : 'Not set',
      hashSecret: VNPAY_CONFIG.HASH_SECRET ? `${VNPAY_CONFIG.HASH_SECRET.substring(0, 8)}****` : 'Not set',
      paymentUrl: VNPAY_CONFIG.PAYMENT_URL,
      returnUrl: VNPAY_CONFIG.RETURN_URL,
      ipnUrl: VNPAY_CONFIG.IPN_URL,
      version: VNPAY_CONFIG.VERSION,
      command: VNPAY_CONFIG.COMMAND,
      currencyCode: VNPAY_CONFIG.CURRENCY_CODE,
      locale: VNPAY_CONFIG.LOCALE,
      orderType: VNPAY_CONFIG.ORDER_TYPE
    };

    // Test date creation
    const testDate = VNPayUtils.createDate();
    
    // Test object sorting
    const testObject = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: 'TEST123',
      vnp_Amount: '10000000'
    };
    const sortedObject = VNPayUtils.sortObject(testObject);

    return NextResponse.json({
      success: true,
      message: 'VNPay configuration is valid and ready for use',
      config: configInfo,
      tests: {
        dateCreation: {
          format: 'yyyyMMddHHmmss',
          example: testDate,
          valid: /^\d{14}$/.test(testDate)
        },
        objectSorting: {
          original: testObject,
          sorted: sortedObject,
          valid: Object.keys(sortedObject).length === Object.keys(testObject).length
        }
      },
      merchantInfo: VNPAY_CONFIG.MERCHANT_INFO
    });

  } catch (error: any) {
    console.error('Error testing VNPay configuration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test VNPay configuration',
        details: error.message,
        success: false
      },
      { status: 500 }
    );
  }
}
