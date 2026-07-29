/* ==========================================================================
   SIMPLES AGENDA PRO - LOCAL STORAGE DATA MANAGER ENGINE
   ========================================================================== */

const STORAGE_KEYS = {
  SETTINGS: 'simples_agenda_settings',
  CLIENTS: 'simples_agenda_clients',
  SERVICES: 'simples_agenda_services',
  PRODUCTS: 'simples_agenda_products',
  APPOINTMENTS: 'simples_agenda_appointments',
  TRANSACTIONS: 'simples_agenda_transactions',
  THEME: 'simples_agenda_theme'
};

const DEFAULT_SETTINGS = {
  businessName: 'Minha Empresa / Barbearia VIP',
  businessPhone: '(11) 99999-9999',
  businessAddress: 'Av. Paulista, 1000 - São Paulo, SP',
  businessLogo: '',
  whatsappTemplates: {
    created: 'Olá {cliente}! Seu agendamento para {servico} foi criado com sucesso para o dia {data} às {horario}. Valor: R$ {valor}. Te esperamos!',
    reminder: 'Olá {cliente}! Lembramos que seu agendamento de {servico} é HOJE ({data}) às {horario} em {empresa}. Por favor, confirme a presença!',
    birthday: 'Parabéns {cliente}! A equipe da {empresa} deseja um feliz aniversário! Temos um presente especial para você hoje.'
  }
};

const DEFAULT_CLIENTS = [
  { id: 'cli_1', name: 'Carlos Eduardo', phone: '(11) 98765-4321', birthDate: '1990-07-29', email: 'carlos@email.com', anamnesis: 'Cabelo curto nas laterais, barba bem desenhada.' },
  { id: 'cli_2', name: 'Ana Paula Souza', phone: '(11) 97654-3210', birthDate: '1995-08-15', email: 'ana@email.com', anamnesis: 'Alergia a amônia. Prefere produtos veganos.' },
  { id: 'cli_3', name: 'Marcos Vinicius', phone: '(11) 96543-2109', birthDate: '1988-12-05', email: 'marcos@email.com', anamnesis: 'Atendimento quinzenal de barba.' }
];

const DEFAULT_SERVICES = [
  { id: 'srv_1', name: 'Corte de Cabelo Masculino', duration: 30, price: 45.00, color: '#0EA5E9' },
  { id: 'srv_2', name: 'Barba Completa com Toalha Quente', duration: 30, price: 35.00, color: '#F97316' },
  { id: 'srv_3', name: 'Combo Corte + Barba VIP', duration: 60, price: 70.00, color: '#10B981' },
  { id: 'srv_4', name: 'Design de Sobrancelha', duration: 15, price: 20.00, color: '#8B5CF6' }
];

const DEFAULT_PRODUCTS = [
  { id: 'prod_1', name: 'Pomada Modeladora Matte 100g', category: 'Venda ao Cliente', sku: 'PRD-001', price: 45.00, costPrice: 20.00, stock: 12, minStock: 5 },
  { id: 'prod_2', name: 'Óleo para Barba Hidratante 30ml', category: 'Venda ao Cliente', sku: 'PRD-002', price: 38.00, costPrice: 15.00, stock: 3, minStock: 5 },
  { id: 'prod_3', name: 'Shampoo Fortificante 250ml', category: 'Cosméticos & Cabelo', sku: 'PRD-003', price: 52.00, costPrice: 25.00, stock: 8, minStock: 4 }
];

class StoreManager {
  constructor() {
    this.initDefaults();
  }

  initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      const todayStr = new Date().toISOString().split('T')[0];
      const sampleAppointments = [
        { id: 'app_1', clientId: 'cli_1', serviceId: 'srv_1', date: todayStr, time: '09:00', price: 45.00, status: 'confirmed', notes: 'Cliente pontual' },
        { id: 'app_2', clientId: 'cli_2', serviceId: 'srv_2', date: todayStr, time: '11:00', price: 35.00, status: 'scheduled', notes: '' },
        { id: 'app_3', clientId: 'cli_3', serviceId: 'srv_3', date: todayStr, time: '15:00', price: 70.00, status: 'completed', notes: 'Pago em Pix' }
      ];
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(sampleAppointments));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      const todayStr = new Date().toISOString().split('T')[0];
      const sampleTransactions = [
        { id: 'tr_1', type: 'income', description: 'Atendimento Combo Corte + Barba - Marcos', amount: 70.00, date: todayStr, paymentMethod: 'Pix', status: 'paid' },
        { id: 'tr_2', type: 'expense', description: 'Conta de Energia Elétrica', amount: 140.00, date: todayStr, paymentMethod: 'Boleto', status: 'pending' }
      ];
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sampleTransactions));
    }
  }

  getSettings() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS; }
  saveSettings(data) { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data)); }

  getClients() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || []; }
  saveClients(data) { localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data)); }

  getServices() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || []; }
  saveServices(data) { localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data)); }

  getProducts() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || []; }
  saveProducts(data) { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data)); }

  getAppointments() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) || []; }
  saveAppointments(data) { localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(data)); }

  getTransactions() { return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || []; }
  saveTransactions(data) { localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data)); }

  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
}

window.Store = new StoreManager();
