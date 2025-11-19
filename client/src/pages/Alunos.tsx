import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Building2,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { AlunoWithFilial } from "@shared/schema";
import AlunoForm from "@/components/forms/AlunoForm";
import CadastroResponsavelForm from "@/components/forms/CadastroResponsavelForm";

export default function Alunos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterPayment, setFilterPayment] = useState<"all" | "paid" | "late">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResponsavelDialogOpen, setIsResponsavelDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<AlunoWithFilial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alunos, isLoading } = useQuery<AlunoWithFilial[]>({
    queryKey: ["/api/alunos"],
  });

  const deleteAlunoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/alunos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      toast({
        title: "Sucesso",
        description: "Aluno removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover aluno. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredAlunos = alunos?.filter((aluno) => {
    const matchesSearch = 
      aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && aluno.ativo) ||
      (filterStatus === "inactive" && !aluno.ativo);
    
    const matchesPayment = 
      filterPayment === "all" ||
      (filterPayment === "paid" && aluno.statusPagamento?.emDia) ||
      (filterPayment === "late" && aluno.statusPagamento && !aluno.statusPagamento.emDia);
    
    return matchesSearch && matchesStatus && matchesPayment;
  }) || [];

  const handleEdit = (aluno: AlunoWithFilial) => {
    setEditingAluno(aluno);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este aluno?")) {
      deleteAlunoMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAluno(null);
  };

  const handleResponsavelSuccess = () => {
    setIsResponsavelDialogOpen(false);
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "-";
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const activeCount = alunos?.filter(a => a.ativo).length || 0;
  const paidCount = alunos?.filter(a => a.statusPagamento?.emDia).length || 0;
  const lateCount = alunos?.filter(a => a.statusPagamento && !a.statusPagamento.emDia).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Gestão de Alunos</h1>
          <p className="text-muted-foreground text-lg">Cadastre e gerencie os alunos da escola</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isResponsavelDialogOpen} onOpenChange={setIsResponsavelDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                data-testid="button-cadastro-responsavel"
                className="border-border hover:bg-muted"
              >
                <Users className="w-4 h-4 mr-2" />
                Cadastro por Responsável
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastro de Alunos por Responsável</DialogTitle>
              </DialogHeader>
              <CadastroResponsavelForm onSuccess={handleResponsavelSuccess} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="button-novo-aluno"
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAluno ? "Editar Aluno" : "Cadastrar Novo Aluno"}
                </DialogTitle>
              </DialogHeader>
              <AlunoForm 
                aluno={editingAluno} 
                onSuccess={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Alunos</p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-total-alunos">{alunos?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Alunos Ativos</p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-alunos-ativos">{activeCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Em Dia</p>
                <p className="text-3xl font-bold text-green-600" data-testid="stat-alunos-em-dia">{paidCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Atrasados</p>
                <p className="text-3xl font-bold text-red-600" data-testid="stat-alunos-atrasados">{lateCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
                className="pl-11 h-11 bg-background border-border"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                data-testid="select-status-filter"
                className="h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>

              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value as any)}
                data-testid="select-payment-filter"
                className="h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Todos Pagamentos</option>
                <option value="paid">Em Dia</option>
                <option value="late">Atrasados</option>
              </select>

              <Button
                variant="outline"
                data-testid="button-export"
                className="h-11"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {(filterStatus !== "all" || filterPayment !== "all" || searchTerm) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>
                Mostrando {filteredAlunos.length} de {alunos?.length || 0} alunos
              </span>
              {(filterStatus !== "all" || filterPayment !== "all" || searchTerm) && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setFilterPayment("all");
                  }}
                  className="h-auto p-0 text-green-600 hover:text-green-700"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredAlunos.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <UserPlus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm || filterStatus !== "all" || filterPayment !== "all"
                  ? "Nenhum aluno encontrado"
                  : "Nenhum aluno cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all" || filterPayment !== "all"
                  ? "Tente ajustar os filtros ou buscar com outros termos."
                  : "Comece cadastrando o primeiro aluno da escola."}
              </p>
              {!searchTerm && filterStatus === "all" && filterPayment === "all" && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-cadastrar-primeiro"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Contato</TableHead>
                    <TableHead className="font-semibold">Filial</TableHead>
                    <TableHead className="font-semibold">Idade</TableHead>
                    <TableHead className="font-semibold">Responsável</TableHead>
                    <TableHead className="font-semibold">Pagamento</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow key={aluno.id} className="border-border hover:bg-muted/50" data-testid={`row-aluno-${aluno.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{aluno.nome}</p>
                          {aluno.dataNascimento && (
                            <p className="text-sm text-muted-foreground flex items-center mt-0.5">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(aluno.dataNascimento), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {aluno.email && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="w-3.5 h-3.5 mr-1.5" />
                              <span className="truncate max-w-[180px]">{aluno.email}</span>
                            </div>
                          )}
                          {aluno.telefone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="w-3.5 h-3.5 mr-1.5" />
                              {aluno.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {aluno.filial ? (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{aluno.filial.nome}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem filial</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {calculateAge(aluno.dataNascimento)} anos
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          {aluno.nomeResponsavel && (
                            <p className="font-medium text-sm">{aluno.nomeResponsavel}</p>
                          )}
                          {aluno.telefoneResponsavel && (
                            <p className="text-xs text-muted-foreground">{aluno.telefoneResponsavel}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {aluno.statusPagamento ? (
                          <div className="space-y-1.5">
                            <Badge 
                              variant={aluno.statusPagamento.emDia ? "default" : "destructive"}
                              className={aluno.statusPagamento.emDia 
                                ? "bg-green-600 hover:bg-green-700 text-white" 
                                : "bg-red-600 hover:bg-red-700 text-white"
                              }
                            >
                              {aluno.statusPagamento.emDia ? "Em Dia" : "Atrasado"}
                            </Badge>
                            {!aluno.statusPagamento.emDia && (
                              <div className="text-xs font-medium text-red-600">
                                {aluno.statusPagamento.diasAtraso !== undefined 
                                  ? `${aluno.statusPagamento.diasAtraso} dias`
                                  : "Sem pagamentos"
                                }
                              </div>
                            )}
                            {aluno.statusPagamento.ultimoPagamento && (
                              <div className="text-xs text-muted-foreground">
                                Último: {aluno.statusPagamento.ultimoPagamento}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="bg-muted">
                            Sem dados
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={aluno.ativo ? "default" : "secondary"}
                          className={aluno.ativo ? "bg-green-600 hover:bg-green-700" : "bg-muted"}
                        >
                          {aluno.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(aluno)}
                            data-testid={`button-edit-${aluno.id}`}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(aluno.id)}
                            disabled={deleteAlunoMutation.isPending}
                            data-testid={`button-delete-${aluno.id}`}
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
