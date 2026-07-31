/* ==========================================================================
   SIMPLES AGENDA PRO - STORE & LOCALSTORAGE PERSISTENCE (AZUL & LARANJA)
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

// Dados Iniciais Sem Agendamentos Fictícios
const DEFAULT_SEED_DATA = {
  settings: {
    businessName: 'Meu Estabelecimento / Barbearia VIP',
    businessPhone: '5511999887766',
    businessAddress: 'Av. Principal, 1000',
    businessLogo: '',
    whatsappTemplates: {
      created: 'Olá {cliente}! Seu agendamento para *{servico}* na *{empresa}* foi realizado com sucesso para o dia *{data}* às *{horario}*.\n\nValor: R$ {valor}.\nAguardamos você!',
      reminder: 'Olá {cliente}! Passando para lembrar do seu agendamento amanhã, *{data}* às *{horario}* para *{servico}* na *{empresa}*.\n\nPor favor, responda OK para confirmar sua presença! 😊',
      birthday: '🎉 Parabéns, {cliente}! A equipe da *{empresa}* deseja a você um feliz aniversário! Venha celebrar conosco e ganhe 15% de desconto no seu próximo serviço!'
    }
  },
  services: [
    { id: 'srv-1', name: 'Corte de Cabelo Masculino / Feminino', duration: 40, price: 60.00, color: '#0EA5E9' },
    { id: 'srv-2', name: 'Barba Completa com Toalha Quente', duration: 30, price: 40.00, color: '#F97316' },
    { id: 'srv-3', name: 'Combo Corte + Barba VIP', duration: 60, price: 90.00, color: '#8B5CF6' }
  ],
  products: [
    { id: 'prod-1', name: 'Pomada Modeladora Matte 100g', price: 45.00, stock: 10, minStock: 5 }
  ],
  employees: [
    { id: 'emp-1', name: 'Profissional Principal', role: 'Atendimento', phone: '11988887777', workDays: 'Segunda a Sábado', workHours: '08:00 às 19:00', commissionRate: 50 }
  ],
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
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      this.save(STORAGE_KEYS.SERVICES, DEFAULT_SEED_DATA.services);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.save(STORAGE_KEYS.PRODUCTS, DEFAULT_SEED_DATA.products);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      this.save(STORAGE_KEYS.EMPLOYEES, DEFAULT_SEED_DATA.employees);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      this.save(STORAGE_KEYS.CLIENTS, DEFAULT_SEED_DATA.clients);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      this.save(STORAGE_KEYS.APPOINTMENTS, DEFAULT_SEED_DATA.appointments);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.save(STORAGE_KEYS.TRANSACTIONS, DEFAULT_SEED_DATA.transactions);
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
