#!/usr/bin/perl
use strict; use warnings; use utf8;
use open ':std', ':encoding(UTF-8)';
use FindBin;
my $file = "$FindBin::Bin/../index.html";

open(my $fh, '<:encoding(UTF-8)', $file) or die $!;
local $/; my $txt = <$fh>; close $fh;

my @pairs = (
  # Brand / Setup
  ['<h1>Gestor de Tarefas</h1>',                     '<h1>Task Manager</h1>'],
  ['BOA Hotels · Gestor de Tarefas',                 'BOA Hotels · Task Manager'],
  ['BOA Hotels · Task Manager — gerado automaticamente', 'BOA Hotels · Task Manager — auto-generated'],
  ['<div class="nav-section">Tarefas</div>',         '<div class="nav-section">Tasks</div>'],
  ['▤</span> Modelos',                               '▤</span> Templates'],
  ['Subtarefas — cada uma com data opcional',        'Subtasks — each one with optional date'],
  ['Modelos de checklist</h3>',                      'Checklist templates</h3>'],

  # Buttons / labels in code
  ['>Apagar</button>',                               '>Delete</button>'],
  [">Apagar<",                                       ">Delete<"],
  ["{label:'Concluída'}",                            "{label:'Done'}"],
  ["= 'Guardar'",                                    "= 'Save'"],
  ["= 'Guardar modelo'",                             "= 'Save template'"],
  ["= 'Atualizar lista'",                            "= 'Update list'"],
  ["= 'Nova lista'",                                 "= 'New list'"],
  ["= 'Editar lista'",                               "= 'Edit list'"],
  ["= 'Editar modelo'",                              "= 'Edit template'"],
  ["= 'Novo modelo'",                                "= 'New template'"],
  ["push(['Importância',",                           "push(['Priority',"],
  ['confirm(`Apagar "${list.name}" e todas as suas tarefas?`)', 'confirm(`Delete "${list.name}" and all its tasks?`)'],
  ['Apagar "${l.name}"',                             'Delete "${l.name}"'],

  # Date/day arrays
  ["const DOW = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']", "const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']"],
  ["const MONTH = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']", "const MONTH = ['January','February','March','April','May','June','July','August','September','October','November','December']"],

  # selectView titles (textContent)
  ["main-title').textContent = 'Painel'",             "main-title').textContent = 'Dashboard'"],
  ["main-title').textContent = 'Todas'",              "main-title').textContent = 'All'"],
  ["main-title').textContent = 'Hoje'",               "main-title').textContent = 'Today'"],
  ["main-title').textContent = 'Concluídas'",         "main-title').textContent = 'Completed'"],
  ["main-title').textContent = 'Calendário'",         "main-title').textContent = 'Calendar'"],

  # Briefing section title literal (passed as arg)
  ["sec('Vencidas', overdueRows",                     "sec('Overdue', overdueRows"],
  ["sec('Vencidas', d.overdue.map(row))",             "sec('Overdue', d.overdue.map(row))"],
  ["sec('Alta prioridade', highRows)",                "sec('High priority', highRows)"],
  ["sec('Alta prioridade', d.highPri.map(row))",      "sec('High priority', d.highPri.map(row))"],
  ['Semana passada <span',                            'Last week <span'],
  ['Esta semana <span',                               'This week <span'],

  # Toast messages
  ["showToast('Modelo atualizado",                    "showToast('Template updated"],
  ["showToast('Modelo guardado",                      "showToast('Template saved"],
  ["showToast('Erro ao guardar: '",                   "showToast('Error saving: '"],
  ["showToast('Briefing enviado",                     "showToast('Briefing sent"],
  ["showToast('Briefing aberto",                      "showToast('Briefing opened"],
  ["showToast('Modelo aplicado: ' + t.name + (t.monthly ? ' (mensal)' : ''))",  "showToast('Template applied: ' + t.name + (t.monthly ? ' (monthly)' : ''))"],
  ["showToast('Lista guardada",                       "showToast('List saved"],
  ["showToast('Lista criada",                         "showToast('List created"],
  ["showToast('Lista atualizada",                     "showToast('List updated"],
  ["showToast('Sessão terminada')",                   "showToast('Signed out')"],
  ["showToast('Erro: '",                              "showToast('Error: '"],
  ["showToast('Sem ligação à Internet')",             "showToast('No internet connection')"],

  # Comments only - safe to leave but cleaner translated
  ['// ── Templates (Modelos) ──',                    '// ── Templates ──'],
  ['// Próxima meia-hora a partir de agora (mínimo 09:00)', '// Next half-hour from now (min 09:00)'],

  # Newsletter / briefing texts (more)
  [' ✦',                                              ' ✦'],
  ['Bom dia',                                         'Good morning'],

  # Sidebar status fallback
  ["'Por sincronizar'",                               "'Pending sync'"],
  ["'Sem ligação'",                                   "'Offline'"],

  # Calendar reload error
  ["alert('Erro",                                     "alert('Error"],

  # Generic remaining
  [' tarefas ', ' tasks '],
  [' tarefa ', ' task '],

  # Quick-add textarea title placeholders if any leftover
  ['placeholder="Título"',                            'placeholder="Title"'],

  # Add list select option / placeholder text
  ['Lista (opcional)',                                'List (optional)'],

  # Status badges full names if any
  [">À espera<",                                      ">Waiting<"],

  # Schedule "Bloquear" leftover
  ['Bloquear no calendário</button>',                 'Block on calendar</button>'],

  # Templates list "Editar" pencil tooltip
  ['title="Editar"',                                  'title="Edit"'],

  # focus card hint
  ['Ainda não estás ligado',                          'Not yet connected'],
);

my $count = 0;
for my $p (@pairs) {
  my ($old, $new) = @$p;
  my $before = $txt;
  $txt =~ s/\Q$old\E/$new/g;
  if ($before ne $txt) {
    my $n = () = $before =~ /\Q$old\E/g;
    $count += $n;
  }
}

open(my $out, '>:encoding(UTF-8)', $file) or die $!;
print $out $txt; close $out;
print "Pass 2: replaced ~$count more. Length: ", length($txt), "\n";
