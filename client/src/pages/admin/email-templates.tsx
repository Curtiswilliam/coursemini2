import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Pencil, Trash2, Zap } from "lucide-react";
import { format } from "date-fns";

const TRIGGER_OPTIONS = [
  { value: "user_signup", label: "User Signs Up", description: "Fires when a new user registers" },
  { value: "email_verified", label: "Email Verified", description: "Fires when a user verifies their email" },
  { value: "course_enroll", label: "Course Enrolled", description: "Fires when a student enrolls in a course" },
  { value: "course_complete", label: "Course Completed", description: "Fires when a student completes all lessons in a course" },
  { value: "lesson_complete", label: "Lesson Completed", description: "Fires each time a student completes a lesson" },
  { value: "certificate_issued", label: "Certificate Issued", description: "Fires when a certificate is issued after course completion" },
  { value: "badge_earned", label: "Badge Earned", description: "Fires when a student earns a badge" },
  { value: "checkout_abandon", label: "Abandoned Checkout", description: "Fires when a logged-in user views a course page but leaves without enrolling" },
  { value: "password_reset", label: "Password Reset", description: "Fires when a password reset is requested" },
];

const PRESET_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

type Tab = "templates" | "automations" | "categories";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export default function EmailTemplates() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Automations dialog state
  const [autoDialog, setAutoDialog] = useState(false);
  const [editingAuto, setEditingAuto] = useState<any>(null);
  const [autoForm, setAutoForm] = useState({ name: "", trigger: "", templateId: "", delayMinutes: "0", description: "" });

  // Categories state
  const [catForm, setCatForm] = useState({ name: "", color: "#6366f1", description: "" });
  const [editingCat, setEditingCat] = useState<any>(null);

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => apiFetch("/api/admin/email-templates"),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["email-categories"],
    queryFn: () => apiFetch("/api/admin/email-categories"),
  });

  const { data: automations = [] } = useQuery({
    queryKey: ["email-automations"],
    queryFn: () => apiFetch("/api/admin/email-automations"),
  });

  const createTemplate = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/email-templates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (tmpl) => {
      qc.invalidateQueries({ queryKey: ["email-templates"] });
      navigate(`/admin/email-templates/${tmpl.id}/edit`);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/email-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-templates"] }); toast({ title: "Template deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createAuto = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/email-automations", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-automations"] }); setAutoDialog(false); toast({ title: "Automation created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateAuto = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiFetch(`/api/admin/email-automations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-automations"] }); setAutoDialog(false); toast({ title: "Automation updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteAuto = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/email-automations/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-automations"] }); toast({ title: "Automation deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleAuto = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => apiFetch(`/api/admin/email-automations/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-automations"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createCat = useMutation({
    mutationFn: (data: any) => apiFetch("/api/admin/email-categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-categories"] }); setCatForm({ name: "", color: "#6366f1", description: "" }); toast({ title: "Category created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCat = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiFetch(`/api/admin/email-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-categories"] }); setEditingCat(null); toast({ title: "Category updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCat = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/admin/email-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["email-categories"] }); toast({ title: "Category deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function openAutoDialog(auto?: any) {
    if (auto) {
      setEditingAuto(auto);
      setAutoForm({
        name: auto.name,
        trigger: auto.trigger,
        templateId: String(auto.templateId ?? ""),
        delayMinutes: String(auto.delayMinutes ?? 0),
        description: auto.description ?? "",
      });
    } else {
      setEditingAuto(null);
      setAutoForm({ name: "", trigger: "", templateId: "", delayMinutes: "0", description: "" });
    }
    setAutoDialog(true);
  }

  function submitAutoForm() {
    const payload = {
      name: autoForm.name,
      trigger: autoForm.trigger,
      templateId: autoForm.templateId ? parseInt(autoForm.templateId) : undefined,
      delayMinutes: parseInt(autoForm.delayMinutes) || 0,
      description: autoForm.description || undefined,
    };
    if (editingAuto) {
      updateAuto.mutate({ id: editingAuto.id, data: payload });
    } else {
      createAuto.mutate(payload);
    }
  }

  const filteredTemplates = selectedCategory === null
    ? templates
    : templates.filter((t: any) => t.categoryId === selectedCategory);

  const tabs: { key: Tab; label: string }[] = [
    { key: "templates", label: "Templates" },
    { key: "automations", label: "Automations" },
    { key: "categories", label: "Categories" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email Templates</h1>
            <p className="text-sm text-muted-foreground">Design and manage email templates and automations</p>
          </div>
        </div>
        <Button onClick={() => createTemplate.mutate({ name: "New Template", subject: "" })} disabled={createTemplate.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div>
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Templates ({templates.length})
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>

          {loadingTemplates ? (
            <div className="text-center text-muted-foreground py-12">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
              <Mail className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No templates yet</p>
              <p className="text-sm">Click "New Template" to create your first email template.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tmpl: any) => {
                const cat = tmpl.category;
                const color = cat?.color ?? "#6366f1";
                return (
                  <div key={tmpl.id} className="border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow flex flex-col">
                    {/* Color accent bar */}
                    <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-tight">{tmpl.name}</h3>
                        <div className="flex gap-1 shrink-0">
                          {tmpl.isSystem && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">System</Badge>
                          )}
                        </div>
                      </div>
                      {tmpl.subject && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{tmpl.subject}</p>
                      )}
                      {cat && (
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-muted-foreground">{cat.name}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground/70 mt-auto">
                        {tmpl.createdAt ? format(new Date(tmpl.createdAt), "MMM d, yyyy") : ""}
                      </p>
                    </div>
                    <div className="border-t px-4 py-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => navigate(`/admin/email-templates/${tmpl.id}/edit`)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        disabled={tmpl.isSystem || deleteTemplate.isPending}
                        onClick={() => {
                          if (confirm(`Delete "${tmpl.name}"?`)) deleteTemplate.mutate(tmpl.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === "automations" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => openAutoDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>
          {automations.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
              <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No automations yet</p>
              <p className="text-sm">Create an automation to send emails based on user actions.</p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((auto: any) => {
                    const triggerOption = TRIGGER_OPTIONS.find(t => t.value === auto.trigger);
                    return (
                      <TableRow key={auto.id}>
                        <TableCell className="font-medium">{auto.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{triggerOption?.label ?? auto.trigger}</p>
                            <p className="text-xs text-muted-foreground">{triggerOption?.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {auto.template?.name ?? <span className="italic">None</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {auto.delayMinutes > 0 ? `${auto.delayMinutes}m` : "Immediate"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={auto.isActive}
                            onCheckedChange={(checked) => toggleAuto.mutate({ id: auto.id, isActive: checked })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAutoDialog(auto)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm("Delete this automation?")) deleteAuto.mutate(auto.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {/* Create form */}
          <div className="border rounded-xl p-4 bg-card space-y-3">
            <h3 className="font-medium text-sm">Add Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Name</Label>
                <Input
                  placeholder="e.g. Onboarding"
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Description</Label>
                <Input
                  placeholder="Optional description"
                  value={catForm.description}
                  onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Color</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCatForm(f => ({ ...f, color: c }))}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${catForm.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              disabled={!catForm.name || createCat.isPending}
              onClick={() => createCat.mutate(catForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </div>

          {/* Category list */}
          {categories.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-xl text-sm">No categories yet</div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat: any) => (
                <div key={cat.id} className="flex items-center gap-3 border rounded-lg p-3 bg-card">
                  <div className="h-8 w-8 rounded-lg shrink-0" style={{ backgroundColor: cat.color }} />
                  {editingCat?.id === cat.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        className="h-7 text-sm"
                        value={editingCat.name}
                        onChange={e => setEditingCat((c: any) => ({ ...c, name: e.target.value }))}
                      />
                      <Input
                        className="h-7 text-sm"
                        placeholder="Description"
                        value={editingCat.description ?? ""}
                        onChange={e => setEditingCat((c: any) => ({ ...c, description: e.target.value }))}
                      />
                      <div className="flex gap-1">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditingCat((cat2: any) => ({ ...cat2, color: c }))}
                            className={`h-5 w-5 rounded-full border-2 ${editingCat.color === c ? "border-foreground" : "border-transparent"}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <Button size="sm" className="h-7" onClick={() => updateCat.mutate({ id: cat.id, data: { name: editingCat.name, color: editingCat.color, description: editingCat.description } })}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => setEditingCat(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{cat.name}</p>
                        {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCat(cat)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Delete this category?")) deleteCat.mutate(cat.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Automation Dialog */}
      <Dialog open={autoDialog} onOpenChange={setAutoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAuto ? "Edit Automation" : "New Automation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-1 block">Name</Label>
              <Input
                placeholder="e.g. Welcome email"
                value={autoForm.name}
                onChange={e => setAutoForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Trigger</Label>
              <Select value={autoForm.trigger} onValueChange={v => setAutoForm(f => ({ ...f, trigger: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trigger..." />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <p className="font-medium text-sm">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1 block">Template</Label>
              <Select value={autoForm.templateId} onValueChange={v => setAutoForm(f => ({ ...f, templateId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1 block">Delay (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={autoForm.delayMinutes}
                onChange={e => setAutoForm(f => ({ ...f, delayMinutes: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">Set to 0 for immediate delivery</p>
            </div>
            <div>
              <Label className="text-sm mb-1 block">Description (optional)</Label>
              <Textarea
                placeholder="Describe what this automation does..."
                value={autoForm.description}
                onChange={e => setAutoForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoDialog(false)}>Cancel</Button>
            <Button
              onClick={submitAutoForm}
              disabled={!autoForm.name || !autoForm.trigger || createAuto.isPending || updateAuto.isPending}
            >
              {editingAuto ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
