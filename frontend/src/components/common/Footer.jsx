import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white py-6 px-4 sm:px-6 lg:px-8 w-full mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
        
        {/* Left: Brand & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <span className="font-bold text-[#0F172A]">MedConnect Karavali</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>© 2026 MedConnect Karavali. All rights reserved.</span>
        </div>

        {/* Right: Legal & Contact Links */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-[#0F172A] transition-colors">
            Privacy Policy
          </a>
          <span className="text-slate-300">•</span>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-[#0F172A] transition-colors">
            Terms
          </a>
          <span className="text-slate-300">•</span>
          <a href="#contact" onClick={(e) => e.preventDefault()} className="hover:text-[#0F172A] transition-colors">
            Contact
          </a>
        </div>

      </div>
    </footer>
  );
};
