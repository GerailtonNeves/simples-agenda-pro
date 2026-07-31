/* ==========================================================================
   SIMPLES AGENDA PRO - STORE & LOCALSTORAGE PERSISTENCE (100% LIMPO SEM DADOS DE TERCEIROS)
   ========================================================================== */

const STORAGE_KEYS = {
  SETTINGS: 'simples_agenda_settings',
  CLIENTS: 'simples_agenda_clients',
  SERVICES: 'simples_agenda_services',
  PRODUCTS: 'simples_agenda_products',
  EMPLOYEES: 'simples_agenda_employees',
  APPOINTMENTS: 'simples_agenda_appointments',
  TRANSACTIONS: 'simples_agenda_transactions',
  THEME: 'simples_agenda_theme'
};

// Configurações Iniciais Sem Dados Fictícios de Terceiros
const DEFAULT_SEED_DATA = {
  settings: {
    businessName: 'Meu Estabelecimento Comercial',
    businessPhone: '',
    businessAddress: '',
    businessLogo: '',
    whatsappTemplates: {
      created: 'Olá {cliente}! Seu agendamento para *{servico}* na *{empresa}* foi realizado com sucesso para o dia *{data}* às *{horario}*.\n\nValor: R$ {valor}.\nAguardamos você!',
      reminder: 'Olá {cliente}! Passando para lembrar do seu agendamento amanhã, *{data}* às *{horario}* para *{servico}* na *{empresa}*.\n\nPor favor, responda OK para confirmar sua presença! 😊',
      birthday: '🎉 Parabéns, {cliente}! A equipe da *{empresa}* deseja a você um feliz aniversário! Venha celebrar conosco e ganhe 15% de desconto no seu próximo serviço!'
    }
  },
  services: [],
  products: [],
  employees: [],
  clients: [],
  appointments: [],
  transactions: []
};

function getLocalDateStr(d = new Date()) {
  const dateObj = typeof d === 'string' ? new Date(d.includes('T') ? d : d + 'T00:00:00') : d;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
window.getLocalDateStr = getLocalDateStr;

class StoreManager {
  constructor() {
    this.initStore();
  }

  initStore() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.save(STORAGE_KEYS.SETTINGS, DEFAULT_SEED_DATA.settings);
    }
    
    // Auto-limpeza de serviços demonstrativos legados (srv-1, srv-2, srv-3, srv-4, srv-5)
    let services = this.get(STORAGE_KEYS.SERVICES);
    if (!services || (Array.isArray(services) && services.some(s => ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5'].includes(s.id)))) {
      this.save(STORAGE_KEYS.SERVICES, []);
    }

    // Auto-limpeza de produtos demonstrativos legados
    let products = this.get(STORAGE_KEYS.PRODUCTS);
    if (!products || (Array.isArray(products) && products.some(p => ['prod-1', 'prod-2', 'prod-3'].includes(p.id)))) {
      this.save(STORAGE_KEYS.PRODUCTS, []);
    }

    // Auto-limpeza de funcionários demonstrativos legados
    let employees = this.get(STORAGE_KEYS.EMPLOYEES);
    if (!employees || (Array.isArray(employees) && employees.some(e => ['emp-1', 'emp-2'].includes(e.id)))) {
      this.save(STORAGE_KEYS.EMPLOYEES, []);
    }

    // Auto-limpeza de clientes demonstrativos legados
    let clients = this.get(STORAGE_KEYS.CLIENTS);
    if (!clients || (Array.isArray(clients) && clients.some(c => ['cli-1', 'cli-2', 'cli-3'].includes(c.id)))) {
      this.save(STORAGE_KEYS.CLIENTS, []);
    }

    // Auto-limpeza de agendamentos demonstrativos legados
    let appointments = this.get(STORAGE_KEYS.APPOINTMENTS);
    if (!appointments || (Array.isArray(appointments) && appointments.some(a => ['app-1', 'app-2', 'app-3'].includes(a.id)))) {
      this.save(STORAGE_KEYS.APPOINTMENTS, []);
    }

    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.save(STORAGE_KEYS.TRANSACTIONS, []);
    }
  }

  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Erro ao ler ${key} do localStorage:`, e);
      return null;
    }
  }

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Erro ao salvar ${key} no localStorage:`, e);
    }
  }

  getSettings() { return this.get(STORAGE_KEYS.SETTINGS); }
  saveSettings(data) { this.save(STORAGE_KEYS.SETTINGS, data); }

  getClients() { return this.get(STORAGE_KEYS.CLIENTS) || []; }
  saveClients(clients) { this.save(STORAGE_KEYS.CLIENTS, clients); }

  getServices() { return this.get(STORAGE_KEYS.SERVICES) || []; }
  saveServices(services) { this.save(STORAGE_KEYS.SERVICES, services); }

  getProducts() { return this.get(STORAGE_KEYS.PRODUCTS) || []; }
  saveProducts(products) { this.save(STORAGE_KEYS.PRODUCTS, products); }

  getEmployees() { return this.get(STORAGE_KEYS.EMPLOYEES) || []; }
  saveEmployees(employees) { this.save(STORAGE_KEYS.EMPLOYEES, employees); }

  getAppointments() { return this.get(STORAGE_KEYS.APPOINTMENTS) || []; }
  saveAppointments(appts) { this.save(STORAGE_KEYS.APPOINTMENTS, appts); }

  getTransactions() { return this.get(STORAGE_KEYS.TRANSACTIONS) || []; }
  saveTransactions(trans) { this.save(STORAGE_KEYS.TRANSACTIONS, trans); }

  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  resetAllData() {
    localStorage.clear();
    this.initStore();
  }
}

window.Store = new StoreManager();
