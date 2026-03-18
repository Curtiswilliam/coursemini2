import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  BarChart3,
  Shield,
  PieChart,
  Copy,
  Pencil,
  Archive,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [duplicating, setDuplicating] = useState<number | null>(null);
  const [archiving, setArchiving] = useState<number | null>(null);

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentCourses } = useQuery<any[]>({
    queryKey: ["/api/admin/courses"],
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
      toast({ title: archive ? "Course archived" : "Course unarchived" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    onSettled: () => setArchiving(null),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="bg-card border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your courses and students</p>
            </div>
            <Link href="/admin/courses/new">
              <Button data-testid="button-create-course">
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-courses">{stats?.courseCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-students">{stats?.studentCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-enrollments">{stats?.enrollmentCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Enrollments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-md bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-published">{stats?.publishedCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {user?.role === "ADMIN" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/admin/analytics">
              <Card className="hover-elevate cursor-pointer" data-testid="card-analytics">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-md bg-purple-500/10 flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Analytics</h3>
                    <p className="text-sm text-muted-foreground">Platform metrics and insights</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/users">
              <Card className="hover-elevate cursor-pointer" data-testid="card-user-management">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">User Management</h3>
                    <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/students">
              <Card className="hover-elevate cursor-pointer" data-testid="card-students">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Students</h3>
                    <p className="text-sm text-muted-foreground">View enrolled students and progress</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Courses</h2>
            <Link href="/admin/courses/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </Link>
          </div>
          {recentCourses && recentCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCourses.map((course: any) => (
                <Card key={course.id} className="group" data-testid={`card-admin-course-${course.id}`}>
                  <div className="flex items-start gap-4 p-4">
                    <Link href={`/admin/courses/${course.id}/edit`} className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-16 w-24 rounded-md overflow-hidden shrink-0 bg-muted">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{course.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {course.status === "PUBLISHED" ? (
                            <span className="text-emerald-500">Published</span>
                          ) : (
                            <span className="text-amber-500">Draft</span>
                          )}
                          {" · "}
                          {course.enrollmentCount || 0} students
                        </p>
                      </div>
                    </Link>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={duplicating === course.id}
                          onClick={() => {
                            setDuplicating(course.id);
                            duplicateMutation.mutate(course.id);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {duplicating === course.id ? "Duplicating…" : "Duplicate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={archiving === course.id}
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setArchiving(course.id);
                            archiveMutation.mutate({ courseId: course.id, archive: true });
                          }}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {archiving === course.id ? "Archiving…" : "Archive"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No courses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first course to get started</p>
                <Link href="/admin/courses/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
