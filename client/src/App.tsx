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
import Filiais from "@/pages/Filiais";
import DashboardUnidades from "@/pages/DashboardUnidades";
import ResponsavelEntrada from "@/pages/ResponsavelEntrada";
import ResponsavelLogin from "@/pages/ResponsavelLogin";
import ResponsavelCadastro from "@/pages/ResponsavelCadastro";
import ResponsavelPortal from "@/pages/ResponsavelPortalSimples";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Portal do Responsável - Rotas independentes */}
      <Route path="/responsavel" component={ResponsavelEntrada} />
      <Route path="/responsavel/cadastro" component={ResponsavelCadastro} />
      <Route path="/responsavel/login" component={ResponsavelLogin} />
      <Route path="/portal" component={ResponsavelPortal} />
      
      {/* Sistema Administrativo */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Layout>
          <Route path="/" component={Dashboard} />
          <Route path="/alunos" component={Alunos} />
          <Route path="/professores" component={Professores} />
          <Route path="/turmas" component={Turmas} />
          <Route path="/gestao-turmas" component={GestaoTurmas} />
          <Route path="/filiais" component={Filiais} />
          <Route path="/dashboard-unidades" component={DashboardUnidades} />
          <Route path="/financeiro" component={Financeiro} />
          <Route path="/relatorios" component={Relatorios} />
          <Route path="/relatorio-presencas" component={RelatorioPresencas} />
        </Layout>
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
