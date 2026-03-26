import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, Users, Award, ArrowRight, BookOpen, Code, Palette,
  BarChart3, Megaphone, Smartphone, CheckCircle2, Clock, Trophy,
  Star, Play, TrendingUp, Shield, Zap, Globe, HeartHandshake,
  MonitorPlay, Laptop, Building2,
} from "lucide-react";

const heroBg = "/images/hero-bg.png";

const categoryIcons: Record<string, any> = {
  "web-development": Code,
  "ui-ux-design": Palette,
  "data-science": BarChart3,
  "digital-marketing": Megaphone,
  "mobile-development": Smartphone,
};

const FEATURES = [
  {
    icon: Clock,
    title: "Learn at Your Own Pace",
    description: "Access course content anytime, anywhere. Pause, rewind, and revisit lessons whenever you need to.",
  },
  {
    icon: Trophy,
    title: "Earn Recognised Certificates",
    description: "Complete courses and receive verifiable certificates you can share on LinkedIn and with employers.",
  },
  {
    icon: Shield,
    title: "Expert-Crafted Content",
    description: "All courses are created by qualified industry professionals with real-world experience.",
  },
  {
    icon: Zap,
    title: "Bite-Sized Mini Courses",
    description: "Focused, practical courses designed to deliver results fast — without the filler.",
  },
  {
    icon: Globe,
    title: "Learn From Anywhere",
    description: "Fully online and mobile-friendly. All you need is a device and an internet connection.",
  },
  {
    icon: HeartHandshake,
    title: "Supportive Community",
    description: "Join a growing community of learners. Ask questions, share progress, and stay motivated.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create a Free Account",
    description: "Sign up in seconds. No credit card required to get started.",
    icon: Users,
  },
  {
    step: "02",
    title: "Choose Your Course",
    description: "Browse our library and find the course that matches your goals.",
    icon: BookOpen,
  },
  {
    step: "03",
    title: "Learn & Get Certified",
    description: "Complete lessons at your own pace and earn your certificate.",
    icon: Award,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Marketing Manager",
    text: "The courses are practical and straight to the point. I completed a digital marketing course in a weekend and immediately applied what I learned at work.",
    rating: 5,
  },
  {
    name: "James T.",
    role: "Small Business Owner",
    text: "As someone who runs their own business, I needed flexible learning that fits around my schedule. CourseMini delivers exactly that.",
    rating: 5,
  },
  {
    name: "Priya K.",
    role: "Career Changer",
    text: "I switched careers after completing three courses here. The certificate I earned genuinely helped me land my new role.",
    rating: 5,
  },
];

const FOR_WHO = [
  {
    icon: Laptop,
    title: "Individuals",
    points: [
      "Upskill for a promotion or career change",
      "Learn practical, job-ready skills",
      "Study on your schedule, at your pace",
      "Earn certificates to boost your CV",
    ],
    cta: "Start Learning Free",
    href: "/auth?tab=register",
    variant: "default" as const,
  },
  {
    icon: Building2,
    title: "Organisations",
    points: [
      "Train your team with curated content",
      "Track staff progress and completion",
      "Group enrolments and bulk pricing",
      "Custom learning pathways for roles",
    ],
    cta: "Contact Us",
    href: "/auth?tab=register",
    variant: "outline" as const,
  },
];

export default function Home() {
  // Force light mode on the marketing page regardless of user preference
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.classList.contains("dark") ? "dark" : "light";
    root.classList.remove("dark");
    root.classList.add("light");
    return () => {
      root.classList.remove("light");
      root.classList.add(prev);
    };
  }, []);

  const { data: courses, isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ["/api/courses", "?featured=true&limit=4"],
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });

  const heroTitle = siteSettings?.heroTitle || "Learn Without\nLimits";
  const heroSubtitle = siteSettings?.heroSubtitle || "Master in-demand skills with expert-led mini courses. Flexible, practical, and designed to get you results fast.";

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-950/90 via-rose-900/75 to-pink-900/60" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-40">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-sm">
              by EQC Institute
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight" data-testid="text-hero-title">
              {heroTitle.split("\n")[0]}
              {heroTitle.includes("\n") && (
                <span className="block bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
                  {heroTitle.split("\n")[1]}
                </span>
              )}
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-lg leading-relaxed">
              {heroSubtitle}
            </p>

            {/* Trust chips */}
            <div className="mt-6 flex flex-wrap gap-3">
              {["100% Online", "Self-Paced", "Certified Courses", "Free to Start"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-white/80 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/15">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses">
                <Button size="lg" data-testid="button-explore-courses">
                  Explore Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20" data-testid="button-start-teaching">
                  <Play className="mr-2 h-4 w-4" />
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <section className="py-12 bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: BookOpen, label: "Courses Available", value: stats?.courseCount || 0, suffix: "+" },
              { icon: Users, label: "Active Students", value: stats?.studentCount || 0, suffix: "+" },
              { icon: GraduationCap, label: "Expert Instructors", value: stats?.instructorCount || 0, suffix: "+" },
              { icon: Award, label: "Certificates Issued", value: stats?.completionCount || 0, suffix: "+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center" data-testid={`stat-${stat.label.toLowerCase()}`}>
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{stat.value}{stat.value > 0 ? stat.suffix : ""}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Getting started is simple. You can be learning in under 1 minute.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="relative flex flex-col items-center text-center p-8 rounded-xl bg-card border">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Step {step}
                </div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 mt-2">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold" data-testid="text-featured-title">Featured Courses</h2>
              <p className="text-muted-foreground mt-1">Hand-picked courses to get you started</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" size="sm" data-testid="link-view-all">
                View All Courses
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {coursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MonitorPlay className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Courses coming soon — check back shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Why CourseMini ────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Why Choose CourseMini?</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              We've built a platform that makes professional development simple, accessible, and effective.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4 p-6 rounded-xl bg-card border hover:border-primary/30 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────── */}
      {categories && categories.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold" data-testid="text-categories-title">Explore by Category</h2>
              <p className="text-muted-foreground mt-2">Find courses that match your interests and career goals</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat: any) => {
                const Icon = categoryIcons[cat.slug] || BookOpen;
                return (
                  <Link key={cat.id} href={`/courses?category=${cat.slug}`}>
                    <div
                      className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all group"
                      data-testid={`card-category-${cat.id}`}
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-center">{cat.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">What Our Students Say</h2>
            <p className="text-muted-foreground mt-2">Real results from real learners</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, rating }) => (
              <Card key={name} className="border bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">"{text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Individuals & Orgs ────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Learning That Works For You</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Whether you're an individual looking to grow or an organisation wanting to train your team.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {FOR_WHO.map(({ icon: Icon, title, points, cta, href, variant }) => (
              <Card key={title} className="border overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500" />
                <CardContent className="p-8 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link href={href}>
                    <Button variant={variant} className="w-full mt-2">
                      {cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 p-10 md:p-16 text-center">
            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="relative z-10">
              <TrendingUp className="h-12 w-12 text-white/70 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Invest in Yourself?
              </h2>
              <p className="text-white/80 max-w-lg mx-auto mb-2 text-lg">
                Join thousands of learners already advancing their careers with CourseMini by EQC Institute.
              </p>
              <p className="text-white/60 mb-8 text-sm">No credit card required. Start with free courses today.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/auth?tab=register">
                  <Button size="lg" variant="secondary" data-testid="button-cta-signup">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
