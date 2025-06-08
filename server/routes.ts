import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Extend session type for responsavel
declare module "express-session" {
  interface SessionData {
    responsavelId?: number;
  }
}
import {
  insertAlunoSchema,
  insertProfessorSchema,
  insertTurmaSchema,
  insertMatriculaSchema,
  insertPagamentoSchema,
  insertFilialSchema,
  insertResponsavelSchema,
  insertEventoSchema,
  insertUniformeSchema,
  insertInscricaoEventoSchema,
  insertCompraUniformeSchema,
  insertNotificacaoSchema,
} from "@shared/schema";
import { z } from "zod";

// Middleware para verificar se usuário admin ou responsável está autenticado
const isAuthenticatedOrResponsavel = async (req: any, res: any, next: any) => {
  // Verificar se é usuário administrativo autenticado
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Verificar se é responsável autenticado via sessão
  if (req.session && req.session.responsavelId) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Alunos routes
  app.get("/api/alunos", isAuthenticatedOrResponsavel, async (req, res) => {
    try {
      const { filialId } = req.query;
      if (filialId) {
        const alunos = await storage.getAlunosByFilial(parseInt(filialId as string));
        res.json(alunos);
      } else {
        const alunos = await storage.getAlunos();
        res.json(alunos);
      }
    } catch (error) {
      console.error("Error fetching alunos:", error);
      res.status(500).json({ message: "Failed to fetch alunos" });
    }
  });

  app.get("/api/alunos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const aluno = await storage.getAluno(id);
      if (!aluno) {
        return res.status(404).json({ message: "Aluno not found" });
      }
      res.json(aluno);
    } catch (error) {
      console.error("Error fetching aluno:", error);
      res.status(500).json({ message: "Failed to fetch aluno" });
    }
  });

  app.post("/api/alunos", isAuthenticatedOrResponsavel, async (req, res) => {
    try {
      const validatedData = insertAlunoSchema.parse(req.body);
      const aluno = await storage.createAluno(validatedData);
      res.status(201).json(aluno);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating aluno:", error);
      res.status(500).json({ message: "Failed to create aluno" });
    }
  });

  app.patch("/api/alunos/:id", isAuthenticatedOrResponsavel, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAlunoSchema.partial().parse(req.body);
      const aluno = await storage.updateAluno(id, validatedData);
      res.json(aluno);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating aluno:", error);
      res.status(500).json({ message: "Failed to update aluno" });
    }
  });

  app.delete("/api/alunos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAluno(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting aluno:", error);
      res.status(500).json({ message: "Failed to delete aluno" });
    }
  });

  // Professores routes
  app.get("/api/professores", isAuthenticated, async (req, res) => {
    try {
      const { filialId } = req.query;
      if (filialId) {
        const professores = await storage.getProfessoresByFilial(parseInt(filialId as string));
        res.json(professores);
      } else {
        const professores = await storage.getProfessores();
        res.json(professores);
      }
    } catch (error) {
      console.error("Error fetching professores:", error);
      res.status(500).json({ message: "Failed to fetch professores" });
    }
  });

  app.get("/api/professores/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const professor = await storage.getProfessor(id);
      if (!professor) {
        return res.status(404).json({ message: "Professor not found" });
      }
      res.json(professor);
    } catch (error) {
      console.error("Error fetching professor:", error);
      res.status(500).json({ message: "Failed to fetch professor" });
    }
  });

  app.post("/api/professores", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProfessorSchema.parse(req.body);
      const professor = await storage.createProfessor(validatedData);
      res.status(201).json(professor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating professor:", error);
      res.status(500).json({ message: "Failed to create professor" });
    }
  });

  app.put("/api/professores/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProfessorSchema.partial().parse(req.body);
      const professor = await storage.updateProfessor(id, validatedData);
      res.json(professor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating professor:", error);
      res.status(500).json({ message: "Failed to update professor" });
    }
  });

  app.delete("/api/professores/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProfessor(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting professor:", error);
      res.status(500).json({ message: "Failed to delete professor" });
    }
  });

  // Turmas routes
  app.get("/api/turmas", isAuthenticated, async (req, res) => {
    try {
      const { filialId } = req.query;
      if (filialId) {
        const turmas = await storage.getTurmasByFilial(parseInt(filialId as string));
        res.json(turmas);
      } else {
        const turmas = await storage.getTurmas();
        res.json(turmas);
      }
    } catch (error) {
      console.error("Error fetching turmas:", error);
      res.status(500).json({ message: "Failed to fetch turmas" });
    }
  });

  app.get("/api/turmas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const turma = await storage.getTurma(id);
      if (!turma) {
        return res.status(404).json({ message: "Turma not found" });
      }
      res.json(turma);
    } catch (error) {
      console.error("Error fetching turma:", error);
      res.status(500).json({ message: "Failed to fetch turma" });
    }
  });

  app.post("/api/turmas", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTurmaSchema.parse(req.body);
      const turma = await storage.createTurma(validatedData);
      res.status(201).json(turma);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating turma:", error);
      res.status(500).json({ message: "Failed to create turma" });
    }
  });

  app.put("/api/turmas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTurmaSchema.partial().parse(req.body);
      const turma = await storage.updateTurma(id, validatedData);
      res.json(turma);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating turma:", error);
      res.status(500).json({ message: "Failed to update turma" });
    }
  });

  app.delete("/api/turmas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTurma(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting turma:", error);
      res.status(500).json({ message: "Failed to delete turma" });
    }
  });

  // Matriculas routes
  app.get("/api/matriculas", isAuthenticated, async (req, res) => {
    try {
      const matriculas = await storage.getMatriculas();
      res.json(matriculas);
    } catch (error) {
      console.error("Error fetching matriculas:", error);
      res.status(500).json({ message: "Failed to fetch matriculas" });
    }
  });

  app.post("/api/matriculas", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMatriculaSchema.parse(req.body);
      const matricula = await storage.createMatricula(validatedData);
      res.status(201).json(matricula);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating matricula:", error);
      res.status(500).json({ message: "Failed to create matricula" });
    }
  });

  app.delete("/api/matriculas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMatricula(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting matricula:", error);
      res.status(500).json({ message: "Failed to delete matricula" });
    }
  });

  // Pagamentos routes
  app.get("/api/pagamentos", isAuthenticated, async (req, res) => {
    try {
      const pagamentos = await storage.getPagamentos();
      res.json(pagamentos);
    } catch (error) {
      console.error("Error fetching pagamentos:", error);
      res.status(500).json({ message: "Failed to fetch pagamentos" });
    }
  });

  app.get("/api/pagamentos/aluno/:alunoId", isAuthenticated, async (req, res) => {
    try {
      const alunoId = parseInt(req.params.alunoId);
      const pagamentos = await storage.getPagamentosByAluno(alunoId);
      res.json(pagamentos);
    } catch (error) {
      console.error("Error fetching pagamentos by aluno:", error);
      res.status(500).json({ message: "Failed to fetch pagamentos by aluno" });
    }
  });

  app.post("/api/pagamentos", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPagamentoSchema.parse(req.body);
      const pagamento = await storage.createPagamento(validatedData);
      res.status(201).json(pagamento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating pagamento:", error);
      res.status(500).json({ message: "Failed to create pagamento" });
    }
  });

  app.delete("/api/pagamentos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePagamento(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pagamento:", error);
      res.status(500).json({ message: "Failed to delete pagamento" });
    }
  });

  // Filiais routes
  app.get("/api/filiais", isAuthenticatedOrResponsavel, async (req, res) => {
    try {
      const filiais = await storage.getFiliais();
      res.json(filiais);
    } catch (error) {
      console.error("Error fetching filiais:", error);
      res.status(500).json({ message: "Failed to fetch filiais" });
    }
  });

  app.get("/api/filiais/detalhadas", isAuthenticated, async (req, res) => {
    try {
      const filiais = await storage.getFiliaisDetalhadas();
      res.json(filiais);
    } catch (error) {
      console.error("Error fetching detailed filiais:", error);
      res.status(500).json({ message: "Failed to fetch detailed filiais" });
    }
  });

  app.get("/api/filiais/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const filial = await storage.getFilial(id);
      if (!filial) {
        return res.status(404).json({ message: "Filial not found" });
      }
      res.json(filial);
    } catch (error) {
      console.error("Error fetching filial:", error);
      res.status(500).json({ message: "Failed to fetch filial" });
    }
  });

  app.post("/api/filiais", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertFilialSchema.parse(req.body);
      const filial = await storage.createFilial(validatedData);
      res.status(201).json(filial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating filial:", error);
      res.status(500).json({ message: "Failed to create filial" });
    }
  });

  app.put("/api/filiais/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFilialSchema.partial().parse(req.body);
      const filial = await storage.updateFilial(id, validatedData);
      res.json(filial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating filial:", error);
      res.status(500).json({ message: "Failed to update filial" });
    }
  });

  app.delete("/api/filiais/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFilial(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting filial:", error);
      res.status(500).json({ message: "Failed to delete filial" });
    }
  });

  // Portal de Responsáveis - Endpoints independentes
  app.post("/api/responsaveis/cadastro", async (req, res) => {
    try {
      const validatedData = insertResponsavelSchema.parse(req.body);
      
      // Verificar se email já existe
      const existingResponsavel = await storage.getResponsavelByEmail(validatedData.email);
      if (existingResponsavel) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      const responsavel = await storage.createResponsavel(validatedData);
      res.status(201).json({ id: responsavel.id, nome: responsavel.nome, email: responsavel.email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating responsavel:", error);
      res.status(500).json({ message: "Erro ao criar conta" });
    }
  });

  app.post("/api/responsaveis/login", async (req, res) => {
    try {
      const { email, senha } = req.body;
      
      if (!email || !senha) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const responsavel = await storage.authenticateResponsavel(email, senha);
      if (!responsavel) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Configurar sessão
      req.session.responsavelId = responsavel.id;
      res.json({ id: responsavel.id, nome: responsavel.nome, email: responsavel.email });
    } catch (error) {
      console.error("Error authenticating responsavel:", error);
      res.status(500).json({ message: "Erro no login" });
    }
  });

  app.get("/api/responsaveis/me", async (req, res) => {
    try {
      const responsavelId = req.session?.responsavelId;
      if (!responsavelId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const responsavelComAlunos = await storage.getResponsavelWithAlunos(responsavelId);
      if (!responsavelComAlunos) {
        return res.status(404).json({ message: "Responsável não encontrado" });
      }

      res.json(responsavelComAlunos);
    } catch (error) {
      console.error("Error fetching responsavel:", error);
      res.status(500).json({ message: "Erro ao buscar dados" });
    }
  });

  app.post("/api/responsaveis/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer logout" });
        }
        res.json({ message: "Logout realizado com sucesso" });
      });
    } catch (error) {
      console.error("Error logging out responsavel:", error);
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });

  // Endpoints para eventos no portal
  app.get("/api/portal/eventos", async (req, res) => {
    try {
      const eventos = await storage.getEventos();
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      res.status(500).json({ message: "Erro ao buscar eventos" });
    }
  });

  app.post("/api/portal/eventos/:id/inscricao", async (req, res) => {
    try {
      const responsavelId = req.session?.responsavelId;
      if (!responsavelId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const eventoId = parseInt(req.params.id);
      const { alunoId, observacoes } = req.body;

      const inscricao = await storage.inscreveAlunoEvento({
        eventoId,
        alunoId,
        observacoes,
      });

      res.status(201).json(inscricao);
    } catch (error) {
      console.error("Error creating inscricao:", error);
      res.status(500).json({ message: "Erro ao inscrever no evento" });
    }
  });

  // Endpoints para uniformes no portal
  app.get("/api/portal/uniformes", async (req, res) => {
    try {
      const uniformes = await storage.getUniformes();
      res.json(uniformes);
    } catch (error) {
      console.error("Error fetching uniformes:", error);
      res.status(500).json({ message: "Erro ao buscar uniformes" });
    }
  });

  app.post("/api/portal/uniformes/:id/comprar", async (req, res) => {
    try {
      const responsavelId = req.session?.responsavelId;
      if (!responsavelId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const uniformeId = parseInt(req.params.id);
      const { alunoId, tamanho, cor, quantidade, preco } = req.body;

      const compra = await storage.comprarUniforme({
        uniformeId,
        alunoId,
        tamanho,
        cor,
        quantidade,
        preco,
      });

      res.status(201).json(compra);
    } catch (error) {
      console.error("Error creating compra uniforme:", error);
      res.status(500).json({ message: "Erro ao comprar uniforme" });
    }
  });

  // Endpoints para notificações no portal
  app.get("/api/portal/notificacoes", async (req, res) => {
    try {
      const responsavelId = req.session?.responsavelId;
      if (!responsavelId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const notificacoes = await storage.getNotificacoesByResponsavel(responsavelId);
      res.json(notificacoes);
    } catch (error) {
      console.error("Error fetching notificacoes:", error);
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });

  app.patch("/api/portal/notificacoes/:id/lida", async (req, res) => {
    try {
      const responsavelId = req.session?.responsavelId;
      if (!responsavelId) {
        return res.status(401).json({ message: "Não autenticado" });
      }

      const notificacaoId = parseInt(req.params.id);
      await storage.marcarNotificacaoLida(notificacaoId);
      res.json({ message: "Notificação marcada como lida" });
    } catch (error) {
      console.error("Error marking notificacao as read:", error);
      res.status(500).json({ message: "Erro ao marcar notificação como lida" });
    }
  });

  // Presenças routes
  app.get("/api/presencas/:turmaId/:data", isAuthenticated, async (req, res) => {
    try {
      const turmaId = parseInt(req.params.turmaId);
      const data = req.params.data;
      const presencas = await storage.getPresencasByTurmaData(turmaId, data);
      res.json(presencas);
    } catch (error) {
      console.error("Error fetching presenças:", error);
      res.status(500).json({ message: "Failed to fetch presenças" });
    }
  });

  app.post("/api/presencas/lote", isAuthenticated, async (req, res) => {
    try {
      const { presencas } = req.body;
      if (!Array.isArray(presencas)) {
        return res.status(400).json({ message: "Presencas must be an array" });
      }
      const novasPresencas = await storage.registrarPresencas(presencas);
      res.status(201).json(novasPresencas);
    } catch (error) {
      console.error("Error registering presenças:", error);
      res.status(500).json({ message: "Failed to register presenças" });
    }
  });

  app.get("/api/presencas/detalhadas", isAuthenticated, async (req, res) => {
    try {
      const presencas = await storage.getPresencasDetalhadas();
      res.json(presencas);
    } catch (error) {
      console.error("Error fetching detailed presencas:", error);
      res.status(500).json({ message: "Failed to fetch detailed presencas" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
