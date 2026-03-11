import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search, Users, Award, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: students, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/students"],
  });

  const filtered = students?.filter(
    (s: any) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold" data-testid="text-students-title">Student Management</h1>
          <p className="text-muted-foreground mt-1">View and manage enrolled students</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-students"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filtered.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    data-testid={`row-student-${student.id}`}
                    onClick={() => navigate(`/admin/students/${student.id}`)}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {student.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" data-testid={`text-student-name-${student.id}`}>{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="no-default-active-elevate">
                        {student.enrollmentCount || 0} courses
                      </Badge>
                      {student.certificates?.length > 0 && (
                        <Badge variant="secondary" className="no-default-active-elevate flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {student.certificates.length}
                        </Badge>
                      )}
                      {student.groupCount > 0 && (
                        <Badge variant="outline" className="no-default-active-elevate text-xs">
                          {student.groupCount} group{student.groupCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-students">No students found</h3>
            <p className="text-muted-foreground">
              {search ? "Try a different search term" : "Students will appear here after they enroll"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
