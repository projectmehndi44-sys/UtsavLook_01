'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ShoppingCart, Sparkles, User } from 'lucide-react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images.json';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#services', label: 'Services' },
  { href: '/#our-works', label: 'Our Works' },
  { href: '/account', label: 'My Bookings' },
];

const Logo = () => (
  <Link href="/" className="flex items-center gap-2">
    <Sparkles className="h-8 w-8 text-accent" />
    <span className="font-headline text-4xl text-primary">UtsavLook</span>
  </Link>
);

const UserMenu = () => {
  const userAvatar = placeholderImages.find(p => p.id === 'user-avatar');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Image
              src={userAvatar?.imageUrl || ''}
              alt="User avatar"
              width={40}
              height={40}
              className="rounded-full"
              data-ai-hint={userAvatar?.imageHint}
            />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Priya Sharma</p>
            <p className="text-xs leading-none text-muted-foreground">
              priya.sharma@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User className="mr-2 h-4 w-4" />
            <span>My Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DesktopNav = () => {
    const pathname = usePathname();
    return (
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
            <Link
                key={link.href}
                href={link.href}
                className={cn("transition-colors hover:text-accent", pathname === link.href ? "text-accent" : "text-foreground/80")}
            >
                {link.label}
            </Link>
            ))}
      </nav>
    );
}

const MobileNav = () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <div className="flex flex-col gap-6 p-6">
                    <Logo />
                    <nav className="grid gap-4 text-lg">
                        {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="font-medium transition-colors hover:text-accent"
                            onClick={() => setIsOpen(false)}
                        >
                            {link.label}
                        </Link>
                        ))}
                    </nav>
                </div>
            </SheetContent>
      </Sheet>
    );
}


export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <DesktopNav />
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping Cart</span>
            </Link>
          </Button>
          <UserMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
