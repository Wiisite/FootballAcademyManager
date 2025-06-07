import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, User, Lock, School } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function ResponsavelLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const endpoint = isLogin ? "/api/responsavel/login" : "/api/responsavel/register";
      const response = await apiRequest("POST", endpoint, data);
      
      if (response.ok) {
        const result = await response.json();
        
        if (isLogin) {
          // Login successful - redirect to portal
          localStorage.setItem("responsavelToken", result.token);
          window.location.href = "/portal";
        } else {
          // Registration successful
          toast({
            title: "Cadastro realizado com sucesso!",
            description: "Agora você pode fazer login com suas credenciais.",
          });
          setIsLogin(true);
          reset();
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: isLogin ? "Email ou senha incorretos." : "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const registerSchema = loginSchema.extend({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    telefone: z.string().optional(),
    cpf: z.string().optional(),
    confirmarSenha: z.string(),
  }).refine((data) => data.senha === data.confirmarSenha, {
    message: "Senhas não coincidem",
    path: ["confirmarSenha"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal do Responsável</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? "Acesse sua conta" : "Crie sua conta"}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Entrar" : "Criar Conta"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Seu nome completo"
                      {...register("nome" as any)}
                    />
                    {errors.nome && (
                      <p className="text-sm text-red-600">{(errors as any).nome.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      {...register("telefone" as any)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      {...register("cpf" as any)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    className="pl-10"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    className="pl-10 pr-10"
                    {...register("senha")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-sm text-red-600">{errors.senha.message}</p>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmarSenha"
                      type="password"
                      placeholder="Confirme sua senha"
                      className="pl-10"
                      {...register("confirmarSenha" as any)}
                    />
                  </div>
                  {(errors as any).confirmarSenha && (
                    <p className="text-sm text-red-600">{(errors as any).confirmarSenha.message}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    reset();
                  }}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {isLogin ? "Criar conta" : "Fazer login"}
                </button>
              </p>
            </div>

            {isLogin && (
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <AlertDescription className="text-sm text-blue-800">
                  <strong>Primeira vez aqui?</strong> Crie sua conta para gerenciar os dados dos seus filhos,
                  receber notificações de pagamento e acompanhar o progresso na escola de futebol.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Precisa de ajuda? Entre em contato com a escola.
          </p>
        </div>
      </div>
    </div>
  );
}