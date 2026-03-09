import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  Users,
  Award,
  ArrowRight,
  BookOpen,
  Code,
  Palette,
  BarChart3,
  Megaphone,
  Smartphone,
} from "lucide-react";
const heroBg = "/images/hero-bg.png";

const categoryIcons: Record<string, any> = {
  "web-development": Code,
  "ui-ux-design": Palette,
  "data-science": BarChart3,
  "digital-marketing": Megaphone,
  "mobile-development": Smartphone,
};

export default function Home() {
  const { data: courses, isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ["/api/courses", "?featured=true&limit=4"],
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight" data-testid="text-hero-title">
              Learn Without
              <span className="block text-primary">Limits</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-lg leading-relaxed">
              Master new skills with world-class instructors. Access thousands of courses
              in technology, design, business, and more.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses">
                <Button size="lg" data-testid="button-explore-courses">
                  Explore Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white" data-testid="button-start-teaching">
                  Start Teaching
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, label: "Courses", value: stats?.courseCount || 0 },
              { icon: Users, label: "Students", value: stats?.studentCount || 0 },
              { icon: GraduationCap, label: "Instructors", value: stats?.instructorCount || 0 },
              { icon: Award, label: "Completions", value: stats?.completionCount || 0 },
            ].map((stat) => (
              <div key={stat.label} className="text-center" data-testid={`stat-${stat.label.toLowerCase()}`}>
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {categories && categories.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-categories-title">Browse by Category</h2>
                <p className="text-muted-foreground mt-1">Find the perfect course for your goals</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat: any) => {
                const Icon = categoryIcons[cat.slug] || BookOpen;
                return (
                  <Link key={cat.id} href={`/courses?category=${cat.slug}`}>
                    <div
                      className="flex flex-col items-center gap-3 p-6 rounded-md bg-card border border-card-border hover-elevate cursor-pointer transition-all"
                      data-testid={`card-category-${cat.id}`}
                    >
                      <Icon className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium text-center">{cat.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-featured-title">Featured Courses</h2>
              <p className="text-muted-foreground mt-1">Hand-picked courses by our team</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" size="sm" data-testid="link-view-all">
                View All
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses?.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-lg overflow-hidden bg-primary p-8 md:p-16 text-center">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
                Join thousands of students already learning on CoursePower. Sign up today and get access to our growing library of courses.
              </p>
              <Link href="/auth?tab=register">
                <Button size="lg" variant="secondary" data-testid="button-cta-signup">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
