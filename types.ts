export interface User {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  avatar?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  menu: MenuItem[];
  isOpen: boolean;
}

export interface OrderItem {
  itemId: string;
  menuItem: MenuItem;
  quantity: number;
  userId: string;
  userName: string;
  notes?: string;
}

export interface RestaurantOrder {
  restaurantId: string;
  items: OrderItem[];
}

export interface VoteOption {
  id: string;
  text: string;
  votes: number;
  voterIds: string[];
}

export interface Poll {
  id: string;
  creatorId: string;
  creatorName: string;
  question: string;
  options: VoteOption[];
  isActive: boolean;
  createdAt: Date;
}

export type ViewState = 'home' | 'restaurant' | 'voting' | 'admin';