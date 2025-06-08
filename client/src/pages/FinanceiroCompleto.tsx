import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  ShoppingBag, 
  Users,
  TrendingUp,
  TrendingDown,
  FileText,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { 
  Pagamento, 
  AlunoWithFilial, 
  Evento, 
  Uniforme, 
  CompraUniforme,
  InscricaoEvento,
  InsertPagamento,
  InsertEvento,
  InsertUniforme,
  InsertCompraUniforme,
  InsertInscricaoEvento
} from "@shared/schema";

export default function FinanceiroCompleto() {
  const [activeTab, setActiveTab] = useState("pagamentos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"pagamento" | "evento" | "uniforme" | "compra-uniforme" | "inscricao-evento">("pagamento");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form handlers
  const handleCreateUniforme = () => {
    const formData = {
      nome: (document.getElementById('nomeUniforme') as HTMLInputElement)?.value,
      categoria: 'camisa',
      descricao: (document.getElementById('descricaoUniforme') as HTMLTextAreaElement)?.value,
      preco: (document.getElementById('precoUniforme') as HTMLInputElement)?.value,
      tamanhos: (document.getElementById('tamanhos') as HTMLInputElement)?.value,
      cores: (document.getElementById('cores') as HTMLInputElement)?.value,
      estoque: parseInt((document.getElementById('estoque') as HTMLInputElement)?.value || '0'),
    };

    if (!formData.nome || !formData.preco || !formData.tamanhos || !formData.cores) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createUniformeMutation.mutate(formData as InsertUniforme);
  };

  const handleCreateEvento = () => {
    const formData = {
      nome: (document.getElementById('nomeEvento') as HTMLInputElement)?.value,
      descricao: (document.getElementById('descricaoEvento') as HTMLTextAreaElement)?.value,
      dataEvento: (document.getElementById('dataEvento') as HTMLInputElement)?.value,
      local: (document.getElementById('localEvento') as HTMLInputElement)?.value,
      preco: (document.getElementById('precoEvento') as HTMLInputElement)?.value,
      vagasMaximas: parseInt((document.getElementById('vagasEvento') as HTMLInputElement)?.value || '0'),
      horaInicio: (document.getElementById('horaInicio') as HTMLInputElement)?.value,
      filialId: 1,
    };

    if (!formData.nome || !formData.dataEvento || !formData.preco || !formData.vagasMaximas) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createEventoMutation.mutate(formData as InsertEvento);
  };

  // Queries
  const { data: pagamentos = [] } = useQuery<Pagamento[]>({
    queryKey: ["/api/pagamentos"],
  });

  const { data: alunos = [] } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos"],
  });

  const { data: eventos = [] } = useQuery<Evento[]>({
    queryKey: ["/api/eventos"],
  });

  const { data: uniformes = [] } = useQuery<Uniforme[]>({
    queryKey: ["/api/uniformes"],
  });

  const { data: comprasUniformes = [] } = useQuery<CompraUniforme[]>({
    queryKey: ["/api/compras-uniformes"],
  });

  const { data: inscricoesEventos = [] } = useQuery<InscricaoEvento[]>({
    queryKey: ["/api/inscricoes-eventos"],
  });

  const { data: pacotesTreino = [] } = useQuery({
    queryKey: ["/api/pacotes-treino"],
  });

  const { data: assinaturasPacotes = [] } = useQuery({
    queryKey: ["/api/assinaturas-pacotes"],
  });

  // Mutations
  const createPagamentoMutation = useMutation({
    mutationFn: async (data: InsertPagamento) => {
      return await apiRequest("POST", "/api/pagamentos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso!",
      });
    },
  });

  const createEventoMutation = useMutation({
    mutationFn: async (data: InsertEvento) => {
      return await apiRequest("POST", "/api/eventos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/eventos"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!",
      });
    },
  });

  const createUniformeMutation = useMutation({
    mutationFn: async (data: InsertUniforme) => {
      return await apiRequest("POST", "/api/uniformes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uniformes"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Uniforme adicionado com sucesso!",
      });
    },
  });

  const comprarUniformeMutation = useMutation({
    mutationFn: async (data: InsertCompraUniforme) => {
      return await apiRequest("POST", "/api/compras-uniformes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compras-uniformes"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Compra de uniforme registrada!",
      });
    },
  });

  const inscreverEventoMutation = useMutation({
    mutationFn: async (data: InsertInscricaoEvento) => {
      return await apiRequest("POST", "/api/inscricoes-eventos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inscricoes-eventos"] });
      setDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Inscrição em evento realizada!",
      });
    },
  });

  // Cálculos financeiros
  const totalPagamentos = pagamentos.reduce((sum, p) => sum + parseFloat(p.valor || "0"), 0);
  const totalUniformes = comprasUniformes.reduce((sum, c) => sum + parseFloat(c.preco || "0") * (c.quantidade || 1), 0);
  const totalEventos = inscricoesEventos.length * 50; // Valor médio por evento
  const receitaTotal = totalPagamentos + totalUniformes + totalEventos;

  const openDialog = (type: typeof dialogType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Área Financeira Completa</h1>
          <p className="text-muted-foreground">
            Gestão de pagamentos, uniformes e eventos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openDialog("pagamento")} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Pagamento
          </Button>
          <Button onClick={() => openDialog("evento")} variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Novo Evento
          </Button>
          <Button onClick={() => openDialog("uniforme")} variant="outline" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Novo Uniforme
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600 bg-green-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mensalidades</p>
                <p className="text-2xl font-bold">R$ {totalPagamentos.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-blue-600 bg-blue-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uniformes</p>
                <p className="text-2xl font-bold">R$ {totalUniformes.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600 bg-purple-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Eventos</p>
                <p className="text-2xl font-bold">R$ {totalEventos.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-emerald-600 bg-emerald-100 p-2 rounded-lg" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold">R$ {receitaTotal.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="uniformes">Uniformes</TabsTrigger>
          <TabsTrigger value="compras-uniformes">Compras</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
          <TabsTrigger value="pacotes">Pacotes de Treino</TabsTrigger>
        </TabsList>

        {/* Tab de Pagamentos */}
        <TabsContent value="pagamentos" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar pagamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => openDialog("pagamento")} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Pagamento
            </Button>
          </div>

          <div className="grid gap-4">
            {pagamentos.map((pagamento) => {
              const aluno = alunos.find(a => a.id === pagamento.alunoId);
              return (
                <Card key={pagamento.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{aluno?.nome || "Aluno não encontrado"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {pagamento.mesReferencia} • {pagamento.formaPagamento}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          R$ {parseFloat(pagamento.valor || "0").toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pagamento.dataPagamento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab de Uniformes */}
        <TabsContent value="uniformes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Catálogo de Uniformes</h2>
            <Button onClick={() => openDialog("uniforme")} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Uniforme
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniformes.map((uniforme) => (
              <Card key={uniforme.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{uniforme.nome}</h3>
                    <p className="text-sm text-muted-foreground">{uniforme.descricao}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{uniforme.tamanho}</Badge>
                      <p className="text-lg font-bold text-blue-600">
                        R$ {parseFloat(uniforme.preco || "0").toFixed(2)}
                      </p>
                    </div>
                    <Button 
                      onClick={() => openDialog("compra-uniforme")} 
                      className="w-full"
                      size="sm"
                    >
                      Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab de Compras de Uniformes */}
        <TabsContent value="compras-uniformes" className="space-y-4">
          <h2 className="text-xl font-semibold">Histórico de Compras</h2>
          <div className="grid gap-4">
            {comprasUniformes.map((compra) => {
              const aluno = alunos.find(a => a.id === compra.alunoId);
              const uniforme = uniformes.find(u => u.id === compra.uniformeId);
              return (
                <Card key={compra.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{aluno?.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {uniforme?.nome} • Qtd: {compra.quantidade}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          R$ {(parseFloat(compra.preco || "0") * (compra.quantidade || 1)).toFixed(2)}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant={compra.statusPagamento === "pago" ? "default" : "secondary"}>
                            {compra.statusPagamento}
                          </Badge>
                          <Badge variant={compra.statusEntrega === "entregue" ? "default" : "secondary"}>
                            {compra.statusEntrega}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab de Eventos */}
        <TabsContent value="eventos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Eventos Disponíveis</h2>
            <Button onClick={() => openDialog("evento")} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar Evento
            </Button>
          </div>

          <div className="grid gap-4">
            {eventos.map((evento) => (
              <Card key={evento.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{evento.nome}</h3>
                      <p className="text-sm text-muted-foreground">{evento.descricao}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(evento.dataEvento).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">
                            {evento.capacidadeMaxima} vagas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600">
                        R$ {parseFloat(evento.preco || "0").toFixed(2)}
                      </p>
                      <Button 
                        onClick={() => openDialog("inscricao-evento")} 
                        size="sm"
                        className="mt-2"
                      >
                        Inscrever Aluno
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab de Inscrições */}
        <TabsContent value="inscricoes" className="space-y-4">
          <h2 className="text-xl font-semibold">Inscrições em Eventos</h2>
          <div className="grid gap-4">
            {inscricoesEventos.map((inscricao) => {
              const aluno = alunos.find(a => a.id === inscricao.alunoId);
              const evento = eventos.find(e => e.id === inscricao.eventoId);
              return (
                <Card key={inscricao.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{aluno?.nome}</h3>
                        <p className="text-sm text-muted-foreground">{evento?.nome}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={inscricao.statusPagamento === "pago" ? "default" : "secondary"}>
                          {inscricao.statusPagamento}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(inscricao.dataInscricao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab de Pacotes de Treino */}
        <TabsContent value="pacotes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pacotes de Treino Disponíveis</h3>
          </div>

          {/* Pacotes Disponíveis */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pacotesTreino.map((pacote: any) => (
              <Card key={pacote.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{pacote.nome}</h4>
                    <Badge variant="secondary">
                      {pacote.frequenciaSemanal}x/semana
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">{pacote.descricao}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        R$ {parseFloat(pacote.valor || "0").toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {pacote.duracao} dias
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2 text-blue-500" />
                      <span>Frequência: {pacote.frequenciaSemanal}x por semana</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                      <span>Duração: {pacote.duracao} dias</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    onClick={() => {
                      const formData = {
                        alunoId: 1,
                        pacoteId: pacote.id,
                        dataInicio: new Date().toISOString().split('T')[0],
                        dataFim: new Date(Date.now() + pacote.duracao * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'ativo',
                        valorPago: pacote.valor,
                        formaPagamento: 'pix'
                      };
                      
                      const handleContratarPacote = async () => {
                        try {
                          await apiRequest("POST", "/api/assinaturas-pacotes", formData);
                          toast({
                            title: "Sucesso",
                            description: `Pacote ${pacote.nome} contratado com sucesso!`,
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/assinaturas-pacotes"] });
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Erro ao contratar pacote",
                            variant: "destructive",
                          });
                        }
                      };
                      
                      handleContratarPacote();
                    }}
                  >
                    Contratar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Assinaturas Ativas */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Assinaturas Ativas</h3>
            <div className="grid gap-4">
              {assinaturasPacotes.map((assinatura: any) => (
                <Card key={assinatura.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{assinatura.aluno?.nome || "Aluno não encontrado"}</h4>
                        <p className="text-sm text-muted-foreground">
                          {assinatura.pacote?.nome || "Pacote não encontrado"} • {assinatura.pacote?.frequenciaSemanal}x/semana
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(assinatura.dataInicio).toLocaleDateString('pt-BR')} - {new Date(assinatura.dataFim).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          R$ {parseFloat(assinatura.valorPago || "0").toFixed(2)}
                        </p>
                        <Badge variant={assinatura.status === 'ativo' ? 'default' : 'secondary'}>
                          {assinatura.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {assinaturasPacotes.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma assinatura de pacote encontrada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs para criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "pagamento" && "Novo Pagamento"}
              {dialogType === "evento" && "Criar Evento"}
              {dialogType === "uniforme" && "Adicionar Uniforme"}
              {dialogType === "compra-uniforme" && "Comprar Uniforme"}
              {dialogType === "inscricao-evento" && "Inscrever em Evento"}
            </DialogTitle>
          </DialogHeader>
          
          {/* Form de Pagamento */}
          {dialogType === "pagamento" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aluno">Aluno</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id.toString()}>
                          {aluno.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input id="valor" type="number" step="0.01" placeholder="0,00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mesReferencia">Mês de Referência</Label>
                  <Input id="mesReferencia" placeholder="Ex: Janeiro/2024" />
                </div>
                <div>
                  <Label htmlFor="dataPagamento">Data do Pagamento</Label>
                  <Input id="dataPagamento" type="date" />
                </div>
              </div>
              <div>
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" placeholder="Observações adicionais..." />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button className="flex-1">
                  Registrar Pagamento
                </Button>
              </div>
            </div>
          )}

          {/* Form de Evento */}
          {dialogType === "evento" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeEvento">Nome do Evento</Label>
                  <Input id="nomeEvento" placeholder="Ex: Torneio de Futebol" />
                </div>
                <div>
                  <Label htmlFor="dataEvento">Data do Evento</Label>
                  <Input id="dataEvento" type="date" />
                </div>
              </div>
              <div>
                <Label htmlFor="descricaoEvento">Descrição</Label>
                <Textarea id="descricaoEvento" placeholder="Descrição detalhada do evento..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="localEvento">Local</Label>
                  <Input id="localEvento" placeholder="Local do evento" />
                </div>
                <div>
                  <Label htmlFor="precoEvento">Preço (R$)</Label>
                  <Input id="precoEvento" type="number" step="0.01" placeholder="0,00" />
                </div>
                <div>
                  <Label htmlFor="vagasEvento">Vagas Máximas</Label>
                  <Input id="vagasEvento" type="number" placeholder="50" />
                </div>
              </div>
              <div>
                <Label htmlFor="horaInicio">Hora de Início</Label>
                <Input id="horaInicio" type="time" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateEvento}
                  disabled={createEventoMutation.isPending}
                  className="flex-1"
                >
                  {createEventoMutation.isPending ? "Criando..." : "Criar Evento"}
                </Button>
              </div>
            </div>
          )}

          {/* Form de Uniforme */}
          {dialogType === "uniforme" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeUniforme">Nome do Item</Label>
                  <Input id="nomeUniforme" placeholder="Ex: Camisa Oficial" />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camisa">Camisa</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="meias">Meias</SelectItem>
                      <SelectItem value="chuteira">Chuteira</SelectItem>
                      <SelectItem value="acessorios">Acessórios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="descricaoUniforme">Descrição</Label>
                <Textarea id="descricaoUniforme" placeholder="Descrição detalhada do item..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="precoUniforme">Preço (R$)</Label>
                  <Input id="precoUniforme" type="number" step="0.01" placeholder="0,00" />
                </div>
                <div>
                  <Label htmlFor="tamanhos">Tamanhos Disponíveis</Label>
                  <Input id="tamanhos" placeholder="P, M, G, GG" />
                </div>
                <div>
                  <Label htmlFor="cores">Cores Disponíveis</Label>
                  <Input id="cores" placeholder="Azul, Branco, Vermelho" />
                </div>
              </div>
              <div>
                <Label htmlFor="estoque">Quantidade em Estoque</Label>
                <Input id="estoque" type="number" placeholder="100" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateUniforme}
                  disabled={createUniformeMutation.isPending}
                  className="flex-1"
                >
                  {createUniformeMutation.isPending ? "Criando..." : "Adicionar Uniforme"}
                </Button>
              </div>
            </div>
          )}

          {/* Form de Compra de Uniforme */}
          {dialogType === "compra-uniforme" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alunoCompra">Aluno</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id.toString()}>
                          {aluno.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="uniformeCompra">Uniforme</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o uniforme" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniformes.map((uniforme) => (
                        <SelectItem key={uniforme.id} value={uniforme.id.toString()}>
                          {uniforme.nome} - R$ {parseFloat(uniforme.preco || "0").toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input id="quantidade" type="number" defaultValue="1" min="1" />
                </div>
                <div>
                  <Label htmlFor="tamanhoEscolhido">Tamanho</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P">P</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="GG">GG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="corEscolhida">Cor</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azul">Azul</SelectItem>
                      <SelectItem value="branco">Branco</SelectItem>
                      <SelectItem value="vermelho">Vermelho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="statusPagamentoUniforme">Status do Pagamento</Label>
                  <Select defaultValue="pendente">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusEntrega">Status da Entrega</Label>
                  <Select defaultValue="preparando">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preparando">Preparando</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button className="flex-1">
                  Registrar Compra
                </Button>
              </div>
            </div>
          )}

          {/* Form de Inscrição em Evento */}
          {dialogType === "inscricao-evento" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alunoInscricao">Aluno</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id.toString()}>
                          {aluno.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eventoInscricao">Evento</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventos.map((evento) => (
                        <SelectItem key={evento.id} value={evento.id.toString()}>
                          {evento.nome} - R$ {parseFloat(evento.preco || "0").toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="statusPagamentoEvento">Status do Pagamento</Label>
                <Select defaultValue="pendente">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="observacoesInscricao">Observações</Label>
                <Textarea id="observacoesInscricao" placeholder="Observações sobre a inscrição..." />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button className="flex-1">
                  Confirmar Inscrição
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}