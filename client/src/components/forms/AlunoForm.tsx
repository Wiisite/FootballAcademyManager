import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAlunoSchema, type Aluno, type InsertAluno, type Filial } from "@shared/schema";
import { z } from "zod";
import { Camera, Download, Upload, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

const formSchema = insertAlunoSchema.extend({
  dataNascimento: z.string().optional(),
  dataMatricula: z.string().optional(),
  filialId: z.number().optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AlunoFormProps {
  aluno?: Aluno | null;
  onSuccess: () => void;
}

export default function AlunoForm({ aluno, onSuccess }: AlunoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Função para iniciar a captura de foto
  const startCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  // Função para capturar a foto
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        
        // Atualiza o campo fotoUrl com a imagem capturada
        form.setValue('fotoUrl', dataURL);
        
        toast({
          title: "Sucesso",
          description: "Foto capturada com sucesso!",
        });
      }
      
      stopCapture();
    }
  };

  // Função para parar a captura
  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  // Função para processar arquivo de imagem anexado
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Converter para base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        form.setValue('fotoUrl', result);
        
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
    fileInputRef.current?.click();
  };

  const { data: filiais } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: aluno?.nome || "",
      cpf: aluno?.cpf || "",
      email: aluno?.email || "",
      telefone: aluno?.telefone || "",
      dataNascimento: aluno?.dataNascimento || "",
      dataMatricula: aluno?.dataMatricula || new Date().toISOString().split('T')[0],
      fotoUrl: aluno?.fotoUrl || "",
      endereco: aluno?.endereco || "",
      nomeResponsavel: aluno?.nomeResponsavel || "",
      telefoneResponsavel: aluno?.telefoneResponsavel || "",
      filialId: aluno?.filialId || undefined,
      ativo: Boolean(aluno?.ativo ?? true),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAluno) => {
      const response = await apiRequest("POST", "/api/alunos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sucesso",
        description: "Aluno cadastrado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar aluno. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertAluno>) => {
      const response = await apiRequest("PUT", `/api/alunos/${aluno!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alunos"] });
      toast({
        title: "Sucesso",
        description: "Aluno atualizado com sucesso.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar aluno. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const submitData: InsertAluno = {
      ...data,
      dataNascimento: data.dataNascimento || null,
      email: data.email || null,
      telefone: data.telefone || null,
      endereco: data.endereco || null,
      nomeResponsavel: data.nomeResponsavel || null,
      telefoneResponsavel: data.telefoneResponsavel || null,
    };

    if (aluno) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF do Aluno</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="999.999.999-99" 
                    maxLength={14}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      // Remove todos os caracteres não numéricos
                      const numbers = e.target.value.replace(/\D/g, '');
                      
                      // Aplica a máscara do CPF
                      let formatted = numbers;
                      if (numbers.length > 3) {
                        formatted = numbers.slice(0, 3) + '.' + numbers.slice(3);
                      }
                      if (numbers.length > 6) {
                        formatted = numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6);
                      }
                      if (numbers.length > 9) {
                        formatted = numbers.slice(0, 3) + '.' + numbers.slice(3, 6) + '.' + numbers.slice(6, 9) + '-' + numbers.slice(9, 11);
                      }
                      
                      field.onChange(formatted);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataNascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataMatricula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Matrícula</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fotoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Foto do Aluno</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {/* Captura de foto com câmera */}
                    {isCapturing ? (
                      <div className="space-y-3">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full max-w-md mx-auto rounded-lg border"
                        />
                        <div className="flex justify-center space-x-2">
                          <Button
                            type="button"
                            onClick={capturePhoto}
                            className="flex items-center space-x-2"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capturar Foto</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={stopCapture}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Campo de URL manual */}
                        <Input 
                          placeholder="URL da foto do aluno (opcional)" 
                          {...field}
                          value={field.value || ""}
                        />
                        
                        {/* Botões de opções */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={selectFile}
                            className="flex items-center space-x-2 flex-1"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>Anexar Imagem</span>
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            onClick={startCapture}
                            className="flex items-center space-x-2 flex-1"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Tirar Foto</span>
                          </Button>
                        </div>
                        
                        {/* Input de arquivo oculto */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    )}

                    {/* Preview da foto */}
                    {field.value && (
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <img 
                          src={field.value} 
                          alt="Preview da foto"
                          className="w-20 h-20 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Foto do aluno</p>
                          <p className="text-xs text-gray-500">
                            {field.value.startsWith('data:image') 
                              ? (field.value.includes('jpeg') || field.value.includes('jpg') || field.value.includes('png'))
                                ? 'Imagem anexada do dispositivo'
                                : 'Foto capturada pela câmera'
                              : 'Foto via URL'
                            }
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (field.value) {
                              const link = document.createElement('a');
                              if (field.value.startsWith('data:')) {
                                // Para fotos capturadas, criar blob para download
                                fetch(field.value)
                                  .then(res => res.blob())
                                  .then(blob => {
                                    const url = URL.createObjectURL(blob);
                                    link.href = url;
                                    link.download = 'foto-aluno.jpg';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                  });
                              } else {
                                // Para URLs, download direto
                                link.href = field.value;
                                link.download = 'foto-aluno.jpg';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }
                          }}
                          className="flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </Button>
                      </div>
                    )}

                    {/* Canvas oculto para captura */}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="filialId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filiais?.filter(f => f.ativa).map((filial) => (
                      <SelectItem key={filial.id} value={filial.id.toString()}>
                        {filial.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail do Aluno</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone do Aluno</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nomeResponsavel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Responsável</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome do responsável" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefoneResponsavel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone do Responsável</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Digite o endereço completo"
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Status Ativo</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Determina se o aluno está ativo no sistema
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={Boolean(field.value ?? true)}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? "Salvando..." : aluno ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
