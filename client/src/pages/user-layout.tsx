"use client"

import { Switch, Route, Redirect, Link, useLocation } from "wouter";
import { Key, Package, ShoppingCart, User, LogOut } from "lucide-react";
import { HeaderLogo } from "@/components/header-logo";
import { useUserAuth } from "@/lib/user-auth";
import { Button } from "@/components/ui/button";

import { UserKeys } from "./user-keys";
import { UserPackages } from "./user-packages";
import { UserOrders } from "./user-orders";
import { UserAccount } from "./user-account";

const navItems = [
  { title: "Dashboard", url: "/user/dashboard", icon: Key },
  { title: "Packages", url: "/user/packages", icon: Package },
  { title: "Order History", url: "/user/orders", icon: ShoppingCart },
  { title: "Account", url: "/user/account", icon: User },
];

export function UserLayout() {
  const [location] = useLocation();
  const { logout, user } = useUserAuth();

  return (
    <div className="flex min-h-screen flex-col w-full circuit-overlay bg-background pb-16 md:pb-0">
      {/* Top Navbar */}
      <header className="glass sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-3">
          <HeaderLogo size="md" />
          <div className="flex flex-col hidden sm:flex">
            <span className="font-serif text-lg font-bold tracking-wide">King Vypers</span>
            <span className="text-xs text-muted-foreground">User Panel</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = location === item.url || location.startsWith(item.url);
            return (
              <Link key={item.title} href={item.url}>
                <span className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </span>
              </Link>
            );
          })}
          
          <div className="ml-4 flex items-center gap-4 border-l pl-4">
            <span className="text-sm font-medium">{user?.username}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-x-hidden">
        <Switch>
          <Route path="/user" component={() => <Redirect to="/user/dashboard" />} />
          <Route path="/user/dashboard" component={UserKeys} />
          <Route path="/user/packages" component={UserPackages} />
          <Route path="/user/orders" component={UserOrders} />
          <Route path="/user/account" component={UserAccount} />
          <Route component={() => <Redirect to="/user/dashboard" />} />
        </Switch>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="glass md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t px-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.url || location.startsWith(item.url);
          return (
            <Link key={item.title} href={item.url} className="flex-1">
              <div className={`flex flex-col items-center justify-center gap-1 w-full h-full p-2 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                <span className="text-[10px] font-medium leading-none">{item.title}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
