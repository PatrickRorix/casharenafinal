import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type BackToDashboardProps = {
  className?: string;
};

export function BackToDashboard({ className = "" }: BackToDashboardProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <Link to="/">
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}