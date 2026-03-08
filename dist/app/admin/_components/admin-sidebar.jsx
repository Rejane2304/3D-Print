'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, ChevronRight, Boxes, Printer, CreditCard, Layers, Tag, DollarSign, } from 'lucide-react';
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
export default function AdminSidebar({ isOpen, setIsOpen }) {
    const pathname = usePathname();
    return (<>
      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {isOpen && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-30" onClick={() => setIsOpen(false)}/>)}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-bg-secondary border-r border-border
          z-40 flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-xl font-bold text-cyan mb-6 hidden lg:block">Panel Admin</h2>
          <nav className="space-y-1">
            {menuItems.map((item) => {
            const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
            return (<Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                    ? 'bg-cyan/20 text-cyan border border-cyan/30'
                    : 'hover:bg-bg-tertiary text-muted hover:text-white'}
                  `}>
                  <item.icon className="w-5 h-5 shrink-0"/>
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto shrink-0"/>}
                </Link>);
        })}
          </nav>
        </div>

        <div className="px-6 pb-6">
          <Link href="/" className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted hover:text-white transition-colors rounded-lg hover:bg-bg-tertiary">
            ← Volver a la tienda
          </Link>
        </div>
      </aside>
    </>);
}
