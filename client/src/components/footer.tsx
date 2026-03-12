import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Twitter, Linkedin, Youtube } from "lucide-react";

export function Footer() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });

  const siteName = settings?.siteName || "CourseMini by EQC Institute";
  const footerText = settings?.footerText || "The modern platform for creating and selling online courses. Empower learners worldwide.";
  const socialTwitter = settings?.socialTwitter;
  const socialLinkedin = settings?.socialLinkedin;
  const socialYoutube = settings?.socialYoutube;

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-pink-500">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold">CourseMini</span>
                <p className="text-[10px] text-muted-foreground leading-none">by EQC Institute</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {footerText}
            </p>
            {(socialTwitter || socialLinkedin || socialYoutube) && (
              <div className="flex items-center gap-3 mt-4">
                {socialTwitter && (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {socialLinkedin && (
                  <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {socialYoutube && (
                  <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Youtube className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-courses">Browse Courses</Link>
              <Link href="/bundles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Course Bundles</Link>
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
              <span className="text-sm text-muted-foreground">hello@eqcinstitute.com</span>
              <span className="text-sm text-muted-foreground">Privacy Policy</span>
              <span className="text-sm text-muted-foreground">Terms of Service</span>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
