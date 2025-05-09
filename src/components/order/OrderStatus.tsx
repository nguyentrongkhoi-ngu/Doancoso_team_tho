import React from 'react';

interface OrderStatusTrackerProps {
  status: string;
}

/**
 * Component hiển thị trạng thái đơn hàng dạng timeline
 */
const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ status }) => {
  return (
    <div className="mb-8">
      <h4 className="text-lg font-medium mb-4">Theo dõi đơn hàng</h4>
      <div className="flex justify-between mb-2">
        <StatusPoint 
          step={1} 
          label="Đặt hàng" 
          isActive={['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status)} 
        />
        <StatusDivider />
        <StatusPoint 
          step={2} 
          label="Xác nhận" 
          isActive={['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status)} 
        />
        <StatusDivider />
        <StatusPoint 
          step={3} 
          label="Vận chuyển" 
          isActive={['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status)} 
        />
        <StatusDivider />
        <StatusPoint 
          step={4} 
          label="Giao hàng" 
          isActive={['DELIVERED', 'COMPLETED'].includes(status)} 
        />
        <StatusDivider />
        <StatusPoint 
          step={5} 
          label="Hoàn thành" 
          isActive={status === 'COMPLETED'} 
        />
      </div>
    </div>
  );
};

interface StatusPointProps {
  step: number;
  label: string;
  isActive: boolean;
}

/**
 * Điểm đánh dấu trạng thái đơn hàng
 */
const StatusPoint: React.FC<StatusPointProps> = ({ step, label, isActive }) => {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isActive ? 'bg-primary text-primary-content' : 'bg-base-300'
      }`}>
        {step}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </div>
  );
};

/**
 * Đường kẻ ngang giữa các điểm trạng thái
 */
const StatusDivider: React.FC = () => {
  return (
    <div className="flex-1 border-t-2 self-start mt-4 border-dashed border-base-300 mx-2"></div>
  );
};

export default OrderStatusTracker; 