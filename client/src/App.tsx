import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AdminLayout } from "@/components/admin-layout";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import CoursesPage from "@/pages/courses";
import CourseDetailPage from "@/pages/course-detail";
import Dashboard from "@/pages/dashboard";
import CoursePlayer from "@/pages/course-player";
import BundlesPage from "@/pages/bundles";
import CertificatePage from "@/pages/certificate";
import AdminDashboard from "@/pages/admin/index";
import CourseStudio from "@/components/course-studio";
import AdminStudents from "@/pages/admin/students";
import AdminSetup from "@/pages/admin/setup";
import AdminUsers from "@/pages/admin/users";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminCoupons from "@/pages/admin/coupons";
import AdminOrders from "@/pages/admin/orders";
import AdminPathways from "@/pages/admin/pathways";
import AdminGroups from "@/pages/admin/groups";
import AdminStudentProfile from "@/pages/admin/student-profile";
import EmailTemplates from "@/pages/admin/email-templates";
import EmailTemplateEditor from "@/pages/admin/email-template-editor";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Redirect to="/auth" />;
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") return <Redirect to="/" />;
  return <>{children}</>;
}

function AdminRouter() {
  return (
    <AdminGuard>
      <Switch>
        {/* Full-screen course studio — no sidebar */}
        <Route path="/admin/courses/new" component={CourseStudio} />
        <Route path="/admin/courses/:id/edit" component={CourseStudio} />
        {/* Full-screen email template editor — no sidebar */}
        <Route path="/admin/email-templates/:id/edit" component={EmailTemplateEditor} />
        {/* All other admin pages use the sidebar layout */}
        <Route>
          <AdminLayout>
            <Switch>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/courses" component={AdminDashboard} />
              <Route path="/admin/setup" component={AdminSetup} />
              <Route path="/admin/analytics" component={AdminAnalytics} />
              <Route path="/admin/students/:id" component={AdminStudentProfile} />
              <Route path="/admin/students" component={AdminStudents} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/coupons" component={AdminCoupons} />
              <Route path="/admin/orders" component={AdminOrders} />
              <Route path="/admin/pathways" component={AdminPathways} />
              <Route path="/admin/groups" component={AdminGroups} />
              <Route path="/admin/email-templates" component={EmailTemplates} />
            </Switch>
          </AdminLayout>
        </Route>
      </Switch>
    </AdminGuard>
  );
}

function PublicRouter() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/courses" component={CoursesPage} />
          <Route path="/courses/:slug" component={CourseDetailPage} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/learn/:slug" component={CoursePlayer} />
          <Route path="/bundles" component={BundlesPage} />
          <Route path="/certificates/:code" component={CertificatePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");
  return isAdmin ? <AdminRouter /> : <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppLayout />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
