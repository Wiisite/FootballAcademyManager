import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Volleyball, 
  BarChart3, 
  Users, 
  SquareUser, 
  UsersIcon, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut,
  Building2,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: BarChart3,
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
      icon: SquareUser,
      active: location === "/professores",
    },
    {
      name: "Turmas",
      href: "/turmas",
      icon: UsersIcon,
      active: location === "/turmas",
    },
    {
      name: "Gestão de Turmas",
      href: "/gestao-turmas",
      icon: Users,
      active: location === "/gestao-turmas",
    },
    {
      name: "Unidades",
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
      icon: FileText,
      active: location === "/relatorios",
    },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-neutral-100 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-green rounded-lg flex items-center justify-center">
            <Volleyball className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-800">EscolaFut</h1>
            <p className="text-sm text-neutral-400">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4 py-3 h-auto font-normal",
                      item.active
                        ? "text-primary bg-primary/10 hover:bg-primary/15"
                        : "text-neutral-600 hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-100">
        <div className="flex items-center space-x-3 mb-4">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="Perfil do usuário" 
              className="w-10 h-10 rounded-full object-cover" 
            />
          ) : (
            <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-neutral-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 truncate">
              {user?.firstName || user?.email || "Usuário"}
            </p>
            <p className="text-xs text-neutral-400">Administrador</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
