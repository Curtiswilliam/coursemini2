import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Mail, Lock, Award, StickyNote, ArrowLeft, ExternalLink, Download } from "lucide-react";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, underscores"),
  email: z.string().email("Invalid email"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

// ─── Profile Form ─────────────────────────────────────────────────────────────

function ProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", username: user?.username || "", email: user?.email || "" },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/auth/account", values);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
        <CardDescription>Update your name, username, and email address</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─── Password Form ─────────────────────────────────────────────────────────────

function PasswordForm() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/auth/account", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast({ title: "Password changed" });
      form.reset();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="currentPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Current password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="newPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Change Password"}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─── Certificates ─────────────────────────────────────────────────────────────

function CertificatesSection() {
  const { data: certificates, isLoading } = useQuery<any[]>({ queryKey: ["/api/my/certificates"] });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4" /> My Certificates</CardTitle>
        <CardDescription>Certificates you've earned by completing courses</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !certificates?.length ? (
          <p className="text-sm text-muted-foreground">No certificates yet. Complete a course to earn one.</p>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{cert.course?.title || "Course"}</p>
                  <p className="text-xs text-muted-foreground">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/certificates/${cert.code}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────────

function NotesSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><StickyNote className="h-4 w-4" /> My Notes</CardTitle>
        <CardDescription>Notes you've taken across all courses</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/my-notes">
          <Button variant="outline" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Full Notepad
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountSettings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Courses
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
        </div>

        <div className="space-y-6">
          <ProfileForm />
          <Separator />
          <PasswordForm />
          <Separator />
          <CertificatesSection />
          <Separator />
          <NotesSection />
        </div>
      </div>
    </div>
  );
}
