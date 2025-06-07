import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
  app.get("/api/alunos", isAuthenticated, async (req, res) => {
    try {
      const alunos = await storage.getAlunos();
      res.json(alunos);
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

  app.post("/api/alunos", isAuthenticated, async (req, res) => {
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

  app.put("/api/alunos/:id", isAuthenticated, async (req, res) => {
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
      const professores = await storage.getProfessores();
      res.json(professores);
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
      const turmas = await storage.getTurmas();
      res.json(turmas);
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
  app.get("/api/filiais", isAuthenticated, async (req, res) => {
    try {
      const filiais = await storage.getFiliais();
      res.json(filiais);
    } catch (error) {
      console.error("Error fetching filiais:", error);
      res.status(500).json({ message: "Failed to fetch filiais" });
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

  const httpServer = createServer(app);
  return httpServer;
}
