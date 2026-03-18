import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CheckCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  ArrowRight,
  Play,
} from "lucide-react";

export default function LandingPage() {
  const [, params] = useRoute("/lp/:slug");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: course, isLoading } = useQuery<any>({
    queryKey: ["/api/lp", params?.slug],
    queryFn: async () => {
      const res = await fetch(`/api/lp/${params?.slug}`);
      if (!res.ok) {
        // Redirect to course page
        navigate(`/courses/${params?.slug}`);
        return null;
      }
      return res.json();
    },
    enabled: !!params?.slug,
  });

  const { data: enrollment } = useQuery<any>({
    queryKey: ["/api/enrollments", "check", params?.slug],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/enrollments/check/${params?.slug}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user && !!params?.slug,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/courses/${course.id}/enroll`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({ title: "Enrolled successfully!" });
      navigate(`/learn/${course.slug}`);
    },
    onError: (e: any) => {
      toast({ title: "Enrollment failed", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-96 w-full" />
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  const features = (course.salesFeatures as string[]) || [];
  const testimonials = (course.salesTestimonials as any[]) || [];
  const faq = (course.salesFaq as any[]) || [];
  const price = course.salePrice || course.price || 0;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm">
                {course.category?.name || "Course"}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                {course.salesHeadline || course.title}
              </h1>
              {course.salesSubheadline && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {course.salesSubheadline}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {course.enrollmentCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.enrollmentCount} students
                  </span>
                )}
                {course.instructor && (
                  <span>By {course.instructor.name}</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {enrollment ? (
                  <Button size="lg" onClick={() => navigate(`/learn/${course.slug}`)}>
                    Continue Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        navigate(`/auth?tab=register&returnTo=/lp/${course.slug}`);
                        return;
                      }
                      enrollMutation.mutate();
                    }}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {course.isFree ? "Enroll for Free" : `Get Started — $${price.toFixed(2)}`}
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={() => navigate(`/courses/${course.slug}`)}>
                  View Course Details
                </Button>
              </div>
            </div>
            <div className="relative">
              {course.salesVideoUrl ? (
                <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                  <iframe
                    src={course.salesVideoUrl}
                    className="h-full w-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title="Course preview video"
                  />
                </div>
              ) : course.thumbnail ? (
                <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
                  <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shadow-2xl">
                  <Play className="h-20 w-20 text-primary/60" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="py-16 border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">What You'll Learn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-muted/30 border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">What Students Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t: any, i: number) => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= (t.rating || 5) ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm italic">"{t.text}"</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="py-16 border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faq.map((item: any, i: number) => (
                <div key={i} className="border rounded-md overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-medium hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{item.question}</span>
                    {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 py-4 border-t text-sm text-muted-foreground">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of students learning with {course.instructor?.name || "expert instructors"}.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!course.isFree && price > 0 && (
              <span className="text-4xl font-extrabold">${price.toFixed(2)}</span>
            )}
            {enrollment ? (
              <Button size="lg" onClick={() => navigate(`/learn/${course.slug}`)}>
                Continue Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => {
                  if (!user) {
                    navigate(`/auth?tab=register&returnTo=/lp/${course.slug}`);
                    return;
                  }
                  enrollMutation.mutate();
                }}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {course.isFree ? "Enroll for Free" : "Enroll Now"}
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
