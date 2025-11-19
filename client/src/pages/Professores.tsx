import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserSquare2, Search, Edit, Trash2, Phone, Mail, DollarSign, Plus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Professor } from "@shared/schema";
import ProfessorForm from "@/components/forms/ProfessorForm";

export default function Professores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: professores, isLoading } = useQuery<Professor[]>({
    queryKey: ["/api/professores"],
  });

  const deleteProfessorMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/professores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/professores"] });
      toast({
        title: "Sucesso",
        description: "Professor removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover professor. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredProfessores = professores?.filter((professor) =>
    professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.especialidade?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este professor?")) {
      deleteProfessorMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProfessor(null);
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const activeCount = professores?.filter(p => p.ativo).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Gestão de Professores</h1>
          <p className="text-muted-foreground text-lg">Cadastre e gerencie os professores da escola</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-novo-professor"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
            >
              <UserSquare2 className="w-4 h-4 mr-2" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProfessor ? "Editar Professor" : "Cadastrar Novo Professor"}
              </DialogTitle>
            </DialogHeader>
            <ProfessorForm 
              professor={editingProfessor} 
              onSuccess={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Professores</p>
                <p className="text-3xl font-bold text-foreground">{professores?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <UserSquare2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Professores Ativos</p>
                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
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
              placeholder="Buscar por nome, email ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-professores"
              className="pl-11 h-11 bg-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Professores Table */}
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
                </div>
              ))}
            </div>
          ) : filteredProfessores.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <UserSquare2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? "Nenhum professor encontrado" : "Nenhum professor cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? "Tente buscar com outros termos." 
                  : "Comece cadastrando o primeiro professor da escola."}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-primeiro-professor"
                >
                  <UserSquare2 className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Professor
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
                    <TableHead className="font-semibold">Especialidade</TableHead>
                    <TableHead className="font-semibold">Salário</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessores.map((professor) => (
                    <TableRow key={professor.id} className="border-border hover:bg-muted/50" data-testid={`row-professor-${professor.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{professor.nome}</p>
                          <p className="text-sm text-muted-foreground">ID: {professor.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {professor.email && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="w-3.5 h-3.5 mr-1.5" />
                              <span className="truncate max-w-[180px]">{professor.email}</span>
                            </div>
                          )}
                          {professor.telefone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="w-3.5 h-3.5 mr-1.5" />
                              {professor.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {professor.especialidade ? (
                          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-700">
                            {professor.especialidade}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center font-semibold">
                          <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                          <span className="text-green-600">
                            {formatCurrency(professor.salario)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={professor.ativo ? "default" : "secondary"}
                          className={professor.ativo ? "bg-green-600 hover:bg-green-700" : "bg-muted"}
                        >
                          {professor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(professor)}
                            data-testid={`button-edit-${professor.id}`}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(professor.id)}
                            disabled={deleteProfessorMutation.isPending}
                            data-testid={`button-delete-${professor.id}`}
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
