import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, SquareUser, Wallet, UsersIcon, UserPlus, Calendar, TrendingUp, Bell, Building2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InterLogo } from "@/components/InterLogo";

interface DashboardMetrics {
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
  receitaMensal: number;
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const handleQuickAction = (action: string) => {
    toast({
      title: "Ação em desenvolvimento",
      description: `A funcionalidade "${action}" será implementada em breve.`,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Dashboard</h2>
          <p className="text-neutral-600">Visão geral da escola de futebol</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800">Dashboard</h2>
          <p className="text-neutral-600">Visão geral da escola de futebol</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
          </Button>
          <Button onClick={() => handleQuickAction("Novo Cadastro")} className="bg-primary hover:bg-primary/90 text-sm sm:text-base">
            <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Novo Cadastro</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-neutral-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total de Alunos</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {metrics?.totalAlunos || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-secondary font-medium">+8%</span>
              <span className="text-neutral-400 ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Professores Ativos</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {metrics?.totalProfessores || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <SquareUser className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-secondary font-medium">+2</span>
              <span className="text-neutral-400 ml-1">novos professores</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {formatCurrency(metrics?.receitaMensal || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-secondary font-medium">+12%</span>
              <span className="text-neutral-400 ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Turmas Ativas</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {metrics?.totalTurmas || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-neutral-400">
                {metrics?.totalProfessores ? Math.round((metrics.totalTurmas || 0) / metrics.totalProfessores) : 0} turmas
              </span>
              <span className="text-neutral-400 ml-1">por professor</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard das Unidades - Acesso Rápido */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center p-1">
                <InterLogo size={32} />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-blue-800">Dashboard das Unidades</CardTitle>
                <p className="text-sm text-blue-600">Análise comparativa entre todas as unidades</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/dashboard-unidades'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">1</p>
              <p className="text-sm text-blue-700">Unidades Ativas</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{metrics?.totalAlunos || 0}</p>
              <p className="text-sm text-blue-700">Total de Alunos</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics?.receitaMensal || 0)}</p>
              <p className="text-sm text-blue-700">Receita Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card className="border-neutral-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Receita Mensal</CardTitle>
                <select className="text-sm border border-neutral-200 rounded-lg px-3 py-2">
                  <option>Últimos 6 meses</option>
                  <option>Último ano</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary/20 rounded-t" style={{ height: "60px" }}></div>
                  <span className="text-xs text-neutral-400">Jan</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary/40 rounded-t" style={{ height: "80px" }}></div>
                  <span className="text-xs text-neutral-400">Fev</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary/60 rounded-t" style={{ height: "120px" }}></div>
                  <span className="text-xs text-neutral-400">Mar</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary/80 rounded-t" style={{ height: "100px" }}></div>
                  <span className="text-xs text-neutral-400">Abr</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary rounded-t" style={{ height: "140px" }}></div>
                  <span className="text-xs text-neutral-400">Mai</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 bg-primary rounded-t" style={{ height: "160px" }}></div>
                  <span className="text-xs text-neutral-400">Jun</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-800">Sistema iniciado</p>
                  <p className="text-xs text-neutral-400">Pronto para cadastros</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
              Ver todas as atividades
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handleQuickAction("Novo Aluno")}
              >
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-neutral-800">Novo Aluno</p>
                  <p className="text-sm text-neutral-400">Cadastrar estudante</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handleQuickAction("Nova Turma")}
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-neutral-800">Nova Turma</p>
                  <p className="text-sm text-neutral-400">Criar turma</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handleQuickAction("Pagamento")}
              >
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-neutral-800">Pagamento</p>
                  <p className="text-sm text-neutral-400">Registrar pagamento</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handleQuickAction("Relatório")}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-neutral-800">Relatório</p>
                  <p className="text-sm text-neutral-400">Gerar relatório</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Próximas Aulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500">Nenhuma aula agendada</p>
                <p className="text-sm text-neutral-400">Cadastre turmas para ver o cronograma</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full text-primary hover:text-primary/80">
              Ver cronograma completo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
