import { Link } from "wouter";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">CourseMini</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The modern platform for creating and selling online courses. Empower learners worldwide.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-courses">Browse Courses</Link>
              <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Become a Student</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">For Instructors</h4>
            <div className="flex flex-col gap-2">
              <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Start Teaching</Link>
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Support</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">help@coursemini.com</span>
              <span className="text-sm text-muted-foreground">Privacy Policy</span>
              <span className="text-sm text-muted-foreground">Terms of Service</span>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            2026 CourseMini. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
