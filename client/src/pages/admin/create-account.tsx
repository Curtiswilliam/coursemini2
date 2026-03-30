import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Copy, CheckCircle2 } from "lucide-react";

const PERMISSION_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "courses", label: "Courses" },
  { key: "coupons", label: "Coupons" },
  { key: "orders", label: "Orders & Revenue" },
  { key: "pathways", label: "Pathways" },
  { key: "students", label: "Students" },
  { key: "groups", label: "Student Groups" },
  { key: "analytics", label: "Analytics" },
  { key: "email-templates", label: "Email Templates" },
  { key: "webhooks", label: "Webhooks" },
  { key: "settings", label: "Settings" },
];

const schema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

export default function AdminCreateAccount() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<string[]>(["dashboard"]);
  const [result, setResult] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", name: "", phone: "", role: "ADMIN" },
  });

  const selectedRole = form.watch("role");

  function togglePermission(key: string) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function selectAll() { setPermissions(PERMISSION_OPTIONS.map((p) => p.key)); }
  function clearAll() { setPermissions([]); }

  async function onSubmit(values: z.infer<typeof schema>) {
    setSaving(true);
    try {
      const data = await (await apiRequest("POST", "/api/admin/create-account", {
        ...values,
        adminPermissions: values.role === "SUPER_ADMIN" ? PERMISSION_OPTIONS.map((p) => p.key) : permissions,
      })).json();
      setResult({ name: data.name, email: data.email, tempPassword: data.tempPassword });
      form.reset();
      setPermissions(["dashboard"]);
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function copyPassword() {
    if (result) {
      navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Only Super Admins can create admin accounts.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="h-6 w-6" /> Create Admin Account
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Create a new admin or super admin account with specific permissions</p>
      </div>

      {result && (
        <Alert className="mb-6 border-emerald-500/50 bg-emerald-500/5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertDescription>
            <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">Account created for {result.name}</p>
            <p className="text-sm text-muted-foreground mb-2">Send these credentials to the new admin securely:</p>
            <div className="flex items-center gap-2 bg-muted p-2 rounded-md font-mono text-sm">
              <span className="flex-1">{result.email} / {result.tempPassword}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copyPassword}>
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">The admin should change their password after first login.</p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Fill in the details for the new admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input placeholder="Jane Smith" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl><Input placeholder="+61 4xx xxx xxx" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {selectedRole === "ADMIN" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">Dashboard Permissions</p>
                      <p className="text-xs text-muted-foreground">Select which sections this admin can access</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={selectAll}>All</Button>
                      <Button type="button" variant="outline" size="sm" onClick={clearAll}>None</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-lg p-3">
                    {PERMISSION_OPTIONS.map((opt) => (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer text-sm py-1 px-2 rounded hover:bg-muted">
                        <Checkbox
                          checked={permissions.includes(opt.key)}
                          onCheckedChange={() => togglePermission(opt.key)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedRole === "SUPER_ADMIN" && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Super Admins automatically have access to all sections and can manage other admins.
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Creating…" : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
