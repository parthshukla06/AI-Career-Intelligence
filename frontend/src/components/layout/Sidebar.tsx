import { NavLink } from "react-router-dom";
import {
  BrainCircuit,
  Briefcase,
  FileText,
  Home,
  LayoutDashboard,
  Map,
  WandSparkles,
  Route,
  MessageSquare,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/career", label: "Career Intelligence", icon: BrainCircuit },
  { to: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { to: "/roadmap", label: "Career Roadmap", icon: Map },
  { to: "/resume-improvement", label: "Resume Improvement", icon: WandSparkles },
  { to: "/career-paths", label: "Career Paths", icon: Route },
];

const authNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const token = useAuthStore((s) => s.token);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-background border-r border-border h-full transition-all duration-200",
        collapsed ? "w-14" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
          AI
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-foreground leading-tight">
            Career<br />Intelligence
          </span>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-2",
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Auth-only nav items */}
        {token && (
          <>
            <div className={cn("pt-2 pb-1", collapsed ? "px-2" : "px-3")}>
              {!collapsed && (
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account
                </span>
              )}
              {collapsed && <div className="border-t border-border" />}
            </div>
            {authNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    collapsed && "justify-center px-2",
                  )
                }
                title={collapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
