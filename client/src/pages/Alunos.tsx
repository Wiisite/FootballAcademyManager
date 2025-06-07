import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search, Edit, Trash2, Phone, Mail, Calendar, Users, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { AlunoWithFilial } from "@shared/schema";
import AlunoForm from "@/components/forms/AlunoForm";
import CadastroResponsavelForm from "@/components/forms/CadastroResponsavelForm";

export default function Alunos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResponsavelDialogOpen, setIsResponsavelDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alunos, isLoading } = useQuery<Aluno[]>({
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
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover aluno. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredAlunos = alunos?.filter((aluno) =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (aluno: Aluno) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-neutral-800">Gestão de Alunos</h2>
          <p className="text-neutral-600">Cadastre e gerencie os alunos da escola</p>
        </div>
        <div className="flex space-x-3">
          <Dialog open={isResponsavelDialogOpen} onOpenChange={setIsResponsavelDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
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
              <Button className="bg-primary hover:bg-primary/90">
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

      {/* Search and Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                placeholder="Buscar alunos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-lg">{filteredAlunos.length}</p>
                <p className="text-neutral-500">Total</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg text-green-600">
                  {filteredAlunos.filter(a => a.ativo).length}
                </p>
                <p className="text-neutral-500">Ativos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alunos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
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
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-800 mb-2">
                {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              </h3>
              <p className="text-neutral-500 mb-4">
                {searchTerm 
                  ? "Tente buscar com outros termos." 
                  : "Comece cadastrando o primeiro aluno da escola."
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Filial</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{aluno.nome}</p>
                          {aluno.dataNascimento && (
                            <p className="text-sm text-neutral-500">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {format(new Date(aluno.dataNascimento), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {aluno.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1 text-neutral-400" />
                              {aluno.email}
                            </div>
                          )}
                          {aluno.telefone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-3 h-3 mr-1 text-neutral-400" />
                              {aluno.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {aluno.filial ? (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-neutral-400" />
                            <span>{aluno.filial.nome}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">Sem filial</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {calculateAge(aluno.dataNascimento)} anos
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          {aluno.nomeResponsavel && (
                            <p className="font-medium text-sm">{aluno.nomeResponsavel}</p>
                          )}
                          {aluno.telefoneResponsavel && (
                            <p className="text-xs text-neutral-500">{aluno.telefoneResponsavel}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={aluno.ativo ? "default" : "secondary"}>
                          {aluno.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(aluno)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(aluno.id)}
                            disabled={deleteAlunoMutation.isPending}
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
