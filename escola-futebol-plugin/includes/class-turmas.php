
<?php

class EscolaFutebol_Turmas {
    
    public static function get_all($unidade_id = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_turmas';
        
        if ($unidade_id) {
            $results = $wpdb->get_results($wpdb->prepare(
                "SELECT t.*, p.nome as professor_nome FROM $table_name t 
                LEFT JOIN {$wpdb->prefix}escola_professores p ON t.professor_id = p.id 
                WHERE t.unidade_id = %d ORDER BY t.nome ASC",
                $unidade_id
            ));
        } else {
            $results = $wpdb->get_results(
                "SELECT t.*, p.nome as professor_nome FROM $table_name t 
                LEFT JOIN {$wpdb->prefix}escola_professores p ON t.professor_id = p.id 
                ORDER BY t.nome ASC"
            );
        }
        
        return $results;
    }
    
    public static function get_by_id($id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_turmas';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT t.*, p.nome as professor_nome FROM $table_name t 
            LEFT JOIN {$wpdb->prefix}escola_professores p ON t.professor_id = p.id 
            WHERE t.id = %d",
            $id
        ));
    }
    
    public static function create($data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_turmas';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'nome' => sanitize_text_field($data['nome']),
                'descricao' => sanitize_textarea_field($data['descricao']),
                'professor_id' => intval($data['professor_id']),
                'unidade_id' => intval($data['unidade_id']),
                'horario' => sanitize_text_field($data['horario']),
                'dias_semana' => sanitize_text_field($data['dias_semana']),
                'max_alunos' => intval($data['max_alunos']),
                'valor_mensalidade' => floatval($data['valor_mensalidade']),
                'status' => sanitize_text_field($data['status']),
                'data_inicio' => sanitize_text_field($data['data_inicio']),
                'data_fim' => sanitize_text_field($data['data_fim'])
            ),
            array('%s', '%s', '%d', '%d', '%s', '%s', '%d', '%f', '%s', '%s', '%s')
        );
        
        if ($result !== false) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    public static function update($id, $data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_turmas';
        
        return $wpdb->update(
            $table_name,
            array(
                'nome' => sanitize_text_field($data['nome']),
                'descricao' => sanitize_textarea_field($data['descricao']),
                'professor_id' => intval($data['professor_id']),
                'unidade_id' => intval($data['unidade_id']),
                'horario' => sanitize_text_field($data['horario']),
                'dias_semana' => sanitize_text_field($data['dias_semana']),
                'max_alunos' => intval($data['max_alunos']),
                'valor_mensalidade' => floatval($data['valor_mensalidade']),
                'status' => sanitize_text_field($data['status']),
                'data_inicio' => sanitize_text_field($data['data_inicio']),
                'data_fim' => sanitize_text_field($data['data_fim'])
            ),
            array('id' => $id),
            array('%s', '%s', '%d', '%d', '%s', '%s', '%d', '%f', '%s', '%s', '%s'),
            array('%d')
        );
    }
    
    public static function delete($id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_turmas';
        
        return $wpdb->delete(
            $table_name,
            array('id' => $id),
            array('%d')
        );
    }
    
    public static function get_count($unidade_id = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_turmas';
        
        if ($unidade_id) {
            return $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name WHERE unidade_id = %d AND status = 'ativa'",
                $unidade_id
            ));
        } else {
            return $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE status = 'ativa'");
        }
    }
    
    public static function get_alunos_matriculados($turma_id) {
        global $wpdb;
        
        $table_matriculas = $wpdb->prefix . 'escola_matriculas';
        $table_alunos = $wpdb->prefix . 'escola_alunos';
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT a.*, m.data_matricula FROM $table_alunos a 
            INNER JOIN $table_matriculas m ON a.id = m.aluno_id 
            WHERE m.turma_id = %d AND m.status = 'ativa' 
            ORDER BY a.nome ASC",
            $turma_id
        ));
    }
}
