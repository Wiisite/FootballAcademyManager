import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersRound, Search, Edit, Trash2, Clock, DollarSign, UserSquare2, Building2, Plus, CheckCircle2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TurmaWithProfessor } from "@shared/schema";
import TurmaForm from "@/components/forms/TurmaForm";

export default function Turmas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<TurmaWithProfessor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: turmas, isLoading } = useQuery<TurmaWithProfessor[]>({
    queryKey: ["/api/turmas"],
  });

  const deleteTurmaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/turmas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/turmas"] });
      toast({
        title: "Sucesso",
        description: "Turma removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover turma. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredTurmas = turmas?.filter((turma) =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.professor?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (turma: TurmaWithProfessor) => {
    setEditingTurma(turma);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta turma?")) {
      deleteTurmaMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTurma(null);
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const getCategoryColor = (categoria: string) => {
    const colors = {
      "Infantil": "bg-blue-500/10 text-blue-700 border-blue-500/20",
      "Juvenil": "bg-green-500/10 text-green-700 border-green-500/20",
      "Adulto": "bg-purple-500/10 text-purple-700 border-purple-500/20",
    };
    return colors[categoria as keyof typeof colors] || "bg-muted";
  };

  const activeCount = turmas?.filter(t => t.ativo).length || 0;
  const totalAlunos = turmas?.reduce((total, turma) => total + (turma._count?.matriculas || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Gestão de Turmas</h1>
          <p className="text-muted-foreground text-lg">Cadastre e gerencie as turmas da escola</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-nova-turma"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
            >
              <UsersRound className="w-4 h-4 mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTurma ? "Editar Turma" : "Cadastrar Nova Turma"}
              </DialogTitle>
            </DialogHeader>
            <TurmaForm 
              turma={editingTurma} 
              onSuccess={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Turmas</p>
                <p className="text-3xl font-bold text-foreground">{turmas?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <UsersRound className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Turmas Ativas</p>
                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
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
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Alunos</p>
                <p className="text-3xl font-bold text-blue-600">{totalAlunos}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar por nome, categoria ou professor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-turmas"
              className="pl-11 h-11 bg-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Turmas Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          {isLoading ? (
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
          ) : filteredTurmas.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <UsersRound className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? "Nenhuma turma encontrada" : "Nenhuma turma cadastrada"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? "Tente buscar com outros termos." 
                  : "Comece cadastrando a primeira turma da escola."}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-primeira-turma"
                >
                  <UsersRound className="w-4 h-4 mr-2" />
                  Cadastrar Primeira Turma
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-semibold">Turma</TableHead>
                    <TableHead className="font-semibold">Professor</TableHead>
                    <TableHead className="font-semibold">Filial</TableHead>
                    <TableHead className="font-semibold">Alunos</TableHead>
                    <TableHead className="font-semibold">Horário</TableHead>
                    <TableHead className="font-semibold">Mensalidade</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurmas.map((turma) => (
                    <TableRow key={turma.id} className="border-border hover:bg-muted/50" data-testid={`row-turma-${turma.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{turma.nome}</p>
                          <Badge className={getCategoryColor(turma.categoria)}>
                            {turma.categoria}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {turma.professor ? (
                          <div className="flex items-center">
                            <UserSquare2 className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{turma.professor.nome}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem professor</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {turma.filial ? (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span>{turma.filial.nome}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem filial</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">
                            {turma._count?.matriculas || 0} / {turma.capacidadeMaxima}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {turma.horario && (
                            <div className="flex items-center text-sm">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                              {turma.horario}
                            </div>
                          )}
                          {turma.diasSemana && (
                            <p className="text-xs text-muted-foreground">{turma.diasSemana}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-semibold text-green-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatCurrency(turma.valorMensalidade)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={turma.ativo ? "default" : "secondary"}
                          className={turma.ativo ? "bg-green-600 hover:bg-green-700" : "bg-muted"}
                        >
                          {turma.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(turma)}
                            data-testid={`button-edit-${turma.id}`}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(turma.id)}
                            disabled={deleteTurmaMutation.isPending}
                            data-testid={`button-delete-${turma.id}`}
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
