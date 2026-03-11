import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, BookOpen, ArrowRight, Loader2 } from "lucide-react";

export default function BundlesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: bundles, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bundles"],
  });

  const enrollMutation = useMutation({
    mutationFn: async (bundleId: number) => {
      const res = await apiRequest("POST", `/api/bundles/${bundleId}/enroll`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({ title: "Enrolled in bundle!", description: "You've been enrolled in all courses in this bundle." });
      navigate("/dashboard");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold">Course Bundles</h1>
          <p className="text-muted-foreground mt-2">Get multiple courses at a great value</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-md" />
            ))}
          </div>
        ) : bundles && bundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle: any) => (
              <Card key={bundle.id} className="overflow-hidden hover-elevate">
                {bundle.thumbnail && (
                  <div className="aspect-video overflow-hidden">
                    <img src={bundle.thumbnail} alt={bundle.title} className="h-full w-full object-cover" />
                  </div>
                )}
                {!bundle.thumbnail && (
                  <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                    <Package className="h-16 w-16 text-orange-500/50" />
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{bundle.title}</h3>
                    {bundle.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{bundle.description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {bundle.courses?.slice(0, 3).map((c: any) => (
                      <Badge key={c.id} variant="secondary" className="text-xs">
                        <BookOpen className="h-2.5 w-2.5 mr-1" />
                        {c.title}
                      </Badge>
                    ))}
                    {bundle.courses?.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{bundle.courses.length - 3} more</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-2xl font-bold">${bundle.price?.toFixed(2)}</span>
                    <Button
                      onClick={() => {
                        if (!user) { navigate("/auth"); return; }
                        enrollMutation.mutate(bundle.id);
                      }}
                      disabled={enrollMutation.isPending}
                      size="sm"
                    >
                      {enrollMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Get Bundle
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No bundles available</h3>
            <p className="text-muted-foreground mb-6">Check back soon for course bundles</p>
            <Link href="/courses">
              <Button>Browse Individual Courses</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
