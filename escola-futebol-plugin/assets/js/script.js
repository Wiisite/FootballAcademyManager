
jQuery(document).ready(function($) {
    
    // Função para chamadas AJAX
    function escolaAjax(action, data, callback) {
        $.ajax({
            url: escola_futebol_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'escola_futebol_action',
                escola_action: action,
                nonce: escola_futebol_ajax.nonce,
                ...data
            },
            success: function(response) {
                if (callback) callback(response);
            },
            error: function(xhr, status, error) {
                console.error('Erro na requisição AJAX:', error);
                alert('Erro na requisição. Tente novamente.');
            }
        });
    }
    
    // Função para salvar aluno
    window.saveAluno = function(formData) {
        escolaAjax('save_aluno', formData, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Erro: ' + response.data);
            }
        });
    };
    
    // Função para excluir aluno
    window.deleteAluno = function(alunoId) {
        if (confirm('Tem certeza que deseja excluir este aluno?')) {
            escolaAjax('delete_aluno', {aluno_id: alunoId}, function(response) {
                if (response.success) {
                    alert(response.data);
                    location.reload();
                } else {
                    alert('Erro: ' + response.data);
                }
            });
        }
    };
    
    // Função para salvar professor
    window.saveProfessor = function(formData) {
        escolaAjax('save_professor', formData, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Erro: ' + response.data);
            }
        });
    };
    
    // Função para excluir professor
    window.deleteProfessor = function(professorId) {
        if (confirm('Tem certeza que deseja excluir este professor?')) {
            escolaAjax('delete_professor', {professor_id: professorId}, function(response) {
                if (response.success) {
                    alert(response.data);
                    location.reload();
                } else {
                    alert('Erro: ' + response.data);
                }
            });
        }
    };
    
    // Função para salvar turma
    window.saveTurma = function(formData) {
        escolaAjax('save_turma', formData, function(response) {
            if (response.success) {
                alert(response.data);
                location.reload();
            } else {
                alert('Erro: ' + response.data);
            }
        });
    };
    
    // Função para excluir turma
    window.deleteTurma = function(turmaId) {
        if (confirm('Tem certeza que deseja excluir esta turma?')) {
            escolaAjax('delete_turma', {turma_id: turmaId}, function(response) {
                if (response.success) {
                    alert(response.data);
                    location.reload();
                } else {
                    alert('Erro: ' + response.data);
                }
            });
        }
    };
    
    // Máscara para telefone
    $('.telefone').mask('(00) 00000-0000');
    
    // Máscara para CPF
    $('.cpf').mask('000.000.000-00');
    
    // Validação de formulários
    $('form').submit(function(e) {
        var isValid = true;
        
        $(this).find('input[required], select[required]').each(function() {
            if (!$(this).val()) {
                isValid = false;
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            alert('Por favor, preencha todos os campos obrigatórios.');
        }
    });
    
    // Remove classe de erro ao digitar
    $('input, select').on('input change', function() {
        $(this).removeClass('error');
    });
});
