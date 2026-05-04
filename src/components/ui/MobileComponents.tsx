/**
 * Mobile-optimized components
 */

import { forwardRef, ButtonHTMLAttributes } from "react";

// Touch-friendly button with proper sizing
export const TouchButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
  }
>(({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all focus-ring press-effect disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300",
    outline: "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100",
    ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-4 py-2.5 text-base min-h-[44px]", // Touch-friendly
    lg: "px-6 py-3.5 text-lg min-h-[52px]", // Extra touch-friendly
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

TouchButton.displayName = "TouchButton";

// Mobile card with proper touch targets
export function MobileCard({
  children,
  className = "",
  padding = true,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-slate-200
        ${padding ? "p-4" : ""}
        ${onClick ? "cursor-pointer hover:bg-slate-50 active:bg-slate-100 press-effect" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Mobile-safe modal that respects notch and safe areas
export function MobileModal({
  isOpen,
  onClose,
  children,
  className = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm safe-bottom"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={`
          absolute bottom-0 left-0 right-0
          bg-white rounded-t-3xl
          max-h-[90vh] overflow-y-auto
          animate-slide-up
          p-6 safe-bottom
          ${className}
        `}
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />

        {children}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Input with proper mobile touch target
export function MobileInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`
        w-full px-4 py-3 rounded-xl
        border border-slate-200 bg-white
        text-base
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        min-h-[48px] /* Touch-friendly height */
        ${className}
      `}
      {...props}
    />
  );
}

// Bottom navigation bar for mobile
export function BottomNav({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0
        bg-white border-t border-slate-200
        px-4 pb-safe-bottom
        z-40
        safe-bottom
        ${className}
      `}
    >
      <div className="flex items-center justify-around py-2">
        {children}
      </div>
    </nav>
  );
}

// Nav item for bottom navigation
export function BottomNavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`
        flex flex-col items-center gap-1
        px-4 py-2 rounded-xl
        min-w-[64px]
        transition-colors
        ${active ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50"}
      `}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </a>
  );
}

// Skeleton loader for mobile
export function MobileSkeleton({
  className = "",
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded animate-shimmer"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

// Pull to refresh indicator
export function PullToRefresh({ isPulling }: { isPulling: boolean }) {
  if (!isPulling) return null;

  return (
    <div className="flex items-center justify-center py-4 text-slate-500">
      <div className="h-6 w-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
      <span className="ml-2 text-sm">Pull to refresh...</span>
    </div>
  );
}