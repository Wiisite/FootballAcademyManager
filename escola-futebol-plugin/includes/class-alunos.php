
<?php

class EscolaFutebol_Alunos {
    
    public static function get_all($unidade_id = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_alunos';
        
        if ($unidade_id) {
            $results = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $table_name WHERE unidade_id = %d ORDER BY nome ASC",
                $unidade_id
            ));
        } else {
            $results = $wpdb->get_results("SELECT * FROM $table_name ORDER BY nome ASC");
        }
        
        return $results;
    }
    
    public static function get_by_id($id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_alunos';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $id
        ));
    }
    
    public static function create($data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_alunos';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'nome' => sanitize_text_field($data['nome']),
                'email' => sanitize_email($data['email']),
                'telefone' => sanitize_text_field($data['telefone']),
                'data_nascimento' => sanitize_text_field($data['data_nascimento']),
                'endereco' => sanitize_textarea_field($data['endereco']),
                'responsavel_nome' => sanitize_text_field($data['responsavel_nome']),
                'responsavel_telefone' => sanitize_text_field($data['responsavel_telefone']),
                'responsavel_email' => sanitize_email($data['responsavel_email']),
                'unidade_id' => intval($data['unidade_id']),
                'status' => sanitize_text_field($data['status'])
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s')
        );
        
        if ($result !== false) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    public static function update($id, $data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_alunos';
        
        return $wpdb->update(
            $table_name,
            array(
                'nome' => sanitize_text_field($data['nome']),
                'email' => sanitize_email($data['email']),
                'telefone' => sanitize_text_field($data['telefone']),
                'data_nascimento' => sanitize_text_field($data['data_nascimento']),
                'endereco' => sanitize_textarea_field($data['endereco']),
                'responsavel_nome' => sanitize_text_field($data['responsavel_nome']),
                'responsavel_telefone' => sanitize_text_field($data['responsavel_telefone']),
                'responsavel_email' => sanitize_email($data['responsavel_email']),
                'unidade_id' => intval($data['unidade_id']),
                'status' => sanitize_text_field($data['status'])
            ),
            array('id' => $id),
            array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s'),
            array('%d')
        );
    }
    
    public static function delete($id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_alunos';
        
        return $wpdb->delete(
            $table_name,
            array('id' => $id),
            array('%d')
        );
    }
    
    public static function get_count($unidade_id = null) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_alunos';
        
        if ($unidade_id) {
            return $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name WHERE unidade_id = %d AND status = 'ativo'",
                $unidade_id
            ));
        } else {
            return $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE status = 'ativo'");
        }
    }
}
