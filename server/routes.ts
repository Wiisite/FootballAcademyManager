import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  adminLoginSchema,
  updateAlunoContactSchema,
  guardianInscricaoEventoSchema,
  guardianCompraUniformeSchema,
  notificacoes,
  responsaveis
} from "@shared/schema";
import { addToSync } from "./sync";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { desc, eq } from "drizzle-orm";

// Extend session type for all authentication types
declare module "express-session" {
  interface SessionData {
    responsavelId?: number;
    gestorUnidadeId?: number;
    filialId?: number;
    adminId?: number;
    adminUser?: {
      id: number;
      nome: string;
      email: string;
      papel: string;
    };
  }
}

// Admin authentication middleware
const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.adminId || !req.session.adminUser) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  next();
};

// Unit manager authentication middleware
const requireGestorAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.gestorUnidadeId) {
    return res.status(401).json({ message: "Unit manager authentication required" });
  }
  next();
};

// Guardian authentication middleware
const requireResponsavelAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.responsavelId) {
    return res.status(401).json({ message: "Guardian authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware for traditional authentication
  const PostgresSessionStore = connectPg(session);
  
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60, // 7 days
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'escola-futebol-secret-2024',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // Traditional admin authentication routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, senha } = adminLoginSchema.parse(req.body);
      
      const user = await storage.authenticateAdminUser(email, senha);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      // Store admin user in session
      req.session.adminId = user.id;
      req.session.adminUser = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.papel || 'admin'
      };

      res.json({
        success: true,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          papel: user.papel
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(400).json({ message: "Dados de login inválidos" });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/admin/user', (req, res) => {
    if (!req.session || !req.session.adminId || !req.session.adminUser) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    res.json(req.session.adminUser);
  });

  // Temporary endpoint to create admin user - REMOVE AFTER USE
  app.get('/api/setup-admin', async (req, res) => {
    try {
      const existingAdmin = await storage.getAdminUserByEmail('admin@escolafut.com');
      if (existingAdmin) {
        return res.json({ message: 'Admin já existe', email: 'admin@escolafut.com' });
      }
      
      const admin = await storage.createAdminUser({
        nome: 'Administrador',
        email: 'admin@escolafut.com',
        senha: 'admin123',
        ativo: true,
        papel: 'admin'
      });
      
      res.json({ 
        success: true, 
        message: 'Admin criado com sucesso!',
        email: 'admin@escolafut.com',
        senha: 'admin123'
      });
    } catch (error) {
      console.error('Erro ao criar admin:', error);
      res.status(500).json({ message: 'Erro ao criar admin', error: String(error) });
    }
  });

  // Dashboard routes - protected by admin authentication
  app.get("/api/dashboard/metrics", requireAdminAuth, async (req, res) => {
    try {
      const totalAlunos = (await storage.getAlunos()).length;
      const totalProfessores = (await storage.getProfessores()).length;
      const totalTurmas = (await storage.getTurmas()).length;
      
      const pagamentos = await storage.getPagamentos();
      const receitaMensal = pagamentos
        .filter(p => {
          const currentMonth = new Date().toISOString().slice(0, 7);
          return p.mesReferencia === currentMonth;
        })
        .reduce((total, p) => total + parseFloat(p.valor || "0"), 0);

      res.json({
        totalAlunos,
        totalProfessores,
        totalTurmas,
        receitaMensal,
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Alunos routes - protected by admin authentication
  app.get("/api/alunos", async (req, res) => {
    try {
      // Check if it's admin or unit manager auth
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let alunos = await storage.getAlunos();
      
      // If it's a unit manager, filter by filial
      if (isGestor && !isAdmin) {
        alunos = alunos.filter(aluno => aluno.filialId === req.session.filialId);
      }
      
      res.json(alunos);
    } catch (error) {
      console.error("Error fetching alunos:", error);
      res.status(500).json({ message: "Failed to fetch alunos" });
    }
  });

  app.get("/api/alunos/:id", async (req, res) => {
    try {
      // Check if it's admin or unit manager auth
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const aluno = await storage.getAluno(id);
      if (!aluno) {
        return res.status(404).json({ message: "Aluno not found" });
      }

      // If it's a unit manager, check if aluno belongs to their filial
      if (isGestor && !isAdmin && aluno.filialId !== req.session.filialId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(aluno);
    } catch (error) {
      console.error("Error fetching aluno:", error);
      res.status(500).json({ message: "Failed to fetch aluno" });
    }
  });

  // Rota completa para cadastrar aluno + responsável
  app.post("/api/alunos-completo", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { aluno: alunoData, responsavel: responsavelData } = req.body;

      // If it's a unit manager, ensure filialId matches their unit
      if (isGestor && !isAdmin) {
        alunoData.filialId = req.session.filialId;
      }

      // Criar aluno com dados do responsável para criar acesso ao portal
      const aluno = await storage.createAluno({
        ...alunoData,
        nomeResponsavel: responsavelData.nome,
        telefoneResponsavel: responsavelData.telefone,
        cpfResponsavel: responsavelData.cpf,
        emailResponsavel: responsavelData.email,
        senhaResponsavel: responsavelData.senha,
      });

      res.status(201).json(aluno);
    } catch (error: any) {
      console.error("Error creating aluno completo:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Email ou CPF do responsável já cadastrado" });
      }
      res.status(500).json({ message: "Failed to create aluno" });
    }
  });

  app.post("/api/alunos", async (req, res) => {
    try {
      // Check if it's admin or unit manager auth
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const alunoData = req.body;

      // If it's a unit manager, ensure filialId matches their unit
      if (isGestor && !isAdmin) {
        alunoData.filialId = req.session.filialId;
      }

      const aluno = await storage.createAluno(alunoData);
      res.status(201).json(aluno);
    } catch (error) {
      console.error("Error creating aluno:", error);
      res.status(500).json({ message: "Failed to create aluno" });
    }
  });

  app.put("/api/alunos/:id", async (req, res) => {
    try {
      // Check if it's admin or unit manager auth
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const alunoData = req.body;

      // If it's a unit manager, verify the aluno belongs to their filial
      if (isGestor && !isAdmin) {
        const existingAluno = await storage.getAluno(id);
        if (!existingAluno || existingAluno.filialId !== req.session.filialId) {
          return res.status(403).json({ message: "Access denied" });
        }
        // Ensure filialId cannot be changed
        alunoData.filialId = req.session.filialId;
      }

      const aluno = await storage.updateAluno(id, alunoData);
      res.json(aluno);
    } catch (error) {
      console.error("Error updating aluno:", error);
      res.status(500).json({ message: "Failed to update aluno" });
    }
  });

  app.delete("/api/alunos/:id", async (req, res) => {
    try {
      // Check if it's admin or unit manager auth
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);

      // If it's a unit manager, verify the aluno belongs to their filial
      if (isGestor && !isAdmin) {
        const existingAluno = await storage.getAluno(id);
        if (!existingAluno || existingAluno.filialId !== req.session.filialId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await storage.deleteAluno(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting aluno:", error);
      res.status(500).json({ message: "Failed to delete aluno" });
    }
  });

  // Professores routes - protected by admin or unit manager authentication
  app.get("/api/professores", async (req, res) => {
    try {
      // Check if it's admin or unit manager auth
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let professores = await storage.getProfessores();
      
      // If it's a unit manager, filter by filial
      if (isGestor && !isAdmin) {
        professores = professores.filter(professor => professor.filialId === req.session.filialId);
      }
      
      res.json(professores);
    } catch (error) {
      console.error("Error fetching professores:", error);
      res.status(500).json({ message: "Failed to fetch professores" });
    }
  });

  // POST professor
  app.post("/api/professores", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const professorData = req.body;

      // If it's a unit manager, ensure filialId matches their unit
      if (isGestor && !isAdmin) {
        professorData.filialId = req.session.filialId;
      }

      const professor = await storage.createProfessor(professorData);
      res.status(201).json(professor);
    } catch (error) {
      console.error("Error creating professor:", error);
      res.status(500).json({ message: "Failed to create professor" });
    }
  });

  // PUT professor
  app.put("/api/professores/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const professorData = req.body;

      const professor = await storage.updateProfessor(id, professorData);
      res.json(professor);
    } catch (error) {
      console.error("Error updating professor:", error);
      res.status(500).json({ message: "Failed to update professor" });
    }
  });

  // DELETE professor
  app.delete("/api/professores/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteProfessor(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting professor:", error);
      res.status(500).json({ message: "Failed to delete professor" });
    }
  });

  // Turmas routes - protected by admin or unit manager authentication
  app.get("/api/turmas", async (req, res) => {
    try {
      // Check if it's admin or unit manager auth
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let turmas = await storage.getTurmas();
      
      // If it's a unit manager, filter by filial
      if (isGestor && !isAdmin) {
        turmas = turmas.filter(turma => turma.filialId === req.session.filialId);
      }
      
      res.json(turmas);
    } catch (error) {
      console.error("Error fetching turmas:", error);
      res.status(500).json({ message: "Failed to fetch turmas" });
    }
  });

  // POST turma
  app.post("/api/turmas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const turmaData = req.body;

      // If it's a unit manager, ensure filialId matches their unit
      if (isGestor && !isAdmin) {
        turmaData.filialId = req.session.filialId;
      }

      const turma = await storage.createTurma(turmaData);
      res.status(201).json(turma);
    } catch (error) {
      console.error("Error creating turma:", error);
      res.status(500).json({ message: "Failed to create turma" });
    }
  });

  // PUT turma
  app.put("/api/turmas/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const turmaData = req.body;

      const turma = await storage.updateTurma(id, turmaData);
      res.json(turma);
    } catch (error) {
      console.error("Error updating turma:", error);
      res.status(500).json({ message: "Failed to update turma" });
    }
  });

  // DELETE turma
  app.delete("/api/turmas/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteTurma(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting turma:", error);
      res.status(500).json({ message: "Failed to delete turma" });
    }
  });

  // Filiais routes - protected by admin or unit manager authentication
  app.get("/api/filiais", async (req, res) => {
    try {
      // Check if it's admin or unit manager auth
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let filiais = await storage.getFiliais();
      
      // If it's a unit manager, filter to only their filial
      if (isGestor && !isAdmin) {
        filiais = filiais.filter(filial => filial.id === req.session.filialId);
      }
      
      res.json(filiais);
    } catch (error) {
      console.error("Error fetching filiais:", error);
      res.status(500).json({ message: "Failed to fetch filiais" });
    }
  });

  app.get("/api/filiais/detalhadas", requireAdminAuth, async (req, res) => {
    try {
      const filiais = await storage.getFiliaisDetalhadas();
      res.json(filiais);
    } catch (error) {
      console.error("Error fetching detailed filiais:", error);
      res.status(500).json({ message: "Failed to fetch detailed filiais" });
    }
  });

  app.get("/api/filiais/:id", async (req, res) => {
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

  // POST filial
  app.post("/api/filiais", requireAdminAuth, async (req, res) => {
    try {
      const filialData = req.body;
      const filial = await storage.createFilial(filialData);
      res.status(201).json(filial);
    } catch (error) {
      console.error("Error creating filial:", error);
      res.status(500).json({ message: "Failed to create filial" });
    }
  });

  // PUT filial
  app.put("/api/filiais/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const filialData = req.body;
      const filial = await storage.updateFilial(id, filialData);
      res.json(filial);
    } catch (error) {
      console.error("Error updating filial:", error);
      res.status(500).json({ message: "Failed to update filial" });
    }
  });

  // DELETE filial
  app.delete("/api/filiais/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFilial(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting filial:", error);
      res.status(500).json({ message: "Failed to delete filial" });
    }
  });

  app.get("/api/sync/status", requireAdminAuth, async (req, res) => {
    try {
      // Return sync status for portal
      res.json({
        lastSync: new Date().toISOString(),
        status: "success",
        pendingChanges: 0
      });
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ message: "Failed to fetch sync status" });
    }
  });

  // Planos Financeiros routes
  app.get("/api/planos-financeiros", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let planos = await storage.getPlanosFinanceiros();
      
      // If it's a unit manager, filter plans by their filial or global plans (filialId = null)
      if (isGestor && !isAdmin) {
        planos = planos.filter(p => !p.filialId || p.filialId === req.session.filialId);
      }
      
      res.json(planos);
    } catch (error) {
      console.error("Error fetching planos financeiros:", error);
      res.status(500).json({ message: "Failed to fetch planos financeiros" });
    }
  });

  app.get("/api/planos-financeiros/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const plano = await storage.getPlanoFinanceiro(parseInt(req.params.id));
      if (!plano) {
        return res.status(404).json({ message: "Plano not found" });
      }
      res.json(plano);
    } catch (error) {
      console.error("Error fetching plano financeiro:", error);
      res.status(500).json({ message: "Failed to fetch plano financeiro" });
    }
  });

  app.post("/api/planos-financeiros", requireAdminAuth, async (req, res) => {
    try {
      const { insertPlanoFinanceiroSchema } = await import("@shared/schema");
      const validationResult = insertPlanoFinanceiroSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid plano data", 
          errors: validationResult.error.errors 
        });
      }

      const plano = await storage.createPlanoFinanceiro(validationResult.data);
      res.status(201).json(plano);
    } catch (error) {
      console.error("Error creating plano financeiro:", error);
      res.status(500).json({ message: "Failed to create plano financeiro" });
    }
  });

  app.put("/api/planos-financeiros/:id", requireAdminAuth, async (req, res) => {
    try {
      const { insertPlanoFinanceiroSchema } = await import("@shared/schema");
      const validationResult = insertPlanoFinanceiroSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid plano data", 
          errors: validationResult.error.errors 
        });
      }

      const plano = await storage.updatePlanoFinanceiro(parseInt(req.params.id), validationResult.data);
      res.json(plano);
    } catch (error) {
      console.error("Error updating plano financeiro:", error);
      res.status(500).json({ message: "Failed to update plano financeiro" });
    }
  });

  app.delete("/api/planos-financeiros/:id", requireAdminAuth, async (req, res) => {
    try {
      await storage.deletePlanoFinanceiro(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting plano financeiro:", error);
      res.status(500).json({ message: "Failed to delete plano financeiro" });
    }
  });

  // Notificações routes - Admin can send notifications to guardians
  app.get("/api/notificacoes", requireAdminAuth, async (req, res) => {
    try {
      // Get all notifications (admin view)
      const allNotificacoes = await db.select().from(notificacoes).orderBy(desc(notificacoes.createdAt));
      res.json(allNotificacoes);
    } catch (error) {
      console.error("Error fetching notificacoes:", error);
      res.status(500).json({ message: "Failed to fetch notificacoes" });
    }
  });

  app.post("/api/notificacoes", requireAdminAuth, async (req, res) => {
    try {
      const { responsavelId, titulo, mensagem, tipo, dataVencimento } = req.body;
      
      const notificacao = await storage.createNotificacao({
        responsavelId,
        titulo,
        mensagem,
        tipo: tipo || "geral",
        dataVencimento,
      });
      
      res.status(201).json(notificacao);
    } catch (error) {
      console.error("Error creating notificacao:", error);
      res.status(500).json({ message: "Failed to create notificacao" });
    }
  });

  // Send notification to all guardians
  app.post("/api/notificacoes/enviar-todos", requireAdminAuth, async (req, res) => {
    try {
      const { titulo, mensagem, tipo, dataVencimento } = req.body;
      
      // Get all responsaveis
      const todosResponsaveis = await db.select().from(responsaveis);
      
      const notificacoesCriadas = [];
      for (const resp of todosResponsaveis) {
        const notificacao = await storage.createNotificacao({
          responsavelId: resp.id,
          titulo,
          mensagem,
          tipo: tipo || "geral",
          dataVencimento,
        });
        notificacoesCriadas.push(notificacao);
      }
      
      res.status(201).json({ 
        message: `Notificação enviada para ${notificacoesCriadas.length} responsáveis`,
        count: notificacoesCriadas.length 
      });
    } catch (error) {
      console.error("Error sending notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // Send notification to guardians with pending payments
  app.post("/api/notificacoes/enviar-inadimplentes", requireAdminAuth, async (req, res) => {
    try {
      const { titulo, mensagem, dataVencimento } = req.body;
      
      // Get all students with their payment status
      const alunos = await storage.getAlunos();
      const responsaveisInadimplentes = new Set<number>();
      
      for (const aluno of alunos) {
        if (aluno.responsavelId) {
          const status = await storage.calcularStatusPagamento(aluno.id);
          if (!status.emDia) {
            responsaveisInadimplentes.add(aluno.responsavelId);
          }
        }
      }
      
      const notificacoesCriadas = [];
      for (const respId of responsaveisInadimplentes) {
        const notificacao = await storage.createNotificacao({
          responsavelId: respId,
          titulo: titulo || "Mensalidade Pendente",
          mensagem: mensagem || "Você possui mensalidades pendentes. Por favor, regularize sua situação.",
          tipo: "pagamento",
          dataVencimento,
        });
        notificacoesCriadas.push(notificacao);
      }
      
      res.status(201).json({ 
        message: `Notificação enviada para ${notificacoesCriadas.length} responsáveis inadimplentes`,
        count: notificacoesCriadas.length 
      });
    } catch (error) {
      console.error("Error sending notifications to inadimplentes:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  app.delete("/api/notificacoes/:id", requireAdminAuth, async (req, res) => {
    try {
      await db.delete(notificacoes).where(eq(notificacoes.id, parseInt(req.params.id)));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notificacao:", error);
      res.status(500).json({ message: "Failed to delete notificacao" });
    }
  });

  // Pagamentos routes - protected by admin or unit manager authentication
  app.get("/api/pagamentos", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let pagamentos = await storage.getPagamentos();
      
      // If it's a unit manager, filter payments by students from their filial
      if (isGestor && !isAdmin) {
        const alunosDaFilial = await storage.getAlunosByFilial(req.session.filialId!);
        const alunoIds = alunosDaFilial.map(a => a.id);
        pagamentos = pagamentos.filter(p => p.alunoId && alunoIds.includes(p.alunoId));
      }
      
      res.json(pagamentos);
    } catch (error) {
      console.error("Error fetching pagamentos:", error);
      res.status(500).json({ message: "Failed to fetch pagamentos" });
    }
  });

  app.post("/api/pagamentos", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Validate and transform the request body
      const { insertPagamentoSchema } = await import("@shared/schema");
      const validationResult = insertPagamentoSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid payment data", 
          errors: validationResult.error.errors 
        });
      }

      const pagamentoData = validationResult.data;

      // If it's a unit manager, verify the student belongs to their filial
      if (isGestor && !isAdmin && pagamentoData.alunoId) {
        const aluno = await storage.getAluno(pagamentoData.alunoId);
        if (!aluno || aluno.filialId !== req.session.filialId) {
          return res.status(403).json({ message: "Access denied - student not in your unit" });
        }
      }

      const pagamento = await storage.createPagamento(pagamentoData);
      res.status(201).json(pagamento);
    } catch (error) {
      console.error("Error creating pagamento:", error);
      res.status(500).json({ message: "Failed to create pagamento" });
    }
  });

  app.delete("/api/pagamentos/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      
      // Fetch the specific payment instead of loading all payments
      const pagamento = await storage.getPagamento(id);
      
      if (!pagamento) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // If it's a unit manager, verify the payment belongs to a student from their filial
      if (isGestor && !isAdmin) {
        if (pagamento.alunoId) {
          const aluno = await storage.getAluno(pagamento.alunoId);
          if (!aluno || aluno.filialId !== req.session.filialId) {
            return res.status(403).json({ message: "Access denied - payment not from your unit" });
          }
        } else {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await storage.deletePagamento(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting pagamento:", error);
      res.status(500).json({ message: "Failed to delete pagamento" });
    }
  });

  // Matrículas routes
  app.get("/api/matriculas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const matriculas = await storage.getMatriculas();
      res.json(matriculas);
    } catch (error) {
      console.error("Error fetching matriculas:", error);
      res.status(500).json({ message: "Failed to fetch matriculas" });
    }
  });

  app.post("/api/matriculas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const matricula = await storage.createMatricula(req.body);
      res.status(201).json(matricula);
    } catch (error) {
      console.error("Error creating matricula:", error);
      res.status(500).json({ message: "Failed to create matricula" });
    }
  });

  app.delete("/api/matriculas/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteMatricula(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting matricula:", error);
      res.status(500).json({ message: "Failed to delete matricula" });
    }
  });

  // Eventos routes
  app.get("/api/eventos", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const eventos = await storage.getEventos();
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      res.status(500).json({ message: "Failed to fetch eventos" });
    }
  });

  app.post("/api/eventos", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const evento = await storage.createEvento(req.body);
      res.status(201).json(evento);
    } catch (error) {
      console.error("Error creating evento:", error);
      res.status(500).json({ message: "Failed to create evento" });
    }
  });

  app.put("/api/eventos/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const evento = await storage.updateEvento(id, req.body);
      res.json(evento);
    } catch (error) {
      console.error("Error updating evento:", error);
      res.status(500).json({ message: "Failed to update evento" });
    }
  });

  app.delete("/api/eventos/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteEvento(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting evento:", error);
      res.status(500).json({ message: "Failed to delete evento" });
    }
  });

  // Uniformes routes
  app.get("/api/uniformes", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const uniformes = await storage.getUniformes();
      res.json(uniformes);
    } catch (error) {
      console.error("Error fetching uniformes:", error);
      res.status(500).json({ message: "Failed to fetch uniformes" });
    }
  });

  app.post("/api/uniformes", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const uniforme = await storage.createUniforme(req.body);
      res.status(201).json(uniforme);
    } catch (error) {
      console.error("Error creating uniforme:", error);
      res.status(500).json({ message: "Failed to create uniforme" });
    }
  });

  app.put("/api/uniformes/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const uniforme = await storage.updateUniforme(id, req.body);
      res.json(uniforme);
    } catch (error) {
      console.error("Error updating uniforme:", error);
      res.status(500).json({ message: "Failed to update uniforme" });
    }
  });

  app.delete("/api/uniformes/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteUniforme(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting uniforme:", error);
      res.status(500).json({ message: "Failed to delete uniforme" });
    }
  });

  // Compras de uniformes routes
  app.get("/api/compras-uniformes", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const compras = await storage.getComprasUniformes();
      res.json(compras);
    } catch (error) {
      console.error("Error fetching compras uniformes:", error);
      res.status(500).json({ message: "Failed to fetch compras uniformes" });
    }
  });

  app.post("/api/compras-uniformes", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const compra = await storage.createCompraUniforme(req.body);
      res.status(201).json(compra);
    } catch (error) {
      console.error("Error creating compra uniforme:", error);
      res.status(500).json({ message: "Failed to create compra uniforme" });
    }
  });

  // Inscrições em eventos routes
  app.get("/api/inscricoes-eventos", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const inscricoes = await storage.getInscricoesEventos();
      res.json(inscricoes);
    } catch (error) {
      console.error("Error fetching inscricoes eventos:", error);
      res.status(500).json({ message: "Failed to fetch inscricoes eventos" });
    }
  });

  app.post("/api/inscricoes-eventos", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const inscricao = await storage.createInscricaoEvento(req.body);
      res.status(201).json(inscricao);
    } catch (error) {
      console.error("Error creating inscricao evento:", error);
      res.status(500).json({ message: "Failed to create inscricao evento" });
    }
  });

  // Pacotes de treino routes
  app.get("/api/pacotes-treino", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const pacotes = await storage.getPacotesTreino();
      res.json(pacotes);
    } catch (error) {
      console.error("Error fetching pacotes treino:", error);
      res.status(500).json({ message: "Failed to fetch pacotes treino" });
    }
  });

  app.post("/api/pacotes-treino", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const pacote = await storage.createPacoteTreino(req.body);
      res.status(201).json(pacote);
    } catch (error) {
      console.error("Error creating pacote treino:", error);
      res.status(500).json({ message: "Failed to create pacote treino" });
    }
  });

  app.put("/api/pacotes-treino/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const pacote = await storage.updatePacoteTreino(id, req.body);
      res.json(pacote);
    } catch (error) {
      console.error("Error updating pacote treino:", error);
      res.status(500).json({ message: "Failed to update pacote treino" });
    }
  });

  app.delete("/api/pacotes-treino/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deletePacoteTreino(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pacote treino:", error);
      res.status(500).json({ message: "Failed to delete pacote treino" });
    }
  });

  // Assinaturas de pacotes routes
  app.get("/api/assinaturas-pacotes", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const assinaturas = await storage.getAssinaturasPacotes();
      res.json(assinaturas);
    } catch (error) {
      console.error("Error fetching assinaturas pacotes:", error);
      res.status(500).json({ message: "Failed to fetch assinaturas pacotes" });
    }
  });

  app.post("/api/assinaturas-pacotes", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const assinatura = await storage.createAssinaturaPacote(req.body);
      res.status(201).json(assinatura);
    } catch (error) {
      console.error("Error creating assinatura pacote:", error);
      res.status(500).json({ message: "Failed to create assinatura pacote" });
    }
  });

  // Presenças routes
  app.get("/api/presencas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const presencas = await storage.getPresencas();
      res.json(presencas);
    } catch (error) {
      console.error("Error fetching presencas:", error);
      res.status(500).json({ message: "Failed to fetch presencas" });
    }
  });

  app.post("/api/presencas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const presenca = await storage.createPresenca(req.body);
      res.status(201).json(presenca);
    } catch (error) {
      console.error("Error creating presenca:", error);
      res.status(500).json({ message: "Failed to create presenca" });
    }
  });

  // Avaliações físicas routes
  app.get("/api/avaliacoes-fisicas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const avaliacoes = await storage.getAvaliacoesFisicas();
      res.json(avaliacoes);
    } catch (error) {
      console.error("Error fetching avaliacoes fisicas:", error);
      res.status(500).json({ message: "Failed to fetch avaliacoes fisicas" });
    }
  });

  app.post("/api/avaliacoes-fisicas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const avaliacao = await storage.createAvaliacaoFisica(req.body);
      res.status(201).json(avaliacao);
    } catch (error) {
      console.error("Error creating avaliacao fisica:", error);
      res.status(500).json({ message: "Failed to create avaliacao fisica" });
    }
  });

  app.put("/api/avaliacoes-fisicas/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const avaliacao = await storage.updateAvaliacaoFisica(id, req.body);
      res.json(avaliacao);
    } catch (error) {
      console.error("Error updating avaliacao fisica:", error);
      res.status(500).json({ message: "Failed to update avaliacao fisica" });
    }
  });

  // Pagamentos por aluno
  app.get("/api/pagamentos/aluno/:alunoId", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const alunoId = parseInt(req.params.alunoId);
      const pagamentos = await storage.getPagamentosByAluno(alunoId);
      res.json(pagamentos);
    } catch (error) {
      console.error("Error fetching pagamentos by aluno:", error);
      res.status(500).json({ message: "Failed to fetch pagamentos" });
    }
  });

  // Combos de Aulas routes
  app.get("/api/combos-aulas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const combos = await storage.getCombosAulas();
      res.json(combos);
    } catch (error) {
      console.error("Error fetching combos aulas:", error);
      res.status(500).json({ message: "Failed to fetch combos aulas" });
    }
  });

  app.post("/api/combos-aulas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const combo = await storage.createComboAulas(req.body);
      res.status(201).json(combo);
    } catch (error) {
      console.error("Error creating combo aulas:", error);
      res.status(500).json({ message: "Failed to create combo aulas" });
    }
  });

  app.put("/api/combos-aulas/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const combo = await storage.updateComboAulas(id, req.body);
      res.json(combo);
    } catch (error) {
      console.error("Error updating combo aulas:", error);
      res.status(500).json({ message: "Failed to update combo aulas" });
    }
  });

  app.delete("/api/combos-aulas/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteComboAulas(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting combo aulas:", error);
      res.status(500).json({ message: "Failed to delete combo aulas" });
    }
  });

  // PUT pagamento (update)
  app.put("/api/pagamentos/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const pagamento = await storage.updatePagamento(id, req.body);
      res.json(pagamento);
    } catch (error) {
      console.error("Error updating pagamento:", error);
      res.status(500).json({ message: "Failed to update pagamento" });
    }
  });

  // Unit management authentication routes
  app.post("/api/unidade/login", async (req, res) => {
    try {
      const { email, senha } = req.body;
      const gestor = await storage.authenticateGestorUnidade(email, senha);
      
      if (!gestor) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Get filial data
      const filial = await storage.getFilial(gestor.filialId);
      if (!filial) {
        return res.status(404).json({ message: "Filial não encontrada" });
      }

      req.session.gestorUnidadeId = gestor.id;
      req.session.filialId = gestor.filialId;

      await storage.updateGestorUltimoLogin(gestor.id);

      res.json({
        success: true,
        gestor: {
          id: gestor.id,
          nome: gestor.nome,
          email: gestor.email,
          filialId: gestor.filialId
        },
        filial: {
          id: filial.id,
          nome: filial.nome
        }
      });
    } catch (error) {
      console.error("Unit login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/unidade/me", requireGestorAuth, async (req, res) => {
    try {
      const gestorId = req.session.gestorUnidadeId!;
      const filialId = req.session.filialId!;
      
      const gestor = await storage.getGestorUnidade(gestorId);
      const filial = await storage.getFilial(filialId);
      
      if (!gestor || !filial) {
        return res.status(404).json({ message: "Dados não encontrados" });
      }

      res.json({
        gestor: {
          id: gestor.id,
          nome: gestor.nome,
          email: gestor.email,
          filialId: gestor.filialId
        },
        filial: {
          id: filial.id,
          nome: filial.nome
        }
      });
    } catch (error) {
      console.error("Error fetching unidade session:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/unidade/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ success: true });
    });
  });

  // Guardian authentication routes (suporta ambas as rotas: com e sem 's')
  const handleResponsavelLogin = async (req: Request, res: Response) => {
    try {
      const { email, senha } = req.body;
      const responsavel = await storage.authenticateResponsavel(email, senha);
      
      if (!responsavel) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      req.session.responsavelId = responsavel.id;

      // Salvar sessão explicitamente antes de responder
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Erro ao salvar sessão" });
        }
        
        res.json({
          success: true,
          responsavel: {
            id: responsavel.id,
            nome: responsavel.nome,
            email: responsavel.email
          }
        });
      });
    } catch (error) {
      console.error("Guardian login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  };

  // Registrar ambas as rotas de login
  app.post("/api/responsavel/login", handleResponsavelLogin);
  app.post("/api/responsaveis/login", handleResponsavelLogin);

  app.post("/api/responsavel/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ success: true });
    });
  });

  // Get responsavel data with students
  app.get("/api/responsaveis/me", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const responsavel = await storage.getResponsavelWithAlunos(responsavelId);
      
      if (!responsavel) {
        return res.status(404).json({ message: "Responsável não encontrado" });
      }

      res.json(responsavel);
    } catch (error) {
      console.error("Error fetching responsavel data:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Guardian portal routes
  // Update aluno contact information
  app.patch("/api/portal/alunos/:alunoId/contact", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const alunoId = parseInt(req.params.alunoId);
      
      const validated = updateAlunoContactSchema.parse(req.body);
      
      const updated = await storage.updateAlunoContact(alunoId, responsavelId, validated);
      res.json(updated);
    } catch (error: any) {
      if (error.message === "Aluno not found or unauthorized") {
        return res.status(403).json({ message: "Não autorizado" });
      }
      console.error("Error updating aluno contact:", error);
      res.status(500).json({ message: "Erro ao atualizar dados do aluno" });
    }
  });

  // Get student's classes
  app.get("/api/portal/alunos/:alunoId/turmas", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const alunoId = parseInt(req.params.alunoId);
      
      const turmas = await storage.getTurmasByAluno(alunoId, responsavelId);
      res.json(turmas);
    } catch (error) {
      console.error("Error fetching turmas:", error);
      res.status(500).json({ message: "Erro ao buscar turmas" });
    }
  });

  // Get student's payment history
  app.get("/api/portal/alunos/:alunoId/pagamentos", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const alunoId = parseInt(req.params.alunoId);
      
      const pagamentos = await storage.getPagamentosByAlunoForGuardian(alunoId, responsavelId);
      res.json(pagamentos);
    } catch (error) {
      console.error("Error fetching pagamentos:", error);
      res.status(500).json({ message: "Erro ao buscar pagamentos" });
    }
  });

  // Get notifications for guardian
  app.get("/api/portal/notificacoes", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const notificacoes = await storage.getNotificacoesByResponsavel(responsavelId);
      res.json(notificacoes);
    } catch (error) {
      console.error("Error fetching notificacoes:", error);
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });

  // Mark notification as read
  app.patch("/api/portal/notificacoes/:id/lida", requireResponsavelAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.marcarNotificacaoLida(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Erro ao marcar notificação como lida" });
    }
  });

  // Get student's event enrollments
  app.get("/api/portal/alunos/:alunoId/inscricoes", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const alunoId = parseInt(req.params.alunoId);
      
      const aluno = await storage.getAlunoForGuardian(alunoId, responsavelId);
      if (!aluno) {
        return res.status(403).json({ message: "Não autorizado" });
      }
      
      const inscricoes = await storage.getInscricoesEventosByAluno(alunoId);
      res.json(inscricoes);
    } catch (error) {
      console.error("Error fetching inscricoes:", error);
      res.status(500).json({ message: "Erro ao buscar inscrições" });
    }
  });

  // Get available events for guardian's unit
  app.get("/api/portal/eventos", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const responsavel = await storage.getResponsavelWithAlunos(responsavelId);
      
      if (!responsavel || !responsavel.alunos || responsavel.alunos.length === 0) {
        return res.json([]);
      }

      const filialId = responsavel.alunos[0].filialId;
      if (!filialId) {
        return res.json([]);
      }
      
      const eventos = await storage.getEventosDisponiveisByFilial(filialId);
      res.json(eventos);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      res.status(500).json({ message: "Erro ao buscar eventos" });
    }
  });

  // Enroll student in event
  app.post("/api/portal/eventos/:eventoId/inscricoes", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const eventoId = parseInt(req.params.eventoId);
      
      const validated = guardianInscricaoEventoSchema.parse(req.body);
      
      const inscricao = await storage.createGuardianInscricao(
        eventoId,
        validated.alunoId,
        responsavelId,
        validated.observacoes
      );
      
      res.json(inscricao);
    } catch (error: any) {
      if (error.message?.includes("unauthorized") || error.message?.includes("not found")) {
        return res.status(403).json({ message: "Não autorizado" });
      }
      if (error.message?.includes("already enrolled")) {
        return res.status(400).json({ message: "Aluno já inscrito neste evento" });
      }
      if (error.message?.includes("not available")) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error enrolling in event:", error);
      res.status(500).json({ message: "Erro ao inscrever no evento" });
    }
  });

  // Create payment from guardian portal
  app.post("/api/portal/pagamentos", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const { alunoId, valor, mesReferencia, dataPagamento, formaPagamento, observacoes } = req.body;
      
      // Verify the student belongs to this guardian
      const responsavel = await storage.getResponsavelWithAlunos(responsavelId);
      if (!responsavel) {
        return res.status(404).json({ message: "Responsável não encontrado" });
      }
      
      const alunoDoResponsavel = responsavel.alunos?.find(a => a.id === alunoId);
      if (!alunoDoResponsavel) {
        return res.status(403).json({ message: "Aluno não pertence a este responsável" });
      }

      // Create the payment
      const pagamento = await storage.createPagamento({
        alunoId,
        valor,
        mesReferencia,
        dataPagamento,
        formaPagamento,
        observacoes: observacoes || "Pagamento via Portal do Responsável",
      });

      res.status(201).json(pagamento);
    } catch (error) {
      console.error("Error creating payment from portal:", error);
      res.status(500).json({ message: "Erro ao processar pagamento" });
    }
  });

  // Purchase uniform
  app.post("/api/portal/uniformes/:uniformeId/compras", requireResponsavelAuth, async (req, res) => {
    try {
      const responsavelId = req.session.responsavelId!;
      const uniformeId = parseInt(req.params.uniformeId);
      
      const validated = guardianCompraUniformeSchema.parse(req.body);
      
      const compra = await storage.createGuardianCompra(
        uniformeId,
        validated.alunoId,
        responsavelId,
        validated.tamanho,
        validated.cor,
        validated.quantidade
      );
      
      res.json(compra);
    } catch (error: any) {
      if (error.message?.includes("unauthorized") || error.message?.includes("not found")) {
        return res.status(403).json({ message: "Não autorizado" });
      }
      if (error.message?.includes("stock") || error.message?.includes("available")) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error purchasing uniform:", error);
      res.status(500).json({ message: "Erro ao comprar uniforme" });
    }
  });

  // System configuration routes
  app.get('/api/configuracoes', async (req, res) => {
    try {
      const config = await storage.getConfiguracoes();
      res.json(config);
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  });

  app.put('/api/configuracoes', requireAdminAuth, async (req, res) => {
    try {
      const config = await storage.updateConfiguracoes(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });

  // Upload logo route
  app.post('/api/configuracoes/logo', requireAdminAuth, async (req, res) => {
    try {
      const { logoUrl } = req.body;
      const config = await storage.updateConfiguracoes({ logoUrl });
      res.json(config);
    } catch (error) {
      console.error("Error updating logo:", error);
      res.status(500).json({ message: "Erro ao atualizar logo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}