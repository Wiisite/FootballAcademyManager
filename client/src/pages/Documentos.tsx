import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Eye, Trash2, Download, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Documento {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria: string;
  tipoArquivo: string;
  tamanhoBytes: number;
  nomeArquivoOriginal: string;
  visibilidade: string;
  filialId: number | null;
  alunoId: number | null;
  uploadPorNome: string | null;
  ativo: boolean;
  createdAt: string;
}

export default function Documentos() {
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    categoria: "comunicado",
    visibilidade: "todos",
    filialId: null as number | null,
    alunoId: null as number | null,
    arquivo: "",
    tipoArquivo: "",
    tamanhoBytes: 0,
    nomeArquivoOriginal: "",
  });

  const { data: documentos, isLoading } = useQuery<Documento[]>({
    queryKey: ["/api/documentos"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/documentos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos"] });
      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso!",
      });
      setIsUploadOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar documento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/documentos/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentos"] });
      toast({
        title: "Sucesso",
        description: "Documento removido com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover documento",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        arquivo: result,
        tipoArquivo: file.type,
        tamanhoBytes: file.size,
        nomeArquivoOriginal: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      categoria: "comunicado",
      visibilidade: "todos",
      filialId: null,
      alunoId: null,
      arquivo: "",
      tipoArquivo: "",
      tamanhoBytes: 0,
      nomeArquivoOriginal: "",
    });
  };

  const handleUpload = () => {
    if (!formData.titulo || !formData.arquivo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      comunicado: "Comunicado",
      contrato: "Contrato",
      relatorio: "Relatório",
      certificado: "Certificado",
      outro: "Outro",
    };
    return labels[categoria] || categoria;
  };

  const getVisibilidadeLabel = (visibilidade: string) => {
    const labels: Record<string, string> = {
      todos: "Todos",
      filial: "Filial Específica",
      aluno_especifico: "Aluno Específico",
    };
    return labels[visibilidade] || visibilidade;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos Compartilhados</h1>
          <p className="text-gray-600 mt-1">
            Gerencie documentos para responsáveis e equipe
          </p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-document">
              <Plus className="w-4 h-4 mr-2" />
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload de Documento</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Comunicado Junho 2024"
                  data-testid="input-titulo"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva o conteúdo do documento..."
                  rows={3}
                  data-testid="input-descricao"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger data-testid="select-categoria">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comunicado">Comunicado</SelectItem>
                      <SelectItem value="contrato">Contrato</SelectItem>
                      <SelectItem value="relatorio">Relatório</SelectItem>
                      <SelectItem value="certificado">Certificado</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="visibilidade">Visibilidade</Label>
                  <Select
                    value={formData.visibilidade}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, visibilidade: value }))}
                  >
                    <SelectTrigger data-testid="select-visibilidade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="filial">Filial Específica</SelectItem>
                      <SelectItem value="aluno_especifico">Aluno Específico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="arquivo">Arquivo * (máx 10MB)</Label>
                <Input
                  id="arquivo"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  data-testid="input-file"
                />
                {formData.nomeArquivoOriginal && (
                  <p className="text-sm text-gray-600 mt-2">
                    {formData.nomeArquivoOriginal} ({formatFileSize(formData.tamanhoBytes)})
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadMutation.isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : !documentos || documentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum documento cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Upload por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.titulo}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoriaLabel(doc.categoria)}</Badge>
                    </TableCell>
                    <TableCell>{getVisibilidadeLabel(doc.visibilidade)}</TableCell>
                    <TableCell>{formatFileSize(doc.tamanhoBytes)}</TableCell>
                    <TableCell>{doc.uploadPorNome || "Sistema"}</TableCell>
                    <TableCell>
                      {format(new Date(doc.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {doc.ativo ? (
                        <Badge className="bg-green-600">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid={`button-delete-${doc.id}`}
                          onClick={() => {
                            if (confirm("Tem certeza que deseja remover este documento?")) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
