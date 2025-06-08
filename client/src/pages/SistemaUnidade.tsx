import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2,
  Users, 
  GraduationCap, 
  BookOpen,
  DollarSign,
  LogOut,
  TrendingUp,
  FileText,
  Calendar,
  Settings,
  BarChart3,
  UserCheck,
  CreditCard
} from "lucide-react";
import { InterLogo } from "@/components/InterLogo";
import { useLocation } from "wouter";
import type { Filial } from "@shared/schema";

export default function SistemaUnidade() {
  const [, setLocation] = useLocation();

  // Recuperar unidade selecionada
  const unidadeSelecionada = localStorage.getItem("unidade_selecionada");
  const filialId = unidadeSelecionada ? parseInt(unidadeSelecionada) : null;

  if (!filialId) {
    setLocation("/login-unidade");
    return null;
  }

  const { data: filial, isLoading: loadingFilial } = useQuery<Filial>({
    queryKey: [`/api/filiais/${filialId}`],
  });

  // Métricas da unidade
  const { data: alunos = [] } = useQuery({
    queryKey: [`/api/filiais/${filialId}/alunos`],
  });

  const { data: professores = [] } = useQuery({
    queryKey: [`/api/filiais/${filialId}/professores`],
  });

  const { data: turmas = [] } = useQuery({
    queryKey: [`/api/filiais/${filialId}/turmas`],
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ["/api/pagamentos"],
  });

  // Calcular métricas
  const totalAlunos = alunos.length || 0;
  const totalProfessores = professores.length || 0;
  const totalTurmas = turmas.length || 0;
  const receitaMensal = pagamentos
    .filter((p: any) => {
      const aluno = alunos.find((a: any) => a.id === p.alunoId);
      return aluno && aluno.filialId === filialId && p.dataPagamento;
    })
    .reduce((sum: number, p: any) => sum + parseFloat(p.valor || 0), 0);

  const handleLogout = () => {
    localStorage.removeItem("unidade_selecionada");
    setLocation("/login-unidade");
  };

  const handleBackToMatrix = () => {
    localStorage.removeItem("unidade_selecionada");
    window.location.href = "/api/login";
  };

  if (loadingFilial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!filial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unidade não encontrada</h2>
          <Button onClick={() => setLocation("/login-unidade")}>
            Selecionar Outra Unidade
          </Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Gestão de Alunos",
      description: "Cadastrar, editar e gerenciar alunos da unidade",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      route: "/unidade/alunos",
      count: totalAlunos
    },
    {
      title: "Gestão de Professores", 
      description: "Administrar professores e especialidades",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
      route: "/unidade/professores",
      count: totalProfessores
    },
    {
      title: "Gestão de Turmas",
      description: "Criar e organizar turmas e horários",
      icon: BookOpen,
      color: "text-purple-600", 
      bgColor: "bg-purple-50",
      route: "/unidade/turmas",
      count: totalTurmas
    },
    {
      title: "Controle Financeiro",
      description: "Gerenciar pagamentos e receitas",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      route: "/unidade/financeiro",
      count: `R$ ${receitaMensal.toFixed(2)}`
    },
    {
      title: "Matrículas",
      description: "Vincular alunos às turmas",
      icon: UserCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-50", 
      route: "/unidade/matriculas",
      count: "Gerir"
    },
    {
      title: "Relatórios",
      description: "Gerar relatórios de presença e desempenho",
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      route: "/unidade/relatorios", 
      count: "Ver"
    },
    {
      title: "Presenças",
      description: "Controlar frequência dos alunos",
      icon: Calendar,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      route: "/unidade/presencas",
      count: "Registrar"
    },
    {
      title: "Dashboard",
      description: "Visualizar métricas e indicadores",
      icon: BarChart3,
      color: "text-cyan-600", 
      bgColor: "bg-cyan-50",
      route: "/unidade/dashboard",
      count: "Analytics"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Unidade */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center p-1 mr-3">
                <InterLogo size={32} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{filial.nome}</h1>
                <p className="text-sm text-gray-600">Sistema Completo de Gestão</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={filial.ativa ? "default" : "secondary"} className="px-3 py-1">
                {filial.ativa ? "Unidade Ativa" : "Unidade Inativa"}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleBackToMatrix}>
                <Settings className="h-4 w-4 mr-2" />
                Sistema Matriz
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Trocar Unidade
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informações da Unidade */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Unidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">{filial.endereco}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{filial.telefone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Responsável</p>
                  <p className="font-medium">{filial.responsavel || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={filial.ativa ? "default" : "secondary"}>
                    {filial.ativa ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Resumidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAlunos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Professores Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProfessores}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-50">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Turmas Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTurmas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-emerald-50">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                  <p className="text-2xl font-bold text-gray-900">R$ {receitaMensal.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sistema Completo */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Sistema Completo de Gestão</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Todas as funcionalidades da matriz disponíveis para sua unidade. 
            Os dados são sincronizados automaticamente com o sistema central.
          </p>
        </div>

        {/* Menu de Funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <Card 
              key={item.title} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200"
              onClick={() => setLocation(item.route)}
            >
              <CardContent className="p-6 text-center">
                <div className={`p-4 rounded-lg ${item.bgColor} w-fit mx-auto mb-4`}>
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {item.count}
                  </Badge>
                  <Button size="sm" className="h-7 px-3 text-xs">
                    Acessar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Nota sobre Sincronização */}
        <div className="mt-8">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Sincronização Automática com a Matriz
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Todas as operações realizadas nesta unidade são automaticamente enviadas 
                    para o sistema central da matriz. Isso garante que os dados estejam sempre 
                    atualizados em todos os níveis da organização.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}