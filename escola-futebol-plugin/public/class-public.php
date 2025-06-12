
<?php

class EscolaFutebol_Public {
    
    public function __construct() {
        add_action('wp_ajax_escola_futebol_public_action', array($this, 'handle_ajax'));
        add_action('wp_ajax_nopriv_escola_futebol_public_action', array($this, 'handle_ajax'));
    }
    
    public function handle_ajax() {
        check_ajax_referer('escola_futebol_nonce', 'nonce');
        
        $action = isset($_POST['escola_action']) ? $_POST['escola_action'] : '';
        
        switch ($action) {
            case 'get_alunos':
                $this->get_alunos_public();
                break;
            case 'get_professores':
                $this->get_professores_public();
                break;
            case 'get_turmas':
                $this->get_turmas_public();
                break;
            default:
                wp_die('Ação inválida');
        }
    }
    
    private function get_alunos_public() {
        $unidade_id = isset($_POST['unidade_id']) ? intval($_POST['unidade_id']) : null;
        $alunos = EscolaFutebol_Alunos::get_all($unidade_id);
        
        wp_send_json_success($alunos);
    }
    
    private function get_professores_public() {
        $unidade_id = isset($_POST['unidade_id']) ? intval($_POST['unidade_id']) : null;
        $professores = EscolaFutebol_Professores::get_all($unidade_id);
        
        wp_send_json_success($professores);
    }
    
    private function get_turmas_public() {
        $unidade_id = isset($_POST['unidade_id']) ? intval($_POST['unidade_id']) : null;
        $turmas = EscolaFutebol_Turmas::get_all($unidade_id);
        
        wp_send_json_success($turmas);
    }
}
