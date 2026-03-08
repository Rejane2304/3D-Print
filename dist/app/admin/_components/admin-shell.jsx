'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import AdminSidebar from './admin-sidebar';
export default function AdminShell({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    return (<div className="min-h-screen bg-bg">
      {/* Mobile sticky top bar — hidden on lg+ */}
      <div className="lg:hidden sticky top-16 z-40 flex items-center gap-3 px-4 py-3 bg-bg-secondary border-b border-border">
        <button onClick={() => setIsOpen((v) => !v)} className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors" aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}>
          {isOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
        </button>
        <span className="font-semibold text-cyan text-sm">Panel Admin</span>
      </div>

      <div className="flex">
        <AdminSidebar isOpen={isOpen} setIsOpen={setIsOpen}/>
        <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64">
          {children}
        </main>
      </div>
    </div>);
}
