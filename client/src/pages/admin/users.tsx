import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

type UserRow = { id: number; username: string; name: string; email: string; role: string; isActive: boolean };

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<UserRow[]>({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "SUPER_ADMIN",
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { isActive });
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: isActive ? "User activated" : "User deactivated" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update status", description: e.message, variant: "destructive" });
    },
  });

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Super Admin Only</h3>
            <p className="text-sm text-muted-foreground">Only super admins can manage user roles.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-admin">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-users-title">User Management</h1>
              <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : !users || users.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <Card key={u.id} data-testid={`card-user-${u.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {u.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`text-user-name-${u.id}`}>{u.name}</p>
                      <p className="text-sm text-muted-foreground">@{u.username} · {u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {u.id === user?.id ? (
                      <Badge variant="default" data-testid={`badge-role-${u.id}`}>{u.role.replace("_", " ")} (You)</Badge>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.isActive !== false}
                            onCheckedChange={(isActive) => updateStatusMutation.mutate({ userId: u.id, isActive })}
                            title={u.isActive !== false ? "Active — click to deactivate" : "Inactive — click to activate"}
                          />
                          <span className="text-xs text-muted-foreground w-16">
                            {u.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <Select
                          value={u.role}
                          onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role })}
                        >
                          <SelectTrigger className="w-36" data-testid={`select-role-${u.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STUDENT">Student</SelectItem>
                            <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
