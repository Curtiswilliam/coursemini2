import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import CoursesPage from "@/pages/courses";
import CourseDetailPage from "@/pages/course-detail";
import Dashboard from "@/pages/dashboard";
import CoursePlayer from "@/pages/course-player";
import AdminDashboard from "@/pages/admin/index";
import CourseEditor from "@/pages/admin/course-editor";
import AdminStudents from "@/pages/admin/students";
import AdminSetup from "@/pages/admin/setup";
import AdminUsers from "@/pages/admin/users";
import AdminAnalytics from "@/pages/admin/analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/courses/:slug" component={CourseDetailPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/learn/:slug" component={CoursePlayer} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/setup" component={AdminSetup} />
      <Route path="/admin/courses/new" component={CourseEditor} />
      <Route path="/admin/courses/:id/edit" component={CourseEditor} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/students" component={AdminStudents} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <Router />
      </main>
      <Footer />
    </>
  );
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
