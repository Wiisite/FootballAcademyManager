
<?php

class EscolaFutebol_Database {
    
    public static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Tabela de alunos
        $table_alunos = $wpdb->prefix . 'escola_alunos';
        $sql_alunos = "CREATE TABLE $table_alunos (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            nome varchar(100) NOT NULL,
            email varchar(100),
            telefone varchar(20),
            data_nascimento date,
            endereco text,
            responsavel_nome varchar(100),
            responsavel_telefone varchar(20),
            responsavel_email varchar(100),
            unidade_id mediumint(9),
            status varchar(20) DEFAULT 'ativo',
            data_cadastro datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Tabela de professores
        $table_professores = $wpdb->prefix . 'escola_professores';
        $sql_professores = "CREATE TABLE $table_professores (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            nome varchar(100) NOT NULL,
            email varchar(100),
            telefone varchar(20),
            data_nascimento date,
            endereco text,
            especialidade varchar(100),
            unidade_id mediumint(9),
            salario decimal(10,2),
            status varchar(20) DEFAULT 'ativo',
            data_cadastro datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Tabela de turmas
        $table_turmas = $wpdb->prefix . 'escola_turmas';
        $sql_turmas = "CREATE TABLE $table_turmas (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            nome varchar(100) NOT NULL,
            descricao text,
            professor_id mediumint(9),
            unidade_id mediumint(9),
            horario varchar(50),
            dias_semana varchar(50),
            max_alunos int(3) DEFAULT 20,
            valor_mensalidade decimal(10,2),
            status varchar(20) DEFAULT 'ativa',
            data_inicio date,
            data_fim date,
            data_cadastro datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Tabela de unidades/filiais
        $table_unidades = $wpdb->prefix . 'escola_unidades';
        $sql_unidades = "CREATE TABLE $table_unidades (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            nome varchar(100) NOT NULL,
            endereco text,
            telefone varchar(20),
            email varchar(100),
            responsavel varchar(100),
            status varchar(20) DEFAULT 'ativa',
            data_cadastro datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Tabela de matrículas (relacionamento aluno-turma)
        $table_matriculas = $wpdb->prefix . 'escola_matriculas';
        $sql_matriculas = "CREATE TABLE $table_matriculas (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            aluno_id mediumint(9) NOT NULL,
            turma_id mediumint(9) NOT NULL,
            data_matricula date,
            status varchar(20) DEFAULT 'ativa',
            data_cadastro datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Tabela de pagamentos
        $table_pagamentos = $wpdb->prefix . 'escola_pagamentos';
        $sql_pagamentos = "CREATE TABLE $table_pagamentos (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            aluno_id mediumint(9) NOT NULL,
            turma_id mediumint(9),
            valor decimal(10,2) NOT NULL,
            data_vencimento date,
            data_pagamento date,
            status varchar(20) DEFAULT 'pendente',
            metodo_pagamento varchar(50),
            observacoes text,
            data_cadastro datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        dbDelta($sql_alunos);
        dbDelta($sql_professores);
        dbDelta($sql_turmas);
        dbDelta($sql_unidades);
        dbDelta($sql_matriculas);
        dbDelta($sql_pagamentos);
    }
}
