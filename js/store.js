/* ==========================================================================
   SIMPLES AGENDA PRO - STORE & LOCALSTORAGE PERSISTENCE (COM LISTA NEGRA DE EXCLUSÃO DEFINITIVA)
   ========================================================================== */

const STORAGE_KEYS = {
  SETTINGS: 'simples_agenda_settings',
  CLIENTS: 'simples_agenda_clients',
  SERVICES: 'simples_agenda_services',
  PRODUCTS: 'simples_agenda_products',
  EMPLOYEES: 'simples_agenda_employees',
  APPOINTMENTS: 'simples_agenda_appointments',
  TRANSACTIONS: 'simples_agenda_transactions',
  THEME: 'simples_agenda_theme',
  DELETED_IDS: 'simples_agenda_deleted_ids'
};

// Configurações Iniciais Sem Dados Fictícios de Terceiros
const DEFAULT_SEED_DATA = {
  settings: {
    businessName: 'Meu Estabelecimento Comercial',
    businessPhone: '',
    businessAddress: '',
    businessLogo: '',
    workStartTime: '10:00',
    workEndTime: '16:00',
    slotInterval: '30',
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

    if (!localStorage.getItem(STORAGE_KEYS.DELETED_IDS)) {
      this.save(STORAGE_KEYS.DELETED_IDS, []);
    }

    const deletedIds = new Set(this.getDeletedIds());

    // Expurgo completo de qualquer dado demonstrativo ou deletado previamente
    const legacyServiceNames = ['Corte de Cabelo Masculino / Feminino', 'Barba Completa com Toalha Quente', 'Combo Corte + Barba VIP', 'Manicure & Pedicure', 'Limpeza de Pele Profunda'];
    let services = this.get(STORAGE_KEYS.SERVICES);
    if (!services || (Array.isArray(services) && services.some(s => ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5'].includes(s.id) || legacyServiceNames.includes(s.name)))) {
      this.save(STORAGE_KEYS.SERVICES, []);
    } else {
      this.save(STORAGE_KEYS.SERVICES, services.filter(s => !deletedIds.has(s.id)));
    }

    let products = this.get(STORAGE_KEYS.PRODUCTS);
    if (!products || (Array.isArray(products) && products.some(p => ['prod-1', 'prod-2', 'prod-3'].includes(p.id) || (p.name && p.name.includes('Pomada'))))) {
      this.save(STORAGE_KEYS.PRODUCTS, []);
    } else {
      this.save(STORAGE_KEYS.PRODUCTS, products.filter(p => !deletedIds.has(p.id)));
    }

    let employees = this.get(STORAGE_KEYS.EMPLOYEES);
    if (!employees || (Array.isArray(employees) && employees.some(e => ['emp-1', 'emp-2'].includes(e.id) || (e.name && (e.name.includes('Alexandre') || e.name.includes('Mariana')))))) {
      this.save(STORAGE_KEYS.EMPLOYEES, []);
    } else {
      this.save(STORAGE_KEYS.EMPLOYEES, employees.filter(e => !deletedIds.has(e.id)));
    }

    let clients = this.get(STORAGE_KEYS.CLIENTS);
    if (!clients || (Array.isArray(clients) && clients.some(c => ['cli-1', 'cli-2', 'cli-3'].includes(c.id) || (c.name && (c.name.includes('Carlos Eduardo') || c.name.includes('Juliana')))))) {
      this.save(STORAGE_KEYS.CLIENTS, []);
    } else {
      this.save(STORAGE_KEYS.CLIENTS, clients.filter(c => !deletedIds.has(c.id)));
    }

    let appointments = this.get(STORAGE_KEYS.APPOINTMENTS);
    if (!appointments || (Array.isArray(appointments) && appointments.some(a => ['app-1', 'app-2', 'app-3'].includes(a.id)))) {
      this.save(STORAGE_KEYS.APPOINTMENTS, []);
    } else {
      this.save(STORAGE_KEYS.APPOINTMENTS, appointments.filter(a => !deletedIds.has(a.id)));
    }

    let transactions = this.get(STORAGE_KEYS.TRANSACTIONS);
    if (!transactions || (Array.isArray(transactions) && transactions.some(t => ['tr-1', 'tr-2'].includes(t.id)))) {
      this.save(STORAGE_KEYS.TRANSACTIONS, []);
    } else {
      this.save(STORAGE_KEYS.TRANSACTIONS, transactions.filter(t => !deletedIds.has(t.id)));
    }
  }

  // MOTOR DE LISTA NEGRA DE EXCLUSÃO DEFINITIVA
  getDeletedIds() {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      return item ? JSON.parse(item) : [];
    } catch(e) {
      return [];
    }
  }

  markAsDeleted(id) {
    if (!id) return;
    let deleted = this.getDeletedIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(deleted));
    }
  }

  isDeleted(id) {
    if (!id) return false;
    const deleted = this.getDeletedIds();
    return deleted.includes(id);
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

  getClients() {
    const clients = this.get(STORAGE_KEYS.CLIENTS) || [];
    const deletedIds = new Set(this.getDeletedIds());
    return clients.filter(c => !deletedIds.has(c.id));
  }
  saveClients(clients) { this.save(STORAGE_KEYS.CLIENTS, clients); }

  getServices() {
    const services = this.get(STORAGE_KEYS.SERVICES) || [];
    const deletedIds = new Set(this.getDeletedIds());
    return services.filter(s => !deletedIds.has(s.id));
  }
  saveServices(services) { this.save(STORAGE_KEYS.SERVICES, services); }

  getProducts() {
    const products = this.get(STORAGE_KEYS.PRODUCTS) || [];
    const deletedIds = new Set(this.getDeletedIds());
    return products.filter(p => !deletedIds.has(p.id));
  }
  saveProducts(products) { this.save(STORAGE_KEYS.PRODUCTS, products); }

  getEmployees() {
    const employees = this.get(STORAGE_KEYS.EMPLOYEES) || [];
    const deletedIds = new Set(this.getDeletedIds());
    return employees.filter(e => !deletedIds.has(e.id));
  }
  saveEmployees(employees) { this.save(STORAGE_KEYS.EMPLOYEES, employees); }

  getAppointments() {
    const appts = this.get(STORAGE_KEYS.APPOINTMENTS) || [];
    const deletedIds = new Set(this.getDeletedIds());
    return appts.filter(a => !deletedIds.has(a.id));
  }
  saveAppointments(appts) { this.save(STORAGE_KEYS.APPOINTMENTS, appts); }

  getTransactions() {
    const trans = this.get(STORAGE_KEYS.TRANSACTIONS) || [];
    const deletedIds = new Set(this.getDeletedIds());
    return trans.filter(t => !deletedIds.has(t.id));
  }
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
