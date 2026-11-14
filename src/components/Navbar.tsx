import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenDemo: () => void;
}

export function Navbar({ onOpenDemo }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#181C25]/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand wordmark */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-[#181C25] font-display font-bold text-xl tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#181C25] rounded-sm"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M4 3H12.5C17.1944 3 21 6.80558 21 11.5V12.5C21 17.1944 17.1944 21 12.5 21H4V3Z" fill="#FF444F" />
            <path d="M8.5 7.5H12.2C14.851 7.5 17 9.64903 17 12.3C17 14.951 14.851 17.1 12.2 17.1H8.5V7.5Z" fill="#FFFFFF" />
          </svg>
          <span>Deriv</span>
        </a>

        {/* Zone 2: 3 concise single-line anchor links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#181C25]/75"
        >
          <a
            href="#what-it-does"
            className="hover:text-[#181C25] transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#181C25]/30"
          >
            What It Does
          </a>
          <a
            href="#who-its-for"
            className="hover:text-[#181C25] transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#181C25]/30"
          >
            Who It&apos;s For
          </a>
          <a
            href="#start-free-demo"
            className="hover:text-[#181C25] transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#181C25]/30"
          >
            Start Free Demo
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenDemo}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] active:translate-y-px rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#181C25]"
          >
            Try Free $10,000 Demo
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#181C25] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#181C25]/8 bg-white px-4 py-4 space-y-2">
          <a
            href="#what-it-does"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm font-medium text-[#181C25] rounded-lg hover:bg-[#F5F6F8]"
          >
            What It Does
          </a>
          <a
            href="#who-its-for"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm font-medium text-[#181C25] rounded-lg hover:bg-[#F5F6F8]"
          >
            Who It&apos;s For
          </a>
          <a
            href="#start-free-demo"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 text-sm font-medium text-[#181C25] rounded-lg hover:bg-[#F5F6F8]"
          >
            Start Free Demo
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenDemo();
            }}
            className="w-full mt-2 px-4 py-3 text-sm font-semibold text-white bg-[#FF444F] hover:bg-[#E03640] rounded-lg transition-colors cursor-pointer"
          >
            Try Free $10,000 Demo
          </button>
        </div>
      )}
    </header>
  );
}
