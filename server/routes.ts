import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { addToSync } from "./sync";

// Extend session type for responsavel and gestor
declare module "express-session" {
  interface SessionData {
    responsavelId?: number;
    gestorUnidadeId?: number;
    filialId?: number;
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
  insertCategoriaTesteSchema,
  insertTesteSchema,
  insertAvaliacaoFisicaSchema,
  insertResultadoTesteSchema,
  insertMetaAlunoSchema,
  insertGestorUnidadeSchema,
  loginGestorSchema,
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

// Middleware para verificar se gestor de unidade está autenticado
const isGestorUnidadeAuthenticated = async (req: any, res: any, next: any) => {
  if (req.session && req.session.gestorUnidadeId && req.session.filialId) {
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
      
      // Sincronização automática com sistema principal
      if (validatedData.filialId) {
        await addToSync(validatedData.filialId, 'aluno', 'create', aluno);
      }
      
      res.status(201).json(aluno);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating aluno:", error);
      res.status(500).json({ message: "Failed to create aluno" });
    }
  });

  // Rota para cadastro completo (aluno + responsável)
  app.post("/api/alunos-completo", isAuthenticated, async (req, res) => {
    try {
      const { aluno: alunoData, responsavel: responsavelData } = req.body;
      
      // Primeiro, criar o responsável
      const responsavel = await storage.createResponsavel(responsavelData);
      
      // Depois, criar o aluno vinculado ao responsável
      const alunoCompleto = {
        ...alunoData,
        responsavelId: responsavel.id,
      };
      
      const aluno = await storage.createAluno(alunoCompleto);
      
      // Sincronização automática com sistema principal
      if (alunoData.filialId) {
        await addToSync(alunoData.filialId, 'aluno', 'create', aluno);
      }
      
      res.status(201).json({
        aluno,
        responsavel,
        message: "Aluno e responsável cadastrados com sucesso"
      });
    } catch (error) {
      console.error("Error creating aluno completo:", error);
      res.status(500).json({ message: "Failed to create aluno and responsavel" });
    }
  });

  app.patch("/api/alunos/:id", isAuthenticatedOrResponsavel, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAlunoSchema.partial().parse(req.body);
      const aluno = await storage.updateAluno(id, validatedData);
      
      // Sincronização automática com sistema principal
      if (aluno.filialId) {
        await addToSync(aluno.filialId, 'aluno', 'update', aluno);
      }
      
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
      
      // Buscar aluno antes de deletar para sincronização
      const aluno = await storage.getAluno(id);
      if (aluno && aluno.filialId) {
        await addToSync(aluno.filialId, 'aluno', 'delete', { id });
      }
      
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
      
      // Sincronização automática com sistema principal
      if (validatedData.filialId) {
        await addToSync(validatedData.filialId, 'professor', 'create', professor);
      }
      
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
      
      // Sincronização automática com sistema principal
      if (professor.filialId) {
        await addToSync(professor.filialId, 'professor', 'update', professor);
      }
      
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
      
      // Buscar professor antes de deletar para sincronização
      const professor = await storage.getProfessor(id);
      if (professor && professor.filialId) {
        await addToSync(professor.filialId, 'professor', 'delete', { id });
      }
      
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
      
      // Sincronização automática com sistema principal - buscar aluno para obter filialId
      if (validatedData.alunoId) {
        const aluno = await storage.getAluno(validatedData.alunoId);
        if (aluno && aluno.filialId) {
          await addToSync(aluno.filialId, 'pagamento', 'create', pagamento);
        }
      }
      
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
      
      // Buscar pagamento antes de deletar para sincronização
      const pagamentos = await storage.getPagamentos();
      const pagamento = pagamentos.find(p => p.id === id);
      if (pagamento && pagamento.alunoId) {
        const aluno = await storage.getAluno(pagamento.alunoId);
        if (aluno && aluno.filialId) {
          await addToSync(aluno.filialId, 'pagamento', 'delete', { id });
        }
      }
      
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
      
      // Sincronização automática com sistema principal - buscar turma para obter filialId
      if (presencas.length > 0) {
        const turmaId = presencas[0].turmaId;
        const turmas = await storage.getTurmas();
        const turma = turmas.find(t => t.id === turmaId);
        if (turma && turma.filialId) {
          await addToSync(turma.filialId, 'presenca', 'create', novasPresencas);
        }
      }
      
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

  // Pacotes de treino routes
  app.get("/api/pacotes-treino", async (req, res) => {
    try {
      const pacotes = await storage.getPacotesTreino();
      res.json(pacotes);
    } catch (error) {
      console.error("Error fetching pacotes treino:", error);
      res.status(500).json({ message: "Failed to fetch pacotes treino" });
    }
  });

  app.post("/api/pacotes-treino", isAuthenticated, async (req, res) => {
    try {
      const pacote = await storage.createPacoteTreino(req.body);
      res.json(pacote);
    } catch (error) {
      console.error("Error creating pacote treino:", error);
      res.status(500).json({ message: "Failed to create pacote treino" });
    }
  });

  app.get("/api/assinaturas-pacotes", async (req, res) => {
    try {
      const assinaturas = await storage.getAssinaturasPacotes();
      res.json(assinaturas);
    } catch (error) {
      console.error("Error fetching assinaturas pacotes:", error);
      res.status(500).json({ message: "Failed to fetch assinaturas pacotes" });
    }
  });

  app.post("/api/assinaturas-pacotes", async (req, res) => {
    try {
      const assinatura = await storage.criarAssinaturaPacote(req.body);
      res.json(assinatura);
    } catch (error) {
      console.error("Error creating assinatura pacote:", error);
      res.status(500).json({ message: "Failed to create assinatura pacote" });
    }
  });

  // Physical Evaluation Routes - Categorias de Testes
  app.get("/api/categorias-testes", isAuthenticated, async (req, res) => {
    try {
      const categorias = await storage.getCategoriasTestes();
      res.json(categorias);
    } catch (error) {
      console.error("Error fetching categorias testes:", error);
      res.status(500).json({ message: "Failed to fetch categorias testes" });
    }
  });

  app.post("/api/categorias-testes", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCategoriaTesteSchema.parse(req.body);
      const categoria = await storage.createCategoriaTeste(validatedData);
      res.status(201).json(categoria);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating categoria teste:", error);
      res.status(500).json({ message: "Failed to create categoria teste" });
    }
  });

  app.put("/api/categorias-testes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategoriaTesteSchema.partial().parse(req.body);
      const categoria = await storage.updateCategoriaTeste(id, validatedData);
      res.json(categoria);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating categoria teste:", error);
      res.status(500).json({ message: "Failed to update categoria teste" });
    }
  });

  app.delete("/api/categorias-testes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategoriaTeste(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting categoria teste:", error);
      res.status(500).json({ message: "Failed to delete categoria teste" });
    }
  });

  // Testes Routes
  app.get("/api/testes", isAuthenticated, async (req, res) => {
    try {
      const testes = await storage.getTestes();
      res.json(testes);
    } catch (error) {
      console.error("Error fetching testes:", error);
      res.status(500).json({ message: "Failed to fetch testes" });
    }
  });

  app.get("/api/testes/categoria/:categoriaId", isAuthenticated, async (req, res) => {
    try {
      const categoriaId = parseInt(req.params.categoriaId);
      const testes = await storage.getTestesByCategoria(categoriaId);
      res.json(testes);
    } catch (error) {
      console.error("Error fetching testes by categoria:", error);
      res.status(500).json({ message: "Failed to fetch testes by categoria" });
    }
  });

  app.post("/api/testes", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTesteSchema.parse(req.body);
      const teste = await storage.createTeste(validatedData);
      res.status(201).json(teste);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating teste:", error);
      res.status(500).json({ message: "Failed to create teste" });
    }
  });

  app.put("/api/testes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTesteSchema.partial().parse(req.body);
      const teste = await storage.updateTeste(id, validatedData);
      res.json(teste);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating teste:", error);
      res.status(500).json({ message: "Failed to update teste" });
    }
  });

  app.delete("/api/testes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeste(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting teste:", error);
      res.status(500).json({ message: "Failed to delete teste" });
    }
  });

  // Avaliacoes Fisicas Routes
  app.get("/api/avaliacoes-fisicas", isAuthenticated, async (req, res) => {
    try {
      const avaliacoes = await storage.getAvaliacoesFisicas();
      res.json(avaliacoes);
    } catch (error) {
      console.error("Error fetching avaliacoes fisicas:", error);
      res.status(500).json({ message: "Failed to fetch avaliacoes fisicas" });
    }
  });

  app.get("/api/avaliacoes-fisicas/aluno/:alunoId", isAuthenticated, async (req, res) => {
    try {
      const alunoId = parseInt(req.params.alunoId);
      const avaliacoes = await storage.getAvaliacoesByAluno(alunoId);
      res.json(avaliacoes);
    } catch (error) {
      console.error("Error fetching avaliacoes by aluno:", error);
      res.status(500).json({ message: "Failed to fetch avaliacoes by aluno" });
    }
  });

  app.get("/api/avaliacoes-fisicas/filial/:filialId", isAuthenticated, async (req, res) => {
    try {
      const filialId = parseInt(req.params.filialId);
      const avaliacoes = await storage.getAvaliacoesByFilial(filialId);
      res.json(avaliacoes);
    } catch (error) {
      console.error("Error fetching avaliacoes by filial:", error);
      res.status(500).json({ message: "Failed to fetch avaliacoes by filial" });
    }
  });

  app.post("/api/avaliacoes-fisicas", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAvaliacaoFisicaSchema.parse(req.body);
      const avaliacao = await storage.createAvaliacaoFisica(validatedData);
      
      // Sincronização automática com sistema principal
      if (validatedData.alunoId) {
        const aluno = await storage.getAluno(validatedData.alunoId);
        if (aluno && aluno.filialId) {
          await addToSync(aluno.filialId, 'avaliacao', 'create', avaliacao);
        }
      }
      
      res.status(201).json(avaliacao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating avaliacao fisica:", error);
      res.status(500).json({ message: "Failed to create avaliacao fisica" });
    }
  });

  app.put("/api/avaliacoes-fisicas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAvaliacaoFisicaSchema.partial().parse(req.body);
      const avaliacao = await storage.updateAvaliacaoFisica(id, validatedData);
      res.json(avaliacao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating avaliacao fisica:", error);
      res.status(500).json({ message: "Failed to update avaliacao fisica" });
    }
  });

  app.delete("/api/avaliacoes-fisicas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAvaliacaoFisica(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting avaliacao fisica:", error);
      res.status(500).json({ message: "Failed to delete avaliacao fisica" });
    }
  });

  // Resultados Testes Routes
  app.get("/api/resultados-testes", isAuthenticated, async (req, res) => {
    try {
      const resultados = await storage.getResultadosTestes();
      res.json(resultados);
    } catch (error) {
      console.error("Error fetching resultados testes:", error);
      res.status(500).json({ message: "Failed to fetch resultados testes" });
    }
  });

  app.get("/api/resultados-testes/avaliacao/:avaliacaoId", isAuthenticated, async (req, res) => {
    try {
      const avaliacaoId = parseInt(req.params.avaliacaoId);
      const resultados = await storage.getResultadosByAvaliacao(avaliacaoId);
      res.json(resultados);
    } catch (error) {
      console.error("Error fetching resultados by avaliacao:", error);
      res.status(500).json({ message: "Failed to fetch resultados by avaliacao" });
    }
  });

  app.post("/api/resultados-testes", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertResultadoTesteSchema.parse(req.body);
      const resultado = await storage.createResultadoTeste(validatedData);
      res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating resultado teste:", error);
      res.status(500).json({ message: "Failed to create resultado teste" });
    }
  });

  app.put("/api/resultados-testes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertResultadoTesteSchema.partial().parse(req.body);
      const resultado = await storage.updateResultadoTeste(id, validatedData);
      res.json(resultado);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating resultado teste:", error);
      res.status(500).json({ message: "Failed to update resultado teste" });
    }
  });

  app.delete("/api/resultados-testes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteResultadoTeste(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting resultado teste:", error);
      res.status(500).json({ message: "Failed to delete resultado teste" });
    }
  });

  // Metas Alunos Routes
  app.get("/api/metas-alunos", isAuthenticated, async (req, res) => {
    try {
      const metas = await storage.getMetasAlunos();
      res.json(metas);
    } catch (error) {
      console.error("Error fetching metas alunos:", error);
      res.status(500).json({ message: "Failed to fetch metas alunos" });
    }
  });

  app.get("/api/metas-alunos/aluno/:alunoId", isAuthenticated, async (req, res) => {
    try {
      const alunoId = parseInt(req.params.alunoId);
      const metas = await storage.getMetasByAluno(alunoId);
      res.json(metas);
    } catch (error) {
      console.error("Error fetching metas by aluno:", error);
      res.status(500).json({ message: "Failed to fetch metas by aluno" });
    }
  });

  app.post("/api/metas-alunos", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMetaAlunoSchema.parse(req.body);
      const meta = await storage.createMetaAluno(validatedData);
      res.status(201).json(meta);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating meta aluno:", error);
      res.status(500).json({ message: "Failed to create meta aluno" });
    }
  });

  app.put("/api/metas-alunos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMetaAlunoSchema.partial().parse(req.body);
      const meta = await storage.updateMetaAluno(id, validatedData);
      res.json(meta);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating meta aluno:", error);
      res.status(500).json({ message: "Failed to update meta aluno" });
    }
  });

  app.delete("/api/metas-alunos/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMetaAluno(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meta aluno:", error);
      res.status(500).json({ message: "Failed to delete meta aluno" });
    }
  });

  // Combos de Aulas Routes
  app.get("/api/combos-aulas", isAuthenticated, async (req, res) => {
    try {
      const combos = await storage.getCombosAulas();
      res.json(combos);
    } catch (error) {
      console.error("Error fetching combos aulas:", error);
      res.status(500).json({ message: "Failed to fetch combos aulas" });
    }
  });

  app.post("/api/combos-aulas", isAuthenticated, async (req, res) => {
    try {
      const combo = await storage.createComboAulas(req.body);
      res.status(201).json(combo);
    } catch (error) {
      console.error("Error creating combo aulas:", error);
      res.status(500).json({ message: "Failed to create combo aulas" });
    }
  });

  app.put("/api/combos-aulas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const combo = await storage.updateComboAulas(id, req.body);
      res.json(combo);
    } catch (error) {
      console.error("Error updating combo aulas:", error);
      res.status(500).json({ message: "Failed to update combo aulas" });
    }
  });

  app.delete("/api/combos-aulas/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteComboAulas(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting combo aulas:", error);
      res.status(500).json({ message: "Failed to delete combo aulas" });
    }
  });

  // Sync management routes
  app.get("/api/sync/status", isAuthenticated, async (req, res) => {
    try {
      const { syncManager } = await import("./sync");
      const stats = syncManager.getSyncStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting sync status:", error);
      res.status(500).json({ message: "Failed to get sync status" });
    }
  });

  app.post("/api/sync/force", isAuthenticated, async (req, res) => {
    try {
      const { syncManager } = await import("./sync");
      await syncManager.forceSyncNow();
      res.json({ message: "Sync forced successfully" });
    } catch (error) {
      console.error("Error forcing sync:", error);
      res.status(500).json({ message: "Failed to force sync" });
    }
  });

  // Unit Manager Authentication Routes
  app.post("/api/unidade/cadastro", async (req, res) => {
    try {
      const validatedData = insertGestorUnidadeSchema.parse(req.body);
      
      // Check if email already exists
      const existingGestor = await storage.getGestorUnidadeByEmail(validatedData.email);
      if (existingGestor) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      const gestor = await storage.createGestorUnidade(validatedData);
      res.status(201).json({ message: "Cadastro realizado com sucesso! Aguarde aprovação do administrador." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating gestor unidade:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/unidade/login", async (req, res) => {
    try {
      const validatedData = loginGestorSchema.parse(req.body);
      
      const gestor = await storage.authenticateGestorUnidade(validatedData.email, validatedData.senha);
      if (!gestor) {
        return res.status(401).json({ message: "Credenciais inválidas ou conta inativa" });
      }

      // Store in session
      req.session.gestorUnidadeId = gestor.id;
      req.session.filialId = gestor.filialId;
      
      res.json({ 
        message: "Login realizado com sucesso", 
        filialId: gestor.filialId,
        gestorId: gestor.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error authenticating gestor unidade:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/unidade/logout", (req, res) => {
    req.session.gestorUnidadeId = undefined;
    req.session.filialId = undefined;
    res.json({ message: "Logout realizado com sucesso" });
  });

  // Complete Unit and Manager Registration
  app.post("/api/unidade/cadastro-completo", async (req, res) => {
    try {
      const { gestor, unidade } = req.body;
      
      // Validate gestor data
      const validatedGestor = z.object({
        nome: z.string().min(1),
        email: z.string().email(),
        senha: z.string().min(6),
        telefone: z.string().optional(),
      }).parse(gestor);
      
      // Validate unidade data  
      const validatedUnidade = insertFilialSchema.parse(unidade);
      
      // Check if email already exists
      const existingGestor = await storage.getGestorUnidadeByEmail(validatedGestor.email);
      if (existingGestor) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }

      // Create the unit first
      const novaUnidade = await storage.createFilial(validatedUnidade);
      
      // Create the manager with the new unit ID
      const novoGestor = await storage.createGestorUnidade({
        ...validatedGestor,
        filialId: novaUnidade.id,
        ativo: true,
        papel: "gestor",
      });
      
      res.status(201).json({ 
        message: "Unidade e gestor cadastrados com sucesso!",
        unidadeId: novaUnidade.id,
        gestorId: novoGestor.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error creating complete registration:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ========== ROUTES DO PORTAL DA UNIDADE ==========
  
  // Login para gestores de unidade
  app.post("/api/auth/unidade/login", async (req, res) => {
    try {
      const { email, senha } = loginGestorSchema.parse(req.body);
      
      const gestor = await storage.authenticateGestorUnidade(email, senha);
      if (!gestor) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Atualizar último login
      await storage.updateGestorUltimoLogin(gestor.id);

      // Armazenar na sessão
      req.session.gestorUnidadeId = gestor.id;
      req.session.filialId = gestor.filialId;

      res.json({
        gestor: {
          id: gestor.id,
          nome: gestor.nome,
          email: gestor.email,
          filialId: gestor.filialId,
          papel: gestor.papel
        },
        filial: gestor.filial
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error in unidade login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Logout para gestores de unidade
  app.post("/api/auth/unidade/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Get gestor unidade by ID
  app.get("/api/gestores-unidade/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const gestor = await storage.getGestorUnidade(id);
      if (!gestor) {
        return res.status(404).json({ message: "Gestor not found" });
      }
      res.json(gestor);
    } catch (error) {
      console.error("Error fetching gestor unidade:", error);
      res.status(500).json({ message: "Failed to fetch gestor" });
    }
  });

  // Check unit authentication status
  app.get("/api/unidade/auth/check", async (req, res) => {
    if (req.session && req.session.gestorUnidadeId && req.session.filialId) {
      try {
        const gestor = await storage.getGestorUnidade(req.session.gestorUnidadeId);
        if (gestor) {
          res.json({
            authenticated: true,
            gestor: {
              id: gestor.id,
              nome: gestor.nome,
              email: gestor.email,
              filialId: gestor.filialId
            }
          });
        } else {
          res.json({ authenticated: false });
        }
      } catch (error) {
        res.json({ authenticated: false });
      }
    } else {
      res.json({ authenticated: false });
    }
  });

  // Dashboard metrics da unidade
  app.get("/api/unidade/dashboard/metrics/:filialId", isGestorUnidadeAuthenticated, async (req, res) => {
    try {
      const filialId = parseInt(req.params.filialId);
      
      // Verificar se o gestor tem acesso a esta filial
      if (req.session.filialId !== filialId) {
        return res.status(403).json({ message: "Acesso negado a esta unidade" });
      }

      const alunos = await storage.getAlunosByFilial(filialId);
      const professores = await storage.getProfessoresByFilial(filialId);
      const turmas = await storage.getTurmasByFilial(filialId);
      
      // Calcular receita mensal (pagamentos do mês atual dos alunos da filial)
      const agora = new Date();
      const mesAtual = agora.getFullYear() + "-" + String(agora.getMonth() + 1).padStart(2, '0');
      
      let receitaMensal = 0;
      for (const aluno of alunos) {
        const pagamentos = await storage.getPagamentosByAluno(aluno.id);
        const pagamentosMes = pagamentos.filter(p => p.mesReferencia === mesAtual);
        receitaMensal += pagamentosMes.reduce((sum, p) => sum + parseFloat(p.valor.toString()), 0);
      }

      const metrics = {
        totalAlunos: alunos.length,
        totalProfessores: professores.length,
        totalTurmas: turmas.length,
        receitaMensal
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching unidade dashboard metrics:", error);
      res.status(500).json({ message: "Erro ao buscar métricas da unidade" });
    }
  });

  // Alunos por filial (para o portal da unidade)
  app.get("/api/unidade/alunos/:filialId", isGestorUnidadeAuthenticated, async (req, res) => {
    try {
      const filialId = parseInt(req.params.filialId);
      
      // Verificar se o gestor tem acesso a esta filial
      if (req.session.filialId !== filialId) {
        return res.status(403).json({ message: "Acesso negado a esta unidade" });
      }

      const alunos = await storage.getAlunosByFilial(filialId);
      
      // Adicionar informações de sincronização
      const alunosComSync = alunos.map(aluno => ({
        ...aluno,
        sincronizado: true, // Por enquanto, assumir que todos estão sincronizados
        ultimaSync: new Date().toISOString()
      }));

      res.json(alunosComSync);
    } catch (error) {
      console.error("Error fetching alunos by filial:", error);
      res.status(500).json({ message: "Erro ao buscar alunos da unidade" });
    }
  });

  // Professores por filial (para o portal da unidade)
  app.get("/api/unidade/professores/:filialId", isGestorUnidadeAuthenticated, async (req, res) => {
    try {
      const filialId = parseInt(req.params.filialId);
      
      // Verificar se o gestor tem acesso a esta filial
      if (req.session.filialId !== filialId) {
        return res.status(403).json({ message: "Acesso negado a esta unidade" });
      }

      const professores = await storage.getProfessoresByFilial(filialId);
      res.json(professores);
    } catch (error) {
      console.error("Error fetching professores by filial:", error);
      res.status(500).json({ message: "Erro ao buscar professores da unidade" });
    }
  });

  // Turmas por filial (para o portal da unidade)
  app.get("/api/unidade/turmas/:filialId", isGestorUnidadeAuthenticated, async (req, res) => {
    try {
      const filialId = parseInt(req.params.filialId);
      
      // Verificar se o gestor tem acesso a esta filial
      if (req.session.filialId !== filialId) {
        return res.status(403).json({ message: "Acesso negado a esta unidade" });
      }

      const turmas = await storage.getTurmasByFilial(filialId);
      res.json(turmas);
    } catch (error) {
      console.error("Error fetching turmas by filial:", error);
      res.status(500).json({ message: "Erro ao buscar turmas da unidade" });
    }
  });

  // Criar aluno com sincronização automática
  app.post("/api/unidade/alunos", isGestorUnidadeAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAlunoSchema.parse(req.body);
      
      // Garantir que o aluno seja criado na filial correta
      const alunoData = {
        ...validatedData,
        filialId: req.session.filialId
      };

      const aluno = await storage.createAluno(alunoData);
      
      // Adicionar à fila de sincronização
      await addToSync(
        req.session.filialId!,
        'aluno',
        'create',
        aluno
      );

      res.status(201).json(aluno);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating aluno in unidade:", error);
      res.status(500).json({ message: "Failed to create aluno" });
    }
  });

  // Atualizar aluno com sincronização automática
  app.put("/api/unidade/alunos/:id", isGestorUnidadeAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o aluno pertence à filial do gestor
      const alunoExistente = await storage.getAluno(id);
      if (!alunoExistente || alunoExistente.filialId !== req.session.filialId) {
        return res.status(403).json({ message: "Acesso negado a este aluno" });
      }

      const validatedData = insertAlunoSchema.partial().parse(req.body);
      const aluno = await storage.updateAluno(id, validatedData);
      
      // Adicionar à fila de sincronização
      await addToSync(
        req.session.filialId!,
        'aluno',
        'update',
        aluno
      );

      res.json(aluno);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating aluno in unidade:", error);
      res.status(500).json({ message: "Failed to update aluno" });
    }
  });

  // Criar professor com sincronização automática
  app.post("/api/unidade/professores", isGestorUnidadeAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProfessorSchema.parse(req.body);
      
      // Garantir que o professor seja criado na filial correta
      const professorData = {
        ...validatedData,
        filialId: req.session.filialId
      };

      const professor = await storage.createProfessor(professorData);
      
      // Adicionar à fila de sincronização
      await addToSync(
        req.session.filialId!,
        'professor',
        'create',
        professor
      );

      res.status(201).json(professor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating professor in unidade:", error);
      res.status(500).json({ message: "Failed to create professor" });
    }
  });

  // Registrar pagamento com sincronização automática
  app.post("/api/unidade/pagamentos", isGestorUnidadeAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPagamentoSchema.parse(req.body);
      
      // Verificar se o aluno pertence à filial do gestor
      if (!validatedData.alunoId) {
        return res.status(400).json({ message: "ID do aluno é obrigatório" });
      }
      
      const aluno = await storage.getAluno(validatedData.alunoId);
      if (!aluno || aluno.filialId !== req.session.filialId) {
        return res.status(403).json({ message: "Acesso negado a este aluno" });
      }

      const pagamento = await storage.createPagamento(validatedData);
      
      // Adicionar à fila de sincronização
      await addToSync(
        req.session.filialId!,
        'pagamento',
        'create',
        pagamento
      );

      res.status(201).json(pagamento);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating pagamento in unidade:", error);
      res.status(500).json({ message: "Failed to create pagamento" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
