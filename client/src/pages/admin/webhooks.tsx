import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Webhook, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";

const EVENT_TYPES = [
  { value: "enrollment.created", label: "Enrollment Created" },
  { value: "course.completed", label: "Course Completed" },
  { value: "user.created", label: "User Registered" },
  { value: "order.created", label: "Order Created" },
  { value: "*", label: "All Events" },
];

export default function AdminWebhooks() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedDeliveries, setExpandedDeliveries] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", url: "", events: [] as string[], secret: "" });

  const { data: webhooks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/webhooks"],
  });

  const { data: deliveries } = useQuery<any[]>({
    queryKey: ["/api/admin/webhooks", expandedDeliveries, "deliveries"],
    queryFn: async () => {
      if (!expandedDeliveries) return [];
      const res = await fetch(`/api/admin/webhooks/${expandedDeliveries}/deliveries`, { credentials: "include" });
      return res.json();
    },
    enabled: !!expandedDeliveries,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/admin/webhooks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhooks"] });
      setCreateOpen(false);
      setForm({ name: "", url: "", events: [], secret: "" });
      toast({ title: "Webhook created!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/admin/webhooks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhooks"] });
      toast({ title: "Webhook updated!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhooks"] });
      toast({ title: "Webhook deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleEvent = (val: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(val)
        ? f.events.filter((e) => e !== val)
        : [...f.events, val],
    }));
  };

  const handleCreate = () => {
    if (!form.name || !form.url) {
      toast({ title: "Name and URL are required", variant: "destructive" });
      return;
    }
    if (form.events.length === 0) {
      toast({ title: "Select at least one event", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Webhooks</h1>
              <p className="text-muted-foreground mt-1">Receive real-time notifications when events occur</p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : webhooks && webhooks.length > 0 ? (
          webhooks.map((wh: any) => (
            <Card key={wh.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Webhook className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{wh.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 break-all">{wh.url}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(wh.events as string[]).map((ev: string) => (
                          <Badge key={ev} variant="secondary" className="text-xs">{ev}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Active</Label>
                      <Switch
                        checked={wh.isActive}
                        onCheckedChange={(checked) => updateMutation.mutate({ id: wh.id, data: { isActive: checked } })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedDeliveries(expandedDeliveries === wh.id ? null : wh.id)}
                    >
                      {expandedDeliveries === wh.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(wh.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedDeliveries === wh.id && (
                <CardContent className="pt-0 border-t">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recent Deliveries</p>
                  {!deliveries || deliveries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No deliveries yet</p>
                  ) : (
                    <div className="space-y-2">
                      {deliveries.map((d: any) => (
                        <div key={d.id} className="flex items-center gap-3 text-sm">
                          {d.status === "delivered" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          )}
                          <Badge variant="outline" className="text-xs">{d.event}</Badge>
                          {d.responseCode && (
                            <span className="text-xs text-muted-foreground">HTTP {d.responseCode}</span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(d.createdAt).toLocaleString()}
                          </span>
                          {d.error && (
                            <span className="text-xs text-destructive">{d.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-16">
            <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No webhooks yet</h3>
            <p className="text-muted-foreground mb-4">Add a webhook to receive real-time event notifications</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. My CRM Integration"
              />
            </div>
            <div>
              <Label>Endpoint URL *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com/webhook"
                type="url"
              />
            </div>
            <div>
              <Label className="mb-2 block">Events *</Label>
              <div className="space-y-2">
                {EVENT_TYPES.map((et) => (
                  <div key={et.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`event-${et.value}`}
                      checked={form.events.includes(et.value)}
                      onCheckedChange={() => toggleEvent(et.value)}
                    />
                    <Label htmlFor={`event-${et.value}`} className="font-normal cursor-pointer text-sm">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">{et.value}</span>
                      {et.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Secret (optional)</Label>
              <Input
                value={form.secret}
                onChange={(e) => setForm({ ...form, secret: e.target.value })}
                placeholder="Used for HMAC signature verification"
                type="password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If set, deliveries will include an X-CourseMini-Signature header
              </p>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
              Create Webhook
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
