import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, Loader2, Lock } from "lucide-react";

const setupSchema = z.object({
  secret: z.string().min(1, "Admin secret is required"),
});

export default function AdminSetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: { secret: "" },
  });

  if (!user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground mb-4">You need to be logged in to access admin setup.</p>
            <Button onClick={() => navigate("/auth")} data-testid="button-goto-login">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">You're Already an Admin</h3>
            <p className="text-sm text-muted-foreground mb-4">Your account already has super admin privileges.</p>
            <Button onClick={() => navigate("/admin")} data-testid="button-goto-admin">
              Go to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof setupSchema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/promote-admin", { secret: values.secret });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Admin access granted", description: "You now have super admin privileges." });
      navigate("/admin");
    } catch (e: any) {
      toast({ title: "Access denied", description: "The admin secret is incorrect.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl" data-testid="text-admin-setup-title">Super Admin Setup</CardTitle>
          <CardDescription>
            Enter the admin secret key to gain super admin access to the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Secret Key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter the admin secret"
                        {...field}
                        data-testid="input-admin-secret"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-activate-admin">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate Admin Access
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
