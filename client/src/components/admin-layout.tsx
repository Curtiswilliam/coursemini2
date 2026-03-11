import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Shield,
  Settings,
  GraduationCap,
  LogOut,
  Sun,
  Moon,
  Tag,
  Globe,
  ChevronRight,
  ShoppingCart,
  UsersRound,
  GitBranch,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: any;
  label: string;
  exact?: boolean;
  adminOnly?: boolean;
  comingSoon?: boolean;
};

const navSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    ],
  },
  {
    label: "Product",
    items: [
      { href: "/admin/courses", icon: BookOpen, label: "Courses" },
    ],
  },
  {
    label: "Sell",
    items: [
      { href: "/admin/coupons", icon: Tag, label: "Coupons" },
      { href: "/admin/orders", icon: ShoppingCart, label: "Orders & Revenue" },
      { href: "/admin/pathways", icon: GitBranch, label: "Pathways" },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/admin/students", icon: Users, label: "Students" },
      { href: "/admin/groups", icon: UsersRound, label: "Student Groups" },
      { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/admin/email-templates", icon: Mail, label: "Email Templates" },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/users", icon: Shield, label: "Users & Roles", adminOnly: true },
      { href: "/admin/setup", icon: Settings, label: "Settings" },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  const isActive = (href: string, exact = false) => {
    if (exact) return location === href;
    if (href === "/admin/courses") {
      return location.startsWith("/admin/courses");
    }
    if (href === "/admin/email-templates") {
      return location.startsWith("/admin/email-templates");
    }
    return location === href;
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r bg-card flex flex-col fixed top-0 left-0 h-screen z-40">
        {/* Logo */}
        <div className="px-4 py-4 border-b">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm">CourseMini</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.adminOnly || isAdmin
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <div key={item.href}>
                      {item.comingSoon ? (
                        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md text-muted-foreground/50 cursor-not-allowed select-none text-sm">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">Soon</span>
                        </div>
                      ) : (
                        <Link href={item.href}>
                          <div
                            className={cn(
                              "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm cursor-pointer transition-colors",
                              isActive(item.href, item.exact)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {isActive(item.href, item.exact) && (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </div>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom user section */}
        <div className="border-t p-3 space-y-1">
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-1 pt-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs">
                <Globe className="h-3.5 w-3.5 mr-2" />
                View Site
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
