import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResponsavel, logoutResponsavel } from "@/hooks/useResponsavel";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AlunoWithFilial, InsertAluno, Filial } from "@shared/schema";
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

// Componente de formulário de aluno para responsáveis
interface AlunoFormResponsavelProps {
  aluno: AlunoWithFilial | null;
  onSuccess: () => void;
  filiais: Filial[];
  responsavelId?: number;
  createMutation: any;
  updateMutation: any;
}

function AlunoFormResponsavel({ 
  aluno, 
  onSuccess, 
  filiais, 
  responsavelId,
  createMutation,
  updateMutation 
}: AlunoFormResponsavelProps) {
  const [formData, setFormData] = useState({
    nome: aluno?.nome || '',
    cpf: aluno?.cpf || '',
    email: aluno?.email || '',
    telefone: aluno?.telefone || '',
    endereco: aluno?.endereco || '',
    dataNascimento: aluno?.dataNascimento || '',
    fotoUrl: aluno?.fotoUrl || '',
    filialId: aluno?.filialId || '',
    responsavelId: responsavelId || aluno?.responsavelId,
    ativo: aluno?.ativo ?? true,
    dataMatricula: aluno?.dataMatricula || new Date().toISOString().split('T')[0]
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useState<HTMLVideoElement | null>(null);
  const canvasRef = useState<HTMLCanvasElement | null>(null);
  const fileInputRef = useState<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para iniciar captura de foto
  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCapturing(true);
      if (videoRef[0]) {
        videoRef[0].srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera.",
        variant: "destructive",
      });
    }
  };

  // Função para capturar foto
  const capturePhoto = () => {
    if (videoRef[0] && canvasRef[0]) {
      const canvas = canvasRef[0];
      const video = videoRef[0];
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      setFormData(prev => ({ ...prev, fotoUrl: dataURL }));
      stopCapture();
      toast({
        title: "Sucesso",
        description: "Foto capturada com sucesso!",
      });
    }
  };

  // Função para parar captura
  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  // Função para processar arquivo de imagem
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, fotoUrl: result }));
        toast({
          title: "Sucesso",
          description: "Imagem anexada com sucesso!",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para abrir seletor de arquivos
  const selectFile = () => {
    fileInputRef[0]?.click();
  };

  // Função para remover foto
  const removePhoto = () => {
    setFormData(prev => ({ ...prev, fotoUrl: '' }));
  };

  // Função para submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.filialId) {
      toast({
        title: "Erro",
        description: "Selecione uma unidade.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (aluno) {
        await updateMutation.mutateAsync({ id: aluno.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar aluno.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campo Nome */}
      <div>
        <Label htmlFor="nome">Nome Completo *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Nome completo do aluno"
          required
        />
      </div>

      {/* Campo CPF */}
      <div>
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          value={formData.cpf}
          onChange={(e) => {
            const formatted = formatCPF(e.target.value);
            if (formatted.length <= 14) {
              setFormData(prev => ({ ...prev, cpf: formatted }));
            }
          }}
          placeholder="000.000.000-00"
          maxLength={14}
        />
      </div>

      {/* Campos Email e Telefone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email do Aluno</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@exemplo.com"
          />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone do Aluno</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      {/* Campo Endereço */}
      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          value={formData.endereco}
          onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
          placeholder="Endereço completo"
        />
      </div>

      {/* Campos Data de Nascimento e Unidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
          <Input
            id="dataNascimento"
            type="date"
            value={formData.dataNascimento}
            onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="filialId">Unidade *</Label>
          <Select value={formData.filialId.toString()} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, filialId: parseInt(value) }))
          }>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              {filiais.map((filial) => (
                <SelectItem key={filial.id} value={filial.id.toString()}>
                  {filial.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campo Data de Matrícula */}
      <div>
        <Label htmlFor="dataMatricula">Data de Matrícula</Label>
        <Input
          id="dataMatricula"
          type="date"
          value={formData.dataMatricula}
          onChange={(e) => setFormData(prev => ({ ...prev, dataMatricula: e.target.value }))}
        />
      </div>

      {/* Seção de Foto */}
      <div>
        <Label>Foto do Aluno</Label>
        {isCapturing ? (
          <div className="space-y-3">
            <video
              ref={(el) => { videoRef[0] = el; }}
              autoPlay
              className="w-full max-w-md rounded-lg"
            />
            <canvas ref={(el) => { canvasRef[0] = el; }} className="hidden" />
            <div className="flex gap-2">
              <Button type="button" onClick={capturePhoto}>
                Capturar Foto
              </Button>
              <Button type="button" variant="outline" onClick={stopCapture}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={selectFile}
                className="flex items-center justify-center space-x-2 flex-1 h-12"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Anexar Imagem</span>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={startCapture}
                className="flex items-center justify-center space-x-2 flex-1 h-12"
              >
                <Camera className="w-5 h-5" />
                <span>Tirar Foto</span>
              </Button>
            </div>
            
            <input
              ref={(el) => { fileInputRef[0] = el; }}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Preview da foto */}
        {formData.fotoUrl && (
          <div className="flex items-center space-x-3 p-3 border rounded-lg mt-3">
            <img 
              src={formData.fotoUrl} 
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Foto do aluno</p>
              <p className="text-xs text-gray-500">
                {formData.fotoUrl.includes('canvas') || formData.fotoUrl.includes('video')
                  ? 'Foto capturada pela câmera'
                  : 'Imagem anexada do dispositivo'
                }
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removePhoto}
            >
              Remover
            </Button>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {aluno ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}

export default function ResponsavelPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAlunoForm, setShowAlunoForm] = useState(false);
  const [editingAluno, setEditingAluno] = useState<AlunoWithFilial | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
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