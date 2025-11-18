import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResponsavel, logoutResponsavel } from "@/hooks/useResponsavel";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Bell, 
  User, 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  LogOut,
  AlertTriangle,
  CheckCircle,
  Users,
  Edit,
  Eye,
  Loader2
} from "lucide-react";
import type { 
  ResponsavelWithAlunos, 
  Notificacao, 
  EventoWithFilial, 
  Uniforme,
  AlunoWithFilial,
  Pagamento,
  TurmaWithProfessor
} from "@shared/schema";

export default function ResponsavelPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingAluno, setEditingAluno] = useState<AlunoWithFilial | null>(null);
  const [selectedEventoId, setSelectedEventoId] = useState<number | null>(null);
  const [selectedUniforme, setSelectedUniforme] = useState<Uniforme | null>(null);
  const [selectedAlunoForAction, setSelectedAlunoForAction] = useState<number | null>(null);
  
  const { responsavel, isLoading, isAuthenticated } = useResponsavel();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/responsavel/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

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

  if (!responsavel) {
    return null;
  }

  return (
    <ResponsavelPortalContent
      responsavel={responsavel}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      editingAluno={editingAluno}
      setEditingAluno={setEditingAluno}
      selectedEventoId={selectedEventoId}
      setSelectedEventoId={setSelectedEventoId}
      selectedUniforme={selectedUniforme}
      setSelectedUniforme={setSelectedUniforme}
      selectedAlunoForAction={selectedAlunoForAction}
      setSelectedAlunoForAction={setSelectedAlunoForAction}
    />
  );
}

function ResponsavelPortalContent({
  responsavel,
  activeTab,
  setActiveTab,
  editingAluno,
  setEditingAluno,
  selectedEventoId,
  setSelectedEventoId,
  selectedUniforme,
  setSelectedUniforme,
  selectedAlunoForAction,
  setSelectedAlunoForAction,
}: {
  responsavel: ResponsavelWithAlunos;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  editingAluno: AlunoWithFilial | null;
  setEditingAluno: (aluno: AlunoWithFilial | null) => void;
  selectedEventoId: number | null;
  setSelectedEventoId: (id: number | null) => void;
  selectedUniforme: Uniforme | null;
  setSelectedUniforme: (uniforme: Uniforme | null) => void;
  selectedAlunoForAction: number | null;
  setSelectedAlunoForAction: (id: number | null) => void;
}) {
  const { toast } = useToast();

  // Fetch notifications
  const { data: notificacoes } = useQuery<Notificacao[]>({
    queryKey: ["/api/portal/notificacoes"],
  });

  // Fetch available events
  const { data: eventos } = useQuery<EventoWithFilial[]>({
    queryKey: ["/api/portal/eventos"],
  });

  // Fetch available uniforms
  const { data: uniformes } = useQuery<Uniforme[]>({
    queryKey: ["/api/uniformes/disponiveis"],
  });

  const handleLogout = async () => {
    try {
      await logoutResponsavel();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      window.location.href = "/responsavel/login";
    }
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
                  data-testid="button-notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notificacoesNaoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificacoesNaoLidas}
                    </span>
                  )}
                </Button>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
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
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold" data-testid="text-total-children">{responsavel?.alunos?.length || 0}</p>
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
                      <p className="text-2xl font-bold" data-testid="text-notifications">{notificacoesNaoLidas}</p>
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
                      <p className="text-2xl font-bold" data-testid="text-events">{eventos?.length || 0}</p>
                      <p className="text-gray-600">Eventos Disponíveis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                    <div key={aluno.id} className="border rounded-lg p-4" data-testid={`card-student-${aluno.id}`}>
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
                    <StudentCard
                      key={aluno.id}
                      aluno={aluno}
                      onEdit={() => setEditingAluno(aluno)}
                    />
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
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responsavel?.alunos?.map((aluno) => (
                    <PaymentHistory key={aluno.id} aluno={aluno} />
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
                {!eventos || eventos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum evento disponível no momento</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {eventos.map((evento) => (
                      <EventoCard
                        key={evento.id}
                        evento={evento}
                        alunos={responsavel.alunos || []}
                        onEnroll={(eventoId, alunoId) => {
                          setSelectedEventoId(eventoId);
                          setSelectedAlunoForAction(alunoId);
                        }}
                      />
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
                {!uniformes || uniformes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum uniforme disponível no momento</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {uniformes.map((uniforme) => (
                      <UniformeCard
                        key={uniforme.id}
                        uniforme={uniforme}
                        alunos={responsavel.alunos || []}
                        onPurchase={(uniformeData, alunoId) => {
                          setSelectedUniforme(uniformeData);
                          setSelectedAlunoForAction(alunoId);
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Student Dialog */}
      {editingAluno && (
        <EditAlunoDialog
          aluno={editingAluno}
          onClose={() => setEditingAluno(null)}
        />
      )}

      {/* Enroll in Event Dialog */}
      {selectedEventoId && selectedAlunoForAction && (
        <EnrollEventDialog
          eventoId={selectedEventoId}
          alunoId={selectedAlunoForAction}
          onClose={() => {
            setSelectedEventoId(null);
            setSelectedAlunoForAction(null);
          }}
        />
      )}

      {/* Purchase Uniform Dialog */}
      {selectedUniforme && selectedAlunoForAction && (
        <PurchaseUniformDialog
          uniforme={selectedUniforme}
          alunoId={selectedAlunoForAction}
          onClose={() => {
            setSelectedUniforme(null);
            setSelectedAlunoForAction(null);
          }}
        />
      )}
    </div>
  );
}

// Student Card Component
function StudentCard({ aluno, onEdit }: { aluno: AlunoWithFilial; onEdit: () => void }) {
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

  return (
    <div className="border rounded-lg p-6" data-testid={`card-student-details-${aluno.id}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{aluno.nome}</h3>
        {getStatusBadge(aluno.statusPagamento?.emDia || false)}
      </div>
      
      <div className="space-y-2 text-sm">
        <p><strong>Email:</strong> {aluno.email || "Não informado"}</p>
        <p><strong>Telefone:</strong> {aluno.telefone || "Não informado"}</p>
        <p><strong>Unidade:</strong> {aluno.filial?.nome || "Não definida"}</p>
        <p><strong>Data de Nascimento:</strong> {aluno.dataNascimento || "Não informado"}</p>
        <p><strong>Endereço:</strong> {aluno.endereco || "Não informado"}</p>
      </div>

      <div className="mt-4 pt-4 border-t flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={onEdit}
          data-testid={`button-edit-student-${aluno.id}`}
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar Dados
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          data-testid={`button-view-classes-${aluno.id}`}
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver Turmas
        </Button>
      </div>
    </div>
  );
}

// Payment History Component
function PaymentHistory({ aluno }: { aluno: AlunoWithFilial }) {
  const { data: pagamentos, isLoading } = useQuery<Pagamento[]>({
    queryKey: ["/api/portal/alunos", aluno.id, "pagamentos"],
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  return (
    <div className="border rounded-lg p-4" data-testid={`card-payment-history-${aluno.id}`}>
      <h3 className="font-medium mb-3">{aluno.nome}</h3>
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : !pagamentos || pagamentos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum pagamento registrado</p>
      ) : (
        <div className="space-y-2">
          {pagamentos.slice(0, 5).map((pagamento) => (
            <div key={pagamento.id} className="flex justify-between items-center text-sm border-b pb-2">
              <div>
                <p className="font-medium">{pagamento.mesReferencia}</p>
                <p className="text-gray-600">{pagamento.formaPagamento}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(pagamento.valor)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(pagamento.createdAt!).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Event Card Component
function EventoCard({ 
  evento, 
  alunos, 
  onEnroll 
}: { 
  evento: EventoWithFilial; 
  alunos: AlunoWithFilial[]; 
  onEnroll: (eventoId: number, alunoId: number) => void;
}) {
  const [selectedAluno, setSelectedAluno] = useState<number | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="border rounded-lg p-6" data-testid={`card-event-${evento.id}`}>
      <h3 className="text-lg font-semibold mb-2">{evento.nome}</h3>
      <p className="text-gray-600 mb-4">{evento.descricao}</p>
      
      <div className="space-y-2 text-sm mb-4">
        <p><strong>Data:</strong> {evento.dataEvento}</p>
        <p><strong>Horário:</strong> {evento.horaInicio} - {evento.horaFim}</p>
        <p><strong>Local:</strong> {evento.local}</p>
        <p><strong>Preço:</strong> {formatCurrency(parseFloat(evento.preco || "0"))}</p>
      </div>

      <div className="space-y-2">
        <Label>Selecione o filho</Label>
        <Select 
          value={selectedAluno?.toString()} 
          onValueChange={(value) => setSelectedAluno(parseInt(value))}
        >
          <SelectTrigger data-testid={`select-student-event-${evento.id}`}>
            <SelectValue placeholder="Escolha um filho" />
          </SelectTrigger>
          <SelectContent>
            {alunos.map((aluno) => (
              <SelectItem key={aluno.id} value={aluno.id.toString()}>
                {aluno.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={!selectedAluno}
          onClick={() => selectedAluno && onEnroll(evento.id, selectedAluno)}
          data-testid={`button-enroll-event-${evento.id}`}
        >
          Inscrever Filho
        </Button>
      </div>
    </div>
  );
}

// Uniform Card Component
function UniformeCard({
  uniforme,
  alunos,
  onPurchase
}: {
  uniforme: Uniforme;
  alunos: AlunoWithFilial[];
  onPurchase: (uniforme: Uniforme, alunoId: number) => void;
}) {
  const [selectedAluno, setSelectedAluno] = useState<number | null>(null);

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  return (
    <div className="border rounded-lg p-6" data-testid={`card-uniform-${uniforme.id}`}>
      <h3 className="text-lg font-semibold mb-2">{uniforme.nome}</h3>
      <p className="text-gray-600 mb-2">{uniforme.descricao}</p>
      <p className="text-sm text-gray-500 mb-2">Categoria: {uniforme.categoria}</p>
      
      <div className="mb-4">
        <p className="text-xl font-bold text-green-600">
          {formatCurrency(uniforme.preco)}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm"><strong>Tamanhos:</strong> {JSON.parse(uniforme.tamanhos).join(", ")}</p>
        <p className="text-sm"><strong>Cores:</strong> {JSON.parse(uniforme.cores).join(", ")}</p>
        <p className="text-sm"><strong>Estoque:</strong> {uniforme.estoque} unidades</p>
      </div>

      <div className="space-y-2">
        <Label>Selecione o filho</Label>
        <Select 
          value={selectedAluno?.toString()} 
          onValueChange={(value) => setSelectedAluno(parseInt(value))}
        >
          <SelectTrigger data-testid={`select-student-uniform-${uniforme.id}`}>
            <SelectValue placeholder="Escolha um filho" />
          </SelectTrigger>
          <SelectContent>
            {alunos.map((aluno) => (
              <SelectItem key={aluno.id} value={aluno.id.toString()}>
                {aluno.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={uniforme.estoque === 0 || !selectedAluno}
          onClick={() => selectedAluno && onPurchase(uniforme, selectedAluno)}
          data-testid={`button-buy-uniform-${uniforme.id}`}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          {uniforme.estoque === 0 ? "Esgotado" : "Comprar"}
        </Button>
      </div>
    </div>
  );
}

// Edit Student Dialog
function EditAlunoDialog({ aluno, onClose }: { aluno: AlunoWithFilial; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: aluno.email || "",
    telefone: aluno.telefone || "",
    endereco: aluno.endereco || "",
    bairro: aluno.bairro || "",
    cep: aluno.cep || "",
    cidade: aluno.cidade || "",
    estado: aluno.estado || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("PATCH", `/api/portal/alunos/${aluno.id}/contact`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/responsaveis/me"] });
      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-edit-student">
        <DialogHeader>
          <DialogTitle>Editar Dados de {aluno.nome}</DialogTitle>
          <DialogDescription>
            Atualize as informações de contato e endereço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="input-email"
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              data-testid="input-telefone"
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              data-testid="input-endereco"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                data-testid="input-bairro"
              />
            </div>
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                data-testid="input-cep"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                data-testid="input-cidade"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input
                id="estado"
                maxLength={2}
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                data-testid="input-estado"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-edit">
            Cancelar
          </Button>
          <Button 
            onClick={() => updateMutation.mutate(formData)}
            disabled={updateMutation.isPending}
            data-testid="button-save-edit"
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Enroll Event Dialog
function EnrollEventDialog({ 
  eventoId, 
  alunoId, 
  onClose 
}: { 
  eventoId: number; 
  alunoId: number; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [observacoes, setObservacoes] = useState("");

  const enrollMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/portal/eventos/${eventoId}/inscricoes`, { alunoId, observacoes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/eventos"] });
      toast({
        title: "Sucesso",
        description: "Filho inscrito no evento com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao inscrever no evento",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-enroll-event">
        <DialogHeader>
          <DialogTitle>Confirmar Inscrição</DialogTitle>
          <DialogDescription>
            Confirme a inscrição do seu filho neste evento
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="observacoes">Observações (opcional)</Label>
          <Input
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Necessidades especiais, alergias..."
            data-testid="input-observacoes"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-enroll">
            Cancelar
          </Button>
          <Button 
            onClick={() => enrollMutation.mutate()}
            disabled={enrollMutation.isPending}
            data-testid="button-confirm-enroll"
          >
            {enrollMutation.isPending ? "Inscrevendo..." : "Confirmar Inscrição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Purchase Uniform Dialog
function PurchaseUniformDialog({
  uniforme,
  alunoId,
  onClose
}: {
  uniforme: Uniforme;
  alunoId: number;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  const tamanhos = JSON.parse(uniforme.tamanhos);
  const cores = JSON.parse(uniforme.cores);

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/portal/uniformes/${uniforme.id}/compras`, { alunoId, tamanho, cor, quantidade });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uniformes/disponiveis"] });
      toast({
        title: "Sucesso",
        description: "Compra realizada com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao realizar compra",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value) * quantidade);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-purchase-uniform">
        <DialogHeader>
          <DialogTitle>Comprar {uniforme.nome}</DialogTitle>
          <DialogDescription>
            Selecione tamanho, cor e quantidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tamanho</Label>
            <Select value={tamanho} onValueChange={setTamanho}>
              <SelectTrigger data-testid="select-size">
                <SelectValue placeholder="Selecione o tamanho" />
              </SelectTrigger>
              <SelectContent>
                {tamanhos.map((t: string) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Cor</Label>
            <Select value={cor} onValueChange={setCor}>
              <SelectTrigger data-testid="select-color">
                <SelectValue placeholder="Selecione a cor" />
              </SelectTrigger>
              <SelectContent>
                {cores.map((c: string) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              max={uniforme.estoque || 1}
              value={quantidade}
              onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
              data-testid="input-quantity"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-2xl font-bold text-green-600" data-testid="text-total">
                {formatCurrency(uniforme.preco)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-purchase">
            Cancelar
          </Button>
          <Button 
            onClick={() => purchaseMutation.mutate()}
            disabled={!tamanho || !cor || purchaseMutation.isPending}
            data-testid="button-confirm-purchase"
          >
            {purchaseMutation.isPending ? "Comprando..." : "Confirmar Compra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
