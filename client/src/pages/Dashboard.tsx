import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Calendar, DollarSign, LogOut } from "lucide-react";
import { Link } from "wouter";

interface DashboardMetrics {
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
  pagamentosRecebidos: number;
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const handleLogout = async () => {
    await fetch("/api/auth/admin/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Sistema de Gestão - Escola de Futebol
            </h1>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Alunos
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : metrics?.totalAlunos || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Professores
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : metrics?.totalProfessores || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Turmas Ativas
              </CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : metrics?.totalTurmas || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pagamentos (Mês)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {isLoading ? "..." : (metrics?.pagamentosRecebidos || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/alunos">
              <Button className="w-full" variant="outline" data-testid="link-alunos">
                <Users className="w-4 h-4 mr-2" />
                Alunos
              </Button>
            </Link>
            <Link href="/turmas">
              <Button className="w-full" variant="outline" data-testid="link-turmas">
                <Calendar className="w-4 h-4 mr-2" />
                Turmas
              </Button>
            </Link>
            <Link href="/professores">
              <Button className="w-full" variant="outline" data-testid="link-professores">
                <GraduationCap className="w-4 h-4 mr-2" />
                Professores
              </Button>
            </Link>
            <Link href="/filiais">
              <Button className="w-full" variant="outline" data-testid="link-filiais">
                <Users className="w-4 h-4 mr-2" />
                Filiais
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
