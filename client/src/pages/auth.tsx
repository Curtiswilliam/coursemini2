import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  GraduationCap, Loader2, Mail, Phone, User, MapPin, Calendar, CheckCircle2, ArrowLeft,
} from "lucide-react";

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username: values.username, password: values.password });
      const me = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Welcome back!" });
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate(me.role === "ADMIN" || me.role === "INSTRUCTOR" ? "/admin" : "/dashboard");
      }
    } catch (e: any) {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email or username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <a href="/forgot-password" className="text-primary underline">
                Forgot your password?
              </a>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─── Registration Wizard ───────────────────────────────────────────────────────

type RegStep = "credentials" | "verify-email" | "phone" | "verify-phone" | "profile" | "done";

const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const emailCodeSchema = z.object({ code: z.string().length(6, "Must be 6 digits") });
const phoneSchema = z.object({ phone: z.string().min(7, "Enter a valid phone number") });
const phoneCodeSchema = z.object({ code: z.string().length(6, "Must be 6 digits") });
const profileSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  country: z.string().min(2, "Country is required"),
  stateRegion: z.string().min(2, "State/Region is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
});

const STEPS: { step: RegStep; label: string; icon: React.ReactNode }[] = [
  { step: "credentials", label: "Account", icon: <Mail className="h-3.5 w-3.5" /> },
  { step: "verify-email", label: "Email", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { step: "phone", label: "Phone", icon: <Phone className="h-3.5 w-3.5" /> },
  { step: "verify-phone", label: "Verify", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { step: "profile", label: "Profile", icon: <User className="h-3.5 w-3.5" /> },
];

function StepIndicator({ current }: { current: RegStep }) {
  const idx = STEPS.findIndex((s) => s.step === current);
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((s, i) => (
        <div key={s.step} className="flex items-center gap-1">
          <div className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-medium transition-colors ${i < idx ? "bg-primary text-primary-foreground" : i === idx ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "bg-muted text-muted-foreground"}`}>
            {i < idx ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.icon}
          </div>
          {i < STEPS.length - 1 && <div className={`h-px w-5 ${i < idx ? "bg-primary" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

function RegisterWizard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<RegStep>("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhoneState] = useState("");

  const credForm = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const emailCodeForm = useForm<z.infer<typeof emailCodeSchema>>({
    resolver: zodResolver(emailCodeSchema),
    defaultValues: { code: "" },
  });
  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  const phoneCodeForm = useForm<z.infer<typeof phoneCodeSchema>>({
    resolver: zodResolver(phoneCodeSchema),
    defaultValues: { code: "" },
  });
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", country: "", stateRegion: "", dateOfBirth: "" },
  });

  async function onCredentials(values: z.infer<typeof credentialsSchema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register", { email: values.email, password: values.password });
      toast({ title: "Check your email (or server console)", description: "A 6-digit code has been sent." });
      setStep("verify-email");
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onVerifyEmail(values: z.infer<typeof emailCodeSchema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/verify-email", { code: values.code });
      toast({ title: "Email verified!" });
      setStep("phone");
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onResendEmail() {
    try {
      await apiRequest("POST", "/api/auth/resend-email-code", {});
      toast({ title: "Code resent", description: "Check your email or server console." });
    } catch (e: any) {
      toast({ title: "Failed to resend", description: e.message, variant: "destructive" });
    }
  }

  async function onPhone(values: z.infer<typeof phoneSchema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/send-phone-code", { phone: values.phone });
      setPhoneState(values.phone);
      toast({ title: "Code sent", description: "Check your phone (or server console)." });
      setStep("verify-phone");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onVerifyPhone(values: z.infer<typeof phoneCodeSchema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/verify-phone", { code: values.code });
      toast({ title: "Phone verified!" });
      setStep("profile");
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onResendPhone() {
    try {
      await apiRequest("POST", "/api/auth/send-phone-code", { phone });
      toast({ title: "Code resent", description: "Check your phone or server console." });
    } catch (e: any) {
      toast({ title: "Failed to resend", description: e.message, variant: "destructive" });
    }
  }

  async function onProfile(values: z.infer<typeof profileSchema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/complete-profile", values);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Account created!", description: "Welcome to CourseMini by EQC Institute." });
      const params = new URLSearchParams(window.location.search);
      navigate(params.get("returnTo") || "/dashboard");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <StepIndicator current={step} />
        {step === "credentials" && (
          <>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Start with your email and a secure password</CardDescription>
          </>
        )}
        {step === "verify-email" && (
          <>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>Enter the 6-digit code sent to your email address</CardDescription>
          </>
        )}
        {step === "phone" && (
          <>
            <CardTitle>Add your phone number</CardTitle>
            <CardDescription>We'll send a verification code via SMS</CardDescription>
          </>
        )}
        {step === "verify-phone" && (
          <>
            <CardTitle>Verify your phone</CardTitle>
            <CardDescription>Enter the 6-digit code sent to {phone}</CardDescription>
          </>
        )}
        {step === "profile" && (
          <>
            <CardTitle>Complete your profile</CardTitle>
            <CardDescription>Tell us a bit about yourself</CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent>
        {step === "credentials" && (
          <Form {...credForm}>
            <form onSubmit={credForm.handleSubmit(onCredentials)} className="space-y-4">
              <FormField control={credForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={credForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="At least 8 characters" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={credForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl><Input type="password" placeholder="Repeat your password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </form>
          </Form>
        )}

        {step === "verify-email" && (
          <Form {...emailCodeForm}>
            <form onSubmit={emailCodeForm.handleSubmit(onVerifyEmail)} className="space-y-4">
              <div className="flex items-center justify-center py-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              </div>
              <FormField control={emailCodeForm.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>6-digit code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest font-mono h-14"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Didn't get it?{" "}
                <button type="button" onClick={onResendEmail} className="text-primary underline">
                  Resend code
                </button>
              </p>
              <p className="text-center text-xs text-muted-foreground bg-muted rounded p-2">
                During development, codes are printed to the server console.
              </p>
            </form>
          </Form>
        )}

        {step === "phone" && (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(onPhone)} className="space-y-4">
              <div className="flex items-center justify-center py-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
              </div>
              <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 000 0000" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Code
              </Button>
            </form>
          </Form>
        )}

        {step === "verify-phone" && (
          <Form {...phoneCodeForm}>
            <form onSubmit={phoneCodeForm.handleSubmit(onVerifyPhone)} className="space-y-4">
              <div className="flex items-center justify-center py-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
              </div>
              <FormField control={phoneCodeForm.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>6-digit SMS code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest font-mono h-14"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Phone
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Didn't get it?{" "}
                <button type="button" onClick={onResendPhone} className="text-primary underline">
                  Resend code
                </button>
              </p>
              <p className="text-center text-xs text-muted-foreground bg-muted rounded p-2">
                During development, codes are printed to the server console.
              </p>
            </form>
          </Form>
        )}

        {step === "profile" && (
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfile)} className="space-y-4">
              <FormField control={profileForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={profileForm.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl><Input placeholder="Australia" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="stateRegion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Region</FormLabel>
                    <FormControl><Input placeholder="Queensland" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={profileForm.control} name="dateOfBirth" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Registration
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const defaultTab = params.get("tab") === "register" ? "register" : "login";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-500 relative items-center justify-center p-12">
        <div className="relative z-10 text-primary-foreground max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <span className="text-2xl font-bold">CourseMini</span>
              <p className="text-sm text-primary-foreground/70">by EQC Institute</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">Start your learning journey today</h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            Access courses from world-class instructors. Learn at your own pace, earn certificates, and advance your career.
          </p>
          <div className="mt-10 space-y-4">
            {[
              "Access to all free courses",
              "Track your learning progress",
              "Earn completion certificates",
              "Join a community of learners",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  ✓
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <RegisterWizard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
