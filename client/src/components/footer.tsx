import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Send,
  CreditCard
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[hsl(var(--surface))] py-10 border-t border-primary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & About */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <span className="text-primary text-xl font-orbitron font-bold tracking-wider">
                Cash<span className="text-white">Arena</span>
              </span>
            </div>
            <p className="text-[hsl(var(--text-tertiary))] text-sm mb-4">
              The ultimate competitive gaming platform where skill meets reward.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-2 h-auto">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-2 h-auto">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-2 h-auto">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-2 h-auto">
                <FaDiscord className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="md:col-span-1">
            <h4 className="text-white font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">Home</Button>
              </li>
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">Games</Button>
              </li>
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">Tournaments</Button>
              </li>
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">How It Works</Button>
              </li>
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">FAQs</Button>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="md:col-span-1">
            <h4 className="text-white font-medium mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">Contact Us</Button>
              </li>
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">Help Center</Button>
              </li>
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">Terms of Service</Button>
              </li>
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">Privacy Policy</Button>
              </li>
              <li>
                <Button variant="link" className="text-[hsl(var(--text-tertiary))] hover:text-primary transition-colors p-0 h-auto">Responsible Gaming</Button>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div className="md:col-span-1">
            <h4 className="text-white font-medium mb-4">Stay Updated</h4>
            <p className="text-[hsl(var(--text-tertiary))] text-sm mb-4">
              Subscribe to our newsletter for the latest updates and tournaments.
            </p>
            <div className="flex">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="bg-[hsl(var(--surface-light))] border border-primary/30 text-white rounded-l-lg focus:outline-none focus:border-primary"
              />
              <Button className="bg-primary text-background px-4 py-2 rounded-r-lg h-auto">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Separator className="mt-10 pt-6 border-primary/10" />
        
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-[hsl(var(--text-tertiary))] text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} CashArena. All rights reserved.
          </div>
          <div className="flex items-center">
            <CreditCard className="h-6 opacity-70 text-gray-400" />
          </div>
        </div>
      </div>
    </footer>
  );
}
