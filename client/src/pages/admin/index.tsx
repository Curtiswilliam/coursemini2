import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import {
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  BarChart3,
  Shield,
  PieChart,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentCourses } = useQuery<any[]>({
    queryKey: ["/api/admin/courses"],
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
      <div className="bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-fuchsia-600/10 border-b">
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
          </div>
          {recentCourses && recentCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCourses.slice(0, 6).map((course: any) => (
                <Card key={course.id} className="hover-elevate cursor-pointer" data-testid={`card-admin-course-${course.id}`}>
                  <Link href={`/admin/courses/${course.id}/edit`}>
                    <div className="flex items-start gap-4 p-4">
                      <div className="h-16 w-24 rounded-md overflow-hidden shrink-0 bg-muted">
                        {course.thumbnail && (
                          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
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
                          {" "}·{" "}
                          {course.enrollmentCount || 0} students
                        </p>
                      </div>
                    </div>
                  </Link>
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
