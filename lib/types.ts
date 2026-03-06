export interface ProductType {
  id: string;
  name: string;
  description: string;
  category: string;
  material: string;
  basePricePerGram: number;
  density: number;
  minDimX: number;
  minDimY: number;
  minDimZ: number;
  maxDimX: number;
  maxDimY: number;
  maxDimZ: number;
  defaultDimX: number;
  defaultDimY: number;
  defaultDimZ: number;
  finishCost: number;
  images: string[];
  colors: string[];
  featured: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartItemType {
  id: string;
  productId: string;
  material: string;
  color: string;
  quantity: number;
  dimX: number;
  dimY: number;
  dimZ: number;
  unitPrice: number;
  product: ProductType;
}

export interface ReviewType {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

export interface OrderType {
  id: string;
  userId?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  shippingName: string | null;
  shippingEmail: string | null;
  shippingPhone?: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  createdAt: string;
  items: OrderItemType[];
  user?: { name: string | null; email: string };
}

export interface OrderItemType {
  id: string;
  name: string;
  material: string;
  color: string;
  quantity: number;
  dimX: number;
  dimY: number;
  dimZ: number;
  unitPrice: number;
}

export interface UserType {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  loyaltyPoints: number;
  createdAt: string;
}

export interface WishlistItemType {
  id: string;
  productId: string;
  product: ProductType;
  createdAt: string;
}

export interface PointsTransactionType {
  id: string;
  points: number;
  type: 'earned' | 'redeemed' | 'bonus' | 'expired';
  description: string;
  orderId: string | null;
  createdAt: string;
}

export interface DashboardStatsType {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: OrderType[];
  topProducts: { product: ProductType; totalSold: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  costByMaterial?: { material: string; averageUnitPrice: number; pieces: number; percentage: number }[];
  sizeDistribution?: { bucket: string; count: number }[];
}
