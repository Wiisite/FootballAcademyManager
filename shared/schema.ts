import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alunos table
export const alunos = pgTable("alunos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  dataNascimento: date("data_nascimento"),
  endereco: text("endereco"),
  nomeResponsavel: varchar("nome_responsavel", { length: 255 }),
  telefoneResponsavel: varchar("telefone_responsavel", { length: 20 }),
  filialId: integer("filial_id").references(() => filiais.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Professores table
export const professores = pgTable("professores", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  telefone: varchar("telefone", { length: 20 }),
  especialidade: varchar("especialidade", { length: 100 }),
  salario: decimal("salario", { precision: 10, scale: 2 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Filiais table
export const filiais = pgTable("filiais", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  endereco: text("endereco").notNull(),
  telefone: varchar("telefone", { length: 20 }),
  responsavel: varchar("responsavel", { length: 100 }),
  ativa: boolean("ativa").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Turmas table
export const turmas = pgTable("turmas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 100 }).notNull(), // Infantil, Juvenil, Adulto
  professorId: integer("professor_id").references(() => professores.id),
  filialId: integer("filial_id").references(() => filiais.id),
  horario: varchar("horario", { length: 100 }),
  diasSemana: varchar("dias_semana", { length: 50 }), // "Segunda,Quarta,Sexta"
  capacidadeMaxima: integer("capacidade_maxima").default(20),
  valorMensalidade: decimal("valor_mensalidade", { precision: 10, scale: 2 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matrículas table (relaciona alunos com turmas)
export const matriculas = pgTable("matriculas", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id),
  turmaId: integer("turma_id").references(() => turmas.id),
  dataMatricula: date("data_matricula").defaultNow(),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pagamentos table
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  mesReferencia: varchar("mes_referencia", { length: 7 }).notNull(), // "2024-01"
  dataPagamento: date("data_pagamento").notNull(),
  formaPagamento: varchar("forma_pagamento", { length: 50 }).notNull(), // Dinheiro, PIX, Cartão
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const alunosRelations = relations(alunos, ({ one, many }) => ({
  filial: one(filiais, {
    fields: [alunos.filialId],
    references: [filiais.id],
  }),
  matriculas: many(matriculas),
  pagamentos: many(pagamentos),
}));

export const professoresRelations = relations(professores, ({ many }) => ({
  turmas: many(turmas),
}));

export const filiaisRelations = relations(filiais, ({ many }) => ({
  turmas: many(turmas),
}));

export const turmasRelations = relations(turmas, ({ one, many }) => ({
  professor: one(professores, {
    fields: [turmas.professorId],
    references: [professores.id],
  }),
  filial: one(filiais, {
    fields: [turmas.filialId],
    references: [filiais.id],
  }),
  matriculas: many(matriculas),
}));

export const matriculasRelations = relations(matriculas, ({ one }) => ({
  aluno: one(alunos, {
    fields: [matriculas.alunoId],
    references: [alunos.id],
  }),
  turma: one(turmas, {
    fields: [matriculas.turmaId],
    references: [turmas.id],
  }),
}));

export const pagamentosRelations = relations(pagamentos, ({ one }) => ({
  aluno: one(alunos, {
    fields: [pagamentos.alunoId],
    references: [alunos.id],
  }),
}));

// Insert schemas
export const insertAlunoSchema = createInsertSchema(alunos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessorSchema = createInsertSchema(professores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTurmaSchema = createInsertSchema(turmas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatriculaSchema = createInsertSchema(matriculas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPagamentoSchema = createInsertSchema(pagamentos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFilialSchema = createInsertSchema(filiais).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertAluno = z.infer<typeof insertAlunoSchema>;
export type Aluno = typeof alunos.$inferSelect;

export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
export type Professor = typeof professores.$inferSelect;

export type InsertTurma = z.infer<typeof insertTurmaSchema>;
export type Turma = typeof turmas.$inferSelect;

export type InsertMatricula = z.infer<typeof insertMatriculaSchema>;
export type Matricula = typeof matriculas.$inferSelect;

export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;
export type Pagamento = typeof pagamentos.$inferSelect;

export type InsertFilial = z.infer<typeof insertFilialSchema>;
export type Filial = typeof filiais.$inferSelect;

// Combined types for API responses
export type TurmaWithProfessor = Turma & {
  professor: Professor | null;
  filial: Filial | null;
  _count?: {
    matriculas: number;
  };
};

export type AlunoWithTurmas = Aluno & {
  matriculas: (Matricula & {
    turma: Turma & {
      professor: Professor | null;
    };
  })[];
};

export type MatriculaComplete = Matricula & {
  aluno: Aluno;
  turma: TurmaWithProfessor;
};
