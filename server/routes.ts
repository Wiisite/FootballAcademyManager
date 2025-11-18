import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { z } from "zod";

// Session types
declare module "express-session" {
  interface SessionData {
    adminId?: number;
    responsavelId?: number;
    gestorId?: number;
    filialId?: number;
  }
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

const alunoSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  dataNascimento: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  filialId: z.number().optional(),
});

const responsavelSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  telefone: z.string(),
  cpf: z.string().optional(),
  senha: z.string().min(6),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL!,
    createTableIfMissing: true,
    ttl: 7 * 24 * 60 * 60,
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || 'escola-secret-2024',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }));

  // ============ AUTHENTICATION ROUTES ============
  
  // Admin login
  app.post("/api/auth/admin/login", async (req, res) => {
    try {
      const { email, senha } = loginSchema.parse(req.body);
      const user = await storage.authenticateAdminUser(email, senha);
      
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      req.session.adminId = user.id;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => err ? reject(err) : resolve());
      });

      res.json({ success: true, user: { id: user.id, nome: user.nome, email: user.email } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro no servidor" });
    }
  });

  // Admin logout
  app.post("/api/auth/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Check admin session
  app.get("/api/auth/admin/me", (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    res.json({ id: req.session.adminId });
  });

  // Responsavel login
  app.post("/api/auth/responsavel/login", async (req, res) => {
    try {
      const { email, senha } = loginSchema.parse(req.body);
      const responsavel = await storage.authenticateResponsavel(email, senha);
      
      if (!responsavel) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      req.session.responsavelId = responsavel.id;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => err ? reject(err) : resolve());
      });

      res.json({ success: true, responsavel: { id: responsavel.id, nome: responsavel.nome } });
    } catch (error) {
      console.error("Responsavel login error:", error);
      res.status(500).json({ error: "Erro no servidor" });
    }
  });

  // Responsavel logout
  app.post("/api/auth/responsavel/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // ============ FILIAIS ROUTES ============
  
  app.get("/api/filiais", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const filiais = await storage.getFiliais();
    res.json(filiais);
  });

  app.post("/api/filiais", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const filial = await storage.createFilial(req.body);
    res.status(201).json(filial);
  });

  // ============ ALUNOS ROUTES ============
  
  app.get("/api/alunos", async (req, res) => {
    if (!req.session.adminId && !req.session.gestorId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const alunos = await storage.getAlunos();
    res.json(alunos);
  });

  app.get("/api/alunos/:id", async (req, res) => {
    if (!req.session.adminId && !req.session.gestorId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const aluno = await storage.getAluno(parseInt(req.params.id));
    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }
    res.json(aluno);
  });

  // Create aluno with responsavel
  app.post("/api/alunos/complete", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    try {
      const { aluno, responsavel } = req.body;
      
      // Create responsavel first
      const newResponsavel = await storage.createResponsavel(responsavel);
      
      // Create aluno linked to responsavel
      const newAluno = await storage.createAluno({
        ...aluno,
        responsavelId: newResponsavel.id,
      });
      
      res.status(201).json({ aluno: newAluno, responsavel: newResponsavel });
    } catch (error) {
      console.error("Create aluno error:", error);
      res.status(500).json({ error: "Erro ao criar aluno" });
    }
  });

  app.put("/api/alunos/:id", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const aluno = await storage.updateAluno(parseInt(req.params.id), req.body);
    res.json(aluno);
  });

  app.delete("/api/alunos/:id", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    await storage.deleteAluno(parseInt(req.params.id));
    res.json({ success: true });
  });

  // ============ TURMAS ROUTES ============
  
  app.get("/api/turmas", async (req, res) => {
    if (!req.session.adminId && !req.session.gestorId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const turmas = await storage.getTurmas();
    res.json(turmas);
  });

  app.post("/api/turmas", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const turma = await storage.createTurma(req.body);
    res.status(201).json(turma);
  });

  app.put("/api/turmas/:id", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const turma = await storage.updateTurma(parseInt(req.params.id), req.body);
    res.json(turma);
  });

  // ============ MATRICULAS ROUTES ============
  
  app.get("/api/matriculas", async (req, res) => {
    if (!req.session.adminId && !req.session.gestorId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const matriculas = await storage.getMatriculas();
    res.json(matriculas);
  });

  app.post("/api/matriculas", async (req, res) => {
    if (!req.session.adminId && !req.session.gestorId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const matricula = await storage.createMatricula(req.body);
    res.status(201).json(matricula);
  });

  // ============ DASHBOARD METRICS ============
  
  app.get("/api/dashboard/metrics", async (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const metrics = await storage.getDashboardMetrics();
    res.json(metrics);
  });

  // ============ RESPONSAVEL PORTAL ============
  
  app.get("/api/responsavel/alunos", async (req, res) => {
    if (!req.session.responsavelId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    // TODO: Implement this in Phase 2
    const alunos = await storage.getAlunos();
    const filtered = alunos.filter(a => a.responsavelId === req.session.responsavelId);
    res.json(filtered);
  });

  const httpServer = createServer(app);
  return httpServer;
}
