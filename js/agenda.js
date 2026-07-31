/* ==========================================================================
   SIMPLES AGENDA PRO - CALENDAR ENGINE WITH CLIENT NAMES, COMPLETED COLOR CODES & EDIT APPOINTMENTS
   ========================================================================== */

class AgendaController {
  constructor() {
    this.currentDate = new Date();
    this.currentView = 'day'; // 'day', 'week', 'month', 'list'
    this.container = null;
  }

  init() {
    this.container = document.getElementById('agendaViewContainer');
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('btnPrevDate')?.addEventListener('click', () => {
      this.navigateDate(-1);
    });

    document.getElementById('btnNextDate')?.addEventListener('click', () => {
      this.navigateDate(1);
    });

    document.getElementById('btnToday')?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.render();
    });

    const datePicker = document.getElementById('hiddenDatePicker');
    document.getElementById('btnCalendarPick')?.addEventListener('click', () => {
      datePicker?.click();
    });

    datePicker?.addEventListener('change', (e) => {
      if (e.target.value) {
        const [year, month, day] = e.target.value.split('-').map(Number);
        this.currentDate = new Date(year, month - 1, day);
        this.render();
      }
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.render();
      });
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

  formatCurrentDateDisplay() {
    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const dayName = daysOfWeek[this.currentDate.getDay()];
    const day = this.currentDate.getDate();
    const monthName = months[this.currentDate.getMonth()];
    const year = this.currentDate.getFullYear();

    if (this.currentView === 'day' || this.currentView === 'list') {
      return `${dayName}, ${day} de ${monthName} de ${year}`;
    } else if (this.currentView === 'month') {
      return `${monthName} de ${year}`;
    } else {
      const startOfWeek = new Date(this.currentDate);
      startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `Semana de ${startOfWeek.getDate()}/${startOfWeek.getMonth()+1} a ${endOfWeek.getDate()}/${endOfWeek.getMonth()+1}/${year}`;
    }
  }

  getStatusBadgeHTML(status) {
    if (status === 'completed') {
      return `<span class="badge badge-success" style="font-size:0.775rem; background:#D1FAE5; color:#047857; border:1px solid #6EE7B7; font-weight:800"><i data-lucide="check-circle" style="width:13px; height:13px; margin-right:2px"></i> ✅ CONCLUÍDO</span>`;
    } else if (status === 'confirmed') {
      return `<span class="badge badge-orange" style="font-size:0.775rem"><i data-lucide="check" style="width:12px; height:12px; margin-right:2px"></i> ⚡ Confirmado</span>`;
    } else if (status === 'cancelled') {
      return `<span class="badge badge-danger" style="font-size:0.775rem">❌ Cancelado</span>`;
    } else if (status === 'no_show') {
      return `<span class="badge badge-warning" style="font-size:0.775rem">⚠️ Faltou</span>`;
    }
    return `<span class="badge badge-warning" style="background:#E0F2FE; color:#0284C7; border:1px solid #7DD3FC; font-size:0.775rem">📅 Agendado</span>`;
  }

  getApptCardStyle(status, srvColor) {
    if (status === 'completed') {
      return `background:#ECFDF5 !important; border-left:6px solid #10B981 !important; border:1px solid #A7F3D0 !important; color:#064E3B !important;`;
    } else if (status === 'confirmed') {
      return `background:#FFF7ED !important; border-left:6px solid #F97316 !important; border:1px solid #FDBA74 !important; color:#7C2D12 !important;`;
    } else if (status === 'cancelled') {
      return `background:#FEF2F2 !important; border-left:6px solid #EF4444 !important; opacity:0.6; text-decoration:line-through;`;
    }
    return `background:var(--bg-surface) !important; border-left:6px solid ${srvColor || '#0EA5E9'} !important; border:1px solid var(--border-color) !important;`;
  }

  render() {
    const displayElem = document.getElementById('currentDateDisplay');
    if (displayElem) displayElem.textContent = this.formatCurrentDateDisplay();

    if (!this.container) return;

    if (this.currentView === 'day') this.renderDayView();
    else if (this.currentView === 'week') this.renderWeekView();
    else if (this.currentView === 'month') this.renderMonthView();
    else if (this.currentView === 'list') this.renderListView();

    this.updateMetrics();
  }

  /* ------------------------------------------------------------------------
     1. VISÃO DIÁRIA (DAY VIEW COM BOTAO DE EDITAR E DAR BAIXA)
     ------------------------------------------------------------------------ */
  renderDayView() {
    const dateStr = window.getLocalDateStr(this.currentDate);
    const appointments = window.Store.getAppointments().filter(a => a.date === dateStr && a.status !== 'cancelled');
    const clients = window.Store.getClients();
    const services = window.Store.getServices();
    const employees = window.Store.getEmployees();

    const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    let html = `<div class="day-timeline">`;

    hours.forEach(hour => {
      const apptsInHour = appointments.filter(a => a.time.startsWith(hour.split(':')[0]));

      html += `
        <div class="time-row" style="display:flex; border-bottom:1px dashed var(--border-color); min-height:72px; align-items:stretch">
          <div class="time-label" style="width:75px; font-weight:800; font-size:0.875rem; color:var(--text-muted); padding:0.75rem 0.5rem; text-align:center; border-right:1px solid var(--border-color); background:var(--bg-surface-secondary)">${hour}</div>
          <div class="time-slot" style="flex:1; padding:0.5rem; position:relative; cursor:pointer" onclick="window.App.openAppointmentModal('${dateStr}', '${hour}')">
      `;

      if (apptsInHour.length === 0) {
        html += `<div class="slot-empty-hint" style="color:var(--text-muted); font-size:0.8rem; font-style:italic; padding-top:0.4rem">+ Clique para agendar às ${hour}</div>`;
      } else {
        apptsInHour.forEach(appt => {
          const client = clients.find(c => c.id === appt.clientId) || { name: 'Cliente não cadastrado', phone: '' };
          const service = services.find(s => s.id === appt.serviceId) || { name: 'Serviço', color: '#0EA5E9' };
          const emp = employees.find(e => e.id === appt.employeeId);

          const cardStyle = this.getApptCardStyle(appt.status, service.color);
          const badgeHTML = this.getStatusBadgeHTML(appt.status);

          html += `
            <div class="appointment-card" style="${cardStyle} padding:0.85rem 1.1rem; border-radius:var(--radius-md); box-shadow:var(--shadow-sm); display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem" onclick="event.stopPropagation(); window.App.openAppointmentModal(null, null, window.Store.getAppointments().find(x=>x.id==='${appt.id}'))">
              <div class="appt-details">
                <div style="display:flex; align-items:center; gap:0.5rem">
                  <span style="font-weight:800; font-size:1rem; color:var(--primary)">${appt.time}</span>
                  ${badgeHTML}
                </div>
                
                <div style="font-weight:800; font-size:1.05rem; color:var(--text-main); margin-top:0.25rem">
                  👤 ${client.name} ${client.phone ? `<span style="font-size:0.8rem; font-weight:600; color:var(--text-muted)">(${client.phone})</span>` : ''}
                </div>

                <div style="font-size:0.85rem; color:var(--text-muted); margin-top:2px">
                  💇 <strong>${service.name}</strong> ${emp ? `• 👤 Profissional: <strong>${emp.name}</strong>` : ''}
                </div>
                ${appt.notes ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px">📝 ${appt.notes}</div>` : ''}
              </div>

              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap">
                <div style="font-weight:800; font-size:1.1rem; color:var(--text-main); margin-right:0.25rem">R$ ${parseFloat(appt.price || service.price).toFixed(2).replace('.', ',')}</div>

                <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.App.openAppointmentModal(null, null, window.Store.getAppointments().find(x=>x.id==='${appt.id}'))" title="Editar Agendamento">
                  <i data-lucide="edit"></i> Editar
                </button>

                ${appt.status !== 'completed' ? `
                  <button class="btn btn-whatsapp btn-xs" style="background:#10B981 !important; color:#FFF !important" onclick="event.stopPropagation(); window.Agenda.completeApptQuick('${appt.id}')" title="Dar Baixa (Marcar como Concluído)">
                    ✅ Dar Baixa
                  </button>
                ` : `
                  <span style="font-weight:800; color:#047857; font-size:0.8rem; background:#D1FAE5; border:1px solid #6EE7B7; padding:0.3rem 0.65rem; border-radius:var(--radius-full)">✅ Concluído</span>
                `}

                <button class="btn btn-whatsapp btn-xs" onclick="event.stopPropagation(); window.WhatsApp.sendBookingCreatedNotification(window.Store.getAppointments().find(x=>x.id==='${appt.id}'))" title="Enviar WhatsApp">
                  <i data-lucide="message-circle"></i> WA
                </button>
                <button class="icon-btn text-danger btn-xs" onclick="event.stopPropagation(); window.Agenda.deleteAppointment('${appt.id}')" title="Excluir">
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
    this.container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  /* ------------------------------------------------------------------------
     2. VISÃO SEMANAL (WEEK VIEW)
     ------------------------------------------------------------------------ */
  renderWeekView() {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const allAppts = window.Store.getAppointments().filter(a => a.status !== 'cancelled');
    const clients = window.Store.getClients();
    const services = window.Store.getServices();

    let html = `
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.5rem; overflow-x:auto; min-width:760px">
    `;

    days.forEach((dayObj, idx) => {
      const dateStr = window.getLocalDateStr(dayObj);
      const isToday = dateStr === window.getLocalDateStr();
      const dayAppts = allAppts.filter(a => a.date === dateStr);

      html += `
        <div style="background:var(--bg-surface); border:1px solid ${isToday ? 'var(--primary)' : 'var(--border-color)'}; border-radius:var(--radius-md); overflow:hidden; min-height:420px; display:flex; flex-direction:column">
          <div style="background:${isToday ? 'var(--primary-gradient)' : 'var(--bg-surface-secondary)'}; color:${isToday ? '#FFF' : 'var(--text-main)'}; padding:0.6rem; text-align:center; font-weight:800; font-size:0.85rem">
            ${dayNames[idx]} ${dayObj.getDate()}/${dayObj.getMonth()+1}
          </div>
          <div style="padding:0.5rem; flex:1; display:flex; flex-direction:column; gap:0.45rem; cursor:pointer" onclick="window.App.openAppointmentModal('${dateStr}', '10:00')">
      `;

      if (dayAppts.length === 0) {
        html += `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin-top:1rem">+ Agendar</div>`;
      } else {
        dayAppts.forEach(a => {
          const client = clients.find(c => c.id === a.clientId) || { name: 'Cliente' };
          const service = services.find(s => s.id === a.serviceId) || { name: 'Serviço', color: '#0EA5E9' };
          const cardStyle = this.getApptCardStyle(a.status, service.color);

          html += `
            <div style="${cardStyle} padding:0.55rem; border-radius:var(--radius-sm); font-size:0.775rem; box-shadow:var(--shadow-sm)" onclick="event.stopPropagation(); window.App.openAppointmentModal(null, null, window.Store.getAppointments().find(x=>x.id==='${a.id}'))" title="Clique para Editar Agendamento">
              <div style="display:flex; justify-content:space-between; align-items:center">
                <strong style="color:var(--primary); font-size:0.8rem">${a.time}</strong>
                ${a.status === 'completed' ? '<span style="font-size:0.65rem; background:#10B981; color:#FFF; padding:1px 4px; border-radius:4px; font-weight:800">✅ Concluído</span>' : '<span style="font-size:0.65rem; color:var(--primary); font-weight:800">✏️ Editar</span>'}
              </div>
              <div style="font-weight:800; color:var(--text-main); margin-top:2px">👤 ${client.name}</div>
              <div class="text-muted" style="font-size:0.725rem">💇 ${service.name}</div>
            </div>
          `;
        });
      }

      html += `</div></div>`;
    });

    html += `</div>`;
    this.container.innerHTML = html;
  }

  /* ------------------------------------------------------------------------
     3. VISÃO MENSAL (MONTH VIEW)
     ------------------------------------------------------------------------ */
  renderMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const allAppts = window.Store.getAppointments().filter(a => a.status !== 'cancelled');
    const clients = window.Store.getClients();

    let html = `
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.4rem; text-align:center; font-weight:800; margin-bottom:0.5rem; font-size:0.85rem">
        ${dayNames.map(d => `<div style="padding:0.4rem; background:var(--bg-surface-secondary); border-radius:var(--radius-sm)">${d}</div>`).join('')}
      </div>
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:0.4rem">
    `;

    for (let i = 0; i < firstDay; i++) {
      html += `<div style="min-height:85px; background:transparent"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const isToday = dateStr === window.getLocalDateStr();

      const dayAppts = allAppts.filter(a => a.date === dateStr);

      html += `
        <div style="background:var(--bg-surface); border:1px solid ${isToday ? 'var(--primary)' : 'var(--border-color)'}; border-radius:var(--radius-md); padding:0.4rem; min-height:90px; text-align:left; cursor:pointer; overflow:hidden" onclick="window.Agenda.selectMonthDay('${dateStr}')">
          <div style="font-weight:800; font-size:0.85rem; color:${isToday ? 'var(--primary)' : 'var(--text-main)'}">${day}</div>
          
          <div style="display:flex; flex-direction:column; gap:3px; margin-top:4px">
      `;

      dayAppts.slice(0, 3).forEach(a => {
        const client = clients.find(c => c.id === a.clientId) || { name: 'Cliente' };
        const isDone = a.status === 'completed';

        html += `
          <div style="background:${isDone ? '#DCFCE7' : '#F0F9FF'}; color:${isDone ? '#15803D' : '#0369A1'}; border-left:4px solid ${isDone ? '#16A34A' : '#0EA5E9'}; border:1px solid ${isDone ? '#86EFAC' : '#BAE6FD'}; padding:3px 5px; border-radius:4px; font-size:0.7rem; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" onclick="event.stopPropagation(); window.App.openAppointmentModal(null, null, window.Store.getAppointments().find(x=>x.id==='${a.id}'))" title="Clique para Editar">
            ${isDone ? '✅ ' : '📅 '}${a.time} - ${client.name} ${isDone ? '(Concluído)' : ''}
          </div>
        `;
      });

      if (dayAppts.length > 3) {
        html += `<div style="font-size:0.65rem; color:var(--text-muted); font-weight:800; text-align:center">+${dayAppts.length - 3} mais</div>`;
      }

      html += `</div></div>`;
    }

    html += `</div>`;
    this.container.innerHTML = html;
  }

  selectMonthDay(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    this.currentDate = new Date(year, month - 1, day);
    this.currentView = 'day';

    document.querySelectorAll('.view-btn').forEach(b => {
      if (b.dataset.view === 'day') b.classList.add('active');
      else b.classList.remove('active');
    });

    this.render();
  }

  /* ------------------------------------------------------------------------
     4. VISÃO LISTA (LIST VIEW COM BOTAO DE EDITAR)
     ------------------------------------------------------------------------ */
  renderListView() {
    const dateStr = window.getLocalDateStr(this.currentDate);
    const appointments = window.Store.getAppointments().filter(a => a.date >= dateStr && a.status !== 'cancelled');
    appointments.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const clients = window.Store.getClients();
    const services = window.Store.getServices();

    if (appointments.length === 0) {
      this.container.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem">
          <p class="text-muted">Nenhum agendamento futuro a partir de hoje.</p>
        </div>
      `;
      return;
    }

    let html = `<div style="display:flex; flex-direction:column; gap:0.75rem">`;
    appointments.forEach(appt => {
      const client = clients.find(c => c.id === appt.clientId) || { name: 'Cliente', phone: '' };
      const service = services.find(s => s.id === appt.serviceId) || { name: 'Serviço', color: '#0EA5E9' };
      const formattedDate = appt.date ? appt.date.split('-').reverse().join('/') : '';
      const cardStyle = this.getApptCardStyle(appt.status, service.color);
      const badgeHTML = this.getStatusBadgeHTML(appt.status);

      html += `
        <div class="card" style="${cardStyle} padding:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem" onclick="event.stopPropagation(); window.App.openAppointmentModal(null, null, window.Store.getAppointments().find(x=>x.id==='${appt.id}'))">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem">
              <strong style="color:var(--primary); font-size:1rem">${formattedDate} às ${appt.time}</strong>
              ${badgeHTML}
            </div>
            <h4 style="font-weight:800; font-size:1.1rem; margin-top:4px; color:var(--text-main)">👤 ${client.name} ${client.phone ? `(${client.phone})` : ''}</h4>
            <span class="text-muted" style="font-size:0.875rem">💇 ${service.name}</span>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap">
            <span style="font-weight:800; font-size:1.15rem; color:var(--text-main); margin-right:0.25rem">R$ ${parseFloat(appt.price || service.price).toFixed(2).replace('.', ',')}</span>
            
            <button class="btn btn-outline btn-xs" onclick="event.stopPropagation(); window.App.openAppointmentModal(null, null, window.Store.getAppointments().find(x=>x.id==='${appt.id}'))" title="Editar Agendamento">
              <i data-lucide="edit"></i> Editar
            </button>

            ${appt.status !== 'completed' ? `
              <button class="btn btn-whatsapp btn-xs" style="background:#10B981 !important; color:#FFF !important" onclick="event.stopPropagation(); window.Agenda.completeApptQuick('${appt.id}')">
                ✅ Dar Baixa
              </button>
            ` : `
              <span style="font-weight:800; color:#047857; font-size:0.8rem; background:#D1FAE5; border:1px solid #6EE7B7; padding:0.3rem 0.65rem; border-radius:var(--radius-full)">✅ Concluído</span>
            `}

            <button class="btn btn-whatsapp btn-xs" onclick="event.stopPropagation(); window.WhatsApp.sendBookingCreatedNotification(window.Store.getAppointments().find(x=>x.id==='${appt.id}'))">
              <i data-lucide="message-circle"></i> WA
            </button>
            <button class="icon-btn text-danger btn-xs" onclick="event.stopPropagation(); window.Agenda.deleteAppointment('${appt.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  completeApptQuick(id) {
    let appts = window.Store.getAppointments();
    const idx = appts.findIndex(a => a.id === id);
    if (idx !== -1) {
      const appt = appts[idx];
      appt.status = 'completed';
      window.Store.saveAppointments(appts);

      const services = window.Store.getServices();
      const clients = window.Store.getClients();
      const srv = services.find(s => s.id === appt.serviceId);
      const cli = clients.find(c => c.id === appt.clientId);

      let trans = window.Store.getTransactions() || [];
      trans.push({
        id: window.Store.generateId('tr'),
        type: 'income',
        description: `Atendimento Concluído: ${srv ? srv.name : 'Serviço'} - ${cli ? cli.name : 'Cliente'}`,
        amount: parseFloat(appt.price || 0),
        date: appt.date,
        paymentMethod: 'Pix',
        status: 'paid'
      });
      window.Store.saveTransactions(trans);

      window.showToast('✅ Baixa realizada! O agendamento mudou para verde no calendário.', 'success');
      this.render();
      if (window.Employees) window.Employees.render();
      if (window.App) window.App.updateAlertCenterBadge();
    }
  }

  deleteAppointment(id) {
    if (confirm('Deseja realmente excluir permanentemente este agendamento do sistema?')) {
      let appts = window.Store.getAppointments();
      appts = appts.filter(a => a.id !== id);
      window.Store.saveAppointments(appts);

      window.showToast('Agendamento excluído com sucesso!', 'success');
      this.render();
    }
  }

  updateMetrics() {
    const dateStr = window.getLocalDateStr(this.currentDate);
    const apptsToday = window.Store.getAppointments().filter(a => a.date === dateStr && a.status !== 'cancelled');

    const todayCountElem = document.getElementById('metricTodayCount');
    const confirmedCountElem = document.getElementById('metricConfirmedCount');
    const prevRevElem = document.getElementById('metricPrevRevenue');

    if (todayCountElem) todayCountElem.textContent = `${apptsToday.length} Atendimentos`;

    const confirmed = apptsToday.filter(a => a.status === 'confirmed' || a.status === 'completed');
    if (confirmedCountElem) confirmedCountElem.textContent = `${confirmed.length} Confirmados/Concluídos`;

    const totalRev = apptsToday.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    if (prevRevElem) prevRevElem.textContent = `R$ ${totalRev.toFixed(2).replace('.', ',')}`;

    const badge = document.getElementById('todayBadge');
    if (badge) {
      badge.textContent = apptsToday.length;
      if (apptsToday.length > 0) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.Agenda = new AgendaController();
});
