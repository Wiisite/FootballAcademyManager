import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Volleyball, Users, Calendar, TrendingUp, Shield, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-green rounded-lg flex items-center justify-center">
                <Volleyball className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-800">EscolaFut</h1>
                <p className="text-sm text-neutral-500">Sistema de Gestão</p>
              </div>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              Entrar no Sistema
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
              <Volleyball className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Sistema de Gestão para
              <span className="text-primary block">Escola de Futebol</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Gerencie alunos, professores, turmas e finanças da sua escola de futebol 
              de forma simples e eficiente com nossa plataforma completa.
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg"
            >
              Acessar Sistema
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Nossa plataforma oferece todas as ferramentas necessárias para 
              administrar sua escola de futebol com eficiência e profissionalismo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Gestão de Alunos</CardTitle>
                <CardDescription>
                  Cadastre e gerencie informações completas dos alunos, 
                  incluindo dados pessoais, responsáveis e histórico.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="text-xl">Controle de Professores</CardTitle>
                <CardDescription>
                  Gerencie o corpo docente com informações profissionais, 
                  especialidades e controle de turmas atribuídas.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl">Organização de Turmas</CardTitle>
                <CardDescription>
                  Crie e organize turmas por categoria, horários e 
                  professores responsáveis de forma intuitiva.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Controle Financeiro</CardTitle>
                <CardDescription>
                  Gerencie mensalidades, pagamentos e tenha visão 
                  completa da situação financeira da escola.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Relatórios Completos</CardTitle>
                <CardDescription>
                  Acesse relatórios detalhados sobre desempenho, 
                  frequência e análises financeiras.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Volleyball className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Interface Intuitiva</CardTitle>
                <CardDescription>
                  Design moderno e responsivo, fácil de usar tanto 
                  no computador quanto no celular.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-green">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para revolucionar sua escola de futebol?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Entre no sistema e comece a gerenciar sua escola de forma profissional e eficiente.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            variant="secondary"
            className="bg-white text-primary-green hover:bg-neutral-50 px-8 py-4 text-lg"
          >
            Acessar Sistema Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-green rounded-lg flex items-center justify-center">
                <Volleyball className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-neutral-800">EscolaFut</p>
                <p className="text-sm text-neutral-500">Sistema de Gestão</p>
              </div>
            </div>
            <p className="text-sm text-neutral-500">
              © 2024 EscolaFut. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
