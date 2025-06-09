import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Users, 
  GraduationCap,
  DollarSign, 
  Calendar,
  FileText,
  Settings,
  BarChart3,
  UserPlus,
  BookOpen,
  CreditCard,
  Activity,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

// Import existing unit components
import AlunosUnidade from "./AlunosUnidade";
import ProfessoresUnidade from "./ProfessoresUnidade";
import TurmasUnidade from "./TurmasUnidade";
import FinanceiroUnidade from "./FinanceiroUnidade";
import DashboardUnidade from "./DashboardUnidade";

export default function SistemaUnidade() {
  const { filialId } = useParams();
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: filial, isLoading } = useQuery({
    queryKey: ["/api/filiais", filialId],
    enabled: !!filialId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!filial) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unidade não encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            A unidade solicitada não foi encontrada no sistema.
          </p>
          <Link href="/portal-unidades">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Portal
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/portal-unidades">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Portal das Unidades
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                  {filial.nome}
                </h1>
                <p className="text-gray-600">Sistema de gestão completo da unidade</p>
              </div>
            </div>
            <Badge variant={filial.ativo ? "default" : "secondary"}>
              {filial.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:flex lg:space-x-2">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="alunos" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Alunos</span>
            </TabsTrigger>
            <TabsTrigger value="professores" className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Professores</span>
            </TabsTrigger>
            <TabsTrigger value="turmas" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Turmas</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Dashboard da Unidade
                </CardTitle>
                <CardDescription>
                  Visão geral dos indicadores e métricas da unidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardUnidade />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="alunos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Gestão de Alunos
                </CardTitle>
                <CardDescription>
                  Cadastro e gerenciamento completo dos alunos da unidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlunosUnidade />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="professores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Gestão de Professores
                </CardTitle>
                <CardDescription>
                  Cadastro e gerenciamento da equipe de professores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfessoresUnidade />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="turmas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Gestão de Turmas
                </CardTitle>
                <CardDescription>
                  Organização das turmas e horários de treino
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TurmasUnidade />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financeiro" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Gestão Financeira
                </CardTitle>
                <CardDescription>
                  Controle de pagamentos e receitas da unidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinanceiroUnidade />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions Panel */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades da unidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setActiveTab("alunos")}
              >
                <UserPlus className="h-6 w-6" />
                <span className="text-sm">Novo Aluno</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setActiveTab("turmas")}
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Nova Turma</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setActiveTab("financeiro")}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Registrar Pagamento</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => setActiveTab("dashboard")}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Relatórios</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}