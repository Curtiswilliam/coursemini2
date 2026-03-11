import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  ExternalLink,
  Globe,
  Lock,
  Mail,
  Phone,
  Trophy,
} from "lucide-react";

const BADGE_DEFINITIONS = [
  { key: "first_course", name: "Graduate", description: "Complete your first course", emoji: "🎓" },
  { key: "mini_learner", name: "Mini Learner", description: "Complete 2 courses", emoji: "📚" },
  { key: "mini_pro", name: "Mini Pro", description: "Complete 3 courses", emoji: "⭐" },
  { key: "mini_scholar", name: "Mini Scholar", description: "Complete 5 courses", emoji: "🦉" },
  { key: "mini_expert", name: "Mini Expert", description: "Complete all courses in a pathway", emoji: "🏆" },
  { key: "mini_master", name: "Mini Master", description: "Complete 10 courses", emoji: "👑" },
  { key: "quiz_ace", name: "Quiz Ace", description: "Score 100% on a quiz", emoji: "🎯" },
  { key: "speed_runner", name: "Speed Runner", description: "Complete a course within 24 hours of enrolling", emoji: "⚡" },
  { key: "perfectionist", name: "Perfectionist", description: "Complete a course with every lesson finished", emoji: "💎" },
  { key: "certified", name: "Certified", description: "Earn 3 certificates", emoji: "📜" },
  { key: "hat_trick", name: "Hat Trick", description: "Complete 3 courses in one week", emoji: "🎩" },
  { key: "knowledge_seeker", name: "Knowledge Seeker", description: "Enroll in 5 different courses", emoji: "🔍" },
];

export default function AdminStudentProfile() {
  const [, params] = useRoute("/admin/students/:id");
  const studentId = params?.id;
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/admin/students/${studentId}`],
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="bg-card border-b">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Student not found</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/admin/students")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  const { user, enrollments, certificates, badges } = data;
  const earnedBadgeKeys = new Set((badges as any[]).map((b: any) => b.badgeKey));
  const completedEnrollments = (enrollments as any[]).filter((e: any) => e.status === "COMPLETED");
  const initials = user.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={() => navigate("/admin/students")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
          <h1 className="text-2xl font-bold">Student Profile</h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                {initials}
              </div>
              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.country && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 shrink-0" />
                      <span>{user.country}{user.stateRegion ? `, ${user.stateRegion}` : ""}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <BookOpen className="h-6 w-6 text-primary mb-1" />
              <p className="text-2xl font-bold">{enrollments.length}</p>
              <p className="text-xs text-muted-foreground">Total Enrolled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Trophy className="h-6 w-6 text-emerald-500 mb-1" />
              <p className="text-2xl font-bold">{completedEnrollments.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <Award className="h-6 w-6 text-amber-500 mb-1" />
              <p className="text-2xl font-bold">{certificates.length}</p>
              <p className="text-xs text-muted-foreground">Certificates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center gap-1">
              <span className="text-2xl mb-1">🏅</span>
              <p className="text-2xl font-bold">{badges.length}</p>
              <p className="text-xs text-muted-foreground">Badges</p>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Enrolled Courses ({enrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {enrollments.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No enrollments yet</p>
            ) : (
              <div className="divide-y">
                {(enrollments as any[]).map((enrollment: any) => (
                  <div key={enrollment.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="font-medium text-sm">{enrollment.course?.title || "Unknown Course"}</p>
                      <Badge
                        variant={enrollment.status === "COMPLETED" ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {enrollment.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(enrollment.progress || 0)}%</span>
                      </div>
                      <Progress value={enrollment.progress || 0} className="h-1.5" />
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                      {enrollment.completedAt && (
                        <span>Completed: {new Date(enrollment.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificates ({certificates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No certificates earned yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(certificates as any[]).map((cert: any) => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="h-10 w-10 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{cert.course?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground truncate">{cert.certificateCode}</p>
                    </div>
                    <a
                      href={`/certificates/${cert.certificateCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>🏅</span>
              Badges ({badges.length} / {BADGE_DEFINITIONS.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {BADGE_DEFINITIONS.map((def) => {
                const earned = earnedBadgeKeys.has(def.key);
                const earnedBadge = (badges as any[]).find((b: any) => b.badgeKey === def.key);
                return (
                  <div
                    key={def.key}
                    className={`relative rounded-lg border p-3 flex flex-col items-center text-center gap-1 transition-all ${
                      earned
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-muted opacity-50"
                    }`}
                  >
                    {!earned && (
                      <div className="absolute top-2 right-2">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-2xl">{def.emoji}</span>
                    <p className="font-semibold text-xs">{def.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{def.description}</p>
                    {earned && earnedBadge && (
                      <p className="text-xs text-primary mt-1">
                        {new Date(earnedBadge.awardedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
