import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, BookOpen, Users } from "lucide-react";
import type { Course, Category, User } from "@shared/schema";

type CourseWithDetails = Course & {
  instructor?: Pick<User, "id" | "name" | "avatar"> | null;
  category?: Category | null;
  enrollmentCount?: number;
  averageRating?: number;
  lessonCount?: number;
};

export function CourseCard({ course }: { course: CourseWithDetails }) {
  const levelColors: Record<string, string> = {
    BEGINNER: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    INTERMEDIATE: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ADVANCED: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="group cursor-pointer hover-elevate transition-all duration-200 h-full" data-testid={`card-course-${course.id}`}>
        <div className="relative aspect-video overflow-hidden rounded-t-md">
          <img
            src={course.thumbnail || "/images/course-webdev.png"}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-testid={`img-course-${course.id}`}
          />
          {course.isFree && (
            <Badge className="absolute top-3 left-3" variant="secondary">
              Free
            </Badge>
          )}
          {course.level && (
            <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-medium ${levelColors[course.level] || ""}`}>
              {course.level?.charAt(0) + course.level?.slice(1).toLowerCase()}
            </span>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          {course.category && (
            <span className="text-xs font-medium text-primary" data-testid={`text-category-${course.id}`}>
              {course.category.name}
            </span>
          )}
          <h3 className="font-semibold text-sm line-clamp-2 leading-snug" data-testid={`text-title-${course.id}`}>
            {course.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {course.shortDescription || course.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {course.lessonCount !== undefined && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {course.lessonCount} lessons
              </span>
            )}
            {course.enrollmentCount !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {course.enrollmentCount}
              </span>
            )}
            {course.averageRating !== undefined && course.averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {course.averageRating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            {course.instructor && (
              <span className="text-xs text-muted-foreground" data-testid={`text-instructor-${course.id}`}>
                {course.instructor.name}
              </span>
            )}
            <span className="text-sm font-bold" data-testid={`text-price-${course.id}`}>
              {course.isFree ? "Free" : `$${course.price?.toFixed(2)}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
