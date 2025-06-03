'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import OrdersReportPDF from './reports/OrdersReportPDF';

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

interface PDFDownloadButtonProps {
  orders: Order[];
  fromDate?: Date;
  toDate?: Date;
  statusFilter?: OrderStatus;
  fileName: string;
  buttonText: string;
  className?: string;
}

export default function PDFDownloadButton({
  orders,
  fromDate,
  toDate,
  statusFilter,
  fileName,
  buttonText,
  className
}: PDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={
        <OrdersReportPDF
          orders={orders}
          fromDate={fromDate}
          toDate={toDate}
          statusFilter={statusFilter}
        />
      }
      fileName={fileName}
      className={className}
    >
      {({ loading }) =>
        loading ? 'Đang tạo PDF...' : buttonText
      }
    </PDFDownloadLink>
  );
}
