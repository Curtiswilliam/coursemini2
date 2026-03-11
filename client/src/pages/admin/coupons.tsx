import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Tag, Copy } from "lucide-react";

export default function AdminCoupons() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    maxUses: "",
    expiresAt: "",
    courseId: "",
    isActive: true,
  });

  const { data: coupons, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/coupons"],
  });

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/admin/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/coupons", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setOpen(false);
      setForm({ code: "", type: "PERCENTAGE", value: "", maxUses: "", expiresAt: "", courseId: "", isActive: true });
      toast({ title: "Coupon created!" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Coupon deleted" });
    },
  });

  const handleSubmit = () => {
    if (!form.code || !form.value) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      courseId: form.courseId ? parseInt(form.courseId) : null,
      isActive: form.isActive,
    });
  };

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Coupons</h1>
              <p className="text-muted-foreground mt-1">Create and manage discount codes</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Coupon</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Coupon Code *</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE20"
                      className="uppercase"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type *</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                          <SelectItem value="FIXED">Fixed ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Value *</Label>
                      <Input
                        type="number"
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        placeholder={form.type === "PERCENTAGE" ? "20" : "10.00"}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Max Uses (optional)</Label>
                    <Input
                      type="number"
                      value={form.maxUses}
                      onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label>Expires At (optional)</Label>
                    <Input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Specific Course (optional - leave empty for all courses)</Label>
                    <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All courses</SelectItem>
                        {courses?.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
                    Create Coupon
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : coupons && coupons.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {coupons.map((coupon: any) => (
                  <div key={coupon.id} className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{coupon.code}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            toast({ title: "Copied!" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Badge variant={coupon.isActive ? "default" : "secondary"}>
                          {coupon.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          {coupon.type === "PERCENTAGE" ? `${coupon.value}% off` : `$${coupon.value} off`}
                        </span>
                        <span>Used: {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ""}</span>
                        {coupon.expiresAt && (
                          <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>
                        )}
                        {coupon.courseName && (
                          <span>Course: {coupon.courseName}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(coupon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No coupons yet</h3>
            <p className="text-muted-foreground">Create your first discount coupon</p>
          </div>
        )}
      </div>
    </div>
  );
}
