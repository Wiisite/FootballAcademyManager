import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResponsavel, logoutResponsavel } from "@/hooks/useResponsavel";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  User, 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  LogOut,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Gift,
  Loader2
} from "lucide-react";
import type { 
  ResponsavelWithAlunos, 
  Notificacao, 
  EventoWithFilial, 
  Uniforme,
  AlunoCompleto 
} from "@shared/schema";

export default function ResponsavelPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { responsavel, isLoading, isAuthenticated } = useResponsavel();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Acesso restrito",
        description: "Você precisa fazer login para acessar o portal.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/responsavel/login";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !responsavel) {
    return null; // Will redirect to login
  }

  // Fetch notifications
  const { data: notificacoes, isLoading: loadingNotificacoes } = useQuery<Notificacao[]>({
    queryKey: ["/api/responsavel/notificacoes"],
  });

  // Fetch available events
  const { data: eventos, isLoading: loadingEventos } = useQuery<EventoWithFilial[]>({
    queryKey: ["/api/eventos/disponiveis"],
  });

  // Fetch available uniforms
  const { data: uniformes, isLoading: loadingUniformes } = useQuery<Uniforme[]>({
    queryKey: ["/api/uniformes/disponiveis"],
  });

  const handleLogout = () => {
    localStorage.removeItem("responsavelToken");
    window.location.href = "/responsavel/login";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Em Dia
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Atrasado
      </Badge>
    );
  };

  if (loadingResponsavel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const notificacoesNaoLidas = notificacoes?.filter(n => !n.lida).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Portal do Responsável</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                {responsavel?.nome}
              </div>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("notificacoes")}
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  {notificacoesNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificacoesNaoLidas}
                    </span>
                  )}
                </Button>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="alunos">Meus Filhos</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="uniformes">Uniformes</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{responsavel?.alunos?.length || 0}</p>
                      <p className="text-gray-600">Filhos Matriculados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Bell className="w-8 h-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{notificacoesNaoLidas}</p>
                      <p className="text-gray-600">Notificações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{eventos?.length || 0}</p>
                      <p className="text-gray-600">Eventos Disponíveis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notificações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!loadingNotificacoes && notificacoes?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma notificação</p>
                ) : (
                  <div className="space-y-3">
                    {notificacoes?.slice(0, 5).map((notificacao) => (
                      <Alert key={notificacao.id} className={!notificacao.lida ? "border-orange-200 bg-orange-50" : ""}>
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{notificacao.titulo}</p>
                              <p className="text-sm text-gray-600">{notificacao.mensagem}</p>
                            </div>
                            {!notificacao.lida && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Nova
                              </Badge>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Children Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Status dos Filhos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {responsavel?.alunos?.map((aluno) => (
                    <div key={aluno.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{aluno.nome}</h3>
                        {getStatusBadge(aluno.statusPagamento?.emDia || false)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Unidade: {aluno.filial?.nome || "Não definida"}
                      </p>
                      {aluno.statusPagamento?.ultimoPagamento && (
                        <p className="text-sm text-gray-600">
                          Último pagamento: {aluno.statusPagamento.ultimoPagamento}
                        </p>
                      )}
                      {aluno.statusPagamento?.diasAtraso && (
                        <p className="text-sm text-red-600">
                          Atraso: {aluno.statusPagamento.diasAtraso} dias
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="alunos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Filhos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {responsavel?.alunos?.map((aluno) => (
                    <div key={aluno.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold">{aluno.nome}</h3>
                        {getStatusBadge(aluno.statusPagamento?.emDia || false)}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p><strong>Email:</strong> {aluno.email || "Não informado"}</p>
                        <p><strong>Telefone:</strong> {aluno.telefone || "Não informado"}</p>
                        <p><strong>Unidade:</strong> {aluno.filial?.nome || "Não definida"}</p>
                        <p><strong>Data de Nascimento:</strong> {aluno.dataNascimento || "Não informado"}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Extrato de Pagamentos
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="pagamentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Gerenciar Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Acompanhe e realize os pagamentos das mensalidades dos seus filhos.
                </p>
                
                <div className="space-y-4">
                  {responsavel?.alunos?.map((aluno) => (
                    <div key={aluno.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{aluno.nome}</h3>
                          <p className="text-sm text-gray-600">
                            Mensalidade: R$ 150,00
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(aluno.statusPagamento?.emDia || false)}
                          <Button 
                            size="sm" 
                            className={aluno.statusPagamento?.emDia ? 
                              "bg-gray-500 hover:bg-gray-600" : 
                              "bg-green-600 hover:bg-green-700"
                            }
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            {aluno.statusPagamento?.emDia ? "Pago" : "Pagar"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="eventos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Eventos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEventos ? (
                  <p>Carregando eventos...</p>
                ) : eventos?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum evento disponível no momento</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {eventos?.map((evento) => (
                      <div key={evento.id} className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">{evento.nome}</h3>
                        <p className="text-gray-600 mb-4">{evento.descricao}</p>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <p><strong>Data:</strong> {evento.dataEvento}</p>
                          <p><strong>Horário:</strong> {evento.horaInicio} - {evento.horaFim}</p>
                          <p><strong>Local:</strong> {evento.local}</p>
                          <p><strong>Preço:</strong> {formatCurrency(parseFloat(evento.preco || "0"))}</p>
                        </div>

                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Inscrever Filho
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Uniforms Tab */}
          <TabsContent value="uniformes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Loja de Uniformes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUniformes ? (
                  <p>Carregando uniformes...</p>
                ) : uniformes?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum uniforme disponível no momento</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {uniformes?.map((uniforme) => (
                      <div key={uniforme.id} className="border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2">{uniforme.nome}</h3>
                        <p className="text-gray-600 mb-2">{uniforme.descricao}</p>
                        <p className="text-sm text-gray-500 mb-2">Categoria: {uniforme.categoria}</p>
                        
                        <div className="mb-4">
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(parseFloat(uniforme.preco))}
                          </p>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm"><strong>Tamanhos:</strong> {JSON.parse(uniforme.tamanhos).join(", ")}</p>
                          <p className="text-sm"><strong>Cores:</strong> {JSON.parse(uniforme.cores).join(", ")}</p>
                          <p className="text-sm"><strong>Estoque:</strong> {uniforme.estoque} unidades</p>
                        </div>

                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={uniforme.estoque === 0}
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          {uniforme.estoque === 0 ? "Esgotado" : "Comprar"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}