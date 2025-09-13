import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Instagram, Sparkles, Twitter } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-card text-card-foreground border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
             <Link href="/" className="flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-accent" />
                <span className="font-headline text-4xl text-primary">UtsavLook</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your one-stop destination for discovering and booking the best mehndi and makeup artists.
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" size="icon">
                <Twitter className="h-5 w-5 text-accent" />
              </Button>
              <Button variant="ghost" size="icon">
                <Facebook className="h-5 w-5 text-accent" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-5 w-5 text-accent" />
              </Button>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/#services" className="text-sm text-muted-foreground hover:text-accent">Services</Link></li>
              <li><Link href="/#our-works" className="text-sm text-muted-foreground hover:text-accent">Gallery</Link></li>
              <li><Link href="/account" className="text-sm text-muted-foreground hover:text-accent">My Account</Link></li>
              <li><Link href="/cart" className="text-sm text-muted-foreground hover:text-accent">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent">About Us</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent">Contact</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent">Artist Portal</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-accent">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">Subscribe for updates and promotions.</p>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="email" placeholder="Email" />
              <Button type="submit" variant="default">Subscribe</Button>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">© {new Date().getFullYear()} UtsavLook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
