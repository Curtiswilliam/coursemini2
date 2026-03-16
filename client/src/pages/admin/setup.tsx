import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Shield, Lock, Mail, Send, BarChart2, Clock, Plus, Pencil, Trash2,
  ChevronRight, GitBranch, BookOpen, ChevronUp, ChevronDown, ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Shared types ──────────────────────────────────────────────────────────────

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

// ─── Email Campaigns tab ───────────────────────────────────────────────────────

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

function CampaignDialog({ campaign, courses, onClose }: { campaign?: any; courses: any[]; onClose: () => void }) {
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
                <FormLabel>Scope to specific course <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
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
                Variables:{" "}
                {["{{user_name}}", "{{user_email}}", "{{course_title}}", "{{course_url}}", "{{next_course_title}}", "{{pathway_name}}"].map((v) => (
                  <code key={v} className="bg-muted px-1 rounded mr-1">{v}</code>
                ))}
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

function CampaignsTab() {
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
          <h2 className="text-lg font-semibold">Email Campaigns</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Automated emails triggered by user actions and course progress.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

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
                          {c.delayHours < 24 ? `${c.delayHours}h` : `${Math.round(c.delayHours / 24)}d`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setViewingSends(c)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {c.totalSends ?? 0}
                        <span className="text-xs text-muted-foreground">({c.sentCount ?? 0} sent)</span>
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
                          size="icon" variant="ghost" className="h-8 w-8 text-destructive"
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

      <Dialog open={showNew || !!editingCampaign} onOpenChange={(o) => { if (!o) { setShowNew(false); setEditingCampaign(null); } }}>
        <CampaignDialog
          campaign={editingCampaign}
          courses={courses}
          onClose={() => { setShowNew(false); setEditingCampaign(null); }}
        />
      </Dialog>

      <Dialog open={!!viewingSends} onOpenChange={(o) => { if (!o) setViewingSends(null); }}>
        {viewingSends && <SendsDialog campaign={viewingSends} onClose={() => setViewingSends(null)} />}
      </Dialog>
    </div>
  );
}

// ─── Course Pathways tab ───────────────────────────────────────────────────────

function PathwayDialog({
  pathway, courses, campaigns, onClose,
}: { pathway?: any; courses: any[]; campaigns: any[]; onClose: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(pathway?.name ?? "");
  const [description, setDescription] = useState(pathway?.description ?? "");
  const [isActive, setIsActive] = useState(pathway?.isActive ?? true);
  const [steps, setSteps] = useState<any[]>(pathway?.steps ?? []);
  const [saving, setSaving] = useState(false);
  const [newCourseId, setNewCourseId] = useState<string>("");
  const [newCampaignId, setNewCampaignId] = useState<string>("");

  const handleAddStep = () => {
    if (!newCourseId) return;
    const courseId = parseInt(newCourseId);
    if (steps.some((s) => s.courseId === courseId)) {
      toast({ title: "Course already in pathway", variant: "destructive" });
      return;
    }
    const course = courses.find((c) => c.id === courseId);
    setSteps((prev) => [
      ...prev,
      {
        _temp: true,
        courseId,
        courseTitle: course?.title ?? "",
        campaignId: newCampaignId ? parseInt(newCampaignId) : null,
        campaignName: campaigns.find((c) => c.id === parseInt(newCampaignId))?.name ?? null,
        position: prev.length + 1,
      },
    ]);
    setNewCourseId("");
    setNewCampaignId("");
  };

  const moveStep = (idx: number, dir: "up" | "down") => {
    const arr = [...steps];
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSteps(arr.map((s, i) => ({ ...s, position: i + 1 })));
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i + 1 })));
  };

  const updateStepCampaign = (idx: number, campaignId: string) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const camp = campaigns.find((c) => c.id === parseInt(campaignId));
        return { ...s, campaignId: campaignId ? parseInt(campaignId) : null, campaignName: camp?.name ?? null };
      })
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let pathwayId = pathway?.id;
      if (pathwayId) {
        await apiRequest("PATCH", `/api/admin/pathways/${pathwayId}`, { name, description, isActive });
        for (const s of (pathway?.steps ?? [])) {
          await apiRequest("DELETE", `/api/admin/pathways/${pathwayId}/steps/${s.id}`, {});
        }
      } else {
        const res = await apiRequest("POST", "/api/admin/pathways", { name, description, isActive });
        const data = await res.json();
        pathwayId = data.id;
      }
      for (let i = 0; i < steps.length; i++) {
        await apiRequest("POST", `/api/admin/pathways/${pathwayId}/steps`, {
          courseId: steps[i].courseId,
          campaignId: steps[i].campaignId ?? null,
          position: i + 1,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pathways"] });
      toast({ title: pathway?.id ? "Pathway updated" : "Pathway created" });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const availableCourses = courses.filter((c) => !steps.some((s) => s.courseId === c.id));

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{pathway?.id ? "Edit Pathway" : "New Course Pathway"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <Label>Pathway Name</Label>
            <Input placeholder="e.g. Web Development Track" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Description <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <Textarea
              placeholder="Describe what students will achieve through this pathway..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="!mt-0">Active</Label>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-1">Course Sequence</h3>
          <p className="text-xs text-muted-foreground mb-3">
            When a student completes a course, the optional campaign fires to promote the next course in the sequence.
          </p>

          {steps.length === 0 ? (
            <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
              No courses added yet. Add the first course below.
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                  <div className="flex flex-col gap-0.5">
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveStep(idx, "up")} disabled={idx === 0}>
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => moveStep(idx, "down")} disabled={idx === steps.length - 1}>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{step.courseTitle}</div>
                    {idx < steps.length - 1 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Select value={step.campaignId?.toString() ?? ""} onValueChange={(v) => updateStepCampaign(idx, v)}>
                          <SelectTrigger className="h-6 text-xs w-48">
                            <SelectValue placeholder="No campaign (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No campaign</SelectItem>
                            {campaigns.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">on complete</span>
                      </div>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeStep(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {availableCourses.length > 0 && (
            <div className="flex gap-2 items-end p-3 border rounded-lg border-dashed">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Add course</Label>
                <Select value={newCourseId} onValueChange={setNewCourseId}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select a course..." /></SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {steps.length > 0 && (
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Campaign when previous completes</Label>
                  <Select value={newCampaignId} onValueChange={setNewCampaignId}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="No campaign" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No campaign</SelectItem>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button className="h-8" onClick={handleAddStep} disabled={!newCourseId}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {pathway?.id ? "Save Changes" : "Create Pathway"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function PathwaysTab() {
  const { toast } = useToast();
  const [editing, setEditing] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { data: pathways = [] } = useQuery<any[]>({ queryKey: ["/api/admin/pathways"] });
  const { data: courses = [] } = useQuery<any[]>({ queryKey: ["/api/admin/courses"] });
  const { data: campaigns = [] } = useQuery<any[]>({ queryKey: ["/api/admin/campaigns"] });

  const { data: editingDetail } = useQuery<any>({
    queryKey: ["/api/admin/pathways", editing?.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/pathways/${editing.id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!editing?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/pathways/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pathways"] });
      toast({ title: "Pathway deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/pathways/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/pathways"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Course Pathways</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Build learning sequences that automatically market the next course when a student completes the previous one.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Pathway
        </Button>
      </div>

      {pathways.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <GitBranch className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No pathways yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create a learning pathway to automatically guide students through a series of courses.
            </p>
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create First Pathway
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pathways.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                  <Badge variant={p.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{p.stepCount} course{p.stepCount !== 1 ? "s" : ""}</span>
                </div>
                {(p.stepCount ?? 0) > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {Array.from({ length: Math.min(p.stepCount, 5) }).map((_, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className="h-5 w-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3 text-primary/60" />
                        </div>
                        {i < Math.min(p.stepCount, 5) - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    ))}
                    {p.stepCount > 5 && <span className="text-xs text-muted-foreground">+{p.stepCount - 5} more</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-auto pt-3 border-t">
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, isActive: v })}
                  />
                  <span className="text-xs text-muted-foreground flex-1">{p.isActive ? "Enabled" : "Disabled"}</span>
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={(o) => { if (!o) setShowNew(false); }}>
        <PathwayDialog courses={courses} campaigns={campaigns} onClose={() => setShowNew(false)} />
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        {editing && editingDetail && (
          <PathwayDialog pathway={editingDetail} courses={courses} campaigns={campaigns} onClose={() => setEditing(null)} />
        )}
      </Dialog>
    </div>
  );
}

// ─── Admin Access tab ──────────────────────────────────────────────────────────

const setupSchema = z.object({
  secret: z.string().min(1, "Admin secret is required"),
});

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

function AdminAccessTab() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: { secret: "" },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: user?.email ?? "" },
  });

  const onSubmit = async (values: z.infer<typeof setupSchema>) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/promote-admin", { secret: values.secret });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Success", description: "Your account has been promoted to admin." });
      navigate("/admin");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Invalid secret.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setEmailLoading(true);
    try {
      await apiRequest("PATCH", "/api/auth/update-email", { email: values.email });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Email updated", description: "Your admin email address has been saved." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  if (user?.role === "ADMIN") {
    return (
      <div className="space-y-6 max-w-md">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Shield className="h-10 w-10 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">You're a Super Admin</h3>
              <p className="text-sm text-muted-foreground">Your account has full admin privileges.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" /> Admin Email Address
            </CardTitle>
            <CardDescription>Update the email address associated with your admin account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField control={emailForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={emailLoading}>
                  {emailLoading ? "Saving..." : "Save Email"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" /> Promote to Admin
        </CardTitle>
        <CardDescription>Enter the admin secret to gain admin privileges.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="secret" render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Secret</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter admin secret" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Promoting..." : "Promote to Admin"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─── Main Settings page ────────────────────────────────────────────────────────

const TABS = [
  { id: "campaigns", label: "Email Campaigns", icon: Mail },
  { id: "access", label: "Admin Access", icon: Shield },
];

export default function AdminSetup() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultTab = params.get("tab") ?? "campaigns";
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure email campaigns and admin access.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "campaigns" && <CampaignsTab />}
      {activeTab === "access" && <AdminAccessTab />}
    </div>
  );
}
