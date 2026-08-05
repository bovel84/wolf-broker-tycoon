/*
 * brokerage-management.js
 * Deep management layer for player-owned brokerage firms.
 * ES5-compatible and designed to coexist with BrokerageCareer.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';
  var installed = false;
  var originalAdvance = null;
  var originalRenderAll = null;

  var CLIENT_TYPES = [
    { id: 'retail', name: 'Retail', minAssets: 25000, maxAssets: 180000, fee: 0.012, patience: 62, risk: 52 },
    { id: 'affluent', name: 'Affluent', minAssets: 180000, maxAssets: 900000, fee: 0.009, patience: 68, risk: 45 },
    { id: 'hnw', name: 'High Net Worth', minAssets: 900000, maxAssets: 6500000, fee: 0.0065, patience: 76, risk: 38 },
    { id: 'corporate', name: 'Corporate', minAssets: 1500000, maxAssets: 12000000, fee: 0.004, patience: 72, risk: 34 },
    { id: 'institutional', name: 'Istituzionale', minAssets: 5000000, maxAssets: 40000000, fee: 0.0025, patience: 82, risk: 28 }
  ];

  var ROLES = [
    { id: 'broker', name: 'Broker', salary: 1100, capacity: 12, sales: 58, risk: 50 },
    { id: 'advisor', name: 'Financial Advisor', salary: 1350, capacity: 9, sales: 48, risk: 32 },
    { id: 'analyst', name: 'Analista', salary: 1450, capacity: 0, sales: 5, risk: 22 },
    { id: 'compliance', name: 'Compliance Officer', salary: 1650, capacity: 0, sales: 0, risk: 8 },
    { id: 'desk_head', name: 'Desk Head', salary: 2200, capacity: 18, sales: 66, risk: 43 }
  ];

  var FIRST_NAMES = ['Giulia', 'Marco', 'Elena', 'Davide', 'Sara', 'Lorenzo', 'Maya', 'Leon', 'Nora', 'Samir', 'Claire', 'Julian'];
  var LAST_NAMES = ['Rossi', 'Bianchi', 'Costa', 'Ferri', 'Voss', 'Mercer', 'Chen', 'Klein', 'Navarro', 'Stone', 'Rinaldi', 'De Luca'];

  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
  function round(value, digits) { var p = Math.pow(10, digits || 0); return Math.round((Number(value) || 0) * p) / p; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function randomBetween(min, max) { return min + Math.random() * (max - min); }
  function safe(value, max) { return String(value || '').replace(/[<>]/g, '').substring(0, max || 180); }
  function getGame() { try { return typeof G !== 'undefined' ? G : null; } catch (e) { return null; } }
  function money(value) { try { return typeof formatEur === 'function' ? formatEur(value) : '€' + Math.round(value).toLocaleString('it-IT'); } catch (e) { return '€' + Math.round(value); } }
  function notify(kind, text) { try { if (typeof toast === 'function') toast(kind, text); } catch (e) {} }

  function getCareer() {
    var g = getGame();
    return g && g.brokerCareer ? g.brokerCareer : null;
  }

  function isOwner() {
    var career = getCareer();
    return !!(career && career.status === 'owner' && career.ownFirm);
  }

  function createEmployee(roleId, level) {
    var role = findRole(roleId) || ROLES[0];
    var skill = clamp(44 + Math.random() * 38 + (level || 0) * 3, 35, 94);
    return {
      id: 'emp_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
      name: pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES),
      roleId: role.id,
      role: role.name,
      skill: round(skill, 0),
      morale: round(randomBetween(54, 78), 0),
      ethics: round(randomBetween(48, 92), 0),
      salary: Math.round(role.salary * (0.82 + skill / 180)),
      clients: 0,
      revenue: 0,
      performance: 50,
      fatigue: 10,
      status: 'active'
    };
  }

  function createClient(typeId) {
    var type = findClientType(typeId) || CLIENT_TYPES[0];
    var assets = randomBetween(type.minAssets, type.maxAssets);
    return {
      id: 'cli_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
      name: pick(FIRST_NAMES) + ' ' + pick(LAST_NAMES),
      typeId: type.id,
      type: type.name,
      assets: Math.round(assets),
      feeRate: type.fee,
      trust: round(randomBetween(48, 72), 0),
      satisfaction: round(randomBetween(50, 74), 0),
      riskTolerance: type.risk,
      patience: type.patience,
      assignedEmployeeId: null,
      weeklyReturn: 0,
      lifetimeFees: 0,
      complaints: 0,
      status: 'active'
    };
  }

  function createState() {
    return {
      version: VERSION,
      employees: [],
      clients: [],
      departments: {
        brokerage: { level: 1, budget: 2500 },
        advisory: { level: 1, budget: 1800 },
        research: { level: 1, budget: 1200 },
        compliance: { level: 1, budget: 1400 },
        technology: { level: 1, budget: 1000 }
      },
      pricing: { tradingFee: 0.003, advisoryFee: 0.009, performanceFee: 0.08 },
      riskPolicy: { appetite: 50, maxConcentration: 28, liquidityBuffer: 18 },
      weekly: { revenue: 0, payroll: 0, operatingCosts: 0, provisions: 0, profit: 0, inflows: 0, outflows: 0 },
      cumulative: { revenue: 0, costs: 0, profit: 0, clientInflows: 0, clientOutflows: 0 },
      balanceSheet: { cash: 0, receivables: 0, fixedAssets: 12000, liabilities: 0, equity: 0 },
      kpi: { assetsUnderManagement: 0, revenuePerEmployee: 0, clientRetention: 100, capacityUse: 0, complianceScore: 70, operationalRisk: 20 },
      incidents: [],
      history: []
    };
  }

  function findRole(id) { var i; for (i = 0; i < ROLES.length; i++) if (ROLES[i].id === id) return ROLES[i]; return null; }
  function findClientType(id) { var i; for (i = 0; i < CLIENT_TYPES.length; i++) if (CLIENT_TYPES[i].id === id) return CLIENT_TYPES[i]; return null; }

  function ensureState() {
    var career = getCareer();
    if (!career || !career.ownFirm) return null;
    if (!career.ownFirm.management || typeof career.ownFirm.management !== 'object') career.ownFirm.management = createState();
    var state = career.ownFirm.management;
    var defaults = createState();
    var key;
    for (key in defaults) if (Object.prototype.hasOwnProperty.call(defaults, key) && state[key] === undefined) state[key] = defaults[key];
    if (!(state.employees instanceof Array)) state.employees = [];
    if (!(state.clients instanceof Array)) state.clients = [];
    if (!(state.incidents instanceof Array)) state.incidents = [];
    if (!(state.history instanceof Array)) state.history = [];
    if (state.employees.length === 0) {
      state.employees.push(createEmployee('broker', 0));
      state.employees.push(createEmployee('advisor', 0));
      state.employees.push(createEmployee('compliance', 0));
    }
    if (state.clients.length === 0) {
      state.clients.push(createClient('retail'));
      state.clients.push(createClient('affluent'));
      state.clients.push(createClient('retail'));
    }
    syncAssignments(state);
    return state;
  }

  function activeEmployees(state) { return state.employees.filter(function (employee) { return employee.status === 'active'; }); }
  function activeClients(state) { return state.clients.filter(function (client) { return client.status === 'active'; }); }

  function syncAssignments(state) {
    var employees = activeEmployees(state).filter(function (employee) { return employee.roleId === 'broker' || employee.roleId === 'advisor' || employee.roleId === 'desk_head'; });
    var clients = activeClients(state);
    var i;
    for (i = 0; i < employees.length; i++) employees[i].clients = 0;
    for (i = 0; i < clients.length; i++) {
      if (!clients[i].assignedEmployeeId || !findEmployee(state, clients[i].assignedEmployeeId)) {
        clients[i].assignedEmployeeId = employees.length ? employees[i % employees.length].id : null;
      }
      var assigned = findEmployee(state, clients[i].assignedEmployeeId);
      if (assigned) assigned.clients += 1;
    }
  }

  function findEmployee(state, id) {
    var i;
    for (i = 0; i < state.employees.length; i++) if (state.employees[i].id === id && state.employees[i].status === 'active') return state.employees[i];
    return null;
  }

  function computeCapacity(state) {
    var employees = activeEmployees(state);
    var total = 0;
    var i;
    for (i = 0; i < employees.length; i++) {
      var role = findRole(employees[i].roleId);
      if (role) total += role.capacity * (0.65 + employees[i].skill / 150);
    }
    return Math.max(1, Math.round(total));
  }

  function addIncident(state, type, text) {
    var g = getGame();
    state.incidents.unshift({ week: g ? g.week : 1, type: type, text: safe(text, 260) });
    state.incidents = state.incidents.slice(0, 30);
  }

  function hire(roleId) {
    var state = ensureState();
    var career = getCareer();
    var role = findRole(roleId);
    if (!state || !career || !role) return false;
    var hiringCost = Math.round(role.salary * 1.5);
    if (career.ownFirm.cash < hiringCost) { notify('error', 'Cassa insufficiente per selezione e inserimento'); return false; }
    career.ownFirm.cash -= hiringCost;
    var employee = createEmployee(roleId, state.departments[roleId] ? state.departments[roleId].level : 0);
    state.employees.push(employee);
    addIncident(state, 'hr', employee.name + ' entra nella società come ' + employee.role + '.');
    notify('success', employee.name + ' assunto come ' + employee.role);
    render();
    return true;
  }

  function dismiss(employeeId) {
    var state = ensureState();
    var career = getCareer();
    var employee = state ? findEmployee(state, employeeId) : null;
    if (!state || !career || !employee) return false;
    var severance = Math.round(employee.salary * 2);
    if (career.ownFirm.cash < severance) { notify('error', 'Cassa insufficiente per il costo di uscita'); return false; }
    career.ownFirm.cash -= severance;
    employee.status = 'dismissed';
    addIncident(state, 'hr', employee.name + ' lascia la società. Costo di uscita: ' + money(severance) + '.');
    syncAssignments(state);
    render();
    return true;
  }

  function acquireClient(typeId) {
    var state = ensureState();
    var career = getCareer();
    var type = findClientType(typeId);
    if (!state || !career || !type) return false;
    var capacity = computeCapacity(state);
    var clients = activeClients(state);
    if (clients.length >= capacity) { notify('error', 'Capacità esaurita: assumi broker o advisor'); return false; }
    var acquisitionCost = Math.round(type.minAssets * 0.004);
    if (career.ownFirm.cash < acquisitionCost) { notify('error', 'Budget commerciale insufficiente'); return false; }
    career.ownFirm.cash -= acquisitionCost;
    var client = createClient(typeId);
    state.clients.push(client);
    syncAssignments(state);
    addIncident(state, 'client', client.name + ' affida ' + money(client.assets) + ' alla società.');
    notify('success', 'Nuovo cliente ' + client.type + ': ' + client.name);
    render();
    return true;
  }

  function changePolicy(name, delta) {
    var state = ensureState();
    if (!state || state.riskPolicy[name] === undefined) return false;
    state.riskPolicy[name] = clamp(state.riskPolicy[name] + delta, 5, 95);
    render();
    return true;
  }

  function upgradeDepartment(id) {
    var state = ensureState();
    var career = getCareer();
    var department = state && state.departments[id];
    if (!state || !career || !department) return false;
    var cost = Math.round(9000 * Math.pow(1.7, department.level - 1));
    if (career.ownFirm.cash < cost) { notify('error', 'Cassa insufficiente per l’investimento'); return false; }
    career.ownFirm.cash -= cost;
    department.level += 1;
    department.budget = Math.round(department.budget * 1.22);
    addIncident(state, 'investment', 'Il dipartimento ' + id + ' sale al livello ' + department.level + '.');
    notify('success', 'Dipartimento potenziato');
    render();
    return true;
  }

  function processWeek() {
    var state = ensureState();
    var career = getCareer();
    var g = getGame();
    if (!state || !career || !g || !isOwner()) return;

    syncAssignments(state);
    var employees = activeEmployees(state);
    var clients = activeClients(state);
    var capacity = computeCapacity(state);
    var payroll = 0;
    var grossFees = 0;
    var outflows = 0;
    var inflows = 0;
    var complaints = 0;
    var i;

    var analysts = employees.filter(function (employee) { return employee.roleId === 'analyst'; }).length;
    var compliance = employees.filter(function (employee) { return employee.roleId === 'compliance'; }).length;
    var researchBonus = state.departments.research.level * 0.006 + analysts * 0.004;
    var marketReturn = randomBetween(-0.035, 0.045) + researchBonus;

    for (i = 0; i < employees.length; i++) {
      payroll += employees[i].salary;
      employees[i].fatigue = clamp(employees[i].fatigue + randomBetween(-4, 8), 0, 100);
      employees[i].morale = clamp(employees[i].morale + randomBetween(-3, 3) - employees[i].fatigue / 80, 5, 100);
      employees[i].performance = clamp(employees[i].skill * 0.55 + employees[i].morale * 0.3 - employees[i].fatigue * 0.18 + randomBetween(-8, 8), 1, 100);
      employees[i].revenue = 0;
    }

    for (i = 0; i < clients.length; i++) {
      var client = clients[i];
      var employee = findEmployee(state, client.assignedEmployeeId);
      var service = employee ? employee.performance : 20;
      var riskGap = Math.abs(state.riskPolicy.appetite - client.riskTolerance);
      var clientReturn = marketReturn * (0.55 + state.riskPolicy.appetite / 100) + randomBetween(-0.012, 0.012);
      client.weeklyReturn = clientReturn;
      client.assets = Math.max(1000, Math.round(client.assets * (1 + clientReturn)));
      var fee = client.assets * client.feeRate / 52;
      grossFees += fee;
      client.lifetimeFees += fee;
      if (employee) employee.revenue += fee;
      client.satisfaction = clamp(client.satisfaction + clientReturn * 120 + (service - 50) * 0.08 - riskGap * 0.05, 0, 100);
      client.trust = clamp(client.trust + (client.satisfaction - 50) * 0.025, 0, 100);
      if (client.satisfaction < 28 && Math.random() > client.patience / 100) {
        client.status = 'lost';
        outflows += client.assets;
        addIncident(state, 'outflow', client.name + ' revoca il mandato e trasferisce ' + money(client.assets) + '.');
      } else if (client.satisfaction < 40 && Math.random() < 0.18) {
        client.complaints += 1;
        complaints += 1;
      } else if (client.satisfaction > 78 && Math.random() < 0.12) {
        var extra = Math.round(client.assets * randomBetween(0.02, 0.08));
        client.assets += extra;
        inflows += extra;
      }
    }

    var operatingCosts = 0;
    var departmentId;
    for (departmentId in state.departments) if (Object.prototype.hasOwnProperty.call(state.departments, departmentId)) operatingCosts += state.departments[departmentId].budget;
    operatingCosts += Math.round(employees.length * 240 + clients.length * 35);

    var riskLoad = state.riskPolicy.appetite * 0.42 + complaints * 7 + Math.max(0, clients.length - capacity) * 4;
    var complianceScore = clamp(48 + compliance * 14 + state.departments.compliance.level * 7 - riskLoad * 0.35, 0, 100);
    var provisions = Math.round((grossFees * Math.max(0, 55 - complianceScore) / 100) + complaints * 650);
    var profit = grossFees - payroll - operatingCosts - provisions;

    career.ownFirm.cash += profit;
    career.ownFirm.weeklyRevenue = grossFees;
    career.ownFirm.weeklyCosts = payroll + operatingCosts + provisions;
    career.ownFirm.clients = activeClients(state).length;
    career.ownFirm.clientAssets = activeClients(state).reduce(function (sum, clientItem) { return sum + clientItem.assets; }, 0);
    career.ownFirm.compliance = round(complianceScore, 0);
    career.ownFirm.reputation = clamp(career.ownFirm.reputation + (profit > 0 ? 0.6 : -0.8) + (complianceScore - 60) / 70, 0, 100);

    state.weekly = { revenue: round(grossFees, 0), payroll: payroll, operatingCosts: operatingCosts, provisions: provisions, profit: round(profit, 0), inflows: inflows, outflows: outflows };
    state.cumulative.revenue += grossFees;
    state.cumulative.costs += payroll + operatingCosts + provisions;
    state.cumulative.profit += profit;
    state.cumulative.clientInflows += inflows;
    state.cumulative.clientOutflows += outflows;
    state.balanceSheet.cash = career.ownFirm.cash;
    state.balanceSheet.receivables = Math.round(grossFees * 0.18);
    state.balanceSheet.liabilities = Math.max(0, Math.round((payroll + operatingCosts) * 0.35));
    state.balanceSheet.equity = Math.round(state.balanceSheet.cash + state.balanceSheet.receivables + state.balanceSheet.fixedAssets - state.balanceSheet.liabilities);
    state.kpi.assetsUnderManagement = career.ownFirm.clientAssets;
    state.kpi.revenuePerEmployee = employees.length ? Math.round(grossFees / employees.length) : 0;
    state.kpi.clientRetention = clients.length ? round(activeClients(state).length / clients.length * 100, 1) : 100;
    state.kpi.capacityUse = round(activeClients(state).length / capacity * 100, 1);
    state.kpi.complianceScore = round(complianceScore, 0);
    state.kpi.operationalRisk = round(clamp(riskLoad, 0, 100), 0);
    state.history.unshift({ week: g.week, revenue: state.weekly.revenue, costs: payroll + operatingCosts + provisions, profit: state.weekly.profit, clients: activeClients(state).length, aum: state.kpi.assetsUnderManagement });
    state.history = state.history.slice(0, 52);

    if (career.ownFirm.cash < 0) addIncident(state, 'crisis', 'La società è in tensione finanziaria: la cassa è negativa.');
    if (complianceScore < 35) addIncident(state, 'compliance', 'Compliance critica: aumenta il rischio di ispezione e sanzione.');
    render();
  }

  function employeeRows(state) {
    var employees = activeEmployees(state);
    var html = '';
    var i;
    for (i = 0; i < employees.length; i++) {
      html += '<div class="bm-row"><div><strong>' + safe(employees[i].name, 60) + '</strong><div class="bm-muted">' + employees[i].role + ' · skill ' + employees[i].skill + ' · morale ' + Math.round(employees[i].morale) + '</div></div><div>' + money(employees[i].salary) + '/sett.</div><div>' + employees[i].clients + ' clienti</div><button class="btn btn-sm" onclick="BrokerageManagement.dismiss(\'' + employees[i].id + '\')">Licenzia</button></div>';
    }
    return html || '<div class="bm-muted">Nessun dipendente attivo.</div>';
  }

  function clientRows(state) {
    var clients = activeClients(state).slice(0, 12);
    var html = '';
    var i;
    for (i = 0; i < clients.length; i++) {
      var employee = findEmployee(state, clients[i].assignedEmployeeId);
      html += '<div class="bm-row"><div><strong>' + safe(clients[i].name, 60) + '</strong><div class="bm-muted">' + clients[i].type + ' · ' + (employee ? safe(employee.name, 40) : 'non assegnato') + '</div></div><div>' + money(clients[i].assets) + '</div><div>fiducia ' + Math.round(clients[i].trust) + '</div><div class="' + (clients[i].weeklyReturn >= 0 ? 'green' : 'red') + '">' + round(clients[i].weeklyReturn * 100, 2) + '%</div></div>';
    }
    return html || '<div class="bm-muted">Nessun cliente attivo.</div>';
  }

  function ensureUI() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('brokerage-management-style')) {
      var style = document.createElement('style');
      style.id = 'brokerage-management-style';
      style.textContent = '.bm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.bm-kpi{padding:10px;background:var(--bg3);border:1px solid var(--border);border-radius:8px}.bm-kpi strong{display:block;font-size:16px;margin-top:3px}.bm-muted{font-size:10px;color:var(--text2);line-height:1.4}.bm-row{display:grid;grid-template-columns:minmax(150px,1fr) 100px 90px auto;gap:8px;align-items:center;padding:8px;border-bottom:1px solid var(--border);font-size:11px}.bm-section{margin-top:12px;padding-top:10px;border-top:1px solid var(--border)}.bm-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}@media(max-width:640px){.bm-row{grid-template-columns:1fr 1fr}.bm-row button{width:100%}}';
      document.head.appendChild(style);
    }
    var view = document.getElementById('view-brokerage');
    if (view && !document.getElementById('brokerage-management-card')) {
      var card = document.createElement('div');
      card.className = 'card';
      card.id = 'brokerage-management-card';
      card.innerHTML = '<h2>Direzione e bilancio</h2><div id="brokerage-management-content"></div>';
      view.insertBefore(card, view.firstChild);
    }
  }

  function render() {
    if (typeof document === 'undefined') return;
    ensureUI();
    var container = document.getElementById('brokerage-management-content');
    if (!container) return;
    if (!isOwner()) {
      container.innerHTML = '<div class="bm-muted">Il pannello direzionale si attiva quando fondi la tua società di brokeraggio.</div>';
      return;
    }
    var state = ensureState();
    var career = getCareer();
    if (!state || !career) return;
    var weekly = state.weekly;
    var html = '<div class="bm-grid">';
    html += '<div class="bm-kpi"><span class="bm-muted">Ricavi settimanali</span><strong class="green">' + money(weekly.revenue) + '</strong></div>';
    html += '<div class="bm-kpi"><span class="bm-muted">Utile settimanale</span><strong class="' + (weekly.profit >= 0 ? 'green' : 'red') + '">' + money(weekly.profit) + '</strong></div>';
    html += '<div class="bm-kpi"><span class="bm-muted">Masse gestite</span><strong>' + money(state.kpi.assetsUnderManagement) + '</strong></div>';
    html += '<div class="bm-kpi"><span class="bm-muted">Cassa società</span><strong>' + money(career.ownFirm.cash) + '</strong></div>';
    html += '<div class="bm-kpi"><span class="bm-muted">Retention clienti</span><strong>' + state.kpi.clientRetention + '%</strong></div>';
    html += '<div class="bm-kpi"><span class="bm-muted">Compliance</span><strong>' + state.kpi.complianceScore + '/100</strong></div></div>';

    html += '<div class="bm-section"><strong>Conto economico settimanale</strong><div class="bm-grid" style="margin-top:7px"><div class="bm-kpi"><span class="bm-muted">Personale</span><strong class="red">' + money(weekly.payroll) + '</strong></div><div class="bm-kpi"><span class="bm-muted">Costi operativi</span><strong class="red">' + money(weekly.operatingCosts) + '</strong></div><div class="bm-kpi"><span class="bm-muted">Accantonamenti</span><strong class="red">' + money(weekly.provisions) + '</strong></div><div class="bm-kpi"><span class="bm-muted">Patrimonio netto</span><strong>' + money(state.balanceSheet.equity) + '</strong></div></div></div>';

    html += '<div class="bm-section"><strong>Assunzioni</strong><div class="bm-actions">';
    var i;
    for (i = 0; i < ROLES.length; i++) html += '<button class="btn btn-sm" onclick="BrokerageManagement.hire(\'' + ROLES[i].id + '\')">+ ' + ROLES[i].name + '</button>';
    html += '</div>' + employeeRows(state) + '</div>';

    html += '<div class="bm-section"><strong>Sviluppo clientela</strong><div class="bm-actions">';
    for (i = 0; i < CLIENT_TYPES.length; i++) html += '<button class="btn btn-sm btn-blue" onclick="BrokerageManagement.acquireClient(\'' + CLIENT_TYPES[i].id + '\')">+ ' + CLIENT_TYPES[i].name + '</button>';
    html += '</div>' + clientRows(state) + '</div>';

    html += '<div class="bm-section"><strong>Politica di rischio</strong><div class="bm-muted">Propensione ' + state.riskPolicy.appetite + '/100 · concentrazione massima ' + state.riskPolicy.maxConcentration + '% · buffer liquidità ' + state.riskPolicy.liquidityBuffer + '%</div><div class="bm-actions"><button class="btn btn-sm" onclick="BrokerageManagement.changePolicy(\'appetite\',-5)">Rischio -</button><button class="btn btn-sm btn-red" onclick="BrokerageManagement.changePolicy(\'appetite\',5)">Rischio +</button><button class="btn btn-sm" onclick="BrokerageManagement.upgradeDepartment(\'research\')">Potenzia ricerca</button><button class="btn btn-sm" onclick="BrokerageManagement.upgradeDepartment(\'compliance\')">Potenzia compliance</button><button class="btn btn-sm" onclick="BrokerageManagement.upgradeDepartment(\'technology\')">Potenzia tecnologia</button></div></div>';

    if (state.incidents.length) html += '<div class="bm-section"><strong>Ultimo evento</strong><div class="bm-muted" style="margin-top:5px">Settimana ' + state.incidents[0].week + ' · ' + safe(state.incidents[0].text, 260) + '</div></div>';
    container.innerHTML = html;
  }

  function install() {
    if (installed) return;
    installed = true;
    ensureUI();
    if (typeof advanceTurn === 'function') {
      originalAdvance = advanceTurn;
      global.advanceTurn = function () {
        var result = originalAdvance.apply(this, arguments);
        processWeek();
        return result;
      };
    }
    if (typeof renderAll === 'function') {
      originalRenderAll = renderAll;
      global.renderAll = function () {
        var result = originalRenderAll.apply(this, arguments);
        render();
        return result;
      };
    }
    render();
  }

  global.BrokerageManagement = {
    VERSION: VERSION,
    install: install,
    ensureState: ensureState,
    processWeek: processWeek,
    hire: hire,
    dismiss: dismiss,
    acquireClient: acquireClient,
    changePolicy: changePolicy,
    upgradeDepartment: upgradeDepartment,
    render: render,
    getState: function () { return ensureState(); },
    CLIENT_TYPES: CLIENT_TYPES,
    ROLES: ROLES
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
  }
}(typeof window !== 'undefined' ? window : this));
