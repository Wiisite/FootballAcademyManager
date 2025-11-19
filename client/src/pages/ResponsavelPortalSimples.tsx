import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useResponsavel, logoutResponsavel } from "@/hooks/useResponsavel";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AlunoWithFilial, InsertAluno, Filial } from "@shared/schema";
import AlunoFormResponsavel from "@/components/forms/AlunoFormResponsavel";
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
  Loader2,
  Plus,
  Edit,
  Download,
  Camera,
  ImageIcon
} from "lucide-react";

export default function ResponsavelPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAlunoForm, setShowAlunoForm] = useState(false);
  const [editingAluno, setEditingAluno] = useState<AlunoWithFilial | null>(null);
  const { responsavel, isLoading, isAuthenticated } = useResponsavel();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const { data: alunos, isLoading: alunosLoading } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos"],
  });

  // Mutations
  const createAlunoMutation = useMutation({
    mutationFn: async (data: InsertAluno) => {
      return await apiRequest("POST", "/api/alunos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/responsaveis/me"] });
      setShowAlunoForm(false);
      setEditingAluno(null);
      toast({
        title: "Sucesso",
        description: "Aluno cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar aluno",
        variant: "destructive",
      });
    },
  });

  const updateAlunoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAluno> }) => {
      return await apiRequest("PATCH", `/api/alunos/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/responsaveis/me"] });
      setShowAlunoForm(false);
      setEditingAluno(null);
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar aluno",
        variant: "destructive",
      });
    },
  });

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

  const handleLogout = async () => {
    await logoutResponsavel();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal dos Responsáveis</h1>
                <p className="text-sm text-gray-600">Bem-vindo, {responsavel.nome}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="alunos">Meus Filhos</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="uniformes">Uniformes</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Filhos Matriculados</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{responsavel.alunos?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pagamentos em Dia</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {responsavel.alunos?.filter(aluno => aluno.statusPagamento?.emDia).length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pagamentos Atrasados</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {responsavel.alunos?.filter(aluno => !aluno.statusPagamento?.emDia).length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notificações</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                </CardContent>
              </Card>
            </div>

            {/* Filhos Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seus Filhos</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {responsavel.alunos?.map((aluno: any) => (
                  <Card key={aluno.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          {aluno.fotoUrl ? (
                            <div className="relative group">
                              <img 
                                src={aluno.fotoUrl} 
                                alt={aluno.nome}
                                className="w-12 h-12 rounded-full object-cover cursor-pointer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = aluno.fotoUrl!;
                                  link.download = `foto-${aluno.nome.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                                <span className="text-white text-xs opacity-0 group-hover:opacity-100">⬇</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">Foto</span>
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-base">{aluno.nome}</CardTitle>
                            <p className="text-sm text-gray-600">
                              {aluno.filial?.nome || "Unidade não informada"}
                            </p>
                            {aluno.cpf && (
                              <p className="text-xs text-gray-500 font-mono">
                                CPF: {aluno.cpf}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={aluno.statusPagamento?.emDia ? "default" : "destructive"}
                        >
                          {aluno.statusPagamento?.emDia ? "Em dia" : "Atrasado"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <span className={aluno.ativo ? "text-green-600" : "text-red-600"}>
                            {aluno.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        {aluno.dataMatricula && (
                          <div className="flex justify-between text-sm">
                            <span>Data de matrícula:</span>
                            <span>{new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {aluno.statusPagamento?.ultimoPagamento && (
                          <div className="flex justify-between text-sm">
                            <span>Último pagamento:</span>
                            <span>{aluno.statusPagamento.ultimoPagamento}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alunos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Meus Filhos</h2>
              <Dialog open={showAlunoForm} onOpenChange={setShowAlunoForm}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingAluno(null);
                    setShowAlunoForm(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Filho
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAluno ? 'Editar Aluno' : 'Cadastrar Novo Filho'}
                    </DialogTitle>
                  </DialogHeader>
                  <AlunoFormResponsavel 
                    aluno={editingAluno} 
                    onSuccess={() => {
                      setShowAlunoForm(false);
                      setEditingAluno(null);
                    }}
                    filiais={filiais || []}
                    responsavelId={responsavel?.id}
                    createMutation={createAlunoMutation}
                    updateMutation={updateAlunoMutation}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {alunosLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Foto</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Matrícula</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunos?.filter(aluno => aluno.responsavelId === responsavel?.id).map((aluno) => (
                      <TableRow key={aluno.id}>
                        <TableCell>
                          {aluno.fotoUrl ? (
                            <div className="relative group">
                              <img 
                                src={aluno.fotoUrl} 
                                alt={aluno.nome}
                                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = aluno.fotoUrl!;
                                  link.download = `foto-${aluno.nome.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                                <Download className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{aluno.nome}</TableCell>
                        <TableCell>
                          {aluno.cpf ? (
                            <span className="font-mono text-sm">{aluno.cpf}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Não informado</span>
                          )}
                        </TableCell>
                        <TableCell>{aluno.email || '-'}</TableCell>
                        <TableCell>{aluno.telefone || '-'}</TableCell>
                        <TableCell>{aluno.filial?.nome || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={aluno.ativo ? "default" : "secondary"}>
                            {aluno.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {aluno.dataMatricula 
                            ? new Date(aluno.dataMatricula).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAluno(aluno);
                                setShowAlunoForm(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {alunos?.filter(aluno => aluno.responsavelId === responsavel?.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Nenhum filho cadastrado</h3>
                    <p className="text-sm">Clique em "Cadastrar Filho" para adicionar um novo aluno.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pagamentos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Situação dos Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responsavel.alunos?.map((aluno: any) => (
                    <div key={aluno.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{aluno.nome}</h4>
                          <p className="text-sm text-gray-600">{aluno.filial?.nome}</p>
                        </div>
                        <Badge 
                          variant={aluno.statusPagamento?.emDia ? "default" : "destructive"}
                        >
                          {aluno.statusPagamento?.emDia ? "Em dia" : "Atrasado"}
                        </Badge>
                      </div>
                      {!aluno.statusPagamento?.emDia && (
                        <Alert className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Mensalidade em atraso há {aluno.statusPagamento?.diasAtraso || 0} dias
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eventos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Eventos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Em breve você poderá visualizar e se inscrever em eventos e competições.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uniformes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Loja de Uniformes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Em breve você poderá comprar uniformes e equipamentos diretamente pelo portal.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}