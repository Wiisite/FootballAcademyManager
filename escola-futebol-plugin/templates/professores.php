
<div class="escola-futebol-container">
    <div class="escola-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>Professores</h2>
            <a href="#" class="escola-btn escola-btn-primary" onclick="showProfessorForm()">Novo Professor</a>
        </div>
        
        <table class="escola-table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Especialidade</th>
                    <th>Salário</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $professores = EscolaFutebol_Professores::get_all();
                foreach ($professores as $professor): 
                ?>
                <tr>
                    <td><?php echo esc_html($professor->nome); ?></td>
                    <td><?php echo esc_html($professor->email); ?></td>
                    <td><?php echo esc_html($professor->telefone); ?></td>
                    <td><?php echo esc_html($professor->especialidade); ?></td>
                    <td>R$ <?php echo number_format($professor->salario, 2, ',', '.'); ?></td>
                    <td>
                        <span class="escola-status <?php echo $professor->status; ?>">
                            <?php echo ucfirst($professor->status); ?>
                        </span>
                    </td>
                    <td>
                        <a href="#" class="escola-btn escola-btn-secondary" onclick="editProfessor(<?php echo $professor->id; ?>)">Editar</a>
                        <a href="#" class="escola-btn escola-btn-danger" onclick="deleteProfessor(<?php echo $professor->id; ?>)">Excluir</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
function showProfessorForm() {
    alert('Funcionalidade em desenvolvimento');
}

function editProfessor(id) {
    alert('Editar professor ID: ' + id);
}

function deleteProfessor(id) {
    if (confirm('Tem certeza que deseja excluir este professor?')) {
        alert('Excluir professor ID: ' + id);
    }
}
</script>
