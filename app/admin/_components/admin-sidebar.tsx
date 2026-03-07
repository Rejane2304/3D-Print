'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  Boxes,
  Printer,
  CreditCard,
  Layers,
  Tag,
  DollarSign,
} from 'lucide-react';

const menuItems = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Productos', icon: Package },
  { href: '/admin/materials', label: 'Materiales', icon: Layers },
  { href: '/admin/pricing', label: 'Precios', icon: DollarSign },
  { href: '/admin/users', label: 'Clientes', icon: Users },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/inventory', label: 'Inventario', icon: Boxes },
  { href: '/admin/coupons', label: 'Cupones', icon: Tag },
  { href: '/admin/print-queue', label: 'Cola de impresión', icon: Printer },
  { href: '/admin/payments', label: 'Pagos', icon: CreditCard },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-bg-secondary rounded-lg border border-border"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-bg-secondary border-r border-border
          z-40 lg:translate-x-0 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-cyan mb-6">Panel Admin</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-cyan/20 text-cyan border border-cyan/30' 
                      : 'hover:bg-bg-tertiary text-muted hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted hover:text-white transition-colors"
          >
            ← Volver a la tienda
          </Link>
        </div>
      </motion.aside>
    </>
  );
}
