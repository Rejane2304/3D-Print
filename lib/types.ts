// =============================================================
// Tipos compartidos — ecommerce_3d_print
// =============================================================

// ---- Entidades existentes -----------------------------------

export interface ProductType {
  id: string;
  name: string;
  description: string;
  category: string;
  material: string;
  basePricePerGram: number;
  density: number;
  printTimeMinutes: number;
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
  modelFillFactor: number;
  images: string[];
  colors: string[];
  featured: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  prices?: ProductPriceType[];
}

export interface CartItemType {
  id: string;
  productId: string;
  materialId?: string | null;
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
  discount: number;
  total: number;
  status: string;
  couponId?: string | null;
  stripeSessionId?: string | null;
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
  coupon?: CouponType | null;
}

export interface OrderItemType {
  id: string;
  name: string;
  materialId?: string | null;
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

// ---- Nuevas entidades (motor de precios avanzado) -----------

export interface MaterialType {
  id: string;
  name: string;
  code: string;
  pricePerKg: number;
  maintenanceFactor: number;
  density: number;
  description: string | null;
  color: string | null;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPriceType {
  id: string;
  productId: string;
  materialId: string;
  materialCost: number;
  machineCost: number;
  maintenanceCost: number;
  operationCost: number;
  baseCost: number;
  priceUnit: number;
  priceMedium: number;
  priceBulk: number;
  calculatedAt: string;
  updatedAt: string;
  material?: MaterialType;
}

export interface InventoryType {
  id: string;
  materialId: string;
  quantity: number;
  minStock: number;
  location: string | null;
  lastRefill: string;
  updatedAt: string;
  material?: MaterialType;
}

export interface CouponType {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

// ---- Web Worker (pricing worker) ----------------------------

export type WorkerMessageType = 'CALCULATE_PRICES';
export type WorkerResponseType = 'PROGRESS' | 'RESULT' | 'ERROR';

export interface WorkerInput {
  type: WorkerMessageType;
  products: ProductType[];
  materials: MaterialType[];
}

export interface WorkerProgressMessage {
  type: 'PROGRESS';
  current: number;
  total: number;
  percentage: number;
}

export interface WorkerResultMessage {
  type: 'RESULT';
  prices: Record<string, Record<string, ProductPriceType>>;
}

export interface WorkerErrorMessage {
  type: 'ERROR';
  message: string;
}

export type WorkerMessage =
  | WorkerProgressMessage
  | WorkerResultMessage
  | WorkerErrorMessage;
