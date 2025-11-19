import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, TrendingUp, Shield, Zap, Building2, DollarSign, GraduationCap, CheckCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-6 h-6 text-white"
                  >
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
                    <path d="M8 12h8"/>
                    <path d="M12 8v8"/>
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EscolaFut</h1>
                <p className="text-sm text-white/60">Sistema de Gestão</p>
              </div>
            </div>
            <Button 
              onClick={handleLogin} 
              data-testid="button-entrar"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
            >
              Entrar no Sistema
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-2xl mb-6 shadow-lg shadow-green-500/20">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-10 h-10 text-green-400"
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
                <path d="M8 12h8"/>
                <path d="M12 8v8"/>
              </svg>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Sistema de Gestão para
              <span className="text-green-400 block mt-2">Escola de Futebol</span>
            </h1>
            <p className="text-xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              Gerencie alunos, professores, turmas e finanças da sua escola de futebol 
              de forma simples e eficiente com nossa plataforma completa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleLogin}
                size="lg"
                data-testid="button-acessar-sistema"
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-6 text-lg shadow-xl shadow-green-600/30 hover:shadow-green-600/40 transition-all"
              >
                Acessar Sistema
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Nossa plataforma oferece todas as ferramentas necessárias para 
              administrar sua escola de futebol com eficiência e profissionalismo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Gestão de Alunos</CardTitle>
                <CardDescription className="text-white/70">
                  Cadastre e gerencie informações completas dos alunos, 
                  incluindo dados pessoais, responsáveis e status de pagamento.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-xl text-white">Controle de Professores</CardTitle>
                <CardDescription className="text-white/70">
                  Gerencie o corpo docente com informações profissionais, 
                  especialidades e controle de turmas atribuídas.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-xl text-white">Organização de Turmas</CardTitle>
                <CardDescription className="text-white/70">
                  Crie e organize turmas por categoria, horários e 
                  professores responsáveis de forma intuitiva.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <CardTitle className="text-xl text-white">Controle Financeiro</CardTitle>
                <CardDescription className="text-white/70">
                  Gerencie mensalidades, pagamentos e tenha visão 
                  completa da situação financeira da escola.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <CardTitle className="text-xl text-white">Multi-Filiais</CardTitle>
                <CardDescription className="text-white/70">
                  Gerencie múltiplas filiais da sua escola em uma única 
                  plataforma centralizada e organizada.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-rose-400" />
                </div>
                <CardTitle className="text-xl text-white">Dashboard Intuitivo</CardTitle>
                <CardDescription className="text-white/70">
                  Visualize métricas importantes, status de pagamentos e 
                  KPIs em tempo real de forma clara e objetiva.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Por que escolher o EscolaFut?
            </h2>
            <p className="text-lg text-white/70">
              Uma solução completa pensada especificamente para escolas de futebol
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Interface Moderna e Intuitiva</h3>
                <p className="text-white/70">
                  Design pensado para facilitar o uso diário, sem necessidade de treinamento extensivo.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Controle de Pagamentos</h3>
                <p className="text-white/70">
                  Acompanhe quem está em dia e quem está atrasado com as mensalidades em tempo real.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Gestão Centralizada</h3>
                <p className="text-white/70">
                  Todos os dados em um só lugar: alunos, professores, turmas e finanças integrados.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Acesso Responsivo</h3>
                <p className="text-white/70">
                  Acesse de qualquer dispositivo: computador, tablet ou smartphone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto para revolucionar sua escola de futebol?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Entre no sistema e comece a gerenciar sua escola de forma profissional e eficiente hoje mesmo.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            data-testid="button-acessar-agora"
            className="bg-white text-green-600 hover:bg-gray-100 px-10 py-6 text-lg shadow-xl font-semibold"
          >
            Acessar Sistema Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-sm border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-4 h-4 text-white"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
                  <path d="M8 12h8"/>
                  <path d="M12 8v8"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">EscolaFut</p>
                <p className="text-sm text-white/60">Sistema de Gestão</p>
              </div>
            </div>
            <p className="text-sm text-white/60">
              © 2024 EscolaFut. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
