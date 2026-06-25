"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Menu,
  Sparkles,
  LogOut,
  User,
} from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Search className="h-6 w-6 text-primary" />
          <span>Remote<span className="text-primary">Radar</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                {user.name || user.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" onClick={() => signIn()}>
              <User className="h-4 w-4 mr-1" />
              Iniciar Sesión
            </Button>
          )}
          <Link href="/pricing">
            <Button variant="secondary" size="sm">
              <Sparkles className="h-4 w-4 mr-1" />
              Premium
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>RemoteRadar</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-4">
              {user ? (
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ) : null}
              <Separator />
              <Link href="/pricing" className="w-full">
                <Button className="w-full" variant="secondary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Premium — $2.99/mes
                </Button>
              </Link>
              {user ? (
                <Button variant="outline" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              ) : (
                <Button onClick={() => signIn()}>
                  <User className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}