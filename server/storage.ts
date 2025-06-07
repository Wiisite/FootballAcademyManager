import {
  users,
  alunos,
  professores,
  turmas,
  matriculas,
  pagamentos,
  filiais,
  responsaveis,
  eventos,
  uniformes,
  notificacoes,
  inscricoesEventos,
  comprasUniformes,
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
  type AlunoWithFilial,
  type Filial,
  type InsertFilial,
  type Responsavel,
  type InsertResponsavel,
  type ResponsavelWithAlunos,
  type Evento,
  type InsertEvento,
  type EventoWithFilial,
  type Uniforme,
  type InsertUniforme,
  type Notificacao,
  type InsertNotificacao,
  type InscricaoEvento,
  type InsertInscricaoEvento,
  type CompraUniforme,
  type InsertCompraUniforme,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Alunos operations
  getAlunos(): Promise<AlunoWithFilial[]>;
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

  // Responsáveis operations
  getResponsavel(id: number): Promise<Responsavel | undefined>;
  getResponsavelByEmail(email: string): Promise<Responsavel | undefined>;
  createResponsavel(responsavel: InsertResponsavel): Promise<Responsavel>;
  authenticateResponsavel(email: string, senha: string): Promise<Responsavel | null>;
  getResponsavelWithAlunos(id: number): Promise<ResponsavelWithAlunos | undefined>;

  // Eventos operations
  getEventos(): Promise<EventoWithFilial[]>;
  createEvento(evento: InsertEvento): Promise<Evento>;
  inscreveAlunoEvento(inscricao: InsertInscricaoEvento): Promise<InscricaoEvento>;

  // Uniformes operations
  getUniformes(): Promise<Uniforme[]>;
  comprarUniforme(compra: InsertCompraUniforme): Promise<CompraUniforme>;

  // Notificações operations
  getNotificacoesByResponsavel(responsavelId: number): Promise<Notificacao[]>;
  createNotificacao(notificacao: InsertNotificacao): Promise<Notificacao>;
  marcarNotificacaoLida(id: number): Promise<void>;
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
  async getAlunos(): Promise<AlunoWithFilial[]> {
    const alunosData = await db
      .select({
        id: alunos.id,
        nome: alunos.nome,
        email: alunos.email,
        telefone: alunos.telefone,
        dataNascimento: alunos.dataNascimento,
        endereco: alunos.endereco,
        responsavelId: alunos.responsavelId,
        nomeResponsavel: alunos.nomeResponsavel,
        telefoneResponsavel: alunos.telefoneResponsavel,
        filialId: alunos.filialId,
        ativo: alunos.ativo,
        createdAt: alunos.createdAt,
        updatedAt: alunos.updatedAt,
        filial: filiais,
      })
      .from(alunos)
      .leftJoin(filiais, eq(alunos.filialId, filiais.id))
      .where(eq(alunos.ativo, true))
      .orderBy(desc(alunos.createdAt));

    // Calcular status de pagamento para cada aluno
    const alunosComStatus = await Promise.all(
      alunosData.map(async (aluno) => {
        const statusPagamento = await this.calcularStatusPagamento(aluno.id);
        return {
          ...aluno,
          statusPagamento,
        };
      })
    );

    return alunosComStatus;
  }

  private async calcularStatusPagamento(alunoId: number) {
    // Buscar o último pagamento do aluno
    const ultimoPagamento = await db
      .select()
      .from(pagamentos)
      .where(eq(pagamentos.alunoId, alunoId))
      .orderBy(desc(pagamentos.mesReferencia))
      .limit(1);

    if (ultimoPagamento.length === 0) {
      // Aluno nunca fez pagamento
      return {
        emDia: false,
        ultimoPagamento: undefined,
        diasAtraso: undefined,
      };
    }

    const ultimoMesReferencia = ultimoPagamento[0].mesReferencia;
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    
    // Verificar se o último pagamento é do mês atual
    const emDia = ultimoMesReferencia === mesAtual;
    
    // Calcular dias de atraso se não estiver em dia
    let diasAtraso = 0;
    if (!emDia) {
      const [anoUltimo, mesUltimo] = ultimoMesReferencia.split('-').map(Number);
      const dataUltimoPagamento = new Date(anoUltimo, mesUltimo - 1, 1);
      const proximoMesDevido = new Date(anoUltimo, mesUltimo, 1);
      const diffTempo = agora.getTime() - proximoMesDevido.getTime();
      diasAtraso = Math.floor(diffTempo / (1000 * 60 * 60 * 24));
    }

    return {
      emDia,
      ultimoPagamento: ultimoMesReferencia,
      diasAtraso: !emDia ? diasAtraso : undefined,
    };
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

  // Responsáveis operations
  async getResponsavel(id: number): Promise<Responsavel | undefined> {
    const [responsavel] = await db.select().from(responsaveis).where(eq(responsaveis.id, id));
    return responsavel;
  }

  async getResponsavelByEmail(email: string): Promise<Responsavel | undefined> {
    const [responsavel] = await db.select().from(responsaveis).where(eq(responsaveis.email, email));
    return responsavel;
  }

  async createResponsavel(responsavel: InsertResponsavel): Promise<Responsavel> {
    const [novoResponsavel] = await db
      .insert(responsaveis)
      .values(responsavel)
      .returning();
    return novoResponsavel;
  }

  async authenticateResponsavel(email: string, senha: string): Promise<Responsavel | null> {
    const [responsavel] = await db
      .select()
      .from(responsaveis)
      .where(and(eq(responsaveis.email, email), eq(responsaveis.senha, senha)));
    return responsavel || null;
  }

  async getResponsavelWithAlunos(id: number): Promise<ResponsavelWithAlunos | undefined> {
    const responsavel = await this.getResponsavel(id);
    if (!responsavel) return undefined;

    const alunosDoResponsavel = await db
      .select({
        id: alunos.id,
        nome: alunos.nome,
        email: alunos.email,
        telefone: alunos.telefone,
        dataNascimento: alunos.dataNascimento,
        endereco: alunos.endereco,
        responsavelId: alunos.responsavelId,
        nomeResponsavel: alunos.nomeResponsavel,
        telefoneResponsavel: alunos.telefoneResponsavel,
        filialId: alunos.filialId,
        ativo: alunos.ativo,
        createdAt: alunos.createdAt,
        updatedAt: alunos.updatedAt,
        filial: filiais,
      })
      .from(alunos)
      .leftJoin(filiais, eq(alunos.filialId, filiais.id))
      .where(and(eq(alunos.responsavelId, id), eq(alunos.ativo, true)));

    // Calcular status de pagamento para cada aluno
    const alunosComStatus = await Promise.all(
      alunosDoResponsavel.map(async (aluno) => {
        const statusPagamento = await this.calcularStatusPagamento(aluno.id);
        return {
          ...aluno,
          statusPagamento,
        };
      })
    );

    return {
      ...responsavel,
      alunos: alunosComStatus,
    };
  }

  // Eventos operations
  async getEventos(): Promise<EventoWithFilial[]> {
    return await db
      .select({
        id: eventos.id,
        nome: eventos.nome,
        descricao: eventos.descricao,
        dataEvento: eventos.dataEvento,
        valor: eventos.valor,
        filialId: eventos.filialId,
        ativo: eventos.ativo,
        createdAt: eventos.createdAt,
        updatedAt: eventos.updatedAt,
        filial: filiais,
      })
      .from(eventos)
      .leftJoin(filiais, eq(eventos.filialId, filiais.id))
      .where(eq(eventos.ativo, true))
      .orderBy(desc(eventos.dataEvento));
  }

  async createEvento(evento: InsertEvento): Promise<Evento> {
    const [novoEvento] = await db
      .insert(eventos)
      .values(evento)
      .returning();
    return novoEvento;
  }

  async inscreveAlunoEvento(inscricao: InsertInscricaoEvento): Promise<InscricaoEvento> {
    const [novaInscricao] = await db
      .insert(inscricoesEventos)
      .values(inscricao)
      .returning();
    return novaInscricao;
  }

  // Uniformes operations
  async getUniformes(): Promise<Uniforme[]> {
    return await db
      .select()
      .from(uniformes)
      .where(eq(uniformes.ativo, true))
      .orderBy(desc(uniformes.createdAt));
  }

  async comprarUniforme(compra: InsertCompraUniforme): Promise<CompraUniforme> {
    const [novaCompra] = await db
      .insert(comprasUniformes)
      .values(compra)
      .returning();
    return novaCompra;
  }

  // Notificações operations
  async getNotificacoesByResponsavel(responsavelId: number): Promise<Notificacao[]> {
    return await db
      .select()
      .from(notificacoes)
      .where(eq(notificacoes.responsavelId, responsavelId))
      .orderBy(desc(notificacoes.createdAt));
  }

  async createNotificacao(notificacao: InsertNotificacao): Promise<Notificacao> {
    const [novaNotificacao] = await db
      .insert(notificacoes)
      .values(notificacao)
      .returning();
    return novaNotificacao;
  }

  async marcarNotificacaoLida(id: number): Promise<void> {
    await db
      .update(notificacoes)
      .set({ lida: true })
      .where(eq(notificacoes.id, id));
  }
}

export const storage = new DatabaseStorage();
