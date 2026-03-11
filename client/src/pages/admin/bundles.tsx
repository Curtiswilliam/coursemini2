import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2, Package, X, Edit } from "lucide-react";

export default function AdminBundles() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editBundle, setEditBundle] = useState<any>(null);
  const [form, setForm] = useState({ title: "", slug: "", description: "", thumbnail: "", price: "" });
  const [courseToAdd, setCourseToAdd] = useState("");

  const { data: bundles, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/bundles"],
  });

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/admin/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/admin/bundles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bundles"] });
      setCreateOpen(false);
      setForm({ title: "", slug: "", description: "", thumbnail: "", price: "" });
      toast({ title: "Bundle created!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/admin/bundles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bundles"] });
      setEditBundle(null);
      toast({ title: "Bundle updated!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/bundles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bundles"] });
      toast({ title: "Bundle deleted" });
    },
  });

  const addCourseMutation = useMutation({
    mutationFn: async ({ bundleId, courseId }: { bundleId: number; courseId: number }) =>
      apiRequest("POST", `/api/admin/bundles/${bundleId}/courses`, { courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bundles"] });
      setCourseToAdd("");
      toast({ title: "Course added to bundle!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeCourseMutation = useMutation({
    mutationFn: async ({ bundleId, courseId }: { bundleId: number; courseId: number }) =>
      apiRequest("DELETE", `/api/admin/bundles/${bundleId}/courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bundles"] });
      toast({ title: "Course removed from bundle" });
    },
  });

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleCreate = () => {
    if (!form.title || !form.slug) {
      toast({ title: "Title and slug required", variant: "destructive" });
      return;
    }
    createMutation.mutate({ ...form, price: parseFloat(form.price) || 0 });
  };

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Bundles</h1>
              <p className="text-muted-foreground mt-1">Group courses into bundles</p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : bundles && bundles.length > 0 ? (
          bundles.map((bundle: any) => (
            <Card key={bundle.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{bundle.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold">${bundle.price}</span>
                      <Badge variant={bundle.isActive ? "default" : "secondary"}>
                        {bundle.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{bundle.courses?.length || 0} courses</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditBundle(bundle);
                        setForm({ title: bundle.title, slug: bundle.slug, description: bundle.description || "", thumbnail: bundle.thumbnail || "", price: String(bundle.price) });
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(bundle.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Courses in Bundle</p>
                  <div className="flex flex-wrap gap-2">
                    {bundle.courses?.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                        <span>{c.title}</span>
                        <button
                          onClick={() => removeCourseMutation.mutate({ bundleId: bundle.id, courseId: c.id })}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Select value={courseToAdd} onValueChange={setCourseToAdd}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Add a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses?.filter((c: any) => !bundle.courses?.some((bc: any) => bc.id === c.id)).map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!courseToAdd}
                      onClick={() => {
                        if (courseToAdd) {
                          addCourseMutation.mutate({ bundleId: bundle.id, courseId: parseInt(courseToAdd) });
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bundles yet</h3>
            <p className="text-muted-foreground">Create a bundle to group multiple courses together</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Bundle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
                placeholder="Complete Web Dev Bundle"
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="complete-web-dev-bundle" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Price ($)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="99.00" />
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">Create Bundle</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBundle} onOpenChange={() => setEditBundle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
            </div>
            <div>
              <Label>Price ($)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <Button
              onClick={() => updateMutation.mutate({ id: editBundle.id, data: { ...form, price: parseFloat(form.price) || 0 } })}
              disabled={updateMutation.isPending}
              className="w-full"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
