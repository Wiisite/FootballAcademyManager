import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Search, Edit, Trash2, Phone, MapPin, User, Plus, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Filial } from "@shared/schema";
import FilialForm from "@/components/forms/FilialForm";

export default function Filiais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: filiais, isLoading } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const deleteFilialMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/filiais/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filiais"] });
      toast({
        title: "Sucesso",
        description: "Filial removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover filial. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredFiliais = filiais?.filter((filial) =>
    filial.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filial.responsavel?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (filial: Filial) => {
    setEditingFilial(filial);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta filial?")) {
      deleteFilialMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingFilial(null);
  };

  const activeCount = filiais?.filter(f => f.ativa).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Gestão de Filiais</h1>
          <p className="text-muted-foreground text-lg">Gerencie as unidades da escola de futebol</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-nova-filial"
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Filial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFilial ? "Editar Filial" : "Cadastrar Nova Filial"}
              </DialogTitle>
            </DialogHeader>
            <FilialForm 
              filial={editingFilial} 
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
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Filiais</p>
                <p className="text-3xl font-bold text-foreground">{filiais?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover-lift">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Filiais Ativas</p>
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
                <p className="text-sm font-medium text-muted-foreground mb-1">Filiais Inativas</p>
                <p className="text-3xl font-bold text-red-600">{(filiais?.length || 0) - activeCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <XCircle className="w-6 h-6 text-red-600" />
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
              placeholder="Buscar por nome, endereço ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-filiais"
              className="pl-11 h-11 bg-background border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filiais Table */}
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
          ) : filteredFiliais.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? "Nenhuma filial encontrada" : "Nenhuma filial cadastrada"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm
                  ? "Tente ajustar os termos de busca." 
                  : "Comece cadastrando a primeira filial da escola."}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-primeira-filial"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeira Filial
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="font-semibold">Nome da Filial</TableHead>
                    <TableHead className="font-semibold">Endereço</TableHead>
                    <TableHead className="font-semibold">Responsável</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiliais.map((filial) => (
                    <TableRow key={filial.id} className="border-border hover:bg-muted/50" data-testid={`row-filial-${filial.id}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <p className="font-semibold text-foreground">{filial.nome}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="text-sm max-w-xs truncate">{filial.endereco}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm font-medium">{filial.responsavel || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{filial.telefone || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={filial.ativa ? "default" : "secondary"}
                          className={filial.ativa ? "bg-green-600 hover:bg-green-700" : "bg-muted"}
                        >
                          {filial.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(filial)}
                            data-testid={`button-edit-${filial.id}`}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(filial.id)}
                            disabled={deleteFilialMutation.isPending}
                            data-testid={`button-delete-${filial.id}`}
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
