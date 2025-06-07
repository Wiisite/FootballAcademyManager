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

// Responsáveis table
export const responsaveis = pgTable("responsaveis", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  senha: varchar("senha", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }).unique(),
  endereco: text("endereco"),
  bairro: varchar("bairro", { length: 100 }),
  cep: varchar("cep", { length: 10 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alunos table
export const alunos = pgTable("alunos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  dataNascimento: date("data_nascimento"),
  dataMatricula: date("data_matricula").defaultNow(),
  fotoUrl: text("foto_url"),
  endereco: text("endereco"),
  bairro: varchar("bairro", { length: 100 }),
  cep: varchar("cep", { length: 10 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  responsavelId: integer("responsavel_id").references(() => responsaveis.id),
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
  cpf: varchar("cpf", { length: 14 }),
  rg: varchar("rg", { length: 20 }),
  dataAdmissao: date("data_admissao"),
  especialidade: varchar("especialidade", { length: 100 }),
  calendarioSemanal: text("calendario_semanal"), // JSON com dias e horários
  horariosTrabalho: text("horarios_trabalho"), // JSON com horários detalhados
  filialId: integer("filial_id").references(() => filiais.id),
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
  categoria: varchar("categoria", { length: 100 }).notNull(), // Baby fut, Sub 07/08, Sub 09/10, Sub 11/12, Sub 13/14, Sub 15 á 17
  professorId: integer("professor_id").references(() => professores.id),
  filialId: integer("filial_id").references(() => filiais.id),
  horario: varchar("horario", { length: 100 }),
  diasSemana: varchar("dias_semana", { length: 50 }), // "Segunda,Quarta,Sexta"
  capacidadeMaxima: integer("capacidade_maxima").default(20),
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

// Eventos table
export const eventos = pgTable("eventos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  dataEvento: date("data_evento").notNull(),
  horaInicio: varchar("hora_inicio", { length: 5 }),
  horaFim: varchar("hora_fim", { length: 5 }),
  local: varchar("local", { length: 255 }),
  preco: decimal("preco", { precision: 10, scale: 2 }).default("0"),
  vagasMaximas: integer("vagas_maximas"),
  filialId: integer("filial_id").references(() => filiais.id),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Uniformes table
export const uniformes = pgTable("uniformes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  tamanhos: text("tamanhos").notNull(), // JSON array: ["P", "M", "G", "GG"]
  cores: text("cores").notNull(), // JSON array: ["Azul", "Branco", "Verde"]
  categoria: varchar("categoria", { length: 100 }), // Camiseta, Shorts, Chuteira, etc.
  estoque: integer("estoque").default(0),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inscrições de eventos table
export const inscricoesEventos = pgTable("inscricoes_eventos", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventos.id),
  alunoId: integer("aluno_id").references(() => alunos.id),
  dataInscricao: timestamp("data_inscricao").defaultNow(),
  statusPagamento: varchar("status_pagamento", { length: 20 }).default("pendente"), // pendente, pago, cancelado
  observacoes: text("observacoes"),
});

// Compras de uniformes table
export const comprasUniformes = pgTable("compras_uniformes", {
  id: serial("id").primaryKey(),
  uniformeId: integer("uniforme_id").references(() => uniformes.id),
  alunoId: integer("aluno_id").references(() => alunos.id),
  tamanho: varchar("tamanho", { length: 10 }).notNull(),
  cor: varchar("cor", { length: 50 }).notNull(),
  quantidade: integer("quantidade").default(1),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  dataCompra: timestamp("data_compra").defaultNow(),
  statusPagamento: varchar("status_pagamento", { length: 20 }).default("pendente"),
  statusEntrega: varchar("status_entrega", { length: 20 }).default("preparando"), // preparando, entregue
});

// Notificações table
export const notificacoes = pgTable("notificacoes", {
  id: serial("id").primaryKey(),
  responsavelId: integer("responsavel_id").references(() => responsaveis.id),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensagem: text("mensagem").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // pagamento, evento, uniforme, geral
  lida: boolean("lida").default(false),
  dataVencimento: date("data_vencimento"), // Para notificações de pagamento
  createdAt: timestamp("created_at").defaultNow(),
});

// Presenças table (lista de chamada)
export const presencas = pgTable("presencas", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").references(() => alunos.id).notNull(),
  turmaId: integer("turma_id").references(() => turmas.id).notNull(),
  data: date("data").notNull(),
  presente: boolean("presente").notNull(),
  observacoes: text("observacoes"),
  registradoPor: integer("registrado_por").references(() => professores.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const responsaveisRelations = relations(responsaveis, ({ many }) => ({
  alunos: many(alunos),
  notificacoes: many(notificacoes),
}));

export const alunosRelations = relations(alunos, ({ one, many }) => ({
  responsavel: one(responsaveis, {
    fields: [alunos.responsavelId],
    references: [responsaveis.id],
  }),
  filial: one(filiais, {
    fields: [alunos.filialId],
    references: [filiais.id],
  }),
  matriculas: many(matriculas),
  pagamentos: many(pagamentos),
  inscricoesEventos: many(inscricoesEventos),
  comprasUniformes: many(comprasUniformes),
  presencas: many(presencas),
}));

export const professoresRelations = relations(professores, ({ one, many }) => ({
  turmas: many(turmas),
  filial: one(filiais, {
    fields: [professores.filialId],
    references: [filiais.id],
  }),
  presencasRegistradas: many(presencas),
}));

export const filiaisRelations = relations(filiais, ({ many }) => ({
  turmas: many(turmas),
  alunos: many(alunos),
  professores: many(professores),
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
  presencas: many(presencas),
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

export const eventosRelations = relations(eventos, ({ one, many }) => ({
  filial: one(filiais, {
    fields: [eventos.filialId],
    references: [filiais.id],
  }),
  inscricoes: many(inscricoesEventos),
}));

export const uniformesRelations = relations(uniformes, ({ many }) => ({
  compras: many(comprasUniformes),
}));

export const inscricoesEventosRelations = relations(inscricoesEventos, ({ one }) => ({
  evento: one(eventos, {
    fields: [inscricoesEventos.eventoId],
    references: [eventos.id],
  }),
  aluno: one(alunos, {
    fields: [inscricoesEventos.alunoId],
    references: [alunos.id],
  }),
}));

export const comprasUniformesRelations = relations(comprasUniformes, ({ one }) => ({
  uniforme: one(uniformes, {
    fields: [comprasUniformes.uniformeId],
    references: [uniformes.id],
  }),
  aluno: one(alunos, {
    fields: [comprasUniformes.alunoId],
    references: [alunos.id],
  }),
}));

export const notificacoesRelations = relations(notificacoes, ({ one }) => ({
  responsavel: one(responsaveis, {
    fields: [notificacoes.responsavelId],
    references: [responsaveis.id],
  }),
}));

export const presencasRelations = relations(presencas, ({ one }) => ({
  aluno: one(alunos, {
    fields: [presencas.alunoId],
    references: [alunos.id],
  }),
  turma: one(turmas, {
    fields: [presencas.turmaId],
    references: [turmas.id],
  }),
  professor: one(professores, {
    fields: [presencas.registradoPor],
    references: [professores.id],
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

// New schemas for responsáveis portal
export const insertResponsavelSchema = createInsertSchema(responsaveis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventoSchema = createInsertSchema(eventos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUniformeSchema = createInsertSchema(uniformes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInscricaoEventoSchema = createInsertSchema(inscricoesEventos).omit({
  id: true,
});

export const insertCompraUniformeSchema = createInsertSchema(comprasUniformes).omit({
  id: true,
});

export const insertNotificacaoSchema = createInsertSchema(notificacoes).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertAluno = z.infer<typeof insertAlunoSchema>;
export type Aluno = typeof alunos.$inferSelect;
export type AlunoWithFilial = Aluno & {
  filial: Filial | null;
  statusPagamento?: {
    emDia: boolean;
    ultimoPagamento?: string; // mes/ano do último pagamento
    diasAtraso?: number;
  };
};

export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
export type Professor = typeof professores.$inferSelect;
export type ProfessorWithFilial = Professor & {
  filial: Filial | null;
};

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

// New types for responsáveis portal
export type InsertResponsavel = z.infer<typeof insertResponsavelSchema>;
export type Responsavel = typeof responsaveis.$inferSelect;

export type InsertEvento = z.infer<typeof insertEventoSchema>;
export type Evento = typeof eventos.$inferSelect;
export type EventoWithFilial = Evento & {
  filial: Filial | null;
  inscricoes?: InscricaoEvento[];
};

export type InsertUniforme = z.infer<typeof insertUniformeSchema>;
export type Uniforme = typeof uniformes.$inferSelect;

export type InsertInscricaoEvento = z.infer<typeof insertInscricaoEventoSchema>;
export type InscricaoEvento = typeof inscricoesEventos.$inferSelect;

export type InsertCompraUniforme = z.infer<typeof insertCompraUniformeSchema>;
export type CompraUniforme = typeof comprasUniformes.$inferSelect;
export type CompraUniformeComplete = CompraUniforme & {
  uniforme: Uniforme;
  aluno: Aluno;
};

export type InsertNotificacao = z.infer<typeof insertNotificacaoSchema>;
export type Notificacao = typeof notificacoes.$inferSelect;

// Types for responsável portal dashboard
export type ResponsavelWithAlunos = Responsavel & {
  alunos: AlunoWithFilial[];
};

export type AlunoCompleto = Aluno & {
  responsavel?: Responsavel;
  filial: Filial | null;
  matriculas: (Matricula & {
    turma: TurmaWithProfessor;
  })[];
  pagamentos: Pagamento[];
  inscricoesEventos: (InscricaoEvento & {
    evento: Evento;
  })[];
  comprasUniformes: CompraUniformeComplete[];
  statusPagamento?: {
    emDia: boolean;
    ultimoPagamento?: string;
    diasAtraso?: number;
  };
};
