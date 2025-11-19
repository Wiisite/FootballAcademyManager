import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Search, Plus, Trash2, Calendar, CreditCard, TrendingUp, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { Pagamento, Aluno } from "@shared/schema";
import PagamentoForm from "@/components/forms/PagamentoForm";

export default function Financeiro() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pagamentos, isLoading: loadingPagamentos } = useQuery<Pagamento[]>({
    queryKey: ["/api/pagamentos"],
  });

  const { data: alunos } = useQuery<Aluno[]>({
    queryKey: ["/api/alunos"],
  });

  const deletePagamentoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pagamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pagamentos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: "Pagamento removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredPagamentos = pagamentos?.filter((pagamento) => {
    const aluno = alunos?.find(a => a.id === pagamento.alunoId);
    const matchesSearch = aluno?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pagamento.formaPagamento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = !filterMonth || filterMonth === "all" || pagamento.mesReferencia === filterMonth;
    return matchesSearch && matchesMonth;
  }) || [];

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este pagamento?")) {
      deletePagamentoMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const getAlunoNome = (alunoId: number) => {
    const aluno = alunos?.find(a => a.id === alunoId);
    return aluno?.nome || "Aluno não encontrado";
  };

  const getPaymentMethodColor = (method: string) => {
    const colors = {
      "PIX": "bg-green-500/10 text-green-700 border-green-500/20",
      "Dinheiro": "bg-blue-500/10 text-blue-700 border-blue-500/20",
      "Cartão": "bg-purple-500/10 text-purple-700 border-purple-500/20",
      "Transferência": "bg-amber-500/10 text-amber-700 border-amber-500/20",
    };
    return colors[method as keyof typeof colors] || "bg-muted";
  };

  const calculateTotals = () => {
    const total = filteredPagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTotal = filteredPagamentos
      .filter(p => p.mesReferencia === currentMonth)
      .reduce((sum, p) => sum + Number(p.valor), 0);
    
    return { total, monthlyTotal };
  };

  const { total, monthlyTotal } = calculateTotals();

  const getMonthOptions = () => {
    const months = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = format(date, "MMMM yyyy", { locale: ptBR });
      months.push({ value, label });
    }
    return months;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Controle Financeiro</h1>
          <p className="text-muted-foreground text-lg">Gerencie pagamentos e mensalidades</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-registrar-pagamento"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Novo Pagamento</DialogTitle>
            </DialogHeader>
            <PagamentoForm onSuccess={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-600">{filteredPagamentos.length} pagamentos</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Arrecadado</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(total)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Mês atual</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Receita Mensal</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(monthlyTotal)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Por pagamento</span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Ticket Médio</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(filteredPagamentos.length > 0 ? total / filteredPagamentos.length : 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Buscar por aluno ou forma de pagamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-pagamentos"
                className="pl-11 h-11 bg-background border-border"
              />
            </div>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full md:w-56 h-11 bg-background border-border" data-testid="select-month-filter">
                <SelectValue placeholder="Filtrar por mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          {loadingPagamentos ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredPagamentos.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm || filterMonth ? "Nenhum pagamento encontrado" : "Nenhum pagamento registrado"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filterMonth
                  ? "Tente ajustar os filtros de busca." 
                  : "Comece registrando o primeiro pagamento."}
              </p>
              {!searchTerm && !filterMonth && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-primeiro-pagamento"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primeiro Pagamento
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-semibold">Aluno</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Mês Referência</TableHead>
                    <TableHead className="font-semibold">Data Pagamento</TableHead>
                    <TableHead className="font-semibold">Forma de Pagamento</TableHead>
                    <TableHead className="font-semibold">Observações</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagamentos.map((pagamento) => (
                    <TableRow key={pagamento.id} className="border-border hover:bg-muted/50" data-testid={`row-pagamento-${pagamento.id}`}>
                      <TableCell>
                        <p className="font-semibold text-foreground">{getAlunoNome(pagamento.alunoId!)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-semibold text-green-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatCurrency(pagamento.valor)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="capitalize">
                            {format(new Date(pagamento.mesReferencia + "-01"), "MMMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {format(new Date(pagamento.dataPagamento), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(pagamento.formaPagamento)}>
                          <CreditCard className="w-3 h-3 mr-1.5" />
                          {pagamento.formaPagamento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-40 truncate">
                          {pagamento.observacoes || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pagamento.id)}
                          disabled={deletePagamentoMutation.isPending}
                          data-testid={`button-delete-${pagamento.id}`}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
