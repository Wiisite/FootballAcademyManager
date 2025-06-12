
jQuery(document).ready(function($) {
    
    // Gráficos do dashboard (usando Chart.js se disponível)
    if (typeof Chart !== 'undefined' && $('#graficoReceita').length) {
        var ctx = document.getElementById('graficoReceita').getContext('2d');
        var receitaChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Receita Mensal',
                    data: [12000, 15000, 18000, 16000, 20000, 22000],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // DataTables para tabelas
    if (typeof $.fn.DataTable !== 'undefined') {
        $('.escola-table').DataTable({
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.10.25/i18n/Portuguese-Brasil.json'
            },
            responsive: true,
            pageLength: 25
        });
    }
    
    // Modal para formulários
    function openModal(content) {
        var modal = $('<div class="escola-modal-overlay"><div class="escola-modal">' + content + '<button class="escola-modal-close">&times;</button></div></div>');
        $('body').append(modal);
        
        modal.find('.escola-modal-close').click(function() {
            modal.remove();
        });
        
        modal.click(function(e) {
            if (e.target === this) {
                modal.remove();
            }
        });
    }
    
    // Exportar dados
    window.exportarDados = function(tipo) {
        switch(tipo) {
            case 'alunos':
                window.open(ajaxurl + '?action=escola_export&type=alunos', '_blank');
                break;
            case 'professores':
                window.open(ajaxurl + '?action=escola_export&type=professores', '_blank');
                break;
            case 'financeiro':
                window.open(ajaxurl + '?action=escola_export&type=financeiro', '_blank');
                break;
        }
    };
    
    // Filtros
    $('#filtro-unidade').change(function() {
        var unidadeId = $(this).val();
        if (unidadeId) {
            window.location.href = window.location.pathname + '?unidade_id=' + unidadeId;
        } else {
            window.location.href = window.location.pathname;
        }
    });
    
    // Busca em tempo real
    $('#busca-global').on('input', function() {
        var termo = $(this).val().toLowerCase();
        $('.escola-table tbody tr').each(function() {
            var texto = $(this).text().toLowerCase();
            if (texto.indexOf(termo) > -1) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });
});
