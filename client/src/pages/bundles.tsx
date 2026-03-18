import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, BookOpen, ArrowRight, Loader2, Tag } from "lucide-react";

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
            {bundles.map((bundle: any) => {
              // Calculate individual course total price for savings
              const individualTotal = bundle.courses?.reduce((sum: number, c: any) => sum + (c.price || 0), 0) || 0;
              const savings = individualTotal > bundle.price ? individualTotal - bundle.price : 0;

              return (
                <Card key={bundle.id} className="overflow-hidden hover-elevate flex flex-col">
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
                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-lg font-bold">{bundle.title}</h3>
                      {bundle.description && (
                        <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{bundle.description}</p>
                      )}
                    </div>

                    {/* Included courses */}
                    {bundle.courses && bundle.courses.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Included Courses</p>
                        <div className="space-y-1.5">
                          {bundle.courses.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 text-sm">
                              {c.thumbnail ? (
                                <img src={c.thumbnail} alt={c.title} className="h-7 w-10 rounded object-cover shrink-0" />
                              ) : (
                                <div className="h-7 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                              <span className="truncate flex-1">{c.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex-1" />

                    <div className="space-y-2">
                      {savings > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                          <Tag className="h-3.5 w-3.5" />
                          <span className="font-medium">Save ${savings.toFixed(2)} vs buying separately</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          {individualTotal > bundle.price && (
                            <span className="text-sm text-muted-foreground line-through mr-2">${individualTotal.toFixed(2)}</span>
                          )}
                          <span className="text-2xl font-bold">${bundle.price?.toFixed(2)}</span>
                        </div>
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
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
