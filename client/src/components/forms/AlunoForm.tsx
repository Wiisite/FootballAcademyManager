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
                    placeholder="Digite apenas números (11 dígitos)" 
                    maxLength={11}
                    {...field} 
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
                <FormLabel>Foto do Aluno (URL)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="URL da foto do aluno" 
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
                <FormLabel>E-mail</FormLabel>
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
                <FormLabel>Telefone</FormLabel>
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
                  checked={field.value ?? true}
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
