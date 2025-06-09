import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Users, 
  DollarSign, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  Search,
  Eye,
  Settings
} from "lucide-react";
import { Link } from "wouter";

interface Filial {
  id: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  horarioFuncionamento: string | null;
  ativo: boolean | null;
  totalAlunos: number;
  totalProfessores: number;
  receitaMensal: number;
}

export default function PortalUnidades() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: unidades = [], isLoading } = useQuery({
    queryKey: ["/api/filiais/detalhadas"],
  });

  const filteredUnidades = unidades.filter((unidade: Filial) =>
    unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unidade.endereco?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Portal das Unidades</h1>
              <p className="text-gray-600 mt-2">
                Gerencie todas as unidades da escola de futebol de forma centralizada
              </p>
            </div>
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar unidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Unidades</p>
                    <p className="text-2xl font-bold">{unidades.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Alunos</p>
                    <p className="text-2xl font-bold">
                      {unidades.reduce((acc: number, u: Filial) => acc + u.totalAlunos, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Receita Total</p>
                    <p className="text-2xl font-bold">
                      R$ {unidades.reduce((acc: number, u: Filial) => acc + u.receitaMensal, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnidades.map((unidade: Filial) => (
            <Card key={unidade.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{unidade.nome}</CardTitle>
                  <Badge variant={unidade.ativo ? "default" : "secondary"}>
                    {unidade.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardDescription className="text-blue-100">
                  Unidade da escola de futebol
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                {/* Contact Info */}
                {unidade.endereco && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-sm text-gray-700">{unidade.endereco}</span>
                  </div>
                )}
                
                {unidade.telefone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{unidade.telefone}</span>
                  </div>
                )}
                
                {unidade.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{unidade.email}</span>
                  </div>
                )}
                
                {unidade.horarioFuncionamento && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{unidade.horarioFuncionamento}</span>
                  </div>
                )}

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{unidade.totalAlunos}</p>
                    <p className="text-xs text-gray-500">Alunos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{unidade.totalProfessores}</p>
                    <p className="text-xs text-gray-500">Professores</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-600">
                      R$ {unidade.receitaMensal.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Receita</p>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link href={`/unidade/${unidade.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </Link>
                  <Link href={`/unidade/${unidade.id}/sistema`} className="flex-1">
                    <Button size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUnidades.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma unidade encontrada
            </h3>
            <p className="text-gray-600">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Cadastre a primeira unidade para começar."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}