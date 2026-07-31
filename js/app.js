/* ==========================================================================
   SIMPLES AGENDA PRO - MAIN CONTROLLER WITH EMPLOYEES & CALCULATOR ENGINES
   ========================================================================== */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.initUnlocker();
  }

  initUnlocker() {
    const unlock = () => {
      this.getAudioContext();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    };
    document.addEventListener('click', unlock, { once: false });
    document.addEventListener('touchstart', unlock, { once: false });
    document.addEventListener('mousemove', unlock, { once: false });
    document.addEventListener('scroll', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  playBeep() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15);
      gain2.gain.setValueAtTime(0.5, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.45);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1046.5, now + 0.3);
      gain3.gain.setValueAtTime(0.6, now + 0.3);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.3);
      osc3.stop(now + 0.7);
    } catch (e) {
      console.warn('Som blocked or error:', e);
    }
  }
}

window.SoundEngine = new SoundEngine();

class AppController {
  constructor() {
    this.activeTab = 'agenda';
    this.knownApptIds = new Set();
  }

  init() {
    this.bindNavigation();
    this.bindGlobalSearch();
    this.bindThemeToggle();
    this.bindMobileMenu();
    this.bindModals();
    this.bindSoundTestButton();
    this.bindAlertCenterButton();
    this.bindRealtimeStorageListener();
    if (window.CloudSync) window.CloudSync.init();
    this.requestBrowserNotificationPermission();
    this.loadInitialSettings();
    this.updateAlertCenterBadge();

    if (window.Agenda) window.Agenda.init();
    if (window.Clients) window.Clients.init();
    if (window.Employees) window.Employees.init();
    if (window.Services) window.Services.init();
    if (window.Finance) window.Finance.init();
    if (window.Reports) window.Reports.init();
    if (window.BookingPortal) window.BookingPortal.init();
    if (window.Settings) window.Settings.init();

    if (window.lucide) window.lucide.createIcons();

    const initialAppts = window.Store.getAppointments() || [];
    initialAppts.forEach(a => this.knownApptIds.add(a.id));
  }

  requestBrowserNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  loadInitialSettings() {
    const settings = window.Store.getSettings() || {};

    const brandNameDisplay = document.getElementById('brandNameDisplay');
    if (brandNameDisplay && settings.businessName) {
      brandNameDisplay.textContent = settings.businessName;
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    this.setTheme(savedTheme);
  }

  bindSoundTestButton() {
    document.getElementById('btnTestSound')?.addEventListener('click', () => {
      window.SoundEngine.playBeep();
      window.showToast('🔊 Som de notificação testado com sucesso! (BIP Ativo)', 'success');
      
      const appts = window.Store.getAppointments();
      if (appts.length > 0) {
        this.showNewAppointmentModal(appts[appts.length - 1]);
      }
    });
  }

  bindAlertCenterButton() {
    document.getElementById('btnAlertCenterToggle')?.addEventListener('click', () => {
      this.openAlertCenterModal();
    });
  }

  updateAlertCenterBadge() {
    const todayStr = window.getLocalDateStr();
    const appts = window.Store.getAppointments() || [];
    const transactions = window.Store.getTransactions() || [];

    const overdueAppts = appts.filter(a => a.date < todayStr && (a.status === 'scheduled' || a.status === 'confirmed'));
    const overdueTrans = transactions.filter(t => t.date < todayStr && t.status === 'pending');

    const totalAlerts = overdueAppts.length + overdueTrans.length;

    const badge = document.getElementById('alertCenterCounterBadge');
    if (badge) {
      badge.textContent = totalAlerts;
      if (totalAlerts > 0) {
        badge.classList.remove('hidden');
        badge.style.background = 'var(--danger)';
      } else {
        badge.textContent = '0';
        badge.style.background = 'var(--success)';
      }
    }
  }

  openAlertCenterModal() {
    const modal = document.getElementById('modalAlertCenter');
    const body = document.getElementById('alertCenterModalBody');
    if (!modal || !body) return;

    const todayStr = window.getLocalDateStr();
    const appts = window.Store.getAppointments() || [];
    const transactions = window.Store.getTransactions() || [];
    const clients = window.Store.getClients() || [];
    const services = window.Store.getServices() || [];

    const overdueAppts = appts.filter(a => a.date < todayStr && (a.status === 'scheduled' || a.status === 'confirmed'));

    const nextThreeDays = new Date();
    nextThreeDays.setDate(nextThreeDays.getDate() + 3);
    const nextThreeStr = window.getLocalDateStr(nextThreeDays);

    const upcomingAppts = appts.filter(a => a.date >= todayStr && a.date <= nextThreeStr && a.status !== 'cancelled');
    const overdueTrans = transactions.filter(t => t.date < todayStr && t.status === 'pending');
    const upcomingTrans = transactions.filter(t => t.date >= todayStr && t.date <= nextThreeStr && t.status === 'pending');

    let html = `<div style="display:flex; flex-direction:column; gap:1.25rem">`;

    if (overdueAppts.length > 0) {
      html += `
        <div style="background:#FEE2E2; border:1px solid #FCA5A5; padding:1rem; border-radius:var(--radius-md)">
          <h4 style="color:#DC2626; font-weight:800; font-size:0.95rem; display:flex; align-items:center; gap:0.4rem; margin-bottom:0.6rem">
            <i data-lucide="alert-triangle" style="width:18px; height:18px"></i> Agendamentos Vencidos (${overdueAppts.length})
          </h4>
          <div style="display:flex; flex-direction:column; gap:0.5rem">
      `;

      overdueAppts.forEach(a => {
        const client = clients.find(c => c.id === a.clientId) || { name: 'Cliente', phone: '' };
        const service = services.find(s => s.id === a.serviceId) || { name: 'Serviço' };
        const formattedDate = a.date.split('-').reverse().join('/');

        html += `
          <div style="background:#FFF; padding:0.65rem; border-radius:var(--radius-sm); border:1px solid #FCA5A5; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
            <div>
              <strong style="color:#DC2626">${formattedDate} às ${a.time}</strong> - ${client.name}<br>
              <span class="text-muted">💇 ${service.name} ${client.phone ? `(${client.phone})` : ''}</span>
            </div>
            <div style="display:flex; gap:0.35rem">
              <button class="btn btn-whatsapp btn-xs" onclick="window.WhatsApp.sendBookingCreatedNotification(window.Store.getAppointments().find(x=>x.id==='${a.id}'))">
                WA
              </button>
              <button class="btn btn-success btn-xs" onclick="window.App.completeApptFromAlert('${a.id}')">
                ✅ Concluir
              </button>
            </div>
          </div>
        `;
      });

      html += `</div></div>`;
    }

    if (overdueTrans.length > 0) {
      html += `
        <div style="background:#FFF7ED; border:1px solid #FDBA74; padding:1rem; border-radius:var(--radius-md)">
          <h4 style="color:#EA580C; font-weight:800; font-size:0.95rem; display:flex; align-items:center; gap:0.4rem; margin-bottom:0.6rem">
            <i data-lucide="clock" style="width:18px; height:18px"></i> Contas Financeiras Vencidas (${overdueTrans.length})
          </h4>
          <div style="display:flex; flex-direction:column; gap:0.5rem">
      `;

      overdueTrans.forEach(t => {
        const isIncome = t.type === 'income';
        const formattedDate = t.date.split('-').reverse().join('/');
        const formattedVal = parseFloat(t.amount || 0).toFixed(2).replace('.', ',');

        html += `
          <div style="background:#FFF; padding:0.65rem; border-radius:var(--radius-sm); border:1px solid #FDBA74; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
            <div>
              <strong style="color:#C2410C">${formattedDate}</strong> - ${t.description}<br>
              <span class="badge ${isIncome ? 'badge-success' : 'badge-danger'}" style="font-size:0.7rem">${isIncome ? 'Receita a Receber' : 'Despesa a Pagar'}</span>
              <strong style="color:${isIncome ? 'var(--success)' : 'var(--danger)'}"> R$ ${formattedVal}</strong>
            </div>
            <button class="btn btn-success btn-xs" onclick="window.Finance.markAsPaid('${t.id}'); window.App.openAlertCenterModal();">
              ✅ Dar Baixa
            </button>
          </div>
        `;
      });

      html += `</div></div>`;
    }

    html += `
      <div style="background:var(--bg-surface-secondary); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color)">
        <h4 style="font-weight:800; font-size:0.95rem; display:flex; align-items:center; gap:0.4rem; margin-bottom:0.6rem; color:var(--primary-hover)">
          <i data-lucide="calendar" style="width:18px; height:18px"></i> Próximos Compromissos & Vencimentos (3 Dias)
        </h4>
    `;

    if (upcomingAppts.length === 0 && upcomingTrans.length === 0) {
      html += `<p class="text-muted" style="font-size:0.85rem">Nenhum compromisso ou conta pendente para os próximos 3 dias.</p>`;
    } else {
      html += `<div style="display:flex; flex-direction:column; gap:0.5rem">`;

      upcomingAppts.forEach(a => {
        const client = clients.find(c => c.id === a.clientId) || { name: 'Cliente' };
        const service = services.find(s => s.id === a.serviceId) || { name: 'Serviço' };
        const formattedDate = a.date.split('-').reverse().join('/');

        html += `
          <div style="background:var(--bg-surface); padding:0.6rem 0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
            <div>
              <strong>📅 ${formattedDate} às ${a.time}</strong> - Agendamento: ${client.name}<br>
              <span class="text-muted">${service.name}</span>
            </div>
            <button class="btn btn-whatsapp btn-xs" onclick="window.WhatsApp.sendBookingCreatedNotification(window.Store.getAppointments().find(x=>x.id==='${a.id}'))">
              Lembrete WA
            </button>
          </div>
        `;
      });

      upcomingTrans.forEach(t => {
        const isIncome = t.type === 'income';
        const formattedDate = t.date.split('-').reverse().join('/');
        const formattedVal = parseFloat(t.amount || 0).toFixed(2).replace('.', ',');

        html += `
          <div style="background:var(--bg-surface); padding:0.6rem 0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; font-size:0.85rem">
            <div>
              <strong>💸 ${formattedDate}</strong> - Financeiro: ${t.description}<br>
              <span class="text-muted">${isIncome ? 'A Receber' : 'A Pagar'} - R$ ${formattedVal}</span>
            </div>
            <button class="btn btn-success btn-xs" onclick="window.Finance.markAsPaid('${t.id}'); window.App.openAlertCenterModal();">
              Dar Baixa
            </button>
          </div>
        `;
      });

      html += `</div>`;
    }

    html += `</div></div>`;

    body.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    modal.classList.add('active');
  }

  completeApptFromAlert(id) {
    let appts = window.Store.getAppointments();
    const idx = appts.findIndex(a => a.id === id);
    if (idx !== -1) {
      appts[idx].status = 'completed';
      window.Store.saveAppointments(appts);
      window.showToast('Agendamento marcado como Concluído!', 'success');
      this.updateAlertCenterBadge();
      this.openAlertCenterModal();
      if (window.Agenda) window.Agenda.render();
      if (window.Employees) window.Employees.render();
    }
  }

  bindRealtimeStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.APPOINTMENTS || e.key === STORAGE_KEYS.TRANSACTIONS) {
        this.checkNewAppointments();
        this.updateAlertCenterBadge();
        if (window.Agenda) window.Agenda.render();
      }
    });

    setInterval(() => {
      this.checkNewAppointments();
      this.updateAlertCenterBadge();
    }, 2500);
  }

  checkNewAppointments() {
    const currentAppts = window.Store.getAppointments() || [];
    let latestNewAppt = null;

    currentAppts.forEach(a => {
      if (!this.knownApptIds.has(a.id)) {
        this.knownApptIds.add(a.id);
        latestNewAppt = a;
      }
    });

    if (latestNewAppt) {
      this.triggerNewApptAlert(latestNewAppt);
      if (window.Agenda) window.Agenda.render();
    }
  }

  triggerNewApptAlert(latestAppt) {
    window.SoundEngine.playBeep();
    window.showToast('🔔 NOVO AGENDAMENTO RECEBIDO DOS CLIENTES!', 'success');

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const clients = window.Store.getClients();
        const client = clients.find(c => c.id === latestAppt.clientId);
        new Notification('🔔 NOVO AGENDAMENTO RECEBIDO!', {
          body: `${client ? client.name : 'Cliente'} agendou para ${latestAppt.date.split('-').reverse().join('/')} às ${latestAppt.time}`,
          icon: 'favicon.ico'
        });
      } catch (err) {}
    }

    this.showNewAppointmentModal(latestAppt);

    if (window.Agenda) window.Agenda.render();
  }

  showNewAppointmentModal(latestAppt) {
    const modal = document.getElementById('modalNewApptAlert');
    const alertBody = document.getElementById('newApptAlertBody');
    if (!modal || !alertBody) return;

    const clients = window.Store.getClients();
    const services = window.Store.getServices();
    const client = clients.find(c => c.id === latestAppt.clientId) || { name: 'Cliente não identificado', phone: '', company: '', city: '' };
    const service = services.find(s => s.id === latestAppt.serviceId) || { name: 'Serviço', price: latestAppt.price || 0 };

    const formattedDate = latestAppt.date ? latestAppt.date.split('-').reverse().join('/') : '';
    const formattedPrice = parseFloat(latestAppt.price || service.price || 0).toFixed(2).replace('.', ',');

    alertBody.innerHTML = `
      <div style="text-align:center; margin-bottom:1.25rem">
        <div style="width:60px; height:60px; background:#FFF7ED; color:#EA580C; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:0.5rem; box-shadow:0 4px 12px rgba(234, 88, 12, 0.2)">
          <i data-lucide="bell-ring" style="width:32px; height:32px"></i>
        </div>
        <h4 style="font-size:1.2rem; font-weight:800; color:var(--text-main)">Novo Agendamento Confirmado!</h4>
        <p class="text-muted" style="font-size:0.85rem">Um cliente acabou de agendar um horário pelo celular!</p>
      </div>

      <div style="background:var(--bg-surface-secondary); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); font-size:0.9rem; display:flex; flex-direction:column; gap:0.5rem">
        <div><strong>👤 Cliente:</strong> ${client.name} ${client.phone ? `(${client.phone})` : ''}</div>
        ${client.company ? `<div><strong>🏢 Empresa:</strong> ${client.company}</div>` : ''}
        ${client.city ? `<div><strong>📍 Cidade / Estado:</strong> ${client.city}</div>` : ''}
        <div><strong>💇 Serviço:</strong> ${service.name}</div>
        <div><strong>📅 Data e Hora:</strong> <span style="color:var(--primary); font-weight:800">${formattedDate} às ${latestAppt.time}</span></div>
        <div><strong>💰 Valor:</strong> R$ ${formattedPrice}</div>
        ${latestAppt.notes ? `<div><strong>📝 Obs:</strong> ${latestAppt.notes}</div>` : ''}
      </div>

      <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:1.25rem">
        <button class="btn btn-whatsapp w-full" id="btnAlertOpenWA">
          <i data-lucide="send"></i> Abrir Confirmação no WhatsApp
        </button>
        <button class="btn btn-outline w-full close-modal">
          Entendido / Fechar Aviso
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('btnAlertOpenWA').onclick = () => {
      window.WhatsApp.sendBookingCreatedNotification(latestAppt);
      modal.classList.remove('active');
    };

    modal.classList.add('active');
  }

  bindGlobalSearch() {
    const globalSearch = document.getElementById('globalHeaderSearch');
    globalSearch?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) return;

      if (this.activeTab === 'clients' && window.Clients) {
        window.Clients.render(query);
      } else if (this.activeTab === 'employees' && window.Employees) {
        window.Employees.render(query);
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
      employees: 'Gestão de Funcionários & Comissões',
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
    if (tabName === 'employees' && window.Employees) window.Employees.render();
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
        window.Store.markAsDeleted(id);
        let appts = window.Store.getAppointments();
        appts = appts.filter(a => a.id !== id);
        window.Store.saveAppointments(appts);
        if (window.CloudSync) window.CloudSync.pushToCloud();

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

    // LISTENER PARA O SELETOR DE MÚLTIPLAS DATAS RECORRENTES
    document.getElementById('apptRecurrence')?.addEventListener('change', (e) => {
      const wrapper = document.getElementById('recurringCustomDatesWrapper');
      if (e.target.value === 'custom_dates') {
        wrapper?.classList.remove('hidden');
        const startDate = document.getElementById('apptDate').value;
        if (startDate && (!window.selectedCustomDates || window.selectedCustomDates.length === 0)) {
          window.selectedCustomDates = [startDate];
        }
        this.renderCustomDatesChips();
      } else {
        wrapper?.classList.add('hidden');
      }
    });

    document.getElementById('btnAddCustomDateBtn')?.addEventListener('click', () => {
      const dateInput = document.getElementById('customDatePickerInput');
      if (dateInput && dateInput.value) {
        this.addCustomDate(dateInput.value);
        dateInput.value = '';
      }
    });

    document.getElementById('customDatePickerInput')?.addEventListener('change', (e) => {
      if (e.target.value) {
        this.addCustomDate(e.target.value);
      }
    });
  }

  addCustomDate(dateStr) {
    if (!window.selectedCustomDates) window.selectedCustomDates = [];
    if (!window.selectedCustomDates.includes(dateStr)) {
      window.selectedCustomDates.push(dateStr);
      window.selectedCustomDates.sort();
      this.renderCustomDatesChips();
    }
  }

  removeCustomDate(dateStr) {
    if (!window.selectedCustomDates) return;
    window.selectedCustomDates = window.selectedCustomDates.filter(d => d !== dateStr);
    this.renderCustomDatesChips();
  }

  renderCustomDatesChips() {
    const listElem = document.getElementById('selectedCustomDatesList');
    if (!listElem) return;

    if (!window.selectedCustomDates || window.selectedCustomDates.length === 0) {
      listElem.innerHTML = `<span class="text-muted" style="font-size:0.8rem">Nenhuma data adicional selecionada. Escolha a data acima e clique em + Adicionar Data.</span>`;
      return;
    }

    let html = '';
    window.selectedCustomDates.forEach(dateStr => {
      const formatted = dateStr.split('-').reverse().join('/');
      html += `
        <span class="badge badge-success" style="padding:0.4rem 0.75rem; font-size:0.825rem; font-weight:800; display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer" onclick="window.App.removeCustomDate('${dateStr}')" title="Clique para Remover esta data">
          📅 ${formatted} <span style="font-size:0.9rem; color:#EF4444; font-weight:800">✖</span>
        </span>
      `;
    });

    listElem.innerHTML = html;
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

    const employeeSelect = document.getElementById('apptEmployeeId');
    if (employeeSelect) {
      employeeSelect.innerHTML = '<option value="">Selecione quem atenderá...</option>';
      window.Store.getEmployees().forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = `${e.name} (${e.role || 'Profissional'})`;
        employeeSelect.appendChild(opt);
      });
    }

    const defaultDate = apptData ? apptData.date : (dateStr || window.getLocalDateStr());
    document.getElementById('apptId').value = apptData ? apptData.id : '';
    document.getElementById('apptDate').value = defaultDate;
    document.getElementById('apptTime').value = apptData ? apptData.time : (timeStr || '10:00');
    document.getElementById('apptPrice').value = apptData ? apptData.price : '';
    document.getElementById('apptStatus').value = apptData ? apptData.status : 'scheduled';
    document.getElementById('apptRecurrence').value = apptData ? (apptData.recurrence || 'none') : 'none';
    document.getElementById('apptNotes').value = apptData ? apptData.notes : '';

    if (apptData && apptData.clientId) clientSelect.value = apptData.clientId;
    if (apptData && apptData.serviceId) serviceSelect.value = apptData.serviceId;
    if (apptData && apptData.employeeId && employeeSelect) employeeSelect.value = apptData.employeeId;

    // Reset de datas selecionadas
    window.selectedCustomDates = [defaultDate];
    const customWrapper = document.getElementById('recurringCustomDatesWrapper');
    if (apptData && apptData.recurrence === 'custom_dates') {
      if (customWrapper) customWrapper.classList.remove('hidden');
    } else {
      if (customWrapper) customWrapper.classList.add('hidden');
    }
    this.renderCustomDatesChips();

    modal.classList.add('active');
  }

  saveAppointmentForm() {
    const id = document.getElementById('apptId').value;
    const clientId = document.getElementById('apptClientId').value;
    const serviceId = document.getElementById('apptServiceId').value;
    const employeeId = document.getElementById('apptEmployeeId')?.value || '';
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

    const existingConflict = appointments.find(a =>
      a.id !== id &&
      a.date === startDate &&
      a.time === time &&
      a.status !== 'cancelled'
    );

    if (existingConflict) {
      const clients = window.Store.getClients();
      const conflictClient = clients.find(c => c.id === existingConflict.clientId);
      const formattedDate = startDate.split('-').reverse().join('/');
      
      window.showToast(`⚠️ Esta data e horário (${formattedDate} às ${time}) já está ocupado ${conflictClient ? `por ${conflictClient.name}` : ''}! Escolha outro dia ou horário.`, 'warning');
      return;
    }

    const mainAppt = {
      id: id || window.Store.generateId('app'),
      clientId,
      serviceId,
      employeeId,
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
      this.knownApptIds.add(mainAppt.id);

      let createdCount = 1;

      if (recurrence === 'custom_dates') {
        let chosenDates = window.selectedCustomDates || [];
        if (!chosenDates.includes(startDate)) chosenDates.push(startDate);
        chosenDates.sort();

        chosenDates.forEach((targetDate, index) => {
          if (targetDate === startDate) return; // a primeira data é a principal
          const subAppt = {
            id: window.Store.generateId('app'),
            clientId, serviceId, employeeId, date: targetDate, time, price, status: 'scheduled', recurrence: 'custom_dates', notes: `${notes} (Agendamento Recorrente ${index+1}/${chosenDates.length})`
          };
          appointments.push(subAppt);
          this.knownApptIds.add(subAppt.id);
          createdCount++;
        });
      } else if (recurrence === 'weekly_4') {
        for (let i = 1; i <= 3; i++) {
          const d = new Date(startDate + 'T00:00:00');
          d.setDate(d.getDate() + (i * 7));
          const subAppt = {
            id: window.Store.generateId('app'),
            clientId, serviceId, employeeId, date: window.getLocalDateStr(d), time, price, status: 'scheduled', recurrence: 'none', notes: `${notes} (Sessão ${i+1}/4)`
          };
          appointments.push(subAppt);
          this.knownApptIds.add(subAppt.id);
          createdCount++;
        }
      } else if (recurrence === 'biweekly_4') {
        for (let i = 1; i <= 3; i++) {
          const d = new Date(startDate + 'T00:00:00');
          d.setDate(d.getDate() + (i * 14));
          const subAppt = {
            id: window.Store.generateId('app'),
            clientId, serviceId, employeeId, date: window.getLocalDateStr(d), time, price, status: 'scheduled', recurrence: 'none', notes: `${notes} (Sessão ${i+1}/4)`
          };
          appointments.push(subAppt);
          this.knownApptIds.add(subAppt.id);
          createdCount++;
        }
      } else if (recurrence === 'monthly_3') {
        for (let i = 1; i <= 2; i++) {
          const d = new Date(startDate + 'T00:00:00');
          d.setMonth(d.getMonth() + i);
          const subAppt = {
            id: window.Store.generateId('app'),
            clientId, serviceId, employeeId, date: window.getLocalDateStr(d), time, price, status: 'scheduled', recurrence: 'none', notes: `${notes} (Sessão ${i+1}/3)`
          };
          appointments.push(subAppt);
          this.knownApptIds.add(subAppt.id);
          createdCount++;
        }
      }

      if (createdCount > 1) {
        window.showToast(`Agendamento recorrente criado com ${createdCount} sessões para as datas selecionadas!`, 'success');
      } else {
        window.showToast('Agendamento salvo com sucesso!', 'success');
      }

      window.SoundEngine.playBeep();

      setTimeout(() => {
        if (confirm('Agendamento salvo com sucesso!\nDeseja enviar a MENSAGEM DE CONFIRMAÇÃO ao cliente via WhatsApp agora?')) {
          window.WhatsApp.sendBookingCreatedNotification(mainAppt);
        }
      }, 300);
    }

    window.Store.saveAppointments(appointments);
    if (window.CloudSync) window.CloudSync.pushToCloud();

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

    this.updateAlertCenterBadge();
    if (window.Agenda) window.Agenda.render();
    if (window.Employees) window.Employees.render();
  }

  openClientModal(clientData = null) {
    const modal = document.getElementById('modalClient');
    if (!modal) return;

    document.getElementById('modalClientTitle').textContent = clientData ? 'Editar Cliente' : 'Novo Cliente';
    document.getElementById('clientId').value = clientData ? clientData.id : '';
    document.getElementById('clientName').value = clientData ? clientData.name : '';
    document.getElementById('clientPhone').value = clientData ? clientData.phone : '';
    document.getElementById('clientCompany').value = clientData ? (clientData.company || '') : '';
    document.getElementById('clientCity').value = clientData ? (clientData.city || '') : '';
    document.getElementById('clientAnamnesis').value = clientData ? (clientData.anamnesis || '') : '';

    modal.classList.add('active');
  }

  saveClientForm() {
    const id = document.getElementById('clientId').value;
    const name = document.getElementById('clientName').value;
    const phone = document.getElementById('clientPhone').value;
    const company = document.getElementById('clientCompany').value;
    const city = document.getElementById('clientCity').value;
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
      company,
      city,
      anamnesis
    };

    if (id) {
      const idx = clients.findIndex(c => c.id === id);
      if (idx !== -1) clients[idx] = newClient;
    } else {
      clients.push(newClient);
    }

    window.Store.saveClients(clients);
    if (window.CloudSync) window.CloudSync.pushToCloud();

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
    if (window.CloudSync) window.CloudSync.pushToCloud();

    window.showToast('Serviço salvo com sucesso e publicado na Nuvem!', 'success');
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

    this.updateAlertCenterBadge();
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
