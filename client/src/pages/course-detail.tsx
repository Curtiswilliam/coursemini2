import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Play,
  FileText,
  Clock,
  Users,
  Star,
  BookOpen,
  Award,
  CheckCircle,
  Lock,
  ArrowRight,
  Loader2,
  BarChart3,
  Globe,
  Tag,
  X,
  BellRing,
} from "lucide-react";

export default function CourseDetailPage() {
  const [, params] = useRoute("/courses/:slug");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");

  const { data: course, isLoading } = useQuery<any>({
    queryKey: ["/api/courses", params?.slug],
    enabled: !!params?.slug,
  });

  const { data: enrollment } = useQuery<any>({
    queryKey: ["/api/enrollments", "check", params?.slug],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/enrollments/check/${params?.slug}`, { credentials: "include" });
      if (res.status === 404 || res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user && !!params?.slug,
  });

  // Track course page views (only for logged-in users)
  useEffect(() => {
    if (!course || !user) return;
    fetch("/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ eventType: "course_page_view", courseId: course.id, metadata: { slug: course.slug, enrolled: !!enrollment } }),
    }).catch(() => {});
  }, [course?.id]);

  // Track abandoned checkout — fires when logged-in user leaves without enrolling
  useEffect(() => {
    if (!course || !user || enrollment) return;
    const startTime = Date.now();
    return () => {
      // Only fire if they spent at least 10 seconds on the page
      if (Date.now() - startTime < 10000) return;
      navigator.sendBeacon("/api/track", JSON.stringify({
        eventType: "checkout_abandon",
        courseId: course.id,
        metadata: { courseTitle: course.title, courseUrl: `/courses/${course.slug}` },
      }));
    };
  }, [course?.id, !!enrollment, !!user]);

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/coupons/validate", { code, courseId: course?.id });
      return res;
    },
    onSuccess: (data: any) => {
      setAppliedCoupon(data.coupon);
      setCouponError("");
      toast({ title: "Coupon applied!", description: `${data.coupon.type === "PERCENTAGE" ? `${data.coupon.value}%` : `$${data.coupon.value}`} discount applied` });
    },
    onError: (e: any) => {
      setCouponError(e.message || "Invalid coupon");
      setAppliedCoupon(null);
    },
  });

  const { data: waitlistStatus } = useQuery<any>({
    queryKey: ["/api/courses", course?.id, "waitlist/status"],
    queryFn: async () => {
      if (!user || !course) return null;
      const res = await fetch(`/api/courses/${course.id}/waitlist/status`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user && !!course?.id,
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${course?.id}/waitlist`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", course?.id, "waitlist/status"] });
      toast({ title: "Added to waitlist!", description: "We'll notify you when this course opens." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const leaveWaitlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/courses/${course?.id}/waitlist`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", course?.id, "waitlist/status"] });
      toast({ title: "Removed from waitlist" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${course.id}/enroll`, {
        couponCode: appliedCoupon?.code,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({ title: "Enrolled successfully!" });
      navigate(`/learn/${course.slug}`);
    },
    onError: (e: any) => {
      const msg = String(e.message || "");
      if (msg.includes("verify your email") || msg.includes("verify your phone")) {
        toast({ title: "Account verification required", description: "Please complete your account setup first." });
        navigate(`/auth?tab=register&returnTo=/courses/${course?.slug}`);
      } else {
        toast({ title: "Enrollment failed", description: e.message, variant: "destructive" });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="bg-card border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <Skeleton className="h-8 w-2/3 mb-4" />
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video rounded-md" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <p className="text-muted-foreground mb-4">This course doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
        </div>
      </div>
    );
  }

  const lessonTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return <Play className="h-4 w-4" />;
      case "TEXT": return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const totalLessons = course.subjects?.reduce((acc: number, subj: any) =>
    acc + (subj.modules?.reduce((a: number, mod: any) => a + (mod.lessons?.length || 0), 0) || 0), 0) || 0;
  const totalDuration = course.subjects?.reduce((acc: number, subj: any) =>
    acc + (subj.modules?.reduce((a: number, mod: any) =>
      a + (mod.lessons?.reduce((x: number, l: any) => x + (l.duration || 0), 0) || 0), 0) || 0), 0) || 0;

  const basePrice = course.salePrice || course.price || 0;
  const discountedPrice = appliedCoupon
    ? appliedCoupon.type === "PERCENTAGE"
      ? basePrice * (1 - appliedCoupon.value / 100)
      : Math.max(0, basePrice - appliedCoupon.value)
    : basePrice;

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {course.category && (
              <Badge variant="secondary" data-testid="badge-category">{course.category.name}</Badge>
            )}
            {course.level && (
              <Badge variant="outline" data-testid="badge-level">
                <BarChart3 className="h-3 w-3 mr-1" />
                {typeof course.level === "string" ? course.level.charAt(0) + course.level.slice(1).toLowerCase() : course.level}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-course-title">{course.title}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-6">{course.shortDescription}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {course.instructor && (
              <span className="flex items-center gap-2" data-testid="text-instructor">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                  {course.instructor.name?.charAt(0)}
                </div>
                {course.instructor.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {totalLessons} lessons
            </span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.round(totalDuration / 60)}h {totalDuration % 60}m
              </span>
            )}
            {course.enrollmentCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course.enrollmentCount} students
              </span>
            )}
            {course.language && (
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {course.language}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {course.thumbnail && (
              <div className="aspect-video rounded-md overflow-hidden">
                <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" data-testid="img-course-thumbnail" />
              </div>
            )}

            {course.description && (
              <div>
                <h2 className="text-xl font-bold mb-4">About This Course</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-description">
                  <p className="whitespace-pre-wrap">{course.description}</p>
                </div>
              </div>
            )}

            {course.learningOutcomes && (
              <div>
                <h2 className="text-xl font-bold mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.learningOutcomes.split("\n").filter(Boolean).map((outcome: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.subjects && course.subjects.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Curriculum</h2>
                <div className="space-y-4">
                  {course.subjects
                    .sort((a: any, b: any) => a.position - b.position)
                    .map((subject: any) => (
                      <div key={subject.id}>
                        <h3 className="text-base font-semibold mb-2" data-testid={`text-subject-${subject.id}`}>{subject.title}</h3>
                        <Accordion type="multiple" className="space-y-2">
                          {subject.modules
                            ?.sort((a: any, b: any) => a.position - b.position)
                            .map((mod: any) => (
                              <AccordionItem key={mod.id} value={`mod-${mod.id}`} className="border rounded-md px-4">
                                <AccordionTrigger className="text-sm font-medium" data-testid={`accordion-module-${mod.id}`}>
                                  <div className="flex items-center gap-2">
                                    <span>{mod.title}</span>
                                    <Badge variant="outline" className="ml-2 text-xs no-default-active-elevate">
                                      {mod.lessons?.length || 0} lessons
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-1 pb-2">
                                    {mod.lessons
                                      ?.sort((a: any, b: any) => a.position - b.position)
                                      .map((lesson: any) => (
                                        <div
                                          key={lesson.id}
                                          className="flex items-center gap-3 py-2 px-2 rounded-md text-sm"
                                          data-testid={`lesson-item-${lesson.id}`}
                                        >
                                          {lessonTypeIcon(lesson.type)}
                                          <span className="flex-1">{lesson.title}</span>
                                          {lesson.dripDays != null && (
                                            <span className="text-xs text-muted-foreground">Day {lesson.dripDays}</span>
                                          )}
                                          {lesson.duration && (
                                            <span className="text-xs text-muted-foreground">{lesson.duration}m</span>
                                          )}
                                          {lesson.isFree || lesson.isPreview ? (
                                            <Badge variant="outline" className="text-xs no-default-active-elevate">Preview</Badge>
                                          ) : (
                                            <Lock className="h-3 w-3 text-muted-foreground" />
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                        </Accordion>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {course.reviews && course.reviews.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Student Reviews</h2>
                <div className="space-y-4">
                  {course.reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">by {review.user?.name}</span>
                        </div>
                        {review.comment && <p className="text-sm">{review.comment}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    {course.isFree ? (
                      <span className="text-3xl font-bold" data-testid="text-price">Free</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {(course.salePrice || appliedCoupon) && (
                          <span className="text-lg text-muted-foreground line-through">${basePrice.toFixed(2)}</span>
                        )}
                        <span className="text-3xl font-bold" data-testid="text-price">
                          ${discountedPrice.toFixed(2)}
                        </span>
                        {appliedCoupon && (
                          <Badge variant="default" className="text-xs">
                            {appliedCoupon.type === "PERCENTAGE" ? `-${appliedCoupon.value}%` : `-$${appliedCoupon.value}`}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {enrollment ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{Math.round(enrollment.progress || 0)}%</span>
                        </div>
                        <Progress value={enrollment.progress || 0} className="h-2" />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => navigate(`/learn/${course.slug}`)}
                        data-testid="button-continue"
                      >
                        Continue Learning
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Coupon section for paid courses */}
                      {!course.isFree && (
                        <div className="space-y-2">
                          {appliedCoupon ? (
                            <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-sm">
                              <Tag className="h-4 w-4 text-emerald-500 shrink-0" />
                              <span className="flex-1 text-emerald-700 dark:text-emerald-400 font-medium">{appliedCoupon.code}</span>
                              <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); setCouponError(""); }}>
                                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                placeholder="Coupon code"
                                value={couponCode}
                                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                                className="text-sm uppercase"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!couponCode || validateCouponMutation.isPending}
                                onClick={() => validateCouponMutation.mutate(couponCode)}
                              >
                                Apply
                              </Button>
                            </div>
                          )}
                          {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                        </div>
                      )}

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          if (!user) {
                            navigate(`/auth?tab=register&returnTo=/courses/${course.slug}`);
                            return;
                          }
                          enrollMutation.mutate();
                        }}
                        disabled={enrollMutation.isPending}
                        data-testid="button-enroll"
                      >
                        {enrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {course.isFree
                          ? "Enroll for Free"
                          : `Enroll - $${discountedPrice.toFixed(2)}`}
                      </Button>

                      {/* Waitlist */}
                      {course.waitlistEnabled && (
                        <div className="space-y-2">
                          {waitlistStatus?.count > 0 && (
                            <p className="text-xs text-muted-foreground text-center">
                              {waitlistStatus.count} {waitlistStatus.count === 1 ? "person" : "people"} on the waitlist
                            </p>
                          )}
                          {user && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                if (waitlistStatus?.onWaitlist) {
                                  leaveWaitlistMutation.mutate();
                                } else {
                                  joinWaitlistMutation.mutate();
                                }
                              }}
                              disabled={joinWaitlistMutation.isPending || leaveWaitlistMutation.isPending}
                            >
                              <BellRing className="mr-2 h-4 w-4" />
                              {waitlistStatus?.onWaitlist ? "Leave Waitlist" : "Join Waitlist"}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lessons</span>
                      <span className="font-medium">{totalLessons}</span>
                    </div>
                    {totalDuration > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{Math.round(totalDuration / 60)}h {totalDuration % 60}m</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Level</span>
                      <span className="font-medium">{course.level?.charAt(0) + course.level?.slice(1).toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-medium">{course.language}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
