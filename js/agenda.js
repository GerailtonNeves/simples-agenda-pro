/* ==========================================================================
   SIMPLES AGENDA PRO - CALENDAR & AGENDA ENGINE
   ========================================================================== */

class AgendaView {
  constructor() {
    this.currentDate = new Date();
    this.currentView = 'day'; // day, week, month, list
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('btnPrevDate')?.addEventListener('click', () => this.navigateDate(-1));
    document.getElementById('btnNextDate')?.addEventListener('click', () => this.navigateDate(1));
    document.getElementById('btnToday')?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.render();
    });

    const datePicker = document.getElementById('hiddenDatePicker');
    document.getElementById('btnCalendarPick')?.addEventListener('click', () => datePicker?.click());
    datePicker?.addEventListener('change', (e) => {
      if (e.target.value) {
        this.currentDate = new Date(e.target.value + 'T00:00:00');
        this.render();
      }
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.render();
      });
    });

    document.getElementById('btnSendAllReminders')?.addEventListener('click', () => {
      this.triggerRemindersForToday();
    });
  }

  navigateDate(direction) {
    if (this.currentView === 'day' || this.currentView === 'list') {
      this.currentDate.setDate(this.currentDate.getDate() + direction);
    } else if (this.currentView === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
    } else if (this.currentView === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    }
    this.render();
  }

  formatDateDisplay() {
    const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    return this.currentDate.toLocaleDateString('pt-BR', options);
  }

  getDateString(dateObj = this.currentDate) {
    return dateObj.toISOString().split('T')[0];
  }

  render() {
    const displayElem = document.getElementById('currentDateDisplay');
    if (displayElem) displayElem.textContent = this.formatDateDisplay();

    const container = document.getElementById('agendaViewContainer');
    if (!container) return;

    this.updateMetrics();

    if (this.currentView === 'day') this.renderDayView(container);
    else if (this.currentView === 'week') this.renderWeekView(container);
    else if (this.currentView === 'month') this.renderMonthView(container);
    else if (this.currentView === 'list') this.renderListView(container);

    if (window.lucide) window.lucide.createIcons();
  }

  updateMetrics() {
    const todayStr = new Date().toISOString().split('T')[0];
    const appointments = window.Store.getAppointments();
    const todayAppts = appointments.filter(a => a.date === todayStr);

    const todayCountElem = document.getElementById('metricTodayCount');
    const confirmedElem = document.getElementById('metricConfirmedCount');
    const revenueElem = document.getElementById('metricPrevRevenue');
    const todayBadge = document.getElementById('todayBadge');

    if (todayCountElem) todayCountElem.textContent = `${todayAppts.length} Atendimentos`;

    const confirmedCount = todayAppts.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
    if (confirmedElem) confirmedElem.textContent = `${confirmedCount} Confirmados`;

    const revenue = todayAppts.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
    if (revenueElem) revenueElem.textContent = `R$ ${revenue.toFixed(2).replace('.', ',')}`;

    if (todayBadge) {
      todayBadge.textContent = todayAppts.length;
      if (todayAppts.length > 0) todayBadge.classList.remove('hidden');
      else todayBadge.classList.add('hidden');
    }
  }

  renderDayView(container) {
    const dateStr = this.getDateString();
    const appointments = window.Store.getAppointments().filter(a => a.date === dateStr);
    const clients = window.Store.getClients();
    const services = window.Store.getServices();

    const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    let html = `<div class="time-slots-container">`;

    timeSlots.forEach(slot => {
      const slotAppts = appointments.filter(a => a.time && a.time.startsWith(slot.substring(0, 2)));

      html += `
        <div class="slot-row">
          <div class="slot-time">${slot}</div>
          <div class="slot-content">
      `;

      if (slotAppts.length === 0) {
        html += `
          <button class="btn btn-light btn-xs btn-add-slot" onclick="window.App.openAppointmentModal('${dateStr}', '${slot}')" style="align-self: flex-start; opacity: 0.7;">
            <i data-lucide="plus" style="width:14px; height:14px"></i> Reservar Horário
          </button>
        `;
      } else {
        slotAppts.forEach(appt => {
          const client = clients.find(c => c.id === appt.clientId) || { name: 'Cliente Não Identificado', phone: '' };
          const service = services.find(s => s.id === appt.serviceId) || { name: 'Serviço Personalizado', color: '#0EA5E9' };

          html += `
            <div class="appointment-card" style="border-left-color: ${service.color || '#0EA5E9'}">
              <div class="appt-info-main">
                <div class="appt-client-name">
                  <span>${client.name}</span>
                  ${this.getStatusBadgeHtml(appt.status)}
                </div>
                <div class="appt-service-tag">
                  <i data-lucide="scissors" style="width:14px; height:14px; vertical-align:middle"></i>
                  ${service.name} • ${appt.time} • <strong>R$ ${parseFloat(appt.price || 0).toFixed(2).replace('.', ',')}</strong>
                </div>
              </div>
              <div class="appt-actions">
                <button class="btn btn-whatsapp btn-xs" onclick="window.WhatsApp.sendUpcomingReminder(${JSON.stringify(appt).replace(/"/g, '&quot;')})" title="Enviar Lembrete WhatsApp">
                  <i data-lucide="message-circle"></i> Lembrete WA
                </button>
                <button class="icon-btn" onclick="window.Agenda.editAppointment('${appt.id}')" title="Editar">
                  <i data-lucide="edit-3"></i>
                </button>
                <button class="icon-btn" style="color:var(--danger)" onclick="window.Agenda.deleteAppointment('${appt.id}')" title="Excluir Permanentemente">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `;
        });
      }

      html += `</div></div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  renderListView(container) {
    const dateStr = this.getDateString();
    const appointments = window.Store.getAppointments().filter(a => a.date === dateStr);
    const clients = window.Store.getClients();
    const services = window.Store.getServices();

    if (appointments.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 3rem;">
          <i data-lucide="calendar-x" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3>Nenhum agendamento para esta data.</h3>
          <p class="text-muted" style="margin-top: 0.5rem;">Clique no botão "+ Novo Agendamento" para adicionar.</p>
        </div>
      `;
      return;
    }

    let html = `<div style="display:flex; flex-direction:column; gap:1rem;">`;

    appointments.forEach(appt => {
      const client = clients.find(c => c.id === appt.clientId) || { name: 'Cliente', phone: '' };
      const service = services.find(s => s.id === appt.serviceId) || { name: 'Serviço', color: '#0EA5E9' };

      html += `
        <div class="appointment-card" style="border-left-color: ${service.color || '#0EA5E9'}">
          <div class="appt-info-main">
            <div class="appt-client-name">
              <span>${client.name}</span>
              ${this.getStatusBadgeHtml(appt.status)}
            </div>
            <div class="appt-service-tag">
              ⏰ ${appt.time} | 💇 ${service.name} | R$ ${parseFloat(appt.price || 0).toFixed(2).replace('.', ',')}
            </div>
          </div>
          <div class="appt-actions">
            <button class="btn btn-whatsapp btn-xs" onclick="window.WhatsApp.sendUpcomingReminder(${JSON.stringify(appt).replace(/"/g, '&quot;')})">
              <i data-lucide="message-circle"></i> Notificar WA
            </button>
            <button class="icon-btn" onclick="window.Agenda.editAppointment('${appt.id}')">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="icon-btn" style="color:var(--danger)" onclick="window.Agenda.deleteAppointment('${appt.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  renderWeekView(container) {
    container.innerHTML = `<div class="card text-center" style="padding:2rem;">Visão Semanal Ativa. Escolha o dia no navegador acima para ver os horários detalhados.</div>`;
  }

  renderMonthView(container) {
    container.innerHTML = `<div class="card text-center" style="padding:2rem;">Visão Mensal Ativa. Selecione uma data no calendário para ver a lista de clientes.</div>`;
  }

  getStatusBadgeHtml(status) {
    const map = {
      scheduled: { text: 'Agendado', class: 'status-scheduled' },
      confirmed: { text: 'Confirmado', class: 'status-confirmed' },
      completed: { text: 'Concluído', class: 'status-completed' },
      cancelled: { text: 'Cancelado', class: 'status-cancelled' },
      no_show: { text: 'Faltou', class: 'status-no_show' }
    };
    const s = map[status] || map.scheduled;
    return `<span class="status-badge ${s.class}">${s.text}</span>`;
  }

  editAppointment(id) {
    const appointments = window.Store.getAppointments();
    const appt = appointments.find(a => a.id === id);
    if (appt) {
      window.App.openAppointmentModal(appt.date, appt.time, appt);
    }
  }

  deleteAppointment(id) {
    if (confirm('Deseja realmente excluir permanentemente este agendamento do sistema?')) {
      let appointments = window.Store.getAppointments();
      appointments = appointments.filter(a => a.id !== id);
      window.Store.saveAppointments(appointments);
      window.showToast('Agendamento excluído com sucesso!', 'success');
      this.render();
    }
  }

  triggerRemindersForToday() {
    const todayStr = new Date().toISOString().split('T')[0];
    const appointments = window.Store.getAppointments().filter(a => a.date === todayStr);

    if (appointments.length === 0) {
      window.showToast('Nenhum agendamento para hoje para notificar.', 'info');
      return;
    }

    let count = 0;
    appointments.forEach(a => {
      setTimeout(() => {
        window.WhatsApp.sendUpcomingReminder(a);
      }, count * 800);
      count++;
    });
    window.showToast(`Iniciando envio de lembretes para ${count} clientes...`, 'success');
  }
}

window.Agenda = new AgendaView();
