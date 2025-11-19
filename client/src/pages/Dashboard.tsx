import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  UserSquare2, 
  Wallet, 
  UsersRound, 
  UserPlus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  GraduationCap,
  ChevronRight,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

interface DashboardMetrics {
  totalAlunos: number;
  totalProfessores: number;
  totalTurmas: number;
  receitaMensal: number;
}

interface PaymentStats {
  emDia: number;
  atrasados: number;
  total: number;
}

export default function Dashboard() {
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: paymentStats, isLoading: isLoadingPayments } = useQuery<PaymentStats>({
    queryKey: ["/api/alunos/payment-stats"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const isLoading = isLoadingMetrics || isLoadingPayments;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-5 w-28 mb-3" />
                <Skeleton className="h-10 w-20 mb-4" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const percentEmDia = paymentStats?.total 
    ? Math.round((paymentStats.emDia / paymentStats.total) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Bem-vindo ao sistema de gestão da sua escola de futebol</p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Alunos */}
        <Card className="overflow-hidden border-border bg-card hover-lift group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>8%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total de Alunos</p>
              <p className="text-3xl font-bold text-foreground" data-testid="metric-total-alunos">{metrics?.totalAlunos || 0}</p>
            </div>
            <Link href="/alunos">
              <button 
                data-testid="link-alunos"
                className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium flex items-center group/link"
              >
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Professores */}
        <Card className="overflow-hidden border-border bg-card hover-lift group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <UserSquare2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>2 novos</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Professores</p>
              <p className="text-3xl font-bold text-foreground" data-testid="metric-total-professores">{metrics?.totalProfessores || 0}</p>
            </div>
            <Link href="/professores">
              <button 
                data-testid="link-professores"
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center group/link"
              >
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Receita */}
        <Card className="overflow-hidden border-border bg-card hover-lift group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>12%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Receita Mensal</p>
              <p className="text-3xl font-bold text-foreground" data-testid="metric-receita-mensal">{formatCurrency(metrics?.receitaMensal || 0)}</p>
            </div>
            <Link href="/financeiro">
              <button 
                data-testid="link-financeiro"
                className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center group/link"
              >
                Ver detalhes
                <ChevronRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Turmas */}
        <Card className="overflow-hidden border-border bg-card hover-lift group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <UsersRound className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center text-muted-foreground text-sm font-medium">
                <Clock className="w-4 h-4 mr-1" />
                <span>Ativas</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Turmas</p>
              <p className="text-3xl font-bold text-foreground" data-testid="metric-total-turmas">{metrics?.totalTurmas || 0}</p>
            </div>
            <Link href="/turmas">
              <button 
                data-testid="link-turmas"
                className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center group/link"
              >
                Ver todas
                <ChevronRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Status de Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Payment Progress */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Taxa de pagamento
                  </span>
                  <span className="text-2xl font-bold text-foreground" data-testid="metric-percent-em-dia">{percentEmDia}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 rounded-full"
                    style={{ width: `${percentEmDia}%` }}
                  ></div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold text-foreground" data-testid="metric-payment-total">{paymentStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Alunos ativos</p>
                </div>

                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Em Dia</span>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700" data-testid="metric-payment-em-dia">{paymentStats?.emDia || 0}</p>
                  <p className="text-xs text-green-600 mt-1">Pagamentos regulares</p>
                </div>

                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">Atrasados</span>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-700" data-testid="metric-payment-atrasados">{paymentStats?.atrasados || 0}</p>
                  <p className="text-xs text-red-600 mt-1">Necessitam atenção</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/alunos">
              <button 
                data-testid="button-novo-aluno"
                className="w-full flex items-center p-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-green-500/20 mr-3">
                  <UserPlus className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Novo Aluno</p>
                  <p className="text-sm text-muted-foreground">Cadastrar estudante</p>
                </div>
                <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/turmas">
              <button 
                data-testid="button-nova-turma"
                className="w-full flex items-center p-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Nova Turma</p>
                  <p className="text-sm text-muted-foreground">Criar turma</p>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/filiais">
              <button 
                data-testid="button-filiais"
                className="w-full flex items-center p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Filiais</p>
                  <p className="text-sm text-muted-foreground">Gerenciar unidades</p>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/financeiro">
              <button 
                data-testid="button-financeiro-quick"
                className="w-full flex items-center p-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/30 transition-all group"
              >
                <div className="p-2 rounded-lg bg-amber-500/20 mr-3">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Financeiro</p>
                  <p className="text-sm text-muted-foreground">Registrar pagamento</p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
