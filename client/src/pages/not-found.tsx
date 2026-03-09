import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="text-center px-4">
        <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-4xl font-bold mb-2" data-testid="text-404">404</h1>
        <p className="text-lg text-muted-foreground mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link href="/">
          <Button data-testid="button-go-home">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
