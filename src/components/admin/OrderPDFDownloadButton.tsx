'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import OrderPDF from './reports/OrderPDF';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type Order = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

interface OrderPDFDownloadButtonProps {
  order: Order;
  fileName: string;
  buttonText: string;
  className?: string;
}

export default function OrderPDFDownloadButton({
  order,
  fileName,
  buttonText,
  className
}: OrderPDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={<OrderPDF order={order} />}
      fileName={fileName}
      className={className}
    >
      {({ loading }) =>
        loading ? 'Đang tạo PDF...' : buttonText
      }
    </PDFDownloadLink>
  );
}
