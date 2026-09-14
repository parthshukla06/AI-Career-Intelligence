import { NavLink } from "react-router-dom";
import {
  BrainCircuit,
  Briefcase,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const mobileNavItems = [
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/career", label: "Career", icon: BrainCircuit },
  { to: "/recommendations", label: "Matches", icon: Sparkles },
  { to: "/assistant", label: "Assistant", icon: MessageSquare },
];

const mobileNavItemsAuth = [
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/career", label: "Career", icon: BrainCircuit },
  { to: "/assistant", label: "Assistant", icon: MessageSquare },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function MobileBottomNav() {
  const token = useAuthStore((s) => s.token);
  const items = token ? mobileNavItemsAuth : mobileNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex lg:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
