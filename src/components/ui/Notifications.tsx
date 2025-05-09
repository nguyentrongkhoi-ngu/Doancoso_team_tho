import React from 'react';
import Link from 'next/link';

interface SuccessAlertProps {
  message: string;
  linkText?: string;
  linkHref?: string;
  onDismiss?: () => void;
}

/**
 * Component hiển thị thông báo thành công
 */
export const SuccessAlert: React.FC<SuccessAlertProps> = ({ 
  message, 
  linkText, 
  linkHref, 
  onDismiss 
}) => {
  return (
    <div className="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        {message}
        {linkText && linkHref && (
          <Link href={linkHref} className="btn btn-xs btn-ghost ml-2">
            {linkText}
          </Link>
        )}
      </span>
      {onDismiss && (
        <button 
          className="btn btn-sm btn-ghost" 
          onClick={onDismiss}
          aria-label="Đóng"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * Component hiển thị thông báo lỗi
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  message, 
  onDismiss 
}) => {
  return (
    <div className="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
      {onDismiss && (
        <button 
          className="btn btn-sm btn-ghost" 
          onClick={onDismiss}
          aria-label="Đóng"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface LoadingProps {
  message?: string;
}

/**
 * Component hiển thị trạng thái đang tải
 */
export const Loading: React.FC<LoadingProps> = ({ message = 'Đang tải...' }) => {
  return (
    <div className="text-center p-8">
      <span className="loading loading-spinner loading-lg"></span>
      <p className="mt-4">{message}</p>
    </div>
  );
};

interface WarningAlertProps {
  message: string;
}

/**
 * Component hiển thị cảnh báo
 */
export const WarningAlert: React.FC<WarningAlertProps> = ({ message }) => {
  return (
    <div className="alert alert-warning">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}; 