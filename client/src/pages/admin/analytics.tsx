import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Users,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Layers,
  Box,
  FileText,
  Award,
  Star,
  UserCheck,
  Activity,
  CheckCircle,
  Clock,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  color = "primary",
  testId,
}: {
  icon: any;
  label: string;
  value: string | number;
  subLabel?: string;
  color?: string;
  testId: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    purple: "bg-purple-500/10 text-purple-500",
    blue: "bg-blue-500/10 text-blue-500",
    rose: "bg-rose-500/10 text-rose-500",
    cyan: "bg-cyan-500/10 text-cyan-500",
    indigo: "bg-indigo-500/10 text-indigo-500",
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color] || colorClasses.primary}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight" data-testid={testId}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {subLabel && <p className="text-xs text-muted-foreground/70 mt-0.5">{subLabel}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAnalytics() {
  const { data: analytics, isLoading, isError, error } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
  });

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            {(error as any)?.message?.includes("403")
              ? "Only admins can access platform analytics."
              : "Failed to load analytics data."}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="bg-card border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const courseAnalytics = analytics?.courseAnalytics || [];
  const categoryBreakdown = analytics?.categoryBreakdown || [];
  const recentEnrollments = analytics?.recentEnrollments || [];
  const topInstructors = analytics?.topInstructors || [];

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold" data-testid="text-analytics-title">Analytics</h1>
          <p className="text-muted-foreground mt-1">Platform-wide metrics and insights</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={overview.totalUsers || 0} color="primary" testId="stat-total-users" />
          <StatCard icon={GraduationCap} label="Students" value={overview.totalStudents || 0} subLabel={`${overview.totalInstructors || 0} instructors, ${overview.totalAdmins || 0} admins`} color="emerald" testId="stat-students" />
          <StatCard icon={BookOpen} label="Courses" value={overview.totalCourses || 0} subLabel={`${overview.publishedCourses || 0} published, ${overview.draftCourses || 0} drafts`} color="blue" testId="stat-courses" />
          <StatCard icon={TrendingUp} label="Enrollments" value={overview.totalEnrollments || 0} subLabel={`${overview.activeEnrollments || 0} active`} color="amber" testId="stat-enrollments" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={CheckCircle} label="Completions" value={overview.completedEnrollments || 0} color="emerald" testId="stat-completions" />
          <StatCard icon={Activity} label="Completion Rate" value={`${overview.overallCompletionRate || 0}%`} color="purple" testId="stat-completion-rate" />
          <StatCard icon={FileText} label="Total Lessons" value={overview.totalLessons || 0} subLabel={`${overview.totalSubjects || 0} subjects, ${overview.totalModules || 0} modules`} color="cyan" testId="stat-lessons" />
          <StatCard icon={Award} label="Lessons Completed" value={overview.completedLessonProgress || 0} color="rose" testId="stat-lesson-completions" />
        </div>

        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses" data-testid="tab-courses">Courses</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
            <TabsTrigger value="instructors" data-testid="tab-instructors">Instructors</TabsTrigger>
            <TabsTrigger value="enrollments" data-testid="tab-enrollments">Recent Enrollments</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {courseAnalytics.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No courses yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead className="text-center">Lessons</TableHead>
                          <TableHead className="text-center">Enrollments</TableHead>
                          <TableHead className="text-center">Completions</TableHead>
                          <TableHead className="text-center">Completion Rate</TableHead>
                          <TableHead className="text-center">Avg Progress</TableHead>
                          <TableHead className="text-center">Rating</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseAnalytics.map((course: any) => (
                          <TableRow key={course.id} data-testid={`row-course-${course.id}`}>
                            <TableCell className="font-medium max-w-[200px]">
                              <span className="truncate block">{course.title}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={course.status === "PUBLISHED" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {course.status === "PUBLISHED" ? "Published" : course.status === "DRAFT" ? "Draft" : "Archived"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{course.instructor}</TableCell>
                            <TableCell className="text-center">{course.lessonCount}</TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">{course.enrollments}</span>
                            </TableCell>
                            <TableCell className="text-center">{course.completions}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <Progress value={course.completionRate} className="h-1.5 w-16" />
                                <span className="text-xs text-muted-foreground w-8">{course.completionRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <Progress value={course.avgProgress} className="h-1.5 w-16" />
                                <span className="text-xs text-muted-foreground w-8">{course.avgProgress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {course.avgRating > 0 ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="text-sm">{course.avgRating}</span>
                                  <span className="text-xs text-muted-foreground">({course.reviewCount})</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryBreakdown.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No categories yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryBreakdown.map((cat: any) => (
                      <Card key={cat.slug} data-testid={`card-category-${cat.slug}`}>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-sm mb-3">{cat.name}</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Courses</span>
                              <span className="font-medium">{cat.courseCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Enrollments</span>
                              <span className="font-medium">{cat.enrollments}</span>
                            </div>
                            {cat.courseCount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Avg per course</span>
                                <span className="font-medium">{Math.round(cat.enrollments / cat.courseCount)}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructors" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instructor Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {topInstructors.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No instructors yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead className="text-center">Courses</TableHead>
                        <TableHead className="text-center">Total Enrollments</TableHead>
                        <TableHead className="text-center">Avg per Course</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topInstructors
                        .sort((a: any, b: any) => b.totalEnrollments - a.totalEnrollments)
                        .map((instructor: any) => (
                          <TableRow key={instructor.username} data-testid={`row-instructor-${instructor.username}`}>
                            <TableCell className="font-medium">{instructor.name}</TableCell>
                            <TableCell className="text-muted-foreground">@{instructor.username}</TableCell>
                            <TableCell className="text-center">{instructor.courseCount}</TableCell>
                            <TableCell className="text-center font-medium">{instructor.totalEnrollments}</TableCell>
                            <TableCell className="text-center">
                              {instructor.courseCount > 0
                                ? Math.round(instructor.totalEnrollments / instructor.courseCount)
                                : 0}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                {recentEnrollments.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No enrollments yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Progress</TableHead>
                        <TableHead>Enrolled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentEnrollments.map((enrollment: any) => (
                        <TableRow key={enrollment.id} data-testid={`row-enrollment-${enrollment.id}`}>
                          <TableCell>
                            <div>
                              <span className="font-medium">{enrollment.studentName}</span>
                              <span className="text-xs text-muted-foreground ml-1">@{enrollment.studentUsername}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="truncate block text-sm">{enrollment.courseTitle}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={enrollment.status === "COMPLETED" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {enrollment.status === "COMPLETED" ? (
                                <><CheckCircle className="h-3 w-3 mr-1" />Done</>
                              ) : (
                                <><Clock className="h-3 w-3 mr-1" />Active</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <Progress value={enrollment.progress} className="h-1.5 w-16" />
                              <span className="text-xs text-muted-foreground w-8">{enrollment.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
