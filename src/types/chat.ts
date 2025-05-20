export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  isFromAdmin?: boolean;
  productSuggestions?: ProductSuggestion[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatContextType {
  messages: Message[];
  sendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  description?: string;
  url: string;
  discount?: number;
  rating?: number;
  inStock?: boolean;
} 