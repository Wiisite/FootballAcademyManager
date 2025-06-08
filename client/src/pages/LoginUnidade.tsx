import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, ChevronLeft } from "lucide-react";
import { InterLogo } from "@/components/InterLogo";
import type { Filial } from "@shared/schema";

export default function LoginUnidade() {
  const [, setLocation] = useLocation();
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");

  const { data: filiais, isLoading } = useQuery<Filial[]>({
    queryKey: ["/api/filiais"],
  });

  const handleAccessUnidade = () => {
    if (selectedUnidade) {
      // Salvar no localStorage qual unidade foi selecionada
      localStorage.setItem("unidade_selecionada", selectedUnidade);
      setLocation("/painel-unidade");
    }
  };

  const filiaisAtivas = filiais?.filter(f => f.ativa) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão Voltar */}
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar ao Sistema Principal
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4 p-2">
              <InterLogo size={48} />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Acesso por Unidade
            </CardTitle>
            <CardDescription className="text-gray-600">
              Selecione sua unidade para acessar o painel administrativo
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Seleção de Unidade */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Escolha sua unidade
              </label>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma unidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filiaisAtivas.map((filial) => (
                      <SelectItem key={filial.id} value={filial.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{filial.nome}</span>
                          <Badge variant="secondary" className="ml-2">
                            {filial.endereco}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Informações da Unidade Selecionada */}
            {selectedUnidade && (
              <div className="bg-blue-50 p-4 rounded-lg">
                {(() => {
                  const unidade = filiaisAtivas.find(f => f.id.toString() === selectedUnidade);
                  return unidade ? (
                    <div>
                      <h3 className="font-medium text-blue-900 mb-2">{unidade.nome}</h3>
                      <p className="text-sm text-blue-700">{unidade.endereco}</p>
                      {unidade.telefone && (
                        <p className="text-sm text-blue-700">Tel: {unidade.telefone}</p>
                      )}
                      {unidade.responsavel && (
                        <p className="text-sm text-blue-700">Responsável: {unidade.responsavel}</p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Botão de Acesso */}
            <Button 
              onClick={handleAccessUnidade}
              disabled={!selectedUnidade}
              className="w-full"
              size="lg"
            >
              Acessar Painel da Unidade
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            {/* Lista de Unidades Disponíveis */}
            {!isLoading && filiaisAtivas.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Unidades Disponíveis ({filiaisAtivas.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filiaisAtivas.map((filial) => (
                    <div
                      key={filial.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUnidade === filial.id.toString()
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedUnidade(filial.id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{filial.nome}</p>
                          <p className="text-xs text-gray-500">{filial.endereco}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Ativa
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado vazio */}
            {!isLoading && filiaisAtivas.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma unidade ativa encontrada</p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/")}
                  className="mt-4"
                >
                  Voltar ao Sistema Principal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações adicionais */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            Precisa de acesso administrativo completo?{" "}
            <button 
              onClick={() => setLocation("/")}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Acessar Sistema Principal
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}