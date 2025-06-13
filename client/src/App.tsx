import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Alunos from "@/pages/AlunosFixed";
import Professores from "@/pages/Professores";
import Turmas from "@/pages/Turmas";
import GestaoTurmas from "@/pages/GestaoTurmas";
import Financeiro from "@/pages/Financeiro";
import Relatorios from "@/pages/Relatorios";
import RelatorioPresencas from "@/pages/RelatorioPresencas";
import GestaoUnidades from "@/pages/GestaoUnidades";
import DashboardUnidadeWrapper from "@/pages/DashboardUnidadeWrapper";
import PainelUnidade from "@/pages/PainelUnidade";
import LoginUnidade from "@/pages/LoginUnidade";
import CadastroGestorUnidade from "@/pages/CadastroGestorUnidade";
import AlunosUnidadePortal from "@/pages/AlunosUnidade";
import ProfessoresUnidade from "@/pages/ProfessoresUnidade";
import TurmasUnidade from "@/pages/TurmasUnidade";
import FinanceiroUnidade from "@/pages/FinanceiroUnidade";
import SistemaUnidade from "@/pages/SistemaUnidade";
import UnidadeAlunos from "@/pages/UnidadeAlunos";
import UnidadeProfessores from "@/pages/UnidadeProfessores";
import FinanceiroCompleto from "@/pages/FinanceiroCompleto";
import Filiais from "@/pages/Filiais";
import DashboardUnidades from "@/pages/DashboardUnidades";
import ResponsavelEntrada from "@/pages/ResponsavelEntrada";
import ResponsavelLogin from "@/pages/ResponsavelLogin";
import ResponsavelCadastro from "@/pages/ResponsavelCadastro";
import ResponsavelPortal from "@/pages/ResponsavelPortalSimples";
import AvaliacaoFisica from "@/pages/AvaliacaoFisica";
import PortalUnidades from "@/pages/PortalUnidades";
import CombosAulas from "@/pages/CombosAulas";
import CadastroAluno from "@/pages/CadastroAluno";
import PortalUnidade from "@/pages/PortalUnidade";
import DashboardPortalUnidade from "@/pages/DashboardPortalUnidade";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Portal do Responsável - Rotas independentes */}
      <Route path="/responsavel" component={ResponsavelLogin} />
      <Route path="/responsavel/cadastro" component={ResponsavelCadastro} />
      <Route path="/responsavel/login" component={ResponsavelLogin} />
      <Route path="/portal" component={ResponsavelPortal} />
      
      {/* Portal da Unidade - Sistema Independente */}
      <Route path="/portal-unidade" component={PortalUnidade} />
      <Route path="/unidade/:filialId/dashboard" component={DashboardPortalUnidade} />
      <Route path="/unidade/:filialId/alunos" component={AlunosUnidadePortal} />
      <Route path="/unidade/:filialId/professores" component={ProfessoresUnidade} />
      <Route path="/unidade/:filialId/turmas" component={TurmasUnidade} />
      <Route path="/unidade/:filialId/financeiro" component={FinanceiroUnidade} />
      <Route path="/unidade/:filialId/presencas" component={RelatorioPresencas} />
      <Route path="/unidade/:filialId/relatorios" component={Relatorios} />
      
      {/* Rotas antigas para compatibilidade */}
      <Route path="/unidade/login" component={LoginUnidade} />
      <Route path="/unidade/cadastro" component={CadastroGestorUnidade} />
      
      {/* Sistema Completo da Unidade sem ID (compatibilidade) */}
      <Route path="/login-unidade" component={LoginUnidade} />
      <Route path="/unidade/sistema" component={SistemaUnidade} />
      <Route path="/unidade/alunos" component={UnidadeAlunos} />
      <Route path="/unidade/professores" component={UnidadeProfessores} />
      <Route path="/unidade/turmas" component={TurmasUnidade} />
      <Route path="/unidade/financeiro" component={FinanceiroUnidade} />
      <Route path="/unidade/matriculas" component={GestaoTurmas} />
      <Route path="/unidade/relatorios" component={Relatorios} />
      <Route path="/unidade/presencas" component={RelatorioPresencas} />
      <Route path="/unidade/dashboard" component={DashboardUnidadeWrapper} />
      
      {/* Sistema Administrativo */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Layout>
            <Route path="/" component={Dashboard} />
            <Route path="/alunos" component={Alunos} />
            <Route path="/professores" component={Professores} />
            <Route path="/turmas" component={Turmas} />
            <Route path="/gestao-turmas" component={GestaoTurmas} />
            <Route path="/filiais" component={Filiais} />
            <Route path="/dashboard-unidades" component={DashboardUnidades} />
            <Route path="/financeiro" component={FinanceiroCompleto} />
            <Route path="/relatorios" component={Relatorios} />
            <Route path="/relatorio-presencas" component={RelatorioPresencas} />
            <Route path="/avaliacao-fisica" component={AvaliacaoFisica} />
            <Route path="/portal-unidades" component={PortalUnidades} />
            <Route path="/gestao-unidades" component={GestaoUnidades} />
            <Route path="/combos-aulas" component={CombosAulas} />
            <Route path="/cadastro-aluno" component={CadastroAluno} />
          </Layout>
          <Layout>
            <Route path="/unidade/:filialId" component={DashboardUnidadeWrapper} />
            <Route path="/unidade/:filialId/sistema" component={SistemaUnidade} />
          </Layout>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
