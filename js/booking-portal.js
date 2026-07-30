/* ==========================================================================
   SIMPLES AGENDA PRO - CUSTOMER ONLINE BOOKING PORTAL (VERCEL & REAL LINK)
   ========================================================================== */

class BookingPortalView {
  constructor() {
    this.step = 1;
    this.selectedService = null;
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.selectedTime = null;
  }

  init() {
    this.bindEvents();
    this.setupRealLink();
    this.render();
  }

  getRealPortalUrl() {
    const protocol = window.location.protocol;
    const origin = window.location.origin;
    const pathname = window.location.pathname;

    if (protocol === 'file:') {
      if (pathname.endsWith('index.html')) {
        return window.location.href.replace('index.html', 'agendar.html');
      } else {
        return window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1) + 'agendar.html';
      }
    }

    return `${origin}/agendar`;
  }

  setupRealLink() {
    const realUrl = this.getRealPortalUrl();
    const linkInput = document.getElementById('portalLinkInput');
    if (linkInput) {
      linkInput.value = realUrl;
    }
  }

  bindEvents() {
    document.getElementById('btnCopyPortalLink')?.addEventListener('click', () => {
      const realUrl = this.getRealPortalUrl();
      navigator.clipboard.writeText(realUrl);
      window.showToast('Link REAL do Portal copiado! Envie aos seus clientes.', 'success');
    });

    document.getElementById('btnOpenRealPortalLink')?.addEventListener('click', () => {
      const realUrl = this.getRealPortalUrl();
      window.open(realUrl, '_blank');
    });
  }

  updateStepIndicators() {
    const s1 = document.getElementById('pStep1');
    const s2 = document.getElementById('pStep2');
    const s3 = document.getElementById('pStep3');

    if (s1) s1.className = this.step === 1 ? 'active' : '';
    if (s2) s2.className = this.step === 2 ? 'active' : '';
    if (s3) s3.className = this.step === 3 ? 'active' : '';
  }

  render() {
    this.updateStepIndicators();

    const settings = window.Store.getSettings();
    const companyNameElem = document.getElementById('portalCompanyName');
    const logoImgElem = document.getElementById('portalLogoImg');

    if (companyNameElem) companyNameElem.textContent = settings.businessName || 'Minha Empresa';
    if (logoImgElem) {
      if (settings.businessLogo) {
        logoImgElem.src = settings.businessLogo;
        logoImgElem.classList.remove('hidden');
      } else {
        logoImgElem.classList.add('hidden');
      }
    }

    const body = document.getElementById('portalStepBody');
    if (!body) return;

    if (this.step === 1) {
      this.renderStep1(body);
    } else if (this.step === 2) {
      this.renderStep2(body);
    } else if (this.step === 3) {
      this.renderStep3(body);
    } else if (this.step === 4) {
      this.renderStep4(body);
    }
  }

  renderStep1(container) {
    const services = window.Store.getServices();
    
    let html = `
      <div style="font-size:0.875rem; font-weight:800; margin-bottom:0.75rem; color:var(--text-main)">Escolha o serviço desejado:</div>
      <div style="display:flex; flex-direction:column; gap:0.65rem;">
    `;

    services.forEach(srv => {
      html += `
        <div class="card btn-select-srv-portal" data-id="${srv.id}" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; border-left:5px solid ${srv.color || '#0EA5E9'}; padding:0.75rem 0.9rem; background:var(--bg-surface)">
          <div>
            <strong style="font-size:0.95rem">${srv.name}</strong>
            <div class="text-muted" style="font-size:0.75rem; margin-top:2px">⏱️ ${srv.duration} minutos</div>
          </div>
          <span style="font-weight:800; color:var(--primary); font-size:0.95rem">R$ ${parseFloat(srv.price).toFixed(2).replace('.', ',')}</span>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll('.btn-select-srv-portal').forEach(card => {
      card.onclick = () => {
        const id = card.dataset.id;
        this.selectedService = services.find(s => s.id === id);
        this.step = 2;
        this.render();
      };
    });
  }

  renderStep2(container) {
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    const apptsOnDate = window.Store.getAppointments().filter(a => a.date === this.selectedDate && a.status !== 'cancelled');
    const occupiedTimes = new Set(apptsOnDate.map(a => a.time));

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <span style="font-size:0.875rem; font-weight:800;">Data e Horário</span>
        <button class="btn btn-light btn-xs btn-back-step1">← Voltar</button>
      </div>

      <div style="background:var(--primary-light); padding:0.6rem 0.75rem; border-radius:var(--radius-sm); font-size:0.8rem; margin-bottom:0.75rem; color:var(--primary-hover)">
        Serviço: <strong>${this.selectedService ? this.selectedService.name : ''}</strong>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-size:0.775rem">Data do Atendimento</label>
        <input type="date" id="portalDateInput" value="${this.selectedDate}" class="form-control-sm" min="${new Date().toISOString().split('T')[0]}">
      </div>

      <div style="font-size:0.775rem; font-weight:700; margin:0.5rem 0;">Horários Disponíveis:</div>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem;">
    `;

    timeSlots.forEach(t => {
      const isOccupied = occupiedTimes.has(t);
      html += `
        <button class="btn ${isOccupied ? 'btn-light' : 'btn-outline'} btn-xs btn-time-slot" 
                data-time="${t}" ${isOccupied ? 'disabled style="opacity:0.5; text-decoration:line-through"' : ''}>
          ${t} ${isOccupied ? '(Ocupado)' : ''}
        </button>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    container.querySelector('.btn-back-step1').onclick = () => {
      this.step = 1;
      this.render();
    };

    container.querySelector('#portalDateInput').onchange = (e) => {
      this.selectedDate = e.target.value;
      this.renderStep2(container);
    };

    container.querySelectorAll('.btn-time-slot').forEach(btn => {
      btn.onclick = () => {
        this.selectedTime = btn.dataset.time;
        this.step = 3;
        this.render();
      };
    });
  }

  renderStep3(container) {
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <span style="font-size:0.875rem; font-weight:800;">Seus Dados de Contato</span>
        <button class="btn btn-light btn-xs btn-back-step2">← Voltar</button>
      </div>

      <div style="background:var(--accent-orange-light); padding:0.6rem 0.75rem; border-radius:var(--radius-sm); font-size:0.8rem; margin-bottom:0.85rem; color:#C2410C">
        📅 <strong>${this.selectedDate.split('-').reverse().join('/')} às ${this.selectedTime}</strong><br>
        💇 ${this.selectedService ? this.selectedService.name : ''} - R$ ${parseFloat(this.selectedService ? this.selectedService.price : 0).toFixed(2).replace('.', ',')}
      </div>

      <form id="portalClientForm" style="display:flex; flex-direction:column; gap:0.65rem;">
        <div class="form-group">
          <label class="form-label" style="font-size:0.775rem">Seu Nome Completo *</label>
          <input type="text" id="portalClientName" class="form-control-sm" required placeholder="Digite seu nome">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:0.775rem">Seu WhatsApp *</label>
          <input type="tel" id="portalClientPhone" class="form-control-sm" required placeholder="(11) 99999-9999">
        </div>
        <button type="submit" class="btn btn-orange btn-sm margin-top">
          Confirmar Agendamento
        </button>
      </form>
    `;

    container.innerHTML = html;

    container.querySelector('.btn-back-step2').onclick = () => {
      this.step = 2;
      this.render();
    };

    container.querySelector('#portalClientForm').onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('portalClientName').value;
      const phone = document.getElementById('portalClientPhone').value;

      let clients = window.Store.getClients();
      let client = clients.find(c => c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''));
      if (!client) {
        client = {
          id: window.Store.generateId('cli'),
          name,
          phone,
          company: '',
          city: '',
          anamnesis: 'Agendou via Portal Online.'
        };
        clients.push(client);
        window.Store.saveClients(clients);
      }

      const newAppt = {
        id: window.Store.generateId('app'),
        clientId: client.id,
        serviceId: this.selectedService.id,
        date: this.selectedDate,
        time: this.selectedTime,
        price: this.selectedService.price,
        status: 'scheduled',
        notes: 'Agendado pelo Portal Online'
      };

      const appts = window.Store.getAppointments();
      appts.push(newAppt);
      window.Store.saveAppointments(appts);

      if (window.SoundEngine) window.SoundEngine.playBeep();

      this.step = 4;
      this.render();
    };
  }

  renderStep4(container) {
    container.innerHTML = `
      <div class="text-center" style="padding:1.5rem 0;">
        <i data-lucide="check-circle-2" style="width:48px; height:48px; color:var(--whatsapp); margin-bottom:0.75rem;"></i>
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--whatsapp)">Agendamento Concluído!</h3>
        <p class="text-muted" style="font-size:0.8rem; margin-top:0.5rem">
          Horário reservado com sucesso no sistema!
        </p>
        <button class="btn btn-outline btn-sm margin-top btn-reset-portal">
          Fazer Outro Agendamento
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    container.querySelector('.btn-reset-portal').onclick = () => {
      this.step = 1;
      this.render();
    };
  }
}

window.BookingPortal = new BookingPortalView();
