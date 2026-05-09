"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthStatusProps {
  variant?: "desktop" | "mobile";
}

interface User {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  role: string;
  avatar?: string | null;
}

export function AuthStatus({ variant = "desktop" }: AuthStatusProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/status");
        const data = await res.json();
        setIsLoggedIn(data.isLoggedIn);
        setUser(data.user);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    if (variant === "mobile") {
      return <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />;
    }
    return (
      <div className="flex h-8 w-24 animate-pulse items-center gap-3 rounded-lg bg-slate-200">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isLoggedIn && user) {
    const isAdmin = user.role === "ADMIN";
    const dashboardLink = isAdmin ? "/admin" : "/user";

    if (variant === "mobile") {
      return (
        <div className="flex flex-col gap-2">
          <Link href={dashboardLink}>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <User className="h-4 w-4" />
              {isAdmin ? "Admin Panel" : "Dashboard"}
            </Button>
          </Link>
          <Link href="/api/logout">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="hidden items-center gap-3 md:flex">
        <Link href={dashboardLink}>
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            {isAdmin ? "Admin" : "Dashboard"}
          </Button>
        </Link>
        <Link href="/api/logout">
          <Button variant="ghost" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </Link>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-2">
        <Link href="/login">
          <Button variant="outline" size="sm" className="w-full">Login</Button>
        </Link>
        <Link href="/register">
          <Button size="sm" className="w-full">Mulai Gratis</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Login
        </Button>
      </Link>
      <Link href="/register">
        <Button size="sm">Mulai Gratis</Button>
      </Link>
    </div>
  );
}