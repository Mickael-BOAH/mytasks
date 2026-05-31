// Translate index.html PT -> EN. Idempotent.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const path = resolve(here, '..', 'index.html');
let txt = readFileSync(path, 'utf8');

const pairs = [
  // Sidebar / navigation
  ['>Painel<',                                       '>Dashboard<'],
  ['>Todas<',                                        '>All<'],
  ['>Hoje<',                                         '>Today<'],
  ['>Concluídas<',                                   '>Completed<'],
  ['>Calendário<',                                   '>Calendar<'],
  ['"main-title">Todas',                             '"main-title">All'],
  ['As minhas listas',                               'My lists'],
  ['Nova lista</div>',                               'New list</div>'],
  ['Modelos</div>',                                  'Templates</div>'],
  ['>Modelos<',                                      '>Templates<'],

  // Header buttons
  ['+ Nova tarefa<',                                 '+ New task<'],
  ['Atualizar</button>',                             'Refresh</button>'],
  ['Reconectar Google',                              'Reconnect Google'],
  ['Briefing semanal',                               'Weekly briefing'],

  // Filter bar
  ['Procurar…',                                      'Search…'],
  ['Pesquisar…',                                     'Search…'],
  ['>Estado: todos<',                                '>Status: all<'],
  ['>Por fazer<',                                    '>To do<'],
  ['>Em curso<',                                     '>In progress<'],
  ['>Bloqueada<',                                    '>Blocked<'],
  ['>À espera<',                                     '>Waiting<'],
  ['>Concluída<',                                    '>Done<'],
  ['>Prioridade: todas<',                            '>Priority: all<'],
  ['>Alta<',                                         '>High<'],
  ['>Média<',                                        '>Medium<'],
  ['>Baixa<',                                        '>Low<'],
  ['>Vencidas<',                                     '>Overdue<'],
  ['Limpar</button>',                                'Clear</button>'],

  // Empty states
  ['Sem tarefas ainda.<br>Adiciona a tua primeira tarefa.', 'No tasks yet.<br>Add your first task.'],
  ['Sem tarefas.<br>Adiciona uma nova abaixo.',      'No tasks.<br>Add a new one below.'],
  ['Sem tarefas vencidas nem para hoje. Tudo em dia.', 'No overdue tasks and nothing for today. All set.'],
  ['Sem prazos nos próximos 7 dias.',                'No deadlines in the next 7 days.'],
  ['Nada bloqueado nem em espera.',                  'Nothing blocked or waiting.'],
  ['Sem listas.',                                    'No lists.'],
  ['Sem emails para este filtro.',                   'No emails for this filter.'],
  ['Sem emails não lidos.',                          'No unread emails.'],
  ['Ainda não há tarefas concluídas.',               'No completed tasks yet.'],
  ['A carregar eventos…',                            'Loading events…'],
  ['A carregar emails…',                             'Loading emails…'],
  ['A pesquisar…',                                   'Searching…'],
  ['A ligar…',                                       'Connecting…'],
  ['Sincronizado',                                   'Synced'],

  // Quick add modal
  ['placeholder="Nova tarefa…"',                     'placeholder="New task…"'],
  ['>Prioridade</option>',                           '>Priority</option>'],
  ['>Sem lista</option>',                            '>No list</option>'],
  ['>Sem departamento</option>',                     '>No department</option>'],
  ['>Departamento</option>',                         '>Department</option>'],
  ['>Não repetir</option>',                          ">Don't repeat</option>"],
  ['>Diariamente</option>',                          '>Daily</option>'],
  ['>Dias úteis</option>',                           '>Weekdays</option>'],
  ['>Semanalmente</option>',                         '>Weekly</option>'],
  ['>Mensalmente</option>',                          '>Monthly</option>'],
  ['>Anualmente</option>',                           '>Yearly</option>'],
  ['>Semanal</option>',                              '>Weekly</option>'],
  ['>Mensal</option>',                               '>Monthly</option>'],
  ['>Anual</option>',                                '>Yearly</option>'],
  ['— sem repetir —',                                "— don't repeat —"],
  ['placeholder="Adicionar passo…"',                 'placeholder="Add step…"'],
  ['placeholder="Notas / action points…"',           'placeholder="Notes / action points…"'],
  ['placeholder="Notas, contexto, links…"',          'placeholder="Notes, context, links…"'],
  ['>Subtarefas <span',                              '>Subtasks <span'],
  ['>Notas</label>',                                 '>Notes</label>'],
  ['Criar tarefa</button>',                          'Create task</button>'],
  ['Cancelar</button>',                              'Cancel</button>'],
  ['Usar modelo</label>',                            'Use template</label>'],
  ['Usar modelo',                                    'Use template'],
  ['Repetir</label>',                                'Repeat</label>'],
  ['Lista</label>',                                  'List</label>'],
  ['Departamento</label>',                           'Department</label>'],

  // Task detail modal labels
  ['>Estado</label>',                                '>Status</label>'],
  ['>Importância</label>',                           '>Priority</label>'],
  ['>Criada em</label>',                             '>Created on</label>'],
  ['>Data fim</label>',                              '>Due date</label>'],
  ['✓ Guardar alterações',                           '✓ Save changes'],
  ['⊞ Bloquear no calendário',                       '⊞ Block on calendar'],
  ['✉ Follow-up por email',                          '✉ Follow-up email'],
  ['⤓ Exportar Word',                                '⤓ Export to Word'],
  ['↳ Tornar subtarefa',                             '↳ Make subtask'],
  ['class="danger" onclick="deleteTaskFromModal()">Apagar', 'class="danger" onclick="deleteTaskFromModal()">Delete'],
  ['title="Apagar"',                                 'title="Delete"'],
  ['title="Editar lista"',                           'title="Edit list"'],
  ['title="Apagar lista"',                           'title="Delete list"'],
  ['title="Agendar no calendário"',                  'title="Schedule on calendar"'],
  ['title="Bloquear no calendário"',                 'title="Block on calendar"'],
  ['title="Data da subtarefa"',                      'title="Subtask date"'],
  ['title="Repetir"',                                'title="Repeat"'],
  ['title="Repetir esta subtarefa"',                 'title="Repeat this subtask"'],
  ['title="Clica para forçar atualização"',          'title="Click to force refresh"'],

  // Schedule modal
  ['Agendar no Calendário',                          'Schedule on Calendar'],
  ['Título do evento</label>',                       'Event title</label>'],
  ['>Data</label>',                                  '>Date</label>'],
  ['>Início</label>',                                '>Start</label>'],
  ['>Fim</label>',                                   '>End</label>'],
  ['Criar evento</button>',                          'Create event</button>'],

  // Google
  ['● Google ligado',                                '● Google connected'],
  ['Ligar ao Google →',                              'Connect to Google →'],
  ['Ligar ao Google',                                'Connect to Google'],

  // Dashboard cards
  ['>Hoje</div>',                                    '>Today</div>'],
  ['>Vencidas</div>',                                '>Overdue</div>'],
  ['>Próx. 7 dias</div>',                            '>Next 7 days</div>'],
  ['>Concluídas 7d</div>',                           '>Done 7d</div>'],
  ['>Foco de hoje</h4>',                             ">Today's focus</h4>"],
  ['>A precisar de atenção</h4>',                    '>Needs attention</h4>'],
  ['>Prazos · próximos 7 dias</h4>',                 '>Deadlines · next 7 days</h4>'],
  ['>Por unidade</h4>',                              '>By unit</h4>'],
  ['>Estado &amp; prioridade</h4>',                  '>Status &amp; priority</h4>'],
  ['<span>Em curso</span>',                          '<span>In progress</span>'],
  ['<span>Bloqueadas</span>',                        '<span>Blocked</span>'],
  ['<span>À espera</span>',                          '<span>Waiting</span>'],
  ['<span>Por fazer</span>',                         '<span>To do</span>'],
  ['<span>Alta prioridade</span>',                   '<span>High priority</span>'],

  // Briefing modal pieces
  ['Semana de ',                                     'Week of '],
  ['Enviar para o meu Gmail',                        'Send to my Gmail'],
  ['Fechar</button>',                                'Close</button>'],

  // List modal
  ['Nova lista</h3>',                                'New list</h3>'],
  ['Editar lista</h3>',                              'Edit list</h3>'],
  ['Nome</label>',                                   'Name</label>'],
  ['Cor</label>',                                    'Color</label>'],
  ['Departamentos</label>',                          'Departments</label>'],
  ['Adicionar departamento…',                        'Add department…'],
  ['Ex: Trabalho, Pessoal…',                         'e.g. Work, Personal…'],
  ['Apagar lista</button>',                          'Delete list</button>'],
  ['Guardar</button>',                               'Save</button>'],
  ['Adicionar lista</button>',                       'Add list</button>'],
  ['Eliminar a lista também elimina todas as tarefas dela. Continuar?', 'Deleting this list also deletes all its tasks. Continue?'],

  // Templates modal
  ['Modelos check-list</h3>',                        'Checklist templates</h3>'],
  ['Editar modelo</h3>',                             'Edit template</h3>'],
  ['Novo modelo</h3>',                               'New template</h3>'],
  ['Nome do modelo',                                 'Template name'],
  ['Passo da checklist…',                            'Checklist step…'],
  ['Dia (1-31)',                                     'Day (1-31)'],
  ['Esta tarefa repete mensalmente',                 'This task repeats monthly'],
  ['Guardar modelo</button>',                        'Save template</button>'],
  ['Modelos existentes</label>',                     'Existing templates</label>'],
  ['Sem modelos guardados.',                         'No saved templates.'],
  ['Eliminar este modelo?',                          'Delete this template?'],

  // Email view
  ['Pesquisar… (ex: from:fornecedor, has:attachment)','Search… (e.g. from:supplier, has:attachment)'],
  ['Por ler',                                        'Unread'],
  ['Esta semana',                                    'This week'],
  ['Importantes',                                    'Important'],
  ['Todos',                                          'All'],
  ['Abrir no Gmail',                                 'Open in Gmail'],
  ['→ Criar task',                                   '→ Create task'],
  ['Procurar</button>',                              'Search</button>'],

  // Briefing section labels
  ['<span>Vencidas</span>',                          '<span>Overdue</span>'],
  ['<span>Esta semana</span>',                       '<span>This week</span>'],
  ['<span>Semana passada</span>',                    '<span>Last week</span>'],

  // Action required dashboard
  ['⚠ Ação necessária — ',                           '⚠ Action required — '],
  ['tarefa sem lista',                               'task without list'],
  ['tarefas sem lista',                              'tasks without list'],
  ['Abre cada uma e atribui uma lista — todas as tarefas devem pertencer a uma unidade.', 'Open each one and assign a list — every task should belong to a unit.'],

  // Calendar error
  ['Erro ao criar evento. O token pode ter expirado — volta a ligar ao Google.', 'Error creating event. Token may have expired — connect to Google again.'],

  // Sub-task hint
  ['— ao concluir cria nova ocorrência',             '— creates next occurrence when completed'],

  // STATUS / REPEAT constants (JS literals)
  ["todo:    {label:'Por fazer'}",                   "todo:    {label:'To do'}"],
  ["doing:   {label:'Em curso',",                    "doing:   {label:'In progress',"],
  ["blocked: {label:'Bloqueada',",                   "blocked: {label:'Blocked',"],
  ["waiting: {label:'À espera',",                    "waiting: {label:'Waiting',"],
  ["done:    {label:'Concluída',",                   "done:    {label:'Done',"],
  ["daily:'Diariamente'",                            "daily:'Daily'"],
  ["weekdays:'Dias úteis'",                          "weekdays:'Weekdays'"],
  ["weekly:'Semanalmente'",                          "weekly:'Weekly'"],
  ["monthly:'Mensalmente'",                          "monthly:'Monthly'"],
  ["yearly:'Anualmente'",                            "yearly:'Yearly'"],
  ["'daily','Diariamente'",                          "'daily','Daily'"],
  ["'weekdays','Dias úteis'",                        "'weekdays','Weekdays'"],
  ["'weekly','Semanal'",                             "'weekly','Weekly'"],
  ["'monthly','Mensal'",                             "'monthly','Monthly'"],
  ["'yearly','Anual'",                               "'yearly','Yearly'"],
  ["{alta:'Alta', media:'Média', baixa:'Baixa'}",    "{alta:'High', media:'Medium', baixa:'Low'}"],

  // JS toasts and messages
  ["'Tarefa criada'",                                "'Task created'"],
  ["'Modelos — erro: '",                             "'Templates — error: '"],
  ["'Modelo aplicado: '",                            "'Template applied: '"],
  ["'Dá um nome e pelo menos um passo'",             "'Give it a name and at least one step'"],
  ["'Fim de semana → movido para sexta-feira'",      "'Weekend → moved to Friday'"],
  ["'Fim de semana → sexta'",                        "'Weekend → Friday'"],
  ["'Próxima ocorrência: '",                         "'Next occurrence: '"],
  ["'Liga ao Google primeiro (no sidebar)'",         "'Connect to Google first (in sidebar)'"],
  ["'Exportado para Word'",                          "'Exported to Word'"],
  ["'Evento criado no calendário'",                  "'Event created in calendar'"],
  ["'Fim antes do início → reposto para '",          "'End before start → reset to '"],
  ["' min')",                                        "' min')"],

  // Briefing text
  ['Bom trabalho.',                                  'Good work.'],
  ['— sem tarefas —',                                '— no tasks —'],
  ['— sem prazos esta semana —',                     '— no deadlines this week —'],
  ['tarefas concluídas',                             'tasks completed'],
  ['tarefa concluída',                               'task completed'],
  ['vencidas ·',                                     'overdue ·'],

  // Briefing plain-text version
  ['BRIEFING SEMANAL — ',                            'WEEKLY BRIEFING — '],
  ['VENCIDAS (',                                     'OVERDUE ('],
  ['ESTA SEMANA',                                    'THIS WEEK'],
  ['ALTA PRIORIDADE (',                              'HIGH PRIORITY ('],
  ['SEMANA PASSADA — ',                              'LAST WEEK — '],
  [' concluídas',                                    ' completed'],

  // Confirms
  ["'Eliminar esta tarefa?'",                        "'Delete this task?'"],
  ["confirm('Eliminar",                              "confirm('Delete"],

  // Setup screen / errors
  ['Esta conta Google não tem acesso à app.',        'This Google account does not have access to the app.'],
  ['Iniciar sessão com Google',                      'Sign in with Google'],
  ['Entrar com Google',                              'Sign in with Google'],
  ['Sair</button>',                                  'Sign out</button>'],

  // Email/follow-up body
  ['Follow-up: ',                                    'Follow-up: '],
  [' — Referente à tarefa: ',                        ' — Regarding task: '],
  ['  Prazo: ',                                      '  Due: '],

  // Word export labels
  ['Unidade / Lista',                                'Unit / List'],
  ['Repetição',                                      'Recurrence'],
  ['Notas</h3>',                                     'Notes</h3>'],
  ['Subtarefas</h3>',                                'Subtasks</h3>'],
  ["'Tarefa - '",                                    "'Task - '"],
  ['Tarefa - ',                                      'Task - '],

  // Subtask repeat label
  ['Concluídas — ',                                  'Completed — '],

  // Misc
  ['Sem assunto',                                    'No subject'],
  ['(sem assunto)',                                  '(no subject)'],
  ['— Sem lista —',                                  '— No list —'],
  ['— Sem departamento —',                           '— No department —'],
  ['Sem lista',                                      'No list'],
  ['vencida',                                        'overdue'],

  // Vista Concluídas
  ['Sem lista',                                      'No list'],

  // Reconnect inline html
  ['Liga ao Google para ver ',                       'Connect to Google to see '],
  ['os emails',                                      'emails'],
  ['a agenda',                                       'the calendar'],

  // Sync status
  ['● Sincronizado',                                 '● Synced'],

  // PT-PT month/day names — handled at code level below
];

let count = 0;
for (const [oldStr, newStr] of pairs) {
  const before = txt.length;
  const escaped = oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  txt = txt.split(oldStr).join(newStr);
  const occ = (before - txt.length) / (oldStr.length - newStr.length) || 0;
  if (occ > 0) count += Math.abs(occ);
}

// Replace pt-PT locales with en-GB for date formatting
txt = txt.split("toLocaleDateString('pt-PT'").join("toLocaleDateString('en-GB'");
txt = txt.split("toLocaleTimeString('pt-PT'").join("toLocaleTimeString('en-GB'");

writeFileSync(path, txt, 'utf8');
console.log('Translated ~' + count + ' occurrences. Length: ' + txt.length);
