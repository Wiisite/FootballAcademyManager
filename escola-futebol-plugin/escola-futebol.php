
<?php
/**
 * Plugin Name: Sistema de Escola de Futebol
 * Plugin URI: https://github.com/seu-usuario/escola-futebol-plugin
 * Description: Sistema completo para gestão de escola de futebol com alunos, professores, turmas e financeiro.
 * Version: 1.0.0
 * Author: Seu Nome
 * License: GPL v2 or later
 * Text Domain: escola-futebol
 */

// Impedir acesso direto
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes do plugin
define('ESCOLA_FUTEBOL_VERSION', '1.0.0');
define('ESCOLA_FUTEBOL_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ESCOLA_FUTEBOL_PLUGIN_PATH', plugin_dir_path(__FILE__));

// Classe principal do plugin
class EscolaFutebolPlugin {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        // Carregar arquivos necessários
        $this->load_dependencies();
        
        // Inicializar funcionalidades
        $this->init_hooks();
        
        // Carregar scripts e estilos
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
    }
    
    private function load_dependencies() {
        require_once ESCOLA_FUTEBOL_PLUGIN_PATH . 'includes/class-database.php';
        require_once ESCOLA_FUTEBOL_PLUGIN_PATH . 'includes/class-alunos.php';
        require_once ESCOLA_FUTEBOL_PLUGIN_PATH . 'includes/class-professores.php';
        require_once ESCOLA_FUTEBOL_PLUGIN_PATH . 'includes/class-turmas.php';
        require_once ESCOLA_FUTEBOL_PLUGIN_PATH . 'includes/class-financeiro.php';
        require_once ESCOLA_FUTEBOL_PLUGIN_PATH . 'includes/class-unidades.php';
        require_once ESCOLA_FUTEBOL_PLUGIN_PATH . 'admin/class-admin.php';
        require_once ESCOLA_FUTEBOL_PLUGIN_PATH . 'public/class-public.php';
    }
    
    private function init_hooks() {
        // Inicializar classes
        new EscolaFutebol_Database();
        new EscolaFutebol_Admin();
        new EscolaFutebol_Public();
        
        // Adicionar shortcodes
        add_shortcode('escola_dashboard', array($this, 'dashboard_shortcode'));
        add_shortcode('escola_alunos', array($this, 'alunos_shortcode'));
        add_shortcode('escola_professores', array($this, 'professores_shortcode'));
        add_shortcode('escola_turmas', array($this, 'turmas_shortcode'));
        add_shortcode('escola_financeiro', array($this, 'financeiro_shortcode'));
    }
    
    public function enqueue_scripts() {
        wp_enqueue_style('escola-futebol-style', ESCOLA_FUTEBOL_PLUGIN_URL . 'assets/css/style.css', array(), ESCOLA_FUTEBOL_VERSION);
        wp_enqueue_script('escola-futebol-script', ESCOLA_FUTEBOL_PLUGIN_URL . 'assets/js/script.js', array('jquery'), ESCOLA_FUTEBOL_VERSION, true);
        
        // Localizar script para AJAX
        wp_localize_script('escola-futebol-script', 'escola_futebol_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('escola_futebol_nonce')
        ));
    }
    
    public function admin_enqueue_scripts() {
        wp_enqueue_style('escola-futebol-admin-style', ESCOLA_FUTEBOL_PLUGIN_URL . 'assets/css/admin.css', array(), ESCOLA_FUTEBOL_VERSION);
        wp_enqueue_script('escola-futebol-admin-script', ESCOLA_FUTEBOL_PLUGIN_URL . 'assets/js/admin.js', array('jquery'), ESCOLA_FUTEBOL_VERSION, true);
    }
    
    public function activate() {
        // Criar tabelas do banco de dados
        EscolaFutebol_Database::create_tables();
        
        // Definir capacidades
        $this->add_capabilities();
        
        flush_rewrite_rules();
    }
    
    public function deactivate() {
        flush_rewrite_rules();
    }
    
    private function add_capabilities() {
        $role = get_role('administrator');
        $role->add_cap('manage_escola_futebol');
        $role->add_cap('edit_alunos');
        $role->add_cap('edit_professores');
        $role->add_cap('edit_turmas');
    }
    
    // Shortcodes
    public function dashboard_shortcode($atts) {
        ob_start();
        include ESCOLA_FUTEBOL_PLUGIN_PATH . 'templates/dashboard.php';
        return ob_get_clean();
    }
    
    public function alunos_shortcode($atts) {
        ob_start();
        include ESCOLA_FUTEBOL_PLUGIN_PATH . 'templates/alunos.php';
        return ob_get_clean();
    }
    
    public function professores_shortcode($atts) {
        ob_start();
        include ESCOLA_FUTEBOL_PLUGIN_PATH . 'templates/professores.php';
        return ob_get_clean();
    }
    
    public function turmas_shortcode($atts) {
        ob_start();
        include ESCOLA_FUTEBOL_PLUGIN_PATH . 'templates/turmas.php';
        return ob_get_clean();
    }
    
    public function financeiro_shortcode($atts) {
        ob_start();
        include ESCOLA_FUTEBOL_PLUGIN_PATH . 'templates/financeiro.php';
        return ob_get_clean();
    }
}

// Inicializar o plugin
new EscolaFutebolPlugin();
