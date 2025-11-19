import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  UsersRound, 
  DollarSign, 
  FileBarChart, 
  LogOut,
  Building2,
  CircleUser
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserData {
  profileImageUrl?: string;
  firstName?: string;
  email?: string;
}

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const userData = (user || {}) as UserData;

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: location === "/",
    },
    {
      name: "Alunos",
      href: "/alunos",
      icon: Users,
      active: location === "/alunos",
    },
    {
      name: "Professores",
      href: "/professores",
      icon: UserSquare2,
      active: location === "/professores",
    },
    {
      name: "Turmas",
      href: "/turmas",
      icon: UsersRound,
      active: location === "/turmas",
    },
    {
      name: "Filiais",
      href: "/filiais",
      icon: Building2,
      active: location === "/filiais",
    },
    {
      name: "Financeiro",
      href: "/financeiro",
      icon: DollarSign,
      active: location === "/financeiro",
    },
    {
      name: "Relatórios",
      href: "/relatorios",
      icon: FileBarChart,
      active: location === "/relatorios",
    },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <aside className="w-72 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-foreground))] flex flex-col shadow-2xl border-r border-white/5">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-7 h-7 text-white"
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
                <path d="M8 12h8"/>
                <path d="M12 8v8"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[hsl(var(--sidebar-bg))]"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">EscolaFut</h1>
            <p className="text-xs text-white/60 mt-0.5">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <button
                data-testid={`nav-${item.name.toLowerCase()}`}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  item.active
                    ? "bg-green-500/20 text-green-400 shadow-lg shadow-green-500/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center space-x-3 mb-3">
            {userData?.profileImageUrl ? (
              <img 
                src={userData.profileImageUrl} 
                alt="Perfil do usuário" 
                className="w-11 h-11 rounded-full object-cover ring-2 ring-green-500/30" 
              />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <CircleUser className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {userData?.firstName || userData?.email || "Usuário"}
              </p>
              <p className="text-xs text-white/50 mt-0.5">Administrador</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/5 h-9"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
}
