import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BookOpen, Plus, Search, Pencil, Copy, Archive, ArchiveRestore,
  MoreHorizontal, Users, GraduationCap, Eye,
} from "lucide-react";

type Tab = "all" | "published" | "draft" | "archived";

export default function AdminCourses() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [duplicating, setDuplicating] = useState<number | null>(null);
  const [archiving, setArchiving] = useState<number | null>(null);

  const { data: courses = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/courses", tab === "archived" ? "archived" : "active"],
    queryFn: async () => {
      const url = tab === "archived"
        ? "/api/admin/courses?includeArchived=1"
        : "/api/admin/courses";
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await apiRequest("POST", `/api/admin/courses/${courseId}/duplicate`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Course duplicated", description: `"${data.title}" created as a draft.` });
      navigate(`/admin/courses/${data.id}/edit`);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => setDuplicating(null),
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ courseId, archive }: { courseId: number; archive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/courses/${courseId}/archive`, { archive });
      return res.json();
    },
    onSuccess: (_, { archive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: archive ? "Course archived" : "Course restored" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => setArchiving(null),
  });

  // Client-side filtering
  const filtered = courses.filter((c: any) => {
    const isArchived = !!c.archivedAt;
    if (tab === "archived") return isArchived;
    if (isArchived) return false;
    if (tab === "published") return c.status === "PUBLISHED";
    if (tab === "draft") return c.status === "DRAFT";
    return true; // "all" tab
  }).filter((c: any) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.title?.toLowerCase().includes(s) || c.status?.toLowerCase().includes(s);
  });

  // Tab counts
  const allCourses = courses.filter((c: any) => !c.archivedAt);
  const counts = {
    all: allCourses.length,
    published: allCourses.filter((c: any) => c.status === "PUBLISHED").length,
    draft: allCourses.filter((c: any) => c.status === "DRAFT").length,
    archived: courses.filter((c: any) => !!c.archivedAt).length,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Courses</h1>
              <p className="text-muted-foreground mt-1">Manage all your courses in one place</p>
            </div>
            <Link href="/admin/courses/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Stats row */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Active", value: counts.all, icon: BookOpen, color: "text-primary bg-primary/10" },
              { label: "Published", value: counts.published, icon: Eye, color: "text-emerald-600 bg-emerald-500/10" },
              { label: "Drafts", value: counts.draft, icon: Pencil, color: "text-amber-600 bg-amber-500/10" },
              { label: "Archived", value: counts.archived, icon: Archive, color: "text-muted-foreground bg-muted" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-md flex items-center justify-center ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex-1">
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="published">Published ({counts.published})</TabsTrigger>
              <TabsTrigger value="draft">Draft ({counts.draft})</TabsTrigger>
              <TabsTrigger value="archived">Archived ({counts.archived})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Course list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold mb-1">
                {search ? "No courses match your search" : tab === "archived" ? "No archived courses" : "No courses yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {!search && tab === "all" && "Create your first course to get started."}
              </p>
              {!search && tab === "all" && (
                <Link href="/admin/courses/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Course
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((course: any) => (
              <Card key={course.id} className="group hover:shadow-sm transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="h-14 w-20 rounded-md overflow-hidden shrink-0 bg-muted">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm truncate max-w-xs">{course.title}</h3>
                        {course.archivedAt ? (
                          <Badge variant="outline" className="text-muted-foreground shrink-0">Archived</Badge>
                        ) : course.status === "PUBLISHED" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 shrink-0">Published</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 shrink-0">Draft</Badge>
                        )}
                        {course.isFree ? (
                          <Badge variant="secondary" className="shrink-0">Free</Badge>
                        ) : course.price ? (
                          <Badge variant="secondary" className="shrink-0">${course.price}</Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.enrollmentCount ?? 0} enrolled
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {course.lessonCount ?? 0} lessons
                        </span>
                        {course.category && (
                          <span>{course.category.name}</span>
                        )}
                        <span className="hidden sm:inline">
                          Updated {new Date(course.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!course.archivedAt && (
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Button variant="outline" size="sm" className="hidden sm:flex">
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                        </Link>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!course.archivedAt && (
                            <>
                              <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={duplicating === course.id}
                                onClick={() => { setDuplicating(course.id); duplicateMutation.mutate(course.id); }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                {duplicating === course.id ? "Duplicating…" : "Duplicate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={archiving === course.id}
                                className="text-destructive focus:text-destructive"
                                onClick={() => { setArchiving(course.id); archiveMutation.mutate({ courseId: course.id, archive: true }); }}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </>
                          )}
                          {course.archivedAt && (
                            <DropdownMenuItem
                              disabled={archiving === course.id}
                              onClick={() => { setArchiving(course.id); archiveMutation.mutate({ courseId: course.id, archive: false }); }}
                            >
                              <ArchiveRestore className="h-4 w-4 mr-2" />
                              {archiving === course.id ? "Restoring…" : "Restore"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
