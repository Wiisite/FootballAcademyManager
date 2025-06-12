
<div class="wrap">
    <h1>Dashboard - Escola de Futebol</h1>
    
    <div class="escola-futebol-dashboard">
        <div class="dashboard-widgets">
            <div class="dashboard-widget">
                <div class="widget-content">
                    <h3>Total de Alunos</h3>
                    <div class="widget-number"><?php echo $total_alunos; ?></div>
                </div>
            </div>
            
            <div class="dashboard-widget">
                <div class="widget-content">
                    <h3>Professores Ativos</h3>
                    <div class="widget-number">12</div>
                </div>
            </div>
            
            <div class="dashboard-widget">
                <div class="widget-content">
                    <h3>Turmas Ativas</h3>
                    <div class="widget-number">8</div>
                </div>
            </div>
            
            <div class="dashboard-widget">
                <div class="widget-content">
                    <h3>Receita Mensal</h3>
                    <div class="widget-number">R$ 15.000</div>
                </div>
            </div>
        </div>
        
        <div class="dashboard-actions">
            <h2>Ações Rápidas</h2>
            <a href="<?php echo admin_url('admin.php?page=escola-futebol-alunos&action=add'); ?>" class="button button-primary">Cadastrar Aluno</a>
            <a href="<?php echo admin_url('admin.php?page=escola-futebol-professores&action=add'); ?>" class="button button-secondary">Cadastrar Professor</a>
            <a href="<?php echo admin_url('admin.php?page=escola-futebol-turmas&action=add'); ?>" class="button button-secondary">Criar Turma</a>
        </div>
    </div>
</div>

<style>
.escola-futebol-dashboard {
    margin-top: 20px;
}

.dashboard-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.dashboard-widget {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
}

.dashboard-widget h3 {
    margin: 0 0 10px 0;
    color: #23282d;
    font-size: 14px;
}

.widget-number {
    font-size: 32px;
    font-weight: bold;
    color: #0073aa;
}

.dashboard-actions {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
}

.dashboard-actions h2 {
    margin-top: 0;
}

.dashboard-actions .button {
    margin-right: 10px;
}
</style>
