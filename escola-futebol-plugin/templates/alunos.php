
<div class="escola-futebol-container">
    <div class="escola-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>Alunos</h2>
            <a href="#" class="escola-btn escola-btn-primary" onclick="showAlunoForm()">Novo Aluno</a>
        </div>
        
        <table class="escola-table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Responsável</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $alunos = EscolaFutebol_Alunos::get_all();
                foreach ($alunos as $aluno): 
                ?>
                <tr>
                    <td><?php echo esc_html($aluno->nome); ?></td>
                    <td><?php echo esc_html($aluno->email); ?></td>
                    <td><?php echo esc_html($aluno->telefone); ?></td>
                    <td><?php echo esc_html($aluno->responsavel_nome); ?></td>
                    <td>
                        <span class="escola-status <?php echo $aluno->status; ?>">
                            <?php echo ucfirst($aluno->status); ?>
                        </span>
                    </td>
                    <td>
                        <a href="#" class="escola-btn escola-btn-secondary" onclick="editAluno(<?php echo $aluno->id; ?>)">Editar</a>
                        <a href="#" class="escola-btn escola-btn-danger" onclick="deleteAluno(<?php echo $aluno->id; ?>)">Excluir</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
function showAlunoForm() {
    // Implementar modal ou formulário
    alert('Funcionalidade em desenvolvimento');
}

function editAluno(id) {
    // Implementar edição
    alert('Editar aluno ID: ' + id);
}

function deleteAluno(id) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        // Implementar exclusão via AJAX
        alert('Excluir aluno ID: ' + id);
    }
}
</script>
