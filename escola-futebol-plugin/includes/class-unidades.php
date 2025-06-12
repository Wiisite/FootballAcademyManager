
<?php

class EscolaFutebol_Unidades {
    
    public static function get_all() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_unidades';
        
        return $wpdb->get_results("SELECT * FROM $table_name ORDER BY nome ASC");
    }
    
    public static function get_by_id($id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_unidades';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE id = %d",
            $id
        ));
    }
    
    public static function create($data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_unidades';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'nome' => sanitize_text_field($data['nome']),
                'endereco' => sanitize_textarea_field($data['endereco']),
                'telefone' => sanitize_text_field($data['telefone']),
                'email' => sanitize_email($data['email']),
                'responsavel' => sanitize_text_field($data['responsavel']),
                'status' => sanitize_text_field($data['status'])
            ),
            array('%s', '%s', '%s', '%s', '%s', '%s')
        );
        
        if ($result !== false) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    public static function update($id, $data) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_unidades';
        
        return $wpdb->update(
            $table_name,
            array(
                'nome' => sanitize_text_field($data['nome']),
                'endereco' => sanitize_textarea_field($data['endereco']),
                'telefone' => sanitize_text_field($data['telefone']),
                'email' => sanitize_email($data['email']),
                'responsavel' => sanitize_text_field($data['responsavel']),
                'status' => sanitize_text_field($data['status'])
            ),
            array('id' => $id),
            array('%s', '%s', '%s', '%s', '%s', '%s'),
            array('%d')
        );
    }
    
    public static function delete($id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_unidades';
        
        return $wpdb->delete(
            $table_name,
            array('id' => $id),
            array('%d')
        );
    }
    
    public static function get_count() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'escola_unidades';
        
        return $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE status = 'ativa'");
    }
}
