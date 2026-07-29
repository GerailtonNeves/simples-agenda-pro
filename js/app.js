/* ==========================================================================
   SIMPLES AGENDA PRO - MAIN CONTROLLER (RECURRENCE, DELETE & FINANCE STATUS)
   ========================================================================== */

class AppController {
  constructor() {
    this.activeTab = 'agenda';
  }

  init() {
    this.bindNavigation();
    this.bindGlobalSearch();
    this.bindThemeToggle();
    this.bindMobileMenu();
    this.bindModals();
    this.loadInitialSettings();

    if (window.Agenda) window.Agenda.init();
    if (window.Clients) window.Clients.init();
    if (window.Services) window.Services.init();
    if (window.Finance) window.Finance.init();
    if (window.Reports) window.Reports.init();
    if (window.BookingPortal) window.BookingPortal.init();
    if (window.Settings) window.Settings.init();

    if (window.lucide) window.lucide.createIcons();
  }

  loadInitialSettings() {
    const settings = window.Store.getSettings();

    const brandNameDisplay = document.getElementById('brandNameDisplay');
    if (brandNameDisplay && settings.businessName) {
      brandNameDisplay.textContent = settings.businessName;
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    this.setTheme(savedTheme);
  }

  bindGlobalSearch() {
    const globalSearch = document.getElementById('globalHeaderSearch');
    globalSearch?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) return;

      if (this.activeTab === 'clients' && window.Clients) {
        window.Clients.render(query);
      } else if (this.activeTab === 'services' && window.Services) {
        window.Services.renderProducts(query);
      }
    });
  }

  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    document.getElementById('mobileFabBtn')?.addEventListener('click', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      this.openAppointmentModal(todayStr, '12:00');
    });

    document.getElementById('btnQuickAddAppointment')?.addEventListener('click', () => {
      const todayStr = new Date().toISOString().split('T')[0];
      this.openAppointmentModal(todayStr, '10:00');
    });

    document.getElementById('btnQuickAddClient')?.addEventListener('click', () => {
      this.openClientModal();
    });

    document.getElementById('btnQuickWhatsAppMsg')?.addEventListener('click', () => {
      this.openWhatsAppModal();
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
      if (item.dataset.tab === tabName) item.classList.add('active');
      else item.classList.remove('active');
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `tab-${tabName}`) pane.classList.add('active');
      else pane.classList.remove('active');
    });

    const titles = {
      agenda: 'Agenda de Horários',
      clients: 'Gestão de Clientes',
      services: 'Serviços & Estoque de Produtos',
      finance: 'Controle Financeiro & Caixa',
      reports: 'Relatórios & Gráficos',
      portal: 'Portal de Agendamento Online',
      settings: 'Configurações do Sistema'
    };
    const titleElem = document.getElementById('pageTitle');
    if (titleElem) titleElem.textContent = titles[tabName] || 'Agenda';

    document.getElementById('sidebar')?.classList.remove('mobile-open');

    if (tabName === 'agenda' && window.Agenda) window.Agenda.render();
    if (tabName === 'clients' && window.Clients) window.Clients.render();
    if (tabName === 'services' && window.Services) window.Services.render();
    if (tabName === 'finance' && window.Finance) window.Finance.render();
    if (tabName === 'reports' && window.Reports) window.Reports.render();
    if (tabName === 'portal' && window.BookingPortal) window.BookingPortal.render();

    if (window.lucide) window.lucide.createIcons();
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);

    const themeText = document.getElementById('themeToggleText');
    if (themeText) {
      themeText.textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
    }
  }

  bindThemeToggle() {
    const themeBtn = document.getElementById('themeToggleBtn');
    themeBtn?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
    });
  }

  bindMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');

    menuBtn?.addEventListener('click', () => {
      sidebar?.classList.toggle('mobile-open');
    });
  }

  bindModals() {
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    document.getElementById('formAppointment')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAppointmentForm();
    });

    document.getElementById('formClient')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveClientForm();
    });

    document.getElementById('formService')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveServiceForm();
    });

    document.getElementById('formProduct')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProductForm();
    });

    document.getElementById('formTransaction')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTransactionForm();
    });

    document.getElementById('btnDeleteApptFromModal')?.addEventListener('click', () => {
      const id = document.getElementById('apptId').value;
      if (!id) return;

      if (confirm('Deseja realmente excluir permanentemente este agendamento do sistema?')) {
        let appts = window.Store.getAppointments();
        appts = appts.filter(a => a.id !== id);
        window.Store.saveAppointments(appts);

        window.showToast('Agendamento excluído com sucesso!', 'success');
        document.getElementById('modalAppointment')?.classList.remove('active');
        if (window.Agenda) window.Agenda.render();
      }
    });

    document.getElementById('apptServiceId')?.addEventListener('change', (e) => {
      const srvId = e.target.value;
      const services = window.Store.getServices();
      const srv = services.find(s => s.id === srvId);
      if (srv) {
        document.getElementById('apptPrice').value = srv.price;
      }
    });
  }

  openAppointmentModal(dateStr, timeStr, apptData = null) {
    const modal = document.getElementById('modalAppointment');
    if (!modal) return;

    const titleElem = document.getElementById('modalAppointmentTitle');
    const deleteBtn = document.getElementById('btnDeleteApptFromModal');

    if (titleElem) titleElem.textContent = apptData ? 'Editar Agendamento' : 'Novo Agendamento';
    if (deleteBtn) {
      if (apptData) deleteBtn.classList.remove('hidden');
      else deleteBtn.classList.add('hidden');
    }

    const clientSelect = document.getElementById('apptClientId');
    clientSelect.innerHTML = '<option value="">Selecione um cliente...</option>';
    window.Store.getClients().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.phone || 'Sem tel'})`;
      clientSelect.appendChild(opt);
    });

    const serviceSelect = document.getElementById('apptServiceId');
    serviceSelect.innerHTML = '<option value="">Selecione o serviço...</option>';
    window.Store.getServices().forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} - R$ ${parseFloat(s.price).toFixed(2).replace('.', ',')}`;
      serviceSelect.appendChild(opt);
    });

    document.getElementById('apptId').value = apptData ? apptData.id : '';
    document.getElementById('apptDate').value = apptData ? apptData.date : (dateStr || new Date().toISOString().split('T')[0]);
    document.getElementById('apptTime').value = apptData ? apptData.time : (timeStr || '10:00');
    document.getElementById('apptPrice').value = apptData ? apptData.price : '';
    document.getElementById('apptStatus').value = apptData ? apptData.status : 'scheduled';
    document.getElementById('apptRecurrence').value = apptData ? (apptData.recurrence || 'none') : 'none';
    document.getElementById('apptNotes').value = apptData ? apptData.notes : '';

    if (apptData && apptData.clientId) clientSelect.value = apptData.clientId;
    if (apptData && apptData.serviceId) serviceSelect.value = apptData.serviceId;

    modal.classList.add('active');
  }

  saveAppointmentForm() {
    const id = document.getElementById('apptId').value;
    const clientId = document.getElementById('apptClientId').value;
    const serviceId = document.getElementById('apptServiceId').value;
    const startDate = document.getElementById('apptDate').value;
    const time = document.getElementById('apptTime').value;
    const price = parseFloat(document.getElementById('apptPrice').value) || 0;
    const status = document.getElementById('apptStatus').value;
    const recurrence = document.getElementById('apptRecurrence').value;
    const notes = document.getElementById('apptNotes').value;

    if (!clientId || !serviceId || !startDate || !time) {
      window.showToast('Por favor, preencha todos os campos obrigatórios (*).', 'warning');
      return;
    }

    let appointments = window.Store.getAppointments();

    const mainAppt = {
      id: id || window.Store.generateId('app'),
      clientId,
      serviceId,
      date: startDate,
      time,
      price,
      status,
      recurrence,
      notes
    };

    if (id) {
      const idx = appointments.findIndex(a => a.id === id);
      if (idx !== -1) appointments[idx] = mainAppt;
      window.showToast('Agendamento atualizado com sucesso!', 'success');
    } else {
      appointments.push(mainAppt);

      let createdCount = 1;

      if (recurrence === 'weekly_4') {
        for (let i = 1; i <= 3; i++) {
          const d = new Date(startDate + 'T00:00:00');
          d.setDate(d.getDate() + (i * 7));
          appointments.push({
            id: window.Store.generateId('app'),
            clientId, serviceId, date: d.toISOString().split('T')[0], time, price, status: 'scheduled', recurrence: 'none', notes: `${notes} (Sessão ${i+1}/4)`
          });
          createdCount++;
        }
      } else if (recurrence === 'biweekly_4') {
        for (let i = 1; i <= 3; i++) {
          const d = new Date(startDate + 'T00:00:00');
          d.setDate(d.getDate() + (i * 14));
          appointments.push({
            id: window.Store.generateId('app'),
            clientId, serviceId, date: d.toISOString().split('T')[0], time, price, status: 'scheduled', recurrence: 'none', notes: `${notes} (Sessão ${i+1}/4)`
          });
          createdCount++;
        }
      } else if (recurrence === 'monthly_3') {
        for (let i = 1; i <= 2; i++) {
          const d = new Date(startDate + 'T00:00:00');
          d.setMonth(d.getMonth() + i);
          appointments.push({
            id: window.Store.generateId('app'),
            clientId, serviceId, date: d.toISOString().split('T')[0], time, price, status: 'scheduled', recurrence: 'none', notes: `${notes} (Sessão ${i+1}/3)`
          });
          createdCount++;
        }
      }

      if (createdCount > 1) {
        window.showToast(`Agendamento recorrente criado com ${createdCount} sessões futuras!`, 'success');
      } else {
        window.showToast('Agendamento salvo com sucesso!', 'success');
      }

      setTimeout(() => {
        if (confirm('Agendamento salvo com sucesso!\nDeseja enviar a MENSAGEM DE CONFIRMAÇÃO ao cliente via WhatsApp agora?')) {
          window.WhatsApp.sendBookingCreatedNotification(mainAppt);
        }
      }, 300);
    }

    window.Store.saveAppointments(appointments);

    if (status === 'completed') {
      const services = window.Store.getServices();
      const clients = window.Store.getClients();
      const srv = services.find(s => s.id === serviceId);
      const cli = clients.find(c => c.id === clientId);

      let trans = window.Store.getTransactions();
      trans.push({
        id: window.Store.generateId('tr'),
        type: 'income',
        description: `Atendimento Concluído: ${srv ? srv.name : 'Serviço'} - ${cli ? cli.name : 'Cliente'}`,
        amount: price,
        date: startDate,
        paymentMethod: 'Pix',
        status: 'paid'
      });
      window.Store.saveTransactions(trans);
    }

    document.getElementById('modalAppointment')?.classList.remove('active');

    if (window.Agenda) window.Agenda.render();
  }

  openClientModal(clientData = null) {
    const modal = document.getElementById('modalClient');
    if (!modal) return;

    document.getElementById('modalClientTitle').textContent = clientData ? 'Editar Cliente' : 'Novo Cliente';
    document.getElementById('clientId').value = clientData ? clientData.id : '';
    document.getElementById('clientName').value = clientData ? clientData.name : '';
    document.getElementById('clientPhone').value = clientData ? clientData.phone : '';
    document.getElementById('clientBirthDate').value = clientData ? clientData.birthDate : '';
    document.getElementById('clientEmail').value = clientData ? clientData.email : '';
    document.getElementById('clientAnamnesis').value = clientData ? clientData.anamnesis : '';

    modal.classList.add('active');
  }

  saveClientForm() {
    const id = document.getElementById('clientId').value;
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const birthDate = document.getElementById('clientBirthDate').value;
    const email = document.getElementById('clientEmail').value;
    const anamnesis = document.getElementById('clientAnamnesis').value;

    if (!name || !phone) {
      window.showToast('Nome e Telefone são obrigatórios.', 'warning');
      return;
    }

    let clients = window.Store.getClients();
    const newClient = {
      id: id || window.Store.generateId('cli'),
      name,
      phone,
      birthDate,
      email,
      anamnesis
    };

    if (id) {
      const idx = clients.findIndex(c => c.id === id);
      if (idx !== -1) clients[idx] = newClient;
    } else {
      clients.push(newClient);
    }

    window.Store.saveClients(clients);
    window.showToast('Cliente salvo com sucesso!', 'success');
    document.getElementById('modalClient')?.classList.remove('active');

    if (window.Clients) window.Clients.render();
  }

  openServiceModal(srvData = null) {
    const modal = document.getElementById('modalService');
    if (!modal) return;

    document.getElementById('modalServiceTitle').textContent = srvData ? 'Editar Serviço' : 'Novo Serviço';
    document.getElementById('serviceId').value = srvData ? srvData.id : '';
    document.getElementById('serviceName').value = srvData ? srvData.name : '';
    document.getElementById('serviceDuration').value = srvData ? srvData.duration : 30;
    document.getElementById('servicePrice').value = srvData ? srvData.price : '';
    document.getElementById('serviceColor').value = srvData ? srvData.color : '#0EA5E9';

    modal.classList.add('active');
  }

  saveServiceForm() {
    const id = document.getElementById('serviceId').value;
    const name = document.getElementById('serviceName').value;
    const duration = parseInt(document.getElementById('serviceDuration').value, 10) || 30;
    const price = parseFloat(document.getElementById('servicePrice').value) || 0;
    const color = document.getElementById('serviceColor').value || '#0EA5E9';

    if (!name || !price) {
      window.showToast('Preencha nome e preço do serviço.', 'warning');
      return;
    }

    let services = window.Store.getServices();
    const newSrv = { id: id || window.Store.generateId('srv'), name, duration, price, color };

    if (id) {
      const idx = services.findIndex(s => s.id === id);
      if (idx !== -1) services[idx] = newSrv;
    } else {
      services.push(newSrv);
    }

    window.Store.saveServices(services);
    window.showToast('Serviço salvo com sucesso!', 'success');
    document.getElementById('modalService')?.classList.remove('active');

    if (window.Services) window.Services.render();
  }

  openProductModal(prodData = null) {
    const modal = document.getElementById('modalProduct');
    if (!modal) return;

    document.getElementById('modalProductTitle').textContent = prodData ? 'Editar Produto do Estoque' : 'Novo Produto para Estoque';
    document.getElementById('productId').value = prodData ? prodData.id : '';
    document.getElementById('productName').value = prodData ? prodData.name : '';
    document.getElementById('productCategory').value = prodData ? (prodData.category || 'Venda ao Cliente') : 'Venda ao Cliente';
    document.getElementById('productSku').value = prodData ? (prodData.sku || '') : '';
    document.getElementById('productPrice').value = prodData ? prodData.price : '';
    document.getElementById('productCostPrice').value = prodData ? (prodData.costPrice || '') : '';
    document.getElementById('productStock').value = prodData ? prodData.stock : 10;
    document.getElementById('productMinStock').value = prodData ? prodData.minStock : 5;

    modal.classList.add('active');
  }

  saveProductForm() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const sku = document.getElementById('productSku').value;
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const costPrice = parseFloat(document.getElementById('productCostPrice').value) || 0;
    const stock = parseInt(document.getElementById('productStock').value, 10) || 0;
    const minStock = parseInt(document.getElementById('productMinStock').value, 10) || 5;

    if (!name || isNaN(price)) {
      window.showToast('Preencha o nome e um preço válido para o produto.', 'warning');
      return;
    }

    let products = window.Store.getProducts();

    const newProduct = {
      id: id || window.Store.generateId('prod'),
      name,
      category,
      sku,
      price,
      costPrice,
      stock,
      minStock
    };

    if (id) {
      const idx = products.findIndex(p => p.id === id);
      if (idx !== -1) products[idx] = newProduct;
    } else {
      products.push(newProduct);
    }

    window.Store.saveProducts(products);
    window.showToast(`Produto "${name}" salvo no estoque com sucesso!`, 'success');
    document.getElementById('modalProduct')?.classList.remove('active');

    if (window.Services) window.Services.render();
  }

  openTransactionModal() {
    const modal = document.getElementById('modalTransaction');
    if (!modal) return;

    document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('transAmount').value = '';
    document.getElementById('transDescription').value = '';

    modal.classList.add('active');
  }

  saveTransactionForm() {
    const type = document.getElementById('transType').value;
    const amount = parseFloat(document.getElementById('transAmount').value) || 0;
    const description = document.getElementById('transDescription').value;
    const date = document.getElementById('transDate').value;
    const paymentMethod = document.getElementById('transPaymentMethod').value;
    const status = document.getElementById('transStatus').value;

    if (!description || amount <= 0) {
      window.showToast('Descrição e valor válido são obrigatórios.', 'warning');
      return;
    }

    let transactions = window.Store.getTransactions();
    transactions.push({
      id: window.Store.generateId('tr'),
      type,
      amount,
      description,
      date,
      paymentMethod,
      status: status || 'paid'
    });

    window.Store.saveTransactions(transactions);
    window.showToast(status === 'paid' ? 'Transação registrada como Paga/Recebida!' : 'Conta registrada como Pendente no Financeiro!', 'success');
    document.getElementById('modalTransaction')?.classList.remove('active');

    if (window.Finance) window.Finance.render();
  }

  openWhatsAppModal(phone = '', templateKey = 'reminder', params = {}) {
    const modal = document.getElementById('modalWhatsApp');
    if (!modal) return;

    const select = document.getElementById('waTemplateSelect');
    const recipientInput = document.getElementById('waRecipientPhone');
    const messageArea = document.getElementById('waMessageText');
    const launchBtn = document.getElementById('btnLaunchWhatsApp');

    if (select) select.value = templateKey;
    if (recipientInput) recipientInput.value = phone || '';

    const updatePreview = () => {
      const settings = window.Store.getSettings();
      const currentKey = select.value;
      let rawTemplate = '';

      if (currentKey === 'created') rawTemplate = settings.whatsappTemplates?.created;
      else if (currentKey === 'reminder') rawTemplate = settings.whatsappTemplates?.reminder;
      else if (currentKey === 'birthday') rawTemplate = settings.whatsappTemplates?.birthday;
      else rawTemplate = messageArea.value;

      const builtMessage = window.WhatsApp.buildMessage(rawTemplate, params);
      messageArea.value = builtMessage;

      const targetPhone = recipientInput.value || phone;
      launchBtn.href = window.WhatsApp.getWhatsAppUrl(targetPhone, builtMessage);
    };

    select.onchange = updatePreview;
    recipientInput.oninput = updatePreview;
    messageArea.oninput = () => {
      launchBtn.href = window.WhatsApp.getWhatsAppUrl(recipientInput.value, messageArea.value);
    };

    updatePreview();
    modal.classList.add('active');
  }
}

window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'info'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

document.addEventListener('DOMContentLoaded', () => {
  window.App = new AppController();
  window.App.init();
});
