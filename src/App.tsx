/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AccountModal } from './components/AccountModal';
import { gsap, ScrollTrigger, useGSAP } from './lib/gsap';

// Pages
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { FaqPage } from './pages/FaqPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { AdminPage } from './pages/AdminPage';

function parseHash(rawHash?: string): { page: string; params: Record<string, string> } {
  const source = rawHash !== undefined ? rawHash : (typeof window !== 'undefined' ? window.location.hash : '');
  const hash = source.replace(/^#\/?/, '');
  if (!hash || hash === 'home') {
    return { page: 'home', params: {} };
  }

  const [pagePath, queryString] = hash.split('?');
  const params: Record<string, string> = {};

  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  // Handle admin routes like admin or admin/products
  if (pagePath === 'admin' || pagePath.startsWith('admin/')) {
    const subpath = pagePath.replace(/^admin\/?/, '') || 'dashboard';
    return { page: 'admin', params: { subpath, ...params } };
  }

  // Handle path-based routes like product/jp-1
  if (pagePath.startsWith('product/')) {
    const id = pagePath.replace('product/', '');
    return { page: 'product', params: { id, ...params } };
  }

  // Handle path-based routes like track-order/jp-ord-102
  if (pagePath.startsWith('track-order/')) {
    const id = pagePath.replace('track-order/', '');
    return { page: 'track-order', params: { id, ...params } };
  }

  return { page: pagePath || 'home', params };
}

function MainApp() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const { page } = parseHash();
    return page === 'account' ? 'home' : page;
  });
  const [queryParams, setQueryParams] = useState<Record<string, string>>(() => {
    return parseHash().params;
  });
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(() => {
    return parseHash().page === 'account';
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const slides = ['/image.png', '/img-2.png', '/img-3.png', '/img-4.png'];
  const heroRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (currentPage === 'home' && heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0, scale: 0.985 },
          { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' }
        );
      }
    },
    { scope: heroRef, dependencies: [currentPage] }
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync with window hash on popstate and hashchange
  const handleHashChange = useCallback(() => {
    const { page, params } = parseHash();
    if (page === 'account') {
      setIsAccountOpen(true);
      return;
    }
    setCurrentPage(page);
    setQueryParams(params);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [handleHashChange]);

  useEffect(() => {
    // Immediately scroll to top and kill previous page triggers to prevent auto-scrolling
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    ScrollTrigger.getAll().forEach((t) => t.kill());
    ScrollTrigger.clearScrollMemory();
    const t = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 120);
    return () => clearTimeout(t);
  }, [currentPage, queryParams]);

  const navigateTo = (target: string, params: Record<string, string> = {}) => {
    if (target === '#account' || target === 'account') {
      setIsAccountOpen(true);
      return;
    }

    let cleanTarget = target.replace(/^#\/?/, '');
    let newHash = cleanTarget;

    if (cleanTarget === 'product' && params.id) {
      newHash = `product/${params.id}`;
      const { id: _, ...rest } = params;
      if (Object.keys(rest).length > 0) {
        newHash += `?${new URLSearchParams(rest).toString()}`;
      }
    } else if (cleanTarget === 'admin' && params.subpath) {
      newHash = `admin/${params.subpath}`;
      const { subpath: _, ...rest } = params;
      if (Object.keys(rest).length > 0) {
        newHash += `?${new URLSearchParams(rest).toString()}`;
      }
    } else {
      const queryEntries = Object.entries(params);
      if (queryEntries.length > 0) {
        const hasExistingQuery = cleanTarget.includes('?');
        const qs = new URLSearchParams(params).toString();
        newHash = `${cleanTarget}${hasExistingQuery ? '&' : '?'}${qs}`;
      }
    }

    const resolved = parseHash(newHash);
    setCurrentPage(resolved.page);
    setQueryParams(resolved.params);

    if (resolved.page === 'home') {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname);
      }
    } else {
      if (window.location.hash.replace(/^#\/?/, '') !== newHash) {
        window.location.hash = newHash;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage scrollY={scrollY} onNavigate={navigateTo} />;
      case 'categories':
      case 'shop':
        return (
          <CategoriesPage
            onNavigate={navigateTo}
            initialCategory={queryParams.category}
          />
        );
      case 'product':
        return (
          <ProductDetailPage
            productId={queryParams.id || 'jp-1'}
            onNavigate={navigateTo}
          />
        );
      case 'about':
        return <AboutPage onNavigate={navigateTo} />;
      case 'contact':
        return <ContactPage onNavigate={navigateTo} />;
      case 'checkout':
        return <CheckoutPage onNavigate={navigateTo} />;
      case 'track-order':
      case 'orders':
        return (
          <TrackOrderPage
            initialOrderId={queryParams.id}
            onNavigate={navigateTo}
          />
        );
      case 'faq':
      case 'shipping':
        return <FaqPage onNavigate={navigateTo} />;
      case 'policies':
      case 'privacy':
      case 'terms':
        return <PoliciesPage />;
      case 'admin':
        return (
          <AdminPage
            subpath={queryParams.subpath || 'dashboard'}
            onNavigate={navigateTo}
          />
        );
      default:
        return <HomePage scrollY={scrollY} onNavigate={navigateTo} />;
    }
  };

  if (currentPage === 'admin') {
    return (
      <main className="min-h-screen w-full bg-[#FAF9F6]">
        <AdminPage
          subpath={queryParams.subpath || 'dashboard'}
          onNavigate={navigateTo}
        />
        <AccountModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
          onNavigate={navigateTo}
        />
      </main>
    );
  }

  return (
    <main
      id="hero-wrapper"
      className="min-h-screen w-full bg-[#FAF9F6] flex flex-col antialiased selection:bg-neutral-200 overflow-x-hidden max-w-full"
    >
      {/* Master Container - Full Bleed */}
      <div className="w-full bg-[#FAF9F6] flex flex-col relative">
        {currentPage === 'home' ? (
          /* Outer Card Frame */
          <div
            id="hero-card"
            className="w-full h-[95vh] min-h-[640px] flex flex-col relative"
          >
            {/* Navigation Bar */}
            <Navbar
              currentPage={currentPage}
              onNavigate={navigateTo}
              onOpenAccount={() => setIsAccountOpen(true)}
            />

            {/* Hero Framed Canvas with Signature Rounded Borders */}
            <div
              ref={heroRef}
              id="hero-canvas-container"
              className="flex-1 mx-1.5 sm:mx-3 md:mx-4 mb-3 sm:mb-6 md:mb-8 rounded-[1.25rem] sm:rounded-[1.75rem] md:rounded-[2rem] relative overflow-hidden flex items-center justify-center bg-neutral-100 shadow-inner"
            >
              {slides.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`Hero Graphic ${index + 1}`}
                  style={{
                    transform: `translateY(${scrollY * 0.25}px) scale(1.02)`,
                    transformOrigin: 'top center',
                  }}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}

              {/* Slide Navigation Indicator Dots */}
              <div className="absolute bottom-6 sm:bottom-8 inset-x-0 flex justify-center items-center gap-2.5 z-20">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentSlide ? 'w-8 bg-white shadow-md' : 'w-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Navbar
            currentPage={currentPage}
            onNavigate={navigateTo}
            onOpenAccount={() => setIsAccountOpen(true)}
          />
        )}

        {/* Dynamic Page Content */}
        <div className="flex-1 w-full flex flex-col">{renderPage()}</div>

        {/* Global Footer */}
        <Footer onNavigate={navigateTo} />
      </div>

      {/* Slide-over Cart Drawer */}
      <CartDrawer onNavigate={navigateTo} />

      {/* User Account & Orders Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onNavigate={navigateTo}
      />
    </main>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}
