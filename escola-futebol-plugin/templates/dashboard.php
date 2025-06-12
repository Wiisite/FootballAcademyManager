
<div class="escola-futebol-container">
    <div class="escola-stats">
        <div class="escola-stat-card">
            <h3>Total de Alunos</h3>
            <p class="number"><?php echo EscolaFutebol_Alunos::get_count(); ?></p>
        </div>
        <div class="escola-stat-card">
            <h3>Total de Professores</h3>
            <p class="number"><?php echo EscolaFutebol_Professores::get_count(); ?></p>
        </div>
        <div class="escola-stat-card">
            <h3>Total de Turmas</h3>
            <p class="number"><?php echo EscolaFutebol_Turmas::get_count(); ?></p>
        </div>
        <div class="escola-stat-card">
            <h3>Receita do Mês</h3>
            <p class="number">R$ <?php echo number_format(EscolaFutebol_Financeiro::get_receita_total(null, date('Y-m')), 2, ',', '.'); ?></p>
        </div>
    </div>
    
    <div class="escola-grid">
        <div class="escola-card">
            <h3>Ações Rápidas</h3>
            <p><a href="#" class="escola-btn escola-btn-primary" onclick="showAlunoForm()">Cadastrar Aluno</a></p>
            <p><a href="#" class="escola-btn escola-btn-primary" onclick="showProfessorForm()">Cadastrar Professor</a></p>
            <p><a href="#" class="escola-btn escola-btn-primary" onclick="showTurmaForm()">Criar Turma</a></p>
        </div>
        
        <div class="escola-card">
            <h3>Pendências Financeiras</h3>
            <p class="number"><?php echo EscolaFutebol_Financeiro::get_pendencias(); ?></p>
            <p>pagamentos em atraso</p>
        </div>
    </div>
</div>

<script>
function showAlunoForm() {
    // Implementar modal ou redirecionamento
    alert('Funcionalidade em desenvolvimento');
}

function showProfessorForm() {
    // Implementar modal ou redirecionamento
    alert('Funcionalidade em desenvolvimento');
}

function showTurmaForm() {
    // Implementar modal ou redirecionamento
    alert('Funcionalidade em desenvolvimento');
}
</script>
