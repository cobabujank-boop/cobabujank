"use client"

import { Switch, Route, Redirect, Link, useLocation } from "wouter";
import { Key, Package, ShoppingCart, User, LogOut, ChevronRight } from "lucide-react";
import { HeaderLogo } from "@/components/header-logo";
import { useUserAuth } from "@/lib/user-auth";
import { Button } from "@/components/ui/button";

import { UserKeys } from "./user-keys";
import { UserPackages } from "./user-packages";
import { UserOrders } from "./user-orders";
import { UserAccount } from "./user-account";

const navItems = [
  { title: "My Keys", url: "/user/dashboard", icon: Key },
  { title: "Store", url: "/user/packages", icon: Package },
  { title: "Orders", url: "/user/orders", icon: ShoppingCart },
  { title: "Account", url: "/user/account", icon: User },
];

export function UserLayout() {
  const [location] = useLocation();
  const { logout, user } = useUserAuth();

  return (
    <div className="flex min-h-screen flex-col w-full bg-background">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Brand */}
          <Link href="/user/dashboard" className="flex items-center gap-2.5">
            <HeaderLogo size="sm" />
            <span className="font-semibold text-base tracking-tight hidden sm:inline">KingVypers</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.url || (item.url !== "/user/dashboard" && location.startsWith(item.url));
              const isDashActive = item.url === "/user/dashboard" && (location === "/user/dashboard" || location === "/user");
              const active = isActive || isDashActive;
              return (
                <Link key={item.title} href={item.url}>
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop User + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium max-w-[120px] truncate">{user?.username}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground h-8 px-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile: Avatar only (logout is in Account page) */}
          <div className="md:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6 pb-20 md:pb-6">
        <Switch>
          <Route path="/user" component={() => <Redirect to="/user/dashboard" />} />
          <Route path="/user/dashboard" component={UserKeys} />
          <Route path="/user/packages" component={UserPackages} />
          <Route path="/user/orders" component={UserOrders} />
          <Route path="/user/account" component={UserAccount} />
          <Route component={() => <Redirect to="/user/dashboard" />} />
        </Switch>
      </main>

      {/* ── Bottom Navigation (Mobile) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-around px-1">
          {navItems.map((item) => {
            const isActive = location === item.url || (item.url !== "/user/dashboard" && location.startsWith(item.url));
            const isDashActive = item.url === "/user/dashboard" && (location === "/user/dashboard" || location === "/user");
            const active = isActive || isDashActive;
            return (
              <Link key={item.title} href={item.url} className="flex-1">
                <div className={`flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                  <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5px]" : ""}`} />
                  <span className={`text-[10px] leading-tight ${active ? "font-semibold" : "font-medium"}`}>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
