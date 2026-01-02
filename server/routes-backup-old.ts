import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  adminLoginSchema,
  updateAlunoContactSchema,
  guardianInscricaoEventoSchema,
  guardianCompraUniformeSchema
} from "@shared/schema";
import { addToSync } from "./sync";
import session from "express-session";
import connectPg from "connect-pg-simple";

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
  let sessionStore;
  
  if (process.env.DATABASE_URL) {
    const PostgresSessionStore = connectPg(session);
    sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: 7 * 24 * 60 * 60, // 7 days
    });
    console.log('Using PostgreSQL session store');
  } else {
    // Fallback to memory store for development
    const MemoryStore = require('memorystore')(session);
    sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    console.log('Using memory session store (DATABASE_URL not found)');
  }

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
      console.log('Login attempt for:', email);
      
      const user = await storage.authenticateAdminUser(email, senha);
      if (!user) {
        console.log('Authentication failed for:', email);
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      console.log('Authentication successful for:', email);

      // Store admin user in session
      req.session.adminId = user.id;
      req.session.adminUser = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        papel: user.papel || 'admin'
      };

      // Explicitly save session
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            console.log('Session saved successfully for user:', user.id);
            resolve();
          }
        });
      });

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

  // Cadastro completo (aluno + responsável)
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
      
      // Primeiro, criar o responsável
      const responsavel = await storage.createResponsavel(responsavelData);
      
      // Depois, criar o aluno vinculado ao responsável
      const alunoCompleto = {
        ...alunoData,
        responsavelId: responsavel.id,
      };
      
      const aluno = await storage.createAluno(alunoCompleto);
      
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

  app.patch("/api/alunos/:id", async (req, res) => {
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

  app.post("/api/professores", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const professor = await storage.createProfessor(req.body);
      res.json(professor);
    } catch (error) {
      console.error("Error creating professor:", error);
      res.status(500).json({ message: "Failed to create professor" });
    }
  });

  app.patch("/api/professores/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const professor = await storage.updateProfessor(id, req.body);
      res.json(professor);
    } catch (error) {
      console.error("Error updating professor:", error);
      res.status(500).json({ message: "Failed to update professor" });
    }
  });

  app.delete("/api/professores/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteProfessor(id);
      res.json({ success: true });
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

  app.post("/api/turmas", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const turma = await storage.createTurma(req.body);
      res.json(turma);
    } catch (error) {
      console.error("Error creating turma:", error);
      res.status(500).json({ message: "Failed to create turma" });
    }
  });

  app.patch("/api/turmas/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      const turma = await storage.updateTurma(id, req.body);
      res.json(turma);
    } catch (error) {
      console.error("Error updating turma:", error);
      res.status(500).json({ message: "Failed to update turma" });
    }
  });

  app.delete("/api/turmas/:id", async (req, res) => {
    try {
      const isAdmin = req.session.adminId;
      const isGestor = req.session.gestorUnidadeId && req.session.filialId;
      
      if (!isAdmin && !isGestor) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteTurma(id);
      res.json({ success: true });
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

  app.post("/api/filiais", requireAdminAuth, async (req, res) => {
    try {
      const filialData = {
        ...req.body,
        ativa: true,
      };
      const filial = await storage.createFilial(filialData);
      res.json(filial);
    } catch (error) {
      console.error("Error creating filial:", error);
      res.status(500).json({ message: "Failed to create filial" });
    }
  });

  app.patch("/api/filiais/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const filial = await storage.updateFilial(id, req.body);
      res.json(filial);
    } catch (error) {
      console.error("Error updating filial:", error);
      res.status(500).json({ message: "Failed to update filial" });
    }
  });

  app.delete("/api/filiais/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFilial(id);
      res.json({ message: "Filial deleted successfully" });
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

  // Guardian authentication routes
  app.post("/api/responsavel/login", async (req, res) => {
    try {
      const { email, senha } = req.body;
      console.log('Guardian login attempt for:', email);
      
      const responsavel = await storage.authenticateResponsavel(email, senha);
      
      if (!responsavel) {
        console.log('Guardian authentication failed for:', email);
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      console.log('Guardian authentication successful for:', email);

      req.session.responsavelId = responsavel.id;

      // Explicitly save session
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Guardian session save error:', err);
            reject(err);
          } else {
            console.log('Guardian session saved successfully for responsavel:', responsavel.id);
            resolve();
          }
        });
      });

      res.json({
        success: true,
        responsavel: {
          id: responsavel.id,
          nome: responsavel.nome,
          email: responsavel.email
        }
      });
    } catch (error) {
      console.error("Guardian login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}