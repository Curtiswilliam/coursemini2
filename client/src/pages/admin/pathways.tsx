import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, ChevronUp, ChevronDown, GitBranch,
  Pencil, ArrowRight, Mail, BookOpen, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Pathway Builder Dialog ────────────────────────────────────────────────────

function PathwayDialog({
  pathway, courses, campaigns, onClose,
}: {
  pathway?: any; courses: any[]; campaigns: any[]; onClose: () => void;
}) {
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
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
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
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1">
            <Label>Pathway Name</Label>
            <Input placeholder="e.g. Web Development Track" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Description <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <Textarea
              placeholder="Describe the learning journey..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[70px]"
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
            When a student completes a course, the campaign attached to that step fires to promote the next course.
          </p>

          {steps.length === 0 ? (
            <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-sm">
              No courses yet. Add the first course below.
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
                        <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                        <Select value={step.campaignId?.toString() ?? ""} onValueChange={(v) => updateStepCampaign(idx, v)}>
                          <SelectTrigger className="h-6 text-xs w-52">
                            <SelectValue placeholder="No email on complete (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No campaign</SelectItem>
                            {campaigns.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                  <Label className="text-xs">Email when previous course completes</Label>
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

// ─── Visual pathway map card ───────────────────────────────────────────────────

function PathwayCard({
  pathway,
  onEdit,
  onDelete,
  onToggle,
}: {
  pathway: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
}) {
  const steps: any[] = pathway.steps ?? [];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base truncate">{pathway.name}</CardTitle>
              <Badge variant={pathway.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
                {pathway.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {pathway.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pathway.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Visual progression map */}
        {steps.length === 0 ? (
          <div className="text-center py-6 border rounded-lg border-dashed text-muted-foreground text-xs">
            No courses in this pathway yet
          </div>
        ) : (
          <div className="space-y-1">
            {steps.sort((a: any, b: any) => a.position - b.position).map((step: any, idx: number) => (
              <div key={step.id ?? idx}>
                {/* Course node */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                    {idx + 1}
                  </div>
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium truncate flex-1">{step.courseTitle}</span>
                </div>

                {/* Campaign connector (between steps) */}
                {idx < steps.length - 1 && (
                  <div className="flex items-center gap-2 my-1 pl-3">
                    <div className="w-px h-4 bg-border ml-2.5" />
                    {step.campaignName ? (
                      <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20">
                        <Mail className="h-2.5 w-2.5 text-primary" />
                        <span className="text-[10px] text-primary font-medium truncate max-w-[140px]">
                          {step.campaignName}
                        </span>
                      </div>
                    ) : (
                      <ArrowRight className="h-3 w-3 text-muted-foreground ml-1" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t">
          <Switch checked={pathway.isActive} onCheckedChange={onToggle} />
          <span className="text-xs text-muted-foreground flex-1">
            {steps.length} course{steps.length !== 1 ? "s" : ""}
          </span>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPathways() {
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Course Pathways</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build structured learning journeys. When a student completes a course, automatically send an email marketing the next one.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Pathway
        </Button>
      </div>

      {pathways.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No pathways yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Create a learning pathway to automatically guide students through a series of courses with email marketing between each step.
            </p>
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create First Pathway
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pathways.map((p) => (
            <PathwayCard
              key={p.id}
              pathway={p}
              onEdit={() => setEditing(p)}
              onDelete={() => deleteMutation.mutate(p.id)}
              onToggle={(v) => toggleMutation.mutate({ id: p.id, isActive: v })}
            />
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
