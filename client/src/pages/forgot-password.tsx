import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GraduationCap, Loader2, Mail, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email: values.email });
      setSent(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <span className="text-2xl font-bold">CourseMini</span>
              <p className="text-sm text-primary-foreground/70">by EQC Institute</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">Forgot your password?</h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            No worries. Enter your email and we'll send you a link to reset it.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {sent ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Check your email</h3>
                <p className="text-muted-foreground text-sm">
                  If an account exists for that email, we've sent a password reset link. It expires in 1 hour.
                </p>
                <p className="text-xs text-muted-foreground bg-muted rounded p-2">
                  During development the reset link is printed to the server console.
                </p>
                <Link href="/auth">
                  <Button variant="outline" className="mt-2">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>Enter the email address on your account and we'll send you a reset link.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send reset link
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      Remember your password?{" "}
                      <Link href="/auth" className="text-primary underline">
                        Log in
                      </Link>
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
