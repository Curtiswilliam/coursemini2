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
import { Plus, Trash2, Users, X } from "lucide-react";

export default function AdminGroups() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", courseId: "" });
  const [studentToAdd, setStudentToAdd] = useState("");

  const { data: groups, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/groups"],
  });

  const { data: students } = useQuery<any[]>({
    queryKey: ["/api/admin/students"],
  });

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/admin/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/admin/groups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      setCreateOpen(false);
      setForm({ name: "", description: "", courseId: "" });
      toast({ title: "Group created!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      if (selectedGroup) setSelectedGroup(null);
      toast({ title: "Group deleted" });
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) =>
      apiRequest("POST", `/api/admin/groups/${groupId}/members`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      setStudentToAdd("");
      toast({ title: "Student added!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeStudentMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) =>
      apiRequest("DELETE", `/api/admin/groups/${groupId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      toast({ title: "Student removed" });
    },
  });

  // Keep selectedGroup in sync with latest data
  const currentGroupData = groups?.find((g: any) => g.id === selectedGroup?.id);

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Student Groups</h1>
              <p className="text-muted-foreground mt-1">Organize students into cohorts and groups</p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Groups List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : groups && groups.length > 0 ? (
              groups.map((group: any) => (
                <Card
                  key={group.id}
                  className={`cursor-pointer transition-colors ${selectedGroup?.id === group.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{group.name}</h3>
                        {group.description && <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{group.memberCount} members</Badge>
                          {group.courseName && <Badge variant="secondary">{group.courseName}</Badge>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(group.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-16">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground text-sm">Create a group to organize students</p>
              </div>
            )}
          </div>

          {/* Group Detail */}
          {currentGroupData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{currentGroupData.name} — Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={studentToAdd} onValueChange={setStudentToAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.filter((s: any) => !currentGroupData.members?.some((m: any) => m?.id === s.id)).map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    disabled={!studentToAdd || addStudentMutation.isPending}
                    onClick={() => {
                      if (studentToAdd) {
                        addStudentMutation.mutate({ groupId: currentGroupData.id, userId: parseInt(studentToAdd) });
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {currentGroupData.members?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                  ) : (
                    currentGroupData.members?.filter(Boolean).map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                          {member.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <button
                          onClick={() => removeStudentMutation.mutate({ groupId: currentGroupData.id, userId: member.id })}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Student Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Spring 2026 Cohort" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Associated Course (optional)</Label>
              <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific course</SelectItem>
                  {courses?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                if (!form.name) { toast({ title: "Name required", variant: "destructive" }); return; }
                createMutation.mutate({ name: form.name, description: form.description, courseId: form.courseId ? parseInt(form.courseId) : null });
              }}
              disabled={createMutation.isPending}
              className="w-full"
            >
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
