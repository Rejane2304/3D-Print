"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Menu, X, Search, LogOut, Package, Heart, Settings, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";
import { useLanguage } from "@/lib/language-store";
export function Header() {
    const [scrolled] = useState(false);
    const { data: session } = useSession() || {};
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    // Estado y funciones para búsqueda
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const cartCount = useCartStore(s => s?.items?.length ?? 0);
    const { language, setLanguage } = useLanguage();
    const isAdmin = session?.user?.role === 'admin';
    const userName = session?.user?.name || session?.user?.email || "";
    const userInitial = userName.trim().split(" ")[0]?.[0]?.toUpperCase() || "U";
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const handleSearchInput = (value) => {
        setSearchQuery(value);
        setSearchResults([]);
        setShowResults(false);
    };
    const handleSearch = (e) => {
        e.preventDefault();
        setShowResults(true);
    };
    const selectResult = (id) => {
        setShowResults(false);
        setSearchQuery("");
    };
    // Translations
    const t = {
        es: {
            home: 'Inicio',
            catalog: 'Catálogo',
            wishlist: 'Favoritos',
            search: 'Buscar productos...',
            admin: 'Admin',
            adminPanel: 'Admin',
            adminDashboard: 'Panel',
            adminProducts: 'Productos',
            adminClients: 'Clientes',
            adminOrders: 'Pedidos',
            adminInventory: 'Inventario',
            adminPrintQueue: 'Cola de impresión',
            adminPayments: 'Pagos',
            adminSettings: 'Configuración',
            orders: 'Mis Pedidos',
            profile: 'Mi Perfil',
            logout: 'Cerrar Sesión',
            login: 'Iniciar Sesión',
            searchBtn: 'Buscar',
            from: 'desde',
            cartAria: 'Carrito',
            menuAria: 'Menú',
            searchAria: 'Buscar',
            changeLanguageAria: 'Cambiar idioma',
        },
        en: {
            home: 'Home',
            catalog: 'Catalog',
            wishlist: 'Wishlist',
            search: 'Search products...',
            admin: 'Admin',
            adminPanel: 'Admin',
            adminDashboard: 'Dashboard',
            adminProducts: 'Products',
            adminClients: 'Customers',
            adminOrders: 'Orders',
            adminInventory: 'Inventory',
            adminPrintQueue: 'Print queue',
            adminPayments: 'Payments',
            adminSettings: 'Settings',
            orders: 'My Orders',
            profile: 'My Profile',
            logout: 'Logout',
            login: 'Login',
            searchBtn: 'Search',
            from: 'from',
            cartAria: 'Cart',
            menuAria: 'Menu',
            searchAria: 'Search',
            changeLanguageAria: 'Change language',
        }
    };
    const navLinks = [
        { href: "/", label: t[language].home },
        { href: "/catalog", label: t[language].catalog },
    ];
    return (<header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glassmorphism shadow-lg" : "bg-transparent"}`}>
      <div className="max-w-site mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Package className="w-7 h-7 text-cyan"/>
          <span className="font-bold text-lg text-gradient-cyan hidden sm:inline">3D Print</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (<Link key={l.href} href={l.href} className={`text-sm font-medium transition-colors hover:text-cyan ${pathname === l.href ? "text-cyan" : "text-zinc-300"}`}>{l.label}</Link>))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} className="p-2 rounded-lg hover:bg-white/5 transition flex items-center gap-1 text-xs font-medium text-zinc-300" aria-label={t[language].changeLanguageAria}>
            <Globe className="w-4 h-4"/>
            <span className="hidden sm:inline">{language.toUpperCase()}</span>
          </button>

          <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 rounded-lg hover:bg-white/5 transition" aria-label={t[language].searchAria}>
            <Search className="w-5 h-5 text-zinc-300"/>
          </button>

          {session?.user && !isAdmin && (<Link href="/wishlist" className="p-2 rounded-lg hover:bg-white/5 transition relative" aria-label={t[language].wishlist}>
              <Heart className="w-5 h-5 text-zinc-300"/>
            </Link>)}

          {/* Hide cart for admin users */}
          {!isAdmin && (<Link href="/cart" className="p-2 rounded-lg hover:bg-white/5 transition relative" aria-label={t[language].cartAria}>
              <ShoppingCart className="w-5 h-5 text-zinc-300"/>
              {cartCount > 0 && (<span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan text-black text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>)}
            </Link>)}

          {session?.user ? (<div className="flex items-center gap-2">
              {/* Avatar dropdown para usuario y admin */}
              <div className="relative">
                <button type="button" onClick={() => setAdminMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-full bg-cyan/15 px-2 py-1 hover:bg-cyan/25 transition" aria-label={t[language].profile}>
                  <div className="w-8 h-8 rounded-full bg-cyan/25 flex items-center justify-center text-cyan text-sm font-bold">
                    {userInitial}
                  </div>
                  <ChevronDown className="w-3 h-3 text-cyan"/>
                </button>
                <AnimatePresence>
                  {adminMenuOpen && (<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 mt-2 w-56 bg-bg-secondary border border-border rounded-lg shadow-xl z-50">
                      <nav className="py-2 text-xs">
                        <Link href="/profile" className="flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary text-cyan" onClick={() => setAdminMenuOpen(false)}>
                          <User className="w-4 h-4 text-cyan"/>
                          <span className="text-cyan">{t[language].profile}</span>
                        </Link>
                        {isAdmin && (<Link href="/admin" className="flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary text-cyan" onClick={() => setAdminMenuOpen(false)}>
                            <Settings className="w-4 h-4 text-cyan"/>
                            <span className="text-cyan">{t[language].adminDashboard}</span>
                          </Link>)}
                        <button onClick={async () => {
                    useCartStore.getState().clearCart();
                    await signOut({ callbackUrl: "/" });
                }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary text-left">
                          <LogOut className="w-4 h-4 text-cyan"/>
                          <span className="text-cyan">{t[language].logout}</span>
                        </button>
                      </nav>
                    </motion.div>)}
                </AnimatePresence>
              </div>
            </div>) : (<Link href="/login" className="p-2 rounded-lg hover:bg-white/5 transition" aria-label={t[language].login}>
              <User className="w-5 h-5 text-zinc-300"/>
            </Link>)}

          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-white/5 transition md:hidden" aria-label={t[language].menuAria}>
            {menuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      {/* Search Bar with Autocomplete */}
      <AnimatePresence>
        {searchOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-visible border-t border-white/5 bg-bg-secondary">
            <div ref={searchRef} className="max-w-site mx-auto px-4 py-3 relative">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <input type="text" value={searchQuery} onChange={e => handleSearchInput(e?.target?.value ?? "")} placeholder={t[language].search} className="w-full bg-bg-tertiary rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan placeholder-zinc-500" autoFocus/>
                  
                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {showResults && searchResults.length > 0 && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border rounded-lg shadow-xl overflow-hidden z-50">
                        {searchResults.map((result) => (<button key={result.id} type="button" onClick={() => selectResult(result.id)} className="w-full flex items-center gap-3 p-3 hover:bg-bg-tertiary transition-colors text-left">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-bg-tertiary flex-shrink-0">
                              {result.images?.[0] && (<Image src={result.images[0]} alt={result.name} fill className="object-cover"/>)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{result.name}</div>
                              <div className="text-sm text-muted flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs ${result.material === 'PLA' ? 'bg-cyan/20 text-cyan' : 'bg-amber/20 text-amber'}`}>
                                  {result.material}
                                </span>
                                <span>{result.category}</span>
                              </div>
                            </div>
                            <div className="text-sm text-cyan font-medium">
                              {t[language].from} €{(result.basePricePerGram * 10 + 2.5).toFixed(2)}
                            </div>
                          </button>))}
                      </motion.div>)}
                  </AnimatePresence>
                </div>
                <button type="submit" className="px-4 py-2 bg-cyan text-black rounded-lg text-sm font-medium hover:bg-cyan-dark transition">
                  {t[language].searchBtn}
                </button>
              </form>
            </div>
          </motion.div>)}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden md:hidden glassmorphism border-t border-white/5">
            <nav className="max-w-site mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map(l => (<Link key={l.href} href={l.href} className="text-sm font-medium text-zinc-300 hover:text-cyan transition py-2">{l.label}</Link>))}
              {session?.user && !isAdmin && (<>
                  <Link href="/wishlist" className="text-sm font-medium text-zinc-300 hover:text-cyan transition py-2 flex items-center gap-2">
                    <Heart className="w-4 h-4"/>
                    {t[language].wishlist}
                  </Link>
                  <Link href="/profile" className="text-sm font-medium text-zinc-300 hover:text-cyan transition py-2 flex items-center gap-2">
                    <User className="w-4 h-4"/>
                    {t[language].profile}
                  </Link>
                </>)}
            </nav>
          </motion.div>)}
      </AnimatePresence>
    </header>);
}
