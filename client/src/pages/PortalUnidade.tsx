import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PortalUnidade() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/unidade/login", {
        email,
        senha
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Get additional gestor information for the session
        const gestorResponse = await apiRequest("GET", `/api/gestores-unidade/${data.gestorId}`);
        const gestorData = await gestorResponse.json();
        
        // Get filial information
        const filialResponse = await apiRequest("GET", `/api/filiais/${data.filialId}`);
        const filialData = await filialResponse.json();
        
        // Salvar dados da sessão no localStorage
        localStorage.setItem('unidadeSession', JSON.stringify({
          gestorId: data.gestorId,
          filialId: data.filialId,
          nomeGestor: gestorData.nome || 'Gestor',
          nomeFilial: filialData.nome || 'Unidade',
          loginTime: new Date().toISOString()
        }));
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo ao portal da ${filialData.nome || 'Unidade'}`,
        });
        
        // Redirecionar para o dashboard da unidade
        window.location.href = `/unidade/${data.filialId}/dashboard`;
      } else {
        toast({
          title: "Erro no login",
          description: data.message || "Email ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Portal da Unidade
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Acesse o sistema de gestão da sua unidade
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gestor@unidade.com"
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Entrando...
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Problemas para acessar?{" "}
                <button 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => {
                    toast({
                      title: "Suporte",
                      description: "Entre em contato com a administração central para suporte técnico",
                    });
                  }}
                >
                  Solicitar suporte
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}