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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="uniformes">Uniformes</TabsTrigger>
          <TabsTrigger value="compras-uniformes">Compras</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
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
      </Tabs>

      {/* Dialogs para criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "pagamento" && "Novo Pagamento"}
              {dialogType === "evento" && "Criar Evento"}
              {dialogType === "uniforme" && "Adicionar Uniforme"}
              {dialogType === "compra-uniforme" && "Comprar Uniforme"}
              {dialogType === "inscricao-evento" && "Inscrever em Evento"}
            </DialogTitle>
          </DialogHeader>
          {/* Forms específicos para cada tipo serão implementados aqui */}
        </DialogContent>
      </Dialog>
    </div>
  );
}