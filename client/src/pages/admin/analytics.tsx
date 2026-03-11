import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  GraduationCap,
  BarChart3,
  Activity,
  CheckCircle,
  Clock,
  BookOpen,
  LogIn,
  Eye,
  Award,
  RefreshCw,
  ScrollText,
  Play,
  XCircle,
  Star,
  HelpCircle,
  Smartphone,
  Monitor,
  Zap,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function formatSeconds(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
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
  testId?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    purple: "bg-purple-500/10 text-purple-500",
    blue: "bg-blue-500/10 text-blue-500",
    orange: "bg-orange-500/10 text-orange-500",
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

// ─── Activity feed event icon / color ────────────────────────────────────────

const EVENT_META: Record<string, { label: string; icon: any; color: string; badgeClass: string }> = {
  login: { label: "Logged in", icon: LogIn, color: "#3b82f6", badgeClass: "bg-blue-100 text-blue-700" },
  lesson_view: { label: "Viewed lesson", icon: Eye, color: "#f59e0b", badgeClass: "bg-amber-100 text-amber-700" },
  lesson_complete: { label: "Completed lesson", icon: CheckCircle, color: "#10b981", badgeClass: "bg-emerald-100 text-emerald-700" },
  course_enroll: { label: "Enrolled in course", icon: GraduationCap, color: "#8b5cf6", badgeClass: "bg-purple-100 text-purple-700" },
  quiz_submit: { label: "Submitted quiz", icon: HelpCircle, color: "#f97316", badgeClass: "bg-orange-100 text-orange-700" },
  time_spent: { label: "Time tracked", icon: Clock, color: "#64748b", badgeClass: "bg-slate-100 text-slate-700" },
  scroll_depth: { label: "Scroll milestone", icon: ScrollText, color: "#eab308", badgeClass: "bg-yellow-100 text-yellow-700" },
  video_progress: { label: "Video milestone", icon: Play, color: "#3b82f6", badgeClass: "bg-blue-100 text-blue-700" },
  lesson_abandon: { label: "Lesson abandoned", icon: XCircle, color: "#ef4444", badgeClass: "bg-red-100 text-red-700" },
  certificate_view: { label: "Viewed certificate", icon: Award, color: "#d97706", badgeClass: "bg-amber-100 text-amber-700" },
  badge_earned: { label: "Badge earned", icon: Star, color: "#9333ea", badgeClass: "bg-purple-100 text-purple-700" },
  course_page_view: { label: "Viewed course page", icon: Eye, color: "#6b7280", badgeClass: "bg-gray-100 text-gray-700" },
};

function eventMeta(type: string) {
  return EVENT_META[type] || { label: type, icon: Activity, color: "#64748b", badgeClass: "bg-slate-100 text-slate-700" };
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: any }) {
  const overview = data?.overview || {};
  const enrollmentsPerDay: any[] = (data?.enrollmentsPerDay || []).map((r: any) => ({
    date: formatDate(r.date),
    count: Number(r.count),
  }));
  const completionsPerDay: any[] = (data?.completionsPerDay || []).map((r: any) => ({
    date: formatDate(r.date),
    count: Number(r.count),
  }));
  const timeSpentPerDay: any[] = (data?.timeSpentPerDay || []).map((r: any) => ({
    date: formatDate(r.date),
    hours: Math.round((Number(r.seconds) / 3600) * 10) / 10,
  }));
  const activeUsersPerDay: any[] = (data?.activeUsersPerDay || []).map((r: any) => ({
    date: formatDate(r.date),
    count: Number(r.count),
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Students" value={overview.totalStudents || 0} color="blue" testId="stat-total-students" />
        <KpiCard
          icon={Activity}
          label="Active (last 30d)"
          value={activeUsersPerDay.reduce((s, d) => Math.max(s, d.count), 0)}
          color="emerald"
          testId="stat-active-students"
        />
        <KpiCard icon={TrendingUp} label="Total Enrollments" value={overview.totalEnrollments || 0} color="amber" testId="stat-total-enrollments" />
        <KpiCard
          icon={CheckCircle}
          label="Completion Rate"
          value={`${overview.overallCompletionRate || 0}%`}
          subLabel={`${overview.completedEnrollments || 0} completed`}
          color="purple"
          testId="stat-completion-rate"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollments over time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrollments — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollmentsPerDay.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={enrollmentsPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Enrollments" stroke="#f97316" fill="url(#enrollGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Time spent per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time Spent on Platform (hours/day)</CardTitle>
          </CardHeader>
          <CardContent>
            {timeSpentPerDay.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No tracking data yet — time tracking activates after 30s on a lesson</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timeSpentPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v}h`, "Hours"]} />
                  <Bar dataKey="hours" name="Hours" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Active users per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users per Day</CardTitle>
          </CardHeader>
          <CardContent>
            {activeUsersPerDay.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={activeUsersPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="Active Users" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Completions per day */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completions — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {completionsPerDay.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No completions yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={completionsPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="complGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Completions" stroke="#10b981" fill="url(#complGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────

function CourseDrilldown({ courseId }: { courseId: number }) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/analytics/courses", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/courses/${courseId}`, { credentials: "include" });
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-6 space-y-6">
      {/* Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Enrollment Funnel — {data.courseTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data.funnel || []).map((stage: any, i: number) => {
              const max = data.enrolledCount || 1;
              const pct = max > 0 ? Math.round((stage.count / max) * 100) : 0;
              const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"];
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-20 shrink-0">{stage.stage}</span>
                  <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                    <div
                      className={`h-full ${colors[i % colors.length]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-20 text-right">{stage.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Per-lesson drop-off */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Per-Lesson Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          {(data.lessonStats || []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No lesson data yet</p>
          ) : (
            <div className="space-y-3">
              {(data.lessonStats || []).map((ls: any) => (
                <div key={ls.lessonId} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate max-w-[60%]">{ls.lessonTitle}</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Viewed: {ls.viewedPct}%</span>
                      <span>Completed: {ls.completedPct}%</span>
                      {ls.avgSeconds > 0 && <span>Avg time: {formatSeconds(ls.avgSeconds)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-muted rounded-l overflow-hidden">
                      <div className="h-full bg-amber-400 transition-all" style={{ width: `${ls.viewedPct}%` }} />
                    </div>
                    <div className="flex-1 bg-muted rounded-r overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${ls.completedPct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> Viewed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Completed</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz scores */}
      {(data.quizScores || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quiz Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead className="text-center">Attempts</TableHead>
                  <TableHead className="text-center">Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.quizScores.map((qs: any) => (
                  <TableRow key={qs.lesson_id}>
                    <TableCell className="font-medium">{qs.lesson_title}</TableCell>
                    <TableCell className="text-center">{qs.attempt_count}</TableCell>
                    <TableCell className="text-center">
                      <span className={Number(qs.avg_score) >= 70 ? "text-emerald-600 font-medium" : "text-rose-500 font-medium"}>
                        {Number(qs.avg_score).toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CoursesTab({ data }: { data: any }) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const courseAnalytics: any[] = data?.courseAnalytics || [];

  return (
    <div className="space-y-4">
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
                    <TableHead className="text-center">Enrolled</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Rate</TableHead>
                    <TableHead className="text-center">Avg Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseAnalytics.map((course: any) => (
                    <TableRow
                      key={course.id}
                      className={`cursor-pointer transition-colors ${selectedCourseId === course.id ? "bg-muted/60" : "hover:bg-muted/30"}`}
                      onClick={() => setSelectedCourseId(selectedCourseId === course.id ? null : course.id)}
                      data-testid={`row-course-${course.id}`}
                    >
                      <TableCell className="font-medium max-w-[220px]">
                        <div className="truncate">{course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.instructor}</div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{course.enrollments}</TableCell>
                      <TableCell className="text-center">{course.completions}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={course.completionRate} className="h-1.5 w-14" />
                          <span className="text-xs text-muted-foreground w-8">{course.completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={course.avgProgress} className="h-1.5 w-14" />
                          <span className="text-xs text-muted-foreground w-8">{course.avgProgress}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCourseId && <CourseDrilldown courseId={selectedCourseId} />}
    </div>
  );
}

// ─── Students Tab ─────────────────────────────────────────────────────────────

function StudentsTab() {
  const { data: students = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/students"],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Students</CardTitle>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No students yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Certificates</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{student.email}</TableCell>
                    <TableCell className="text-center">{student.enrollmentCount}</TableCell>
                    <TableCell className="text-center">{(student.certificates || []).length}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Activity Feed Tab ────────────────────────────────────────────────────────

const ALL_EVENT_TYPES = ["login", "lesson_view", "lesson_complete", "course_enroll", "quiz_submit", "time_spent", "scroll_depth", "video_progress", "lesson_abandon", "certificate_view", "badge_earned", "course_page_view"];

function ActivityFeedTab() {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { data: feed = [], refetch, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/activity", { credentials: "include" });
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Update last-updated time when data arrives
  useEffect(() => {
    setLastUpdated(new Date());
  }, [feed]);

  const filtered = filterType ? feed.filter((e: any) => e.eventType === filterType) : feed;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(null)}
          >
            All
          </Button>
          {ALL_EVENT_TYPES.map((t) => {
            const meta = eventMeta(t);
            return (
              <Button
                key={t}
                variant={filterType === t ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(filterType === t ? null : t)}
                style={filterType === t ? { backgroundColor: meta.color, borderColor: meta.color } : {}}
              >
                <meta.icon className="h-3.5 w-3.5 mr-1" />
                {meta.label}
              </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Updated {timeAgo(lastUpdated.toISOString())}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Activity className="h-10 w-10 mb-3" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((event: any) => {
                const meta = eventMeta(event.eventType);
                const Icon = meta.icon;
                return (
                  <div key={event.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div
                      className="mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: meta.color + "20", color: meta.color }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{event.userName || "Unknown"}</span>
                        <span className="text-muted-foreground text-xs">{event.userEmail}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        {event.courseTitle && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {event.courseTitle}
                          </span>
                        )}
                        {event.lessonId && (
                          <span>Lesson #{event.lessonId}</span>
                        )}
                        {event.eventType === "quiz_submit" && event.metadata && (
                          <span>
                            Score: {typeof event.metadata === "object" ? event.metadata.score?.toFixed(0) : "?"}%
                            {" "}{typeof event.metadata === "object" && event.metadata.passed ? (
                              <span className="text-emerald-600">Passed</span>
                            ) : (
                              <span className="text-rose-500">Failed</span>
                            )}
                          </span>
                        )}
                        {event.eventType === "time_spent" && event.metadata && (
                          <span>
                            +{typeof event.metadata === "object" ? formatSeconds(event.metadata.seconds) : "?"}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {timeAgo(event.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Engagement Tab ────────────────────────────────────────────────────────────

function EngagementTab() {
  const { data: timeOfDay = [], isLoading: todLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/time-of-day"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/time-of-day", { credentials: "include" });
      return res.json();
    },
  });

  const { data: devices = [], isLoading: devicesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/devices"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/devices", { credentials: "include" });
      return res.json();
    },
  });

  const { data: funnel = [], isLoading: funnelLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/funnel"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/funnel", { credentials: "include" });
      return res.json();
    },
  });

  const { data: dropoff = [], isLoading: dropoffLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/dropoff"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/dropoff", { credentials: "include" });
      return res.json();
    },
  });

  // Build full 24-hour array for time of day chart
  const timeOfDayData = Array.from({ length: 24 }, (_, h) => {
    const found = timeOfDay.find((r: any) => Number(r.hour) === h);
    return { hour: `${h}:00`, count: found ? Number(found.count) : 0 };
  });

  // Device breakdown
  const mobileRow = devices.find((d: any) => d.is_mobile === "true");
  const desktopRow = devices.find((d: any) => d.is_mobile === "false");
  const mobileCount = mobileRow ? Number(mobileRow.count) : 0;
  const desktopCount = desktopRow ? Number(desktopRow.count) : 0;
  const totalDevices = mobileCount + desktopCount;
  const mobilePct = totalDevices > 0 ? Math.round((mobileCount / totalDevices) * 100) : 0;
  const desktopPct = totalDevices > 0 ? Math.round((desktopCount / totalDevices) * 100) : 0;

  // Drop-off with abandon rate
  const dropoffWithRate = dropoff.map((r: any) => ({
    ...r,
    abandonRate: r.views > 0 ? Math.round((r.abandons / r.views) * 100) : 0,
  })).sort((a: any, b: any) => b.abandonRate - a.abandonRate);

  return (
    <div className="space-y-6">
      {/* Device breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                {devicesLoading ? (
                  <Skeleton className="h-7 w-20 mb-1" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">{mobilePct}%</p>
                )}
                <p className="text-xs text-muted-foreground">Mobile Users ({mobileCount} logins)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
                <Monitor className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                {devicesLoading ? (
                  <Skeleton className="h-7 w-20 mb-1" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">{desktopPct}%</p>
                )}
                <p className="text-xs text-muted-foreground">Desktop Users ({desktopCount} logins)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning time of day */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Learning Time of Day (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {todLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : timeOfDay.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeOfDayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Events" fill="#f97316" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Course conversion funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : funnel.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Page Views</TableHead>
                    <TableHead className="text-center">Enrollments</TableHead>
                    <TableHead className="text-center">Views→Enroll</TableHead>
                    <TableHead className="text-center">Started</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Enroll→Complete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funnel.map((row: any) => {
                    const pageViews = Number(row.page_views) || 0;
                    const enrollments = Number(row.enrollments) || 0;
                    const completed = Number(row.completed) || 0;
                    const viewToEnroll = pageViews > 0 ? Math.round((enrollments / pageViews) * 100) : 0;
                    const enrollToComplete = enrollments > 0 ? Math.round((completed / enrollments) * 100) : 0;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{row.title}</TableCell>
                        <TableCell className="text-center">{pageViews}</TableCell>
                        <TableCell className="text-center">{enrollments}</TableCell>
                        <TableCell className="text-center">
                          <span className={viewToEnroll >= 20 ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                            {viewToEnroll}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{Number(row.started) || 0}</TableCell>
                        <TableCell className="text-center">{completed}</TableCell>
                        <TableCell className="text-center">
                          <span className={enrollToComplete >= 50 ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                            {enrollToComplete}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson drop-off */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson Drop-Off Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {dropoffLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : dropoffWithRate.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No abandon data yet — data appears after students navigate away from lessons</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Views</TableHead>
                    <TableHead className="text-center">Abandons</TableHead>
                    <TableHead className="text-center">Completions</TableHead>
                    <TableHead className="text-center">Abandon Rate</TableHead>
                    <TableHead className="text-center">Avg Time Before Abandon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dropoffWithRate.map((row: any) => (
                    <TableRow key={row.lesson_id}>
                      <TableCell className="font-medium max-w-[160px] truncate">{row.lesson_title || `Lesson #${row.lesson_id}`}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[140px] truncate">{row.course_title || "—"}</TableCell>
                      <TableCell className="text-center">{row.views}</TableCell>
                      <TableCell className="text-center">{row.abandons}</TableCell>
                      <TableCell className="text-center">{row.completions}</TableCell>
                      <TableCell className="text-center">
                        <span className={row.abandonRate >= 50 ? "text-rose-500 font-medium" : row.abandonRate >= 25 ? "text-amber-500 font-medium" : "text-emerald-600 font-medium"}>
                          {row.abandonRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {row.avg_seconds_before_abandon ? formatSeconds(Math.round(Number(row.avg_seconds_before_abandon))) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const { data: overviewData, isLoading: overviewLoading, isError } = useQuery<any>({
    queryKey: ["/api/admin/analytics/overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/overview", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
  });

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only admins can access platform analytics.</p>
        </div>
      </div>
    );
  }

  if (overviewLoading) {
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
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold" data-testid="text-analytics-title">Analytics</h1>
          <p className="text-muted-foreground mt-1">Platform-wide metrics, charts and activity</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="courses" data-testid="tab-courses">Courses</TabsTrigger>
            <TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab data={overviewData} />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesTab data={overviewData} />
          </TabsContent>

          <TabsContent value="students">
            <StudentsTab />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityFeedTab />
          </TabsContent>

          <TabsContent value="engagement">
            <EngagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
