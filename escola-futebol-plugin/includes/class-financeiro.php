
<?php

class EscolaFutebol_Financeiro {
    
    public static function get_all_pagamentos($unidade_id = null, $mes_ano = null) {
        global $wpdb;
        
        $table_pagamentos = $wpdb->prefix . 'escola_pagamentos';
        $table_alunos = $wpdb->prefix . 'escola_alunos';
        $table_turmas = $wpdb->prefix . 'escola_turmas';
        
        $where_clauses = array();
        $where_values = array();
        
        if ($unidade_id) {
            $where_clauses[] = "a.unidade_id = %d";
            $where_values[] = $unidade_id;
        }
        
        if ($mes_ano) {
            $where_clauses[] = "DATE_FORMAT(p.data_vencimento, '%Y-%m') = %s";
            $where_values[] = $mes_ano;
        }
        
        $where_sql = '';
        if (!empty($where_clauses)) {
            $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);
        }
        
        $sql = "SELECT p.*, a.nome as aluno_nome, t.nome as turma_nome 
                FROM $table_pagamentos p 
                INNER JOIN $table_alunos a ON p.aluno_id = a.id 
                LEFT JOIN $table_turmas t ON p.turma_id = t.id 
                $where_sql 
                ORDER BY p.data_vencimento DESC";
        
        if (!empty($where_values)) {
            return $wpdb->get_results($wpdb->prepare($sql, $where_values));
        } else {
            return $wpdb->get_results($sql);
        }
    }
    
    public static function get_by_id($id) {
        global $wpdb;
        
        $table_pagamentos = $wpdb->prefix . 'escola_pagamentos';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_pagamentos WHERE id = %d",
            $id
        ));
    }
    
    public static function create($data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_pagamentos';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'aluno_id' => intval($data['aluno_id']),
                'turma_id' => isset($data['turma_id']) ? intval($data['turma_id']) : null,
                'valor' => floatval($data['valor']),
                'data_vencimento' => sanitize_text_field($data['data_vencimento']),
                'data_pagamento' => isset($data['data_pagamento']) ? sanitize_text_field($data['data_pagamento']) : null,
                'status' => sanitize_text_field($data['status']),
                'metodo_pagamento' => isset($data['metodo_pagamento']) ? sanitize_text_field($data['metodo_pagamento']) : null,
                'observacoes' => isset($data['observacoes']) ? sanitize_textarea_field($data['observacoes']) : null
            ),
            array('%d', '%d', '%f', '%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result !== false) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    public static function update($id, $data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_pagamentos';
        
        return $wpdb->update(
            $table_name,
            array(
                'aluno_id' => intval($data['aluno_id']),
                'turma_id' => isset($data['turma_id']) ? intval($data['turma_id']) : null,
                'valor' => floatval($data['valor']),
                'data_vencimento' => sanitize_text_field($data['data_vencimento']),
                'data_pagamento' => isset($data['data_pagamento']) ? sanitize_text_field($data['data_pagamento']) : null,
                'status' => sanitize_text_field($data['status']),
                'metodo_pagamento' => isset($data['metodo_pagamento']) ? sanitize_text_field($data['metodo_pagamento']) : null,
                'observacoes' => isset($data['observacoes']) ? sanitize_textarea_field($data['observacoes']) : null
            ),
            array('id' => $id),
            array('%d', '%d', '%f', '%s', '%s', '%s', '%s', '%s'),
            array('%d')
        );
    }
    
    public static function delete($id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_pagamentos';
        
        return $wpdb->delete(
            $table_name,
            array('id' => $id),
            array('%d')
        );
    }
    
    public static function get_receita_total($unidade_id = null, $mes_ano = null) {
        global $wpdb;
        
        $table_pagamentos = $wpdb->prefix . 'escola_pagamentos';
        $table_alunos = $wpdb->prefix . 'escola_alunos';
        
        $where_clauses = array("p.status = 'pago'");
        $where_values = array();
        
        if ($unidade_id) {
            $where_clauses[] = "a.unidade_id = %d";
            $where_values[] = $unidade_id;
        }
        
        if ($mes_ano) {
            $where_clauses[] = "DATE_FORMAT(p.data_pagamento, '%Y-%m') = %s";
            $where_values[] = $mes_ano;
        }
        
        $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);
        
        $sql = "SELECT SUM(p.valor) FROM $table_pagamentos p 
                INNER JOIN $table_alunos a ON p.aluno_id = a.id 
                $where_sql";
        
        if (!empty($where_values)) {
            return $wpdb->get_var($wpdb->prepare($sql, $where_values)) ?: 0;
        } else {
            return $wpdb->get_var($sql) ?: 0;
        }
    }
    
    public static function get_pendencias($unidade_id = null) {
        global $wpdb;
        
        $table_pagamentos = $wpdb->prefix . 'escola_pagamentos';
        $table_alunos = $wpdb->prefix . 'escola_alunos';
        
        $where_clauses = array("p.status = 'pendente'", "p.data_vencimento < CURDATE()");
        $where_values = array();
        
        if ($unidade_id) {
            $where_clauses[] = "a.unidade_id = %d";
            $where_values[] = $unidade_id;
        }
        
        $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);
        
        $sql = "SELECT COUNT(*) FROM $table_pagamentos p 
                INNER JOIN $table_alunos a ON p.aluno_id = a.id 
                $where_sql";
        
        if (!empty($where_values)) {
            return $wpdb->get_var($wpdb->prepare($sql, $where_values)) ?: 0;
        } else {
            return $wpdb->get_var($sql) ?: 0;
        }
    }
}
