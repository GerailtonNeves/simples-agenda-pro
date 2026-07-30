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

// Dados Iniciais Demonstrativos de Alta Qualidade Comercial
const DEFAULT_SEED_DATA = {
  settings: {
    businessName: 'Studio & Barbearia VIP',
    businessPhone: '5511999887766',
    businessAddress: 'Av. Paulista, 1000 - São Paulo, SP',
    businessLogo: '', // Base64 da logo
    whatsappTemplates: {
      created: 'Olá {cliente}! Seu agendamento para *{servico}* na *{empresa}* foi realizado com sucesso para o dia *{data}* às *{horario}*.\n\nValor: R$ {valor}.\nAguardamos você!',
      reminder: 'Olá {cliente}! Passando para lembrar do seu agendamento amanhã, *{data}* às *{horario}* para *{servico}* na *{empresa}*.\n\nPor favor, responda OK para confirmar sua presença! 😊',
      birthday: '🎉 Parabéns, {cliente}! A equipe da *{empresa}* deseja a você um feliz aniversário! Venha celebrar conosco e ganhe 15% de desconto no seu próximo serviço!'
    }
  },
  services: [
    { id: 'srv-1', name: 'Corte de Cabelo Masculino / Feminino', duration: 40, price: 60.00, color: '#0EA5E9' },
    { id: 'srv-2', name: 'Barba Completa com Toalha Quente', duration: 30, price: 40.00, color: '#F97316' },
    { id: 'srv-3', name: 'Combo Corte + Barba VIP', duration: 60, price: 90.00, color: '#8B5CF6' },
    { id: 'srv-4', name: 'Manicure & Pedicure', duration: 50, price: 55.00, color: '#EC4899' },
    { id: 'srv-5', name: 'Limpeza de Pele Profunda', duration: 60, price: 120.00, color: '#10B981' }
  ],
  products: [
    { id: 'prod-1', name: 'Pomada Modeladora Matte 100g', price: 45.00, stock: 14, minStock: 5 },
    { id: 'prod-2', name: 'Óleo para Barba Hidratante', price: 35.00, stock: 3, minStock: 5 },
    { id: 'prod-3', name: 'Shampoo Fortificante 300ml', price: 50.00, stock: 8, minStock: 4 }
  ],
  employees: [
    { id: 'emp-1', name: 'Alexandre Silva', role: 'Barbeiro Master', phone: '11988887777', workDays: 'Segunda a Sábado', workHours: '08:00 às 18:00', commissionRate: 50 },
    { id: 'emp-2', name: 'Mariana Costa', role: 'Esteticista & Nails', phone: '11977776666', workDays: 'Terça a Sábado', workHours: '09:00 às 19:00', commissionRate: 40 }
  ],
  clients: [
    { id: 'cli-1', name: 'Carlos Eduardo Santos', phone: '11987654321', email: 'carlos@email.com', birthDate: '1992-07-30', anamnesis: 'Corte degrade baixo, prefere pomada efeito fosco.' },
    { id: 'cli-2', name: 'Juliana Oliveira', phone: '11976543210', email: 'juliana@email.com', birthDate: '1995-08-05', anamnesis: 'Alergia a esmalte com formaldeído. Usar linha hipoalergênica.' },
    { id: 'cli-3', name: 'Lucas Mendes', phone: '11965432109', email: 'lucas@email.com', birthDate: '1988-11-12', anamnesis: 'Cliente VIP desde 2022.' }
  ],
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

(function generateInitialAppointments() {
  const today = new Date();
  const formatDate = (d) => getLocalDateStr(d);
  
  const todayStr = formatDate(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  DEFAULT_SEED_DATA.appointments = [
    {
      id: 'app-1',
      clientId: 'cli-1',
      serviceId: 'srv-3',
      employeeId: 'emp-1',
      date: todayStr,
      time: '09:00',
      price: 90.00,
      status: 'confirmed',
      notes: 'Cliente pediu para confirmar via WhatsApp.'
    },
    {
      id: 'app-2',
      clientId: 'cli-2',
      serviceId: 'srv-4',
      employeeId: 'emp-2',
      date: todayStr,
      time: '11:00',
      price: 55.00,
      status: 'scheduled',
      notes: ''
    },
    {
      id: 'app-3',
      clientId: 'cli-3',
      serviceId: 'srv-1',
      employeeId: 'emp-1',
      date: tomorrowStr,
      time: '14:30',
      price: 60.00,
      status: 'scheduled',
      notes: 'Horário do almoço.'
    }
  ];

  DEFAULT_SEED_DATA.transactions = [
    { id: 'tr-1', type: 'income', description: 'Atendimento Carlos Eduardo - Combo VIP', amount: 90.00, date: todayStr, paymentMethod: 'Pix', status: 'paid' },
    { id: 'tr-2', type: 'expense', description: 'Compra de produtos para estoque', amount: 250.00, date: todayStr, paymentMethod: 'Cartão de Crédito', status: 'paid' }
  ];
})();

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
