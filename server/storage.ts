import {
  users,
  alunos,
  professores,
  turmas,
  matriculas,
  pagamentos,
  filiais,
  type User,
  type UpsertUser,
  type Aluno,
  type InsertAluno,
  type Professor,
  type InsertProfessor,
  type Turma,
  type InsertTurma,
  type TurmaWithProfessor,
  type Matricula,
  type InsertMatricula,
  type Pagamento,
  type InsertPagamento,
  type AlunoWithTurmas,
  type Filial,
  type InsertFilial,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Alunos operations
  getAlunos(): Promise<Aluno[]>;
  getAluno(id: number): Promise<AlunoWithTurmas | undefined>;
  createAluno(aluno: InsertAluno): Promise<Aluno>;
  updateAluno(id: number, aluno: Partial<InsertAluno>): Promise<Aluno>;
  deleteAluno(id: number): Promise<void>;

  // Professores operations
  getProfessores(): Promise<Professor[]>;
  getProfessor(id: number): Promise<Professor | undefined>;
  createProfessor(professor: InsertProfessor): Promise<Professor>;
  updateProfessor(id: number, professor: Partial<InsertProfessor>): Promise<Professor>;
  deleteProfessor(id: number): Promise<void>;

  // Turmas operations
  getTurmas(): Promise<TurmaWithProfessor[]>;
  getTurma(id: number): Promise<TurmaWithProfessor | undefined>;
  createTurma(turma: InsertTurma): Promise<Turma>;
  updateTurma(id: number, turma: Partial<InsertTurma>): Promise<Turma>;
  deleteTurma(id: number): Promise<void>;

  // Matriculas operations
  getMatriculas(): Promise<Matricula[]>;
  createMatricula(matricula: InsertMatricula): Promise<Matricula>;
  deleteMatricula(id: number): Promise<void>;

  // Pagamentos operations
  getPagamentos(): Promise<Pagamento[]>;
  getPagamentosByAluno(alunoId: number): Promise<Pagamento[]>;
  createPagamento(pagamento: InsertPagamento): Promise<Pagamento>;
  deletePagamento(id: number): Promise<void>;

  // Filiais operations
  getFiliais(): Promise<Filial[]>;
  getFilial(id: number): Promise<Filial | undefined>;
  createFilial(filial: InsertFilial): Promise<Filial>;
  updateFilial(id: number, filial: Partial<InsertFilial>): Promise<Filial>;
  deleteFilial(id: number): Promise<void>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalAlunos: number;
    totalProfessores: number;
    totalTurmas: number;
    receitaMensal: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Alunos operations
  async getAlunos(): Promise<Aluno[]> {
    return await db.select().from(alunos).where(eq(alunos.ativo, true)).orderBy(desc(alunos.createdAt));
  }

  async getAluno(id: number): Promise<AlunoWithTurmas | undefined> {
    const [aluno] = await db
      .select()
      .from(alunos)
      .where(and(eq(alunos.id, id), eq(alunos.ativo, true)));

    if (!aluno) return undefined;

    const matriculasData = await db
      .select({
        matricula: matriculas,
        turma: turmas,
        professor: professores,
      })
      .from(matriculas)
      .leftJoin(turmas, eq(matriculas.turmaId, turmas.id))
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .where(and(eq(matriculas.alunoId, id), eq(matriculas.ativo, true)));

    return {
      ...aluno,
      matriculas: matriculasData.map((item) => ({
        ...item.matricula,
        turma: {
          ...item.turma!,
          professor: item.professor,
        },
      })),
    };
  }

  async createAluno(aluno: InsertAluno): Promise<Aluno> {
    const [newAluno] = await db.insert(alunos).values(aluno).returning();
    return newAluno;
  }

  async updateAluno(id: number, aluno: Partial<InsertAluno>): Promise<Aluno> {
    const [updatedAluno] = await db
      .update(alunos)
      .set({ ...aluno, updatedAt: new Date() })
      .where(eq(alunos.id, id))
      .returning();
    return updatedAluno;
  }

  async deleteAluno(id: number): Promise<void> {
    await db.update(alunos).set({ ativo: false }).where(eq(alunos.id, id));
  }

  // Professores operations
  async getProfessores(): Promise<Professor[]> {
    return await db.select().from(professores).where(eq(professores.ativo, true)).orderBy(desc(professores.createdAt));
  }

  async getProfessor(id: number): Promise<Professor | undefined> {
    const [professor] = await db
      .select()
      .from(professores)
      .where(and(eq(professores.id, id), eq(professores.ativo, true)));
    return professor;
  }

  async createProfessor(professor: InsertProfessor): Promise<Professor> {
    const [newProfessor] = await db.insert(professores).values(professor).returning();
    return newProfessor;
  }

  async updateProfessor(id: number, professor: Partial<InsertProfessor>): Promise<Professor> {
    const [updatedProfessor] = await db
      .update(professores)
      .set({ ...professor, updatedAt: new Date() })
      .where(eq(professores.id, id))
      .returning();
    return updatedProfessor;
  }

  async deleteProfessor(id: number): Promise<void> {
    await db.update(professores).set({ ativo: false }).where(eq(professores.id, id));
  }

  // Turmas operations
  async getTurmas(): Promise<TurmaWithProfessor[]> {
    const turmasData = await db
      .select({
        turma: turmas,
        professor: professores,
        filial: filiais,
        matriculasCount: count(matriculas.id),
      })
      .from(turmas)
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .leftJoin(filiais, eq(turmas.filialId, filiais.id))
      .leftJoin(matriculas, and(eq(matriculas.turmaId, turmas.id), eq(matriculas.ativo, true)))
      .where(eq(turmas.ativo, true))
      .groupBy(turmas.id, professores.id, filiais.id)
      .orderBy(desc(turmas.createdAt));

    return turmasData.map((item) => ({
      ...item.turma,
      professor: item.professor,
      filial: item.filial,
      _count: {
        matriculas: item.matriculasCount,
      },
    }));
  }

  async getTurma(id: number): Promise<TurmaWithProfessor | undefined> {
    const [turmaData] = await db
      .select({
        turma: turmas,
        professor: professores,
        filial: filiais,
      })
      .from(turmas)
      .leftJoin(professores, eq(turmas.professorId, professores.id))
      .leftJoin(filiais, eq(turmas.filialId, filiais.id))
      .where(and(eq(turmas.id, id), eq(turmas.ativo, true)));

    if (!turmaData) return undefined;

    return {
      ...turmaData.turma,
      professor: turmaData.professor,
      filial: turmaData.filial,
    };
  }

  async createTurma(turma: InsertTurma): Promise<Turma> {
    const [newTurma] = await db.insert(turmas).values(turma).returning();
    return newTurma;
  }

  async updateTurma(id: number, turma: Partial<InsertTurma>): Promise<Turma> {
    const [updatedTurma] = await db
      .update(turmas)
      .set({ ...turma, updatedAt: new Date() })
      .where(eq(turmas.id, id))
      .returning();
    return updatedTurma;
  }

  async deleteTurma(id: number): Promise<void> {
    await db.update(turmas).set({ ativo: false }).where(eq(turmas.id, id));
  }

  // Matriculas operations
  async getMatriculas(): Promise<Matricula[]> {
    return await db.select().from(matriculas).where(eq(matriculas.ativo, true)).orderBy(desc(matriculas.createdAt));
  }

  async createMatricula(matricula: InsertMatricula): Promise<Matricula> {
    const [newMatricula] = await db.insert(matriculas).values(matricula).returning();
    return newMatricula;
  }

  async deleteMatricula(id: number): Promise<void> {
    await db.update(matriculas).set({ ativo: false }).where(eq(matriculas.id, id));
  }

  // Pagamentos operations
  async getPagamentos(): Promise<Pagamento[]> {
    return await db.select().from(pagamentos).orderBy(desc(pagamentos.createdAt));
  }

  async getPagamentosByAluno(alunoId: number): Promise<Pagamento[]> {
    return await db.select().from(pagamentos).where(eq(pagamentos.alunoId, alunoId)).orderBy(desc(pagamentos.createdAt));
  }

  async createPagamento(pagamento: InsertPagamento): Promise<Pagamento> {
    const [newPagamento] = await db.insert(pagamentos).values(pagamento).returning();
    return newPagamento;
  }

  async deletePagamento(id: number): Promise<void> {
    await db.delete(pagamentos).where(eq(pagamentos.id, id));
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalAlunos: number;
    totalProfessores: number;
    totalTurmas: number;
    receitaMensal: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const [alunosCount] = await db
      .select({ count: count() })
      .from(alunos)
      .where(eq(alunos.ativo, true));

    const [professoresCount] = await db
      .select({ count: count() })
      .from(professores)
      .where(eq(professores.ativo, true));

    const [turmasCount] = await db
      .select({ count: count() })
      .from(turmas)
      .where(eq(turmas.ativo, true));

    const [receitaResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${pagamentos.valor}), 0)`,
      })
      .from(pagamentos)
      .where(eq(pagamentos.mesReferencia, currentMonth));

    return {
      totalAlunos: alunosCount.count,
      totalProfessores: professoresCount.count,
      totalTurmas: turmasCount.count,
      receitaMensal: Number(receitaResult.total),
    };
  }

  // Filiais operations
  async getFiliais(): Promise<Filial[]> {
    return await db.select().from(filiais).where(eq(filiais.ativa, true)).orderBy(desc(filiais.createdAt));
  }

  async getFilial(id: number): Promise<Filial | undefined> {
    const [filial] = await db.select().from(filiais).where(and(eq(filiais.id, id), eq(filiais.ativa, true)));
    return filial;
  }

  async createFilial(filial: InsertFilial): Promise<Filial> {
    const [newFilial] = await db.insert(filiais).values(filial).returning();
    return newFilial;
  }

  async updateFilial(id: number, filial: Partial<InsertFilial>): Promise<Filial> {
    const [updatedFilial] = await db
      .update(filiais)
      .set({ ...filial, updatedAt: new Date() })
      .where(eq(filiais.id, id))
      .returning();
    return updatedFilial;
  }

  async deleteFilial(id: number): Promise<void> {
    await db.update(filiais).set({ ativa: false }).where(eq(filiais.id, id));
  }
}

export const storage = new DatabaseStorage();
