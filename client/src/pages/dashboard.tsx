import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { BookOpen, ArrowRight, GraduationCap, Trophy } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: enrollments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const activeEnrollments = enrollments?.filter((e: any) => e.status === "ACTIVE") || [];
  const completedEnrollments = enrollments?.filter((e: any) => e.status === "COMPLETED") || [];

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue where you left off
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-enrolled">{activeEnrollments.length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-completed">{completedEnrollments.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-amber-500/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total">{(enrollments?.length || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeEnrollments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Continue Learning</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment: any) => (
                <Card key={enrollment.id} className="hover-elevate cursor-pointer" data-testid={`card-enrollment-${enrollment.id}`}>
                  <div className="relative aspect-video overflow-hidden rounded-t-md">
                    <img
                      src={enrollment.course?.thumbnail || "/images/course-webdev.png"}
                      alt={enrollment.course?.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm line-clamp-2">{enrollment.course?.title}</h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(enrollment.progress || 0)}%</span>
                      </div>
                      <Progress value={enrollment.progress || 0} className="h-1.5" />
                    </div>
                    <Link href={`/learn/${enrollment.course?.slug}`}>
                      <Button size="sm" className="w-full" data-testid={`button-continue-${enrollment.id}`}>
                        Continue
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {completedEnrollments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Completed Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedEnrollments.map((enrollment: any) => (
                <Card key={enrollment.id} data-testid={`card-completed-${enrollment.id}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md overflow-hidden shrink-0">
                      <img
                        src={enrollment.course?.thumbnail || "/images/course-webdev.png"}
                        alt={enrollment.course?.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{enrollment.course?.title}</h3>
                      <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                        <Trophy className="h-3 w-3" /> Completed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {enrollments?.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2" data-testid="text-no-enrollments">No courses yet</h3>
            <p className="text-muted-foreground mb-6">Start your learning journey by enrolling in a course</p>
            <Link href="/courses">
              <Button data-testid="button-browse">Browse Courses</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
