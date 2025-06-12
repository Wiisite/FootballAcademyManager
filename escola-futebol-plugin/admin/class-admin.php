
<?php

class EscolaFutebol_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('wp_ajax_escola_futebol_action', array($this, 'handle_ajax'));
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Escola de Futebol',
            'Escola de Futebol',
            'manage_escola_futebol',
            'escola-futebol',
            array($this, 'admin_page'),
            'dashicons-awards',
            26
        );
        
        add_submenu_page(
            'escola-futebol',
            'Dashboard',
            'Dashboard',
            'manage_escola_futebol',
            'escola-futebol',
            array($this, 'dashboard_page')
        );
        
        add_submenu_page(
            'escola-futebol',
            'Alunos',
            'Alunos',
            'edit_alunos',
            'escola-futebol-alunos',
            array($this, 'alunos_page')
        );
        
        add_submenu_page(
            'escola-futebol',
            'Professores',
            'Professores',
            'edit_professores',
            'escola-futebol-professores',
            array($this, 'professores_page')
        );
        
        add_submenu_page(
            'escola-futebol',
            'Turmas',
            'Turmas',
            'edit_turmas',
            'escola-futebol-turmas',
            array($this, 'turmas_page')
        );
        
        add_submenu_page(
            'escola-futebol',
            'Financeiro',
            'Financeiro',
            'manage_escola_futebol',
            'escola-futebol-financeiro',
            array($this, 'financeiro_page')
        );
    }
    
    public function admin_page() {
        $this->dashboard_page();
    }
    
    public function dashboard_page() {
        $total_alunos = EscolaFutebol_Alunos::get_count();
        
        include ESCOLA_FUTEBOL_PLUGIN_PATH . 'admin/views/dashboard.php';
    }
    
    public function alunos_page() {
        $action = isset($_GET['action']) ? $_GET['action'] : 'list';
        
        switch ($action) {
            case 'add':
                include ESCOLA_FUTEBOL_PLUGIN_PATH . 'admin/views/aluno-form.php';
                break;
            case 'edit':
                $aluno_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
                $aluno = EscolaFutebol_Alunos::get_by_id($aluno_id);
                include ESCOLA_FUTEBOL_PLUGIN_PATH . 'admin/views/aluno-form.php';
                break;
            default:
                $alunos = EscolaFutebol_Alunos::get_all();
                include ESCOLA_FUTEBOL_PLUGIN_PATH . 'admin/views/alunos-list.php';
                break;
        }
    }
    
    public function professores_page() {
        echo '<div class="wrap"><h1>Gestão de Professores</h1><p>Em desenvolvimento...</p></div>';
    }
    
    public function turmas_page() {
        echo '<div class="wrap"><h1>Gestão de Turmas</h1><p>Em desenvolvimento...</p></div>';
    }
    
    public function financeiro_page() {
        echo '<div class="wrap"><h1>Gestão Financeira</h1><p>Em desenvolvimento...</p></div>';
    }
    
    public function handle_ajax() {
        check_ajax_referer('escola_futebol_nonce', 'nonce');
        
        $action = isset($_POST['escola_action']) ? $_POST['escola_action'] : '';
        
        switch ($action) {
            case 'save_aluno':
                $this->save_aluno();
                break;
            case 'delete_aluno':
                $this->delete_aluno();
                break;
            default:
                wp_die('Ação inválida');
        }
    }
    
    private function save_aluno() {
        $data = array(
            'nome' => $_POST['nome'],
            'email' => $_POST['email'],
            'telefone' => $_POST['telefone'],
            'data_nascimento' => $_POST['data_nascimento'],
            'endereco' => $_POST['endereco'],
            'responsavel_nome' => $_POST['responsavel_nome'],
            'responsavel_telefone' => $_POST['responsavel_telefone'],
            'responsavel_email' => $_POST['responsavel_email'],
            'unidade_id' => $_POST['unidade_id'],
            'status' => $_POST['status']
        );
        
        if (isset($_POST['aluno_id']) && $_POST['aluno_id']) {
            $result = EscolaFutebol_Alunos::update($_POST['aluno_id'], $data);
        } else {
            $result = EscolaFutebol_Alunos::create($data);
        }
        
        if ($result) {
            wp_send_json_success('Aluno salvo com sucesso!');
        } else {
            wp_send_json_error('Erro ao salvar aluno.');
        }
    }
    
    private function delete_aluno() {
        $aluno_id = intval($_POST['aluno_id']);
        $result = EscolaFutebol_Alunos::delete($aluno_id);
        
        if ($result) {
            wp_send_json_success('Aluno excluído com sucesso!');
        } else {
            wp_send_json_error('Erro ao excluir aluno.');
        }
    }
}
