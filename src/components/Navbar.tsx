import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Package, HelpCircle, Truck, CircleUser } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenAccount: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onOpenAccount }) => {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'Shop', id: 'shop' },
    { label: 'About Us', id: 'about' },
    { label: 'Contact Us', id: 'contact' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (

    <header
      id="navbar"
      className="w-full px-6 sm:px-10 md:px-14 py-4 md:py-5 flex items-center justify-between z-30 relative"
    >
      {/* Brand Logo */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          id="brand-logo-link"
          aria-label="Jass Products Home"
          className="flex items-baseline gap-1.5 transition-transform hover:opacity-85 active:scale-95 cursor-pointer bg-transparent border-0 p-0 text-left"
        >
          <span className="font-serif text-2xl md:text-3xl font-bold tracking-wider text-neutral-900">JASS</span>
          <span className="text-[10px] md:text-[11px] tracking-[0.25em] font-semibold text-[#8b6d43] uppercase">Products</span>
        </button>
      </div>

      {/* Navigation Links - Desktop */}
      <nav
        id="nav-links"
        className="hidden sm:flex items-center gap-6 md:gap-8 lg:gap-10"
        aria-label="Primary Navigation"
      >
        {navItems.map((item) => {
          const isActive =
            currentPage === item.id ||
            (item.id === 'shop' && currentPage === 'categories');
          return (
            <button
              key={item.id}
              type="button"
              id={`nav-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`text-xs md:text-sm tracking-[0.15em] uppercase font-medium transition-all duration-200 cursor-pointer bg-transparent border-0 pb-1 relative ${
                isActive
                  ? 'text-[#8b6d43] font-semibold'
                  : 'text-neutral-700 hover:text-neutral-900'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b6d43] rounded-full animate-in fade-in" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Action Icons */}
      <div id="nav-actions" className="flex items-center gap-3 sm:gap-4 md:gap-5">
        {/* Track Order Button */}
        <button
          type="button"
          onClick={() => handleNavClick('track-order')}
          aria-label="Track Order"
          id="nav-track-order"
          className="p-2 rounded-full hover:bg-black/5 text-neutral-800 hover:text-[#8b6d43] transition-colors cursor-pointer"
          title="Track Order"
        >
          <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* User Account / Sign In Button */}
        <button
          type="button"
          onClick={onOpenAccount}
          aria-label="Account & Sign In"
          id="nav-account"
          className="p-2 rounded-full hover:bg-black/5 text-neutral-800 hover:text-[#8b6d43] transition-colors cursor-pointer"
          title="Account / Sign In"
        >
          <CircleUser className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Shopping Cart Button with Dynamic Badge */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Shopping Bag (${totalItemsCount} items)`}
          className="p-2 rounded-full hover:bg-black/5 text-neutral-800 hover:text-[#8b6d43] transition-colors relative cursor-pointer"
          title="Shopping Cart"
        >
          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          {totalItemsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#8b6d43] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale">
              {totalItemsCount > 99 ? '99+' : totalItemsCount}
            </span>
          )}
        </button>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          className="sm:hidden p-2 rounded-full hover:bg-black/5 text-neutral-800 transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-[#FAF9F6] border-b border-[#d2c2ad]/50 shadow-xl py-6 px-8 z-50 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const isActive =
              currentPage === item.id ||
              (item.id === 'shop' && currentPage === 'categories');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`text-left text-sm tracking-[0.15em] uppercase py-2 font-medium transition-colors ${
                  isActive ? 'text-[#8b6d43] font-bold' : 'text-neutral-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-4 border-t border-neutral-200 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAccount();
              }}
              className="flex items-center gap-2.5 text-xs tracking-wider uppercase text-neutral-600 hover:text-[#8b6d43]"
            >
              <CircleUser className="w-4 h-4" />
              <span>Account & Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleNavClick('track-order');
              }}
              className="flex items-center gap-2.5 text-xs tracking-wider uppercase text-neutral-600 hover:text-[#8b6d43]"
            >
              <Package className="w-4 h-4" />
              <span>Track Order</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleNavClick('faq');
              }}
              className="flex items-center gap-2.5 text-xs tracking-wider uppercase text-neutral-600 hover:text-[#8b6d43]"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help & FAQ</span>
            </button>
          </div>
        </div>
      )}
    </header>

  );
};
