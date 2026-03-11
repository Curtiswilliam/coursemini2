import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, Mail, Send, Clock, BarChart2, ChevronRight, X,
} from "lucide-react";

const TRIGGER_LABELS: Record<string, string> = {
  USER_SIGNUP: "User signs up",
  EMAIL_VERIFIED: "Email verified",
  COURSE_ENROLLED: "Course enrolled",
  COURSE_COMPLETED: "Course completed",
  PATHWAY_STEP_COMPLETED: "Pathway step completed",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SENT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const campaignSchema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().optional(),
  triggerType: z.enum(["USER_SIGNUP", "EMAIL_VERIFIED", "COURSE_ENROLLED", "COURSE_COMPLETED", "PATHWAY_STEP_COMPLETED"]),
  delayHours: z.coerce.number().min(0),
  courseId: z.coerce.number().optional().nullable(),
  subject: z.string().min(2, "Subject required"),
  body: z.string().min(10, "Body required"),
  isActive: z.boolean(),
});

type CampaignForm = z.infer<typeof campaignSchema>;

function CampaignDialog({
  campaign,
  courses,
  onClose,
}: { campaign?: any; courses: any[]; onClose: () => void }) {
  const { toast } = useToast();

  const form = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name ?? "",
      description: campaign?.description ?? "",
      triggerType: campaign?.triggerType ?? "USER_SIGNUP",
      delayHours: campaign?.delayHours ?? 0,
      courseId: campaign?.courseId ?? null,
      subject: campaign?.subject ?? "",
      body: campaign?.body ?? "",
      isActive: campaign?.isActive ?? true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: CampaignForm) => {
      const payload = { ...values, courseId: values.courseId || null };
      if (campaign?.id) {
        await apiRequest("PATCH", `/api/admin/campaigns/${campaign.id}`, payload);
      } else {
        await apiRequest("POST", "/api/admin/campaigns", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: campaign?.id ? "Campaign updated" : "Campaign created" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const triggerType = form.watch("triggerType");
  const showCourseFilter = triggerType === "COURSE_ENROLLED" || triggerType === "COURSE_COMPLETED";

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{campaign?.id ? "Edit Campaign" : "New Campaign"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Campaign Name</FormLabel>
                <FormControl><Input placeholder="Welcome email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="triggerType" render={({ field }) => (
              <FormItem>
                <FormLabel>Trigger</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="delayHours" render={({ field }) => (
              <FormItem>
                <FormLabel>Delay (hours)</FormLabel>
                <FormControl><Input type="number" min={0} {...field} /></FormControl>
                <p className="text-xs text-muted-foreground">0 = send immediately</p>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {showCourseFilter && (
            <FormField control={form.control} name="courseId" render={({ field }) => (
              <FormItem>
                <FormLabel>Scope to specific course <span className="text-muted-foreground font-normal text-xs">(optional — leave blank for any course)</span></FormLabel>
                <Select
                  value={field.value?.toString() ?? ""}
                  onValueChange={(v) => field.onChange(v ? parseInt(v) : null)}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="Any course" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="">Any course</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <FormField control={form.control} name="subject" render={({ field }) => (
            <FormItem>
              <FormLabel>Email Subject</FormLabel>
              <FormControl><Input placeholder="Welcome to CourseMini, {{user_name}}!" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="body" render={({ field }) => (
            <FormItem>
              <FormLabel>Email Body</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={"Hi {{user_name}},\n\nWelcome aboard!...\n\nThe CourseMini Team"}
                  className="min-h-[180px] font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Variables: <code className="bg-muted px-1 rounded">{"{{user_name}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{user_email}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{course_title}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{course_url}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{next_course_title}}"}</code>{" "}
                <code className="bg-muted px-1 rounded">{"{{pathway_name}}"}</code>
              </p>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="isActive" render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <FormLabel className="!mt-0">Active</FormLabel>
            </FormItem>
          )} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {campaign?.id ? "Save Changes" : "Create Campaign"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function SendsDialog({ campaign, onClose }: { campaign: any; onClose: () => void }) {
  const { data: sends = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/campaigns", campaign.id, "sends"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/sends`, { credentials: "include" });
      return res.json();
    },
  });

  return (
    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Send history — {campaign.name}</DialogTitle>
      </DialogHeader>
      {sends.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No sends yet for this campaign.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sends.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium text-sm">{s.userName}</div>
                  <div className="text-xs text-muted-foreground">{s.userEmail}</div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? ""}`}>
                    {s.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(s.scheduledAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {s.sentAt ? new Date(s.sentAt).toLocaleString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DialogContent>
  );
}

export default function AdminCampaigns() {
  const { toast } = useToast();
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [viewingSends, setViewingSends] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { data: campaigns = [] } = useQuery<any[]>({ queryKey: ["/api/admin/campaigns"] });
  const { data: courses = [] } = useQuery<any[]>({ queryKey: ["/api/admin/courses"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/campaigns/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Campaign deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/campaigns/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automated emails triggered by user actions and course progress.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Campaigns", value: campaigns.length, icon: Mail },
          { label: "Active", value: campaigns.filter((c) => c.isActive).length, icon: Send },
          { label: "Total Sends", value: campaigns.reduce((a, c) => a + (c.totalSends ?? 0), 0), icon: BarChart2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns table */}
      <Card>
        <CardHeader><CardTitle>All Campaigns</CardTitle></CardHeader>
        <CardContent className="p-0">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No campaigns yet. Create your first one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Sends</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {TRIGGER_LABELS[c.triggerType] ?? c.triggerType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.delayHours === 0 ? "Immediate" : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {c.delayHours < 24
                            ? `${c.delayHours}h`
                            : `${Math.round(c.delayHours / 24)}d`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setViewingSends(c)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {c.totalSends ?? 0}
                        <span className="text-xs text-muted-foreground">
                          ({c.sentCount ?? 0} sent)
                        </span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: c.id, isActive: v })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCampaign(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteMutation.mutate(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New/Edit dialog */}
      <Dialog open={showNew || !!editingCampaign} onOpenChange={(o) => { if (!o) { setShowNew(false); setEditingCampaign(null); } }}>
        <CampaignDialog
          campaign={editingCampaign}
          courses={courses}
          onClose={() => { setShowNew(false); setEditingCampaign(null); }}
        />
      </Dialog>

      {/* Sends dialog */}
      <Dialog open={!!viewingSends} onOpenChange={(o) => { if (!o) setViewingSends(null); }}>
        {viewingSends && <SendsDialog campaign={viewingSends} onClose={() => setViewingSends(null)} />}
      </Dialog>
    </div>
  );
}
