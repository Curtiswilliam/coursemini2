import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { BookOpen, ArrowRight, GraduationCap, Trophy, Award, ExternalLink, Lock, Star } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: enrollments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: certificates } = useQuery<any[]>({
    queryKey: ["/api/my/certificates"],
    enabled: !!user,
  });

  const { data: myBadges } = useQuery<any[]>({
    queryKey: ["/api/my/badges"],
    enabled: !!user,
  });

  const { data: badgeDefinitions } = useQuery<any[]>({
    queryKey: ["/api/badges/definitions"],
  });

  const { data: allCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  const activeEnrollments = enrollments?.filter((e: any) => e.status === "ACTIVE") || [];
  const completedEnrollments = enrollments?.filter((e: any) => e.status === "COMPLETED") || [];

  const enrolledCourseIds = new Set(enrollments?.map((e: any) => e.courseId) || []);
  const suggestedCourses = allCourses?.filter((c: any) => !enrolledCourseIds.has(c.id)).slice(0, 6) || [];

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Certificates</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-violet-500/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-violet-500" />
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

        {/* Certificates */}
        {certificates && certificates.length > 0 && (
          <div id="certificates">
            <h2 className="text-xl font-bold mb-4">My Certificates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert: any) => (
                <Card key={cert.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{cert.course?.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                    </div>
                    <Link href={`/certificates/${cert.certificateCode}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Badges Section */}
        {badgeDefinitions && badgeDefinitions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">My Badges</h2>
            {myBadges && myBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete courses to earn badges!</p>
            ) : null}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {badgeDefinitions.map((def: any) => {
                const earned = myBadges?.find((b: any) => b.badgeKey === def.key);
                return (
                  <div
                    key={def.key}
                    title={`${def.name}: ${def.description}`}
                    className={`relative rounded-lg border p-3 flex flex-col items-center text-center gap-1 transition-all ${
                      earned
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-muted opacity-40"
                    }`}
                  >
                    {!earned && (
                      <div className="absolute top-1.5 right-1.5">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-2xl">{def.emoji}</span>
                    <p className="font-semibold text-xs leading-tight">{def.name}</p>
                    {earned && (
                      <p className="text-xs text-primary">
                        {new Date(earned.awardedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Courses You May Like */}
        {suggestedCourses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Courses You May Like</h2>
              <Link href="/courses">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Browse all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedCourses.map((course: any) => (
                <Card key={course.id} className="hover-elevate cursor-pointer overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.thumbnail || "/images/course-webdev.png"}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                    {course.price === 0 || course.price === null ? (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded">Free</span>
                    ) : null}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
                      {course.instructor && (
                        <p className="text-xs text-muted-foreground mt-1">{course.instructor.name}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {course.price === 0 || course.price === null ? "Free" : `$${(course.price / 100).toFixed(2)}`}
                      </span>
                      {course.level && (
                        <Badge variant="secondary" className="text-xs capitalize">{course.level.toLowerCase()}</Badge>
                      )}
                    </div>
                    <Link href={`/courses/${course.slug}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        View Course
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {enrollments?.length === 0 && suggestedCourses.length === 0 && (
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
