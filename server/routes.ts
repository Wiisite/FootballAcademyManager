import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminLoginSchema } from "@shared/schema";
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
  const PostgresSessionStore = connectPg(session);
  
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
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

  app.get("/api/alunos/:id", requireAdminAuth, async (req, res) => {
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

  // Pagamentos routes - protected by admin authentication
  app.get("/api/pagamentos", requireAdminAuth, async (req, res) => {
    try {
      const pagamentos = await storage.getPagamentos();
      res.json(pagamentos);
    } catch (error) {
      console.error("Error fetching pagamentos:", error);
      res.status(500).json({ message: "Failed to fetch pagamentos" });
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
      const responsavel = await storage.authenticateResponsavel(email, senha);
      
      if (!responsavel) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      req.session.responsavelId = responsavel.id;

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

  const httpServer = createServer(app);
  return httpServer;
}