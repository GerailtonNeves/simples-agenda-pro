/* ==========================================================================
   SIMPLES AGENDA PRO - CLIENT MANAGEMENT ENGINE
   ========================================================================== */

class ClientsView {
  constructor() {}

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('clientSearchInput')?.addEventListener('input', (e) => {
      this.render(e.target.value);
    });

    document.getElementById('btnAddClientModal')?.addEventListener('click', () => {
      window.App.openClientModal();
    });
  }

  render(filterQuery = '') {
    const clients = window.Store.getClients();
    const container = document.getElementById('clientsGrid');
    if (!container) return;

    this.checkBirthdays(clients);

    const filtered = clients.filter(c => {
      const query = filterQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        (c.anamnesis && c.anamnesis.toLowerCase().includes(query))
      );
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card text-center full-width" style="padding: 3rem; grid-column: 1 / -1;">
          <i data-lucide="users" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3>Nenhum cliente encontrado</h3>
          <p class="text-muted" style="margin-top:0.5rem">Clique em "+ Novo Cliente" para cadastrar.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(client => {
      const initial = client.name ? client.name.charAt(0).toUpperCase() : 'C';

      const card = document.createElement('div');
      card.className = 'client-card';
      card.innerHTML = `
        <div>
          <div class="client-header">
            <div class="client-avatar">${initial}</div>
            <div class="client-details">
              <h4>${client.name}</h4>
              <div class="client-contact">
                <i data-lucide="phone" style="width:14px; height:14px"></i> ${client.phone || 'Sem Telefone'}
              </div>
            </div>
          </div>

          ${client.birthDate ? `
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.75rem">
              🎂 Nascimento: <strong>${this.formatDateBR(client.birthDate)}</strong>
            </div>
          ` : ''}

          <div style="font-size:0.825rem; margin-top:0.6rem; background:var(--bg-surface-secondary); padding:0.6rem 0.85rem; border-radius:var(--radius-md)">
            <strong>Anamnese / Notas:</strong><br>
            <span class="text-muted">${client.anamnesis || 'Sem observações cadastradas.'}</span>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:0.85rem; margin-top:0.5rem">
          <button class="btn btn-whatsapp btn-xs btn-wa-client">
            <i data-lucide="message-circle"></i> Conversar WA
          </button>
          <div style="display:flex; gap:0.4rem">
            <button class="icon-btn btn-edit-client" title="Editar Cliente">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="icon-btn btn-delete-client" style="color:var(--danger)" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-wa-client').onclick = () => {
        window.App.openWhatsAppModal(client.phone, 'custom', { clientName: client.name });
      };

      card.querySelector('.btn-edit-client').onclick = () => {
        window.App.openClientModal(client);
      };

      card.querySelector('.btn-delete-client').onclick = () => {
        if (confirm(`Deseja realmente excluir o cliente "${client.name}"?`)) {
          let allClients = window.Store.getClients();
          allClients = allClients.filter(c => c.id !== client.id);
          window.Store.saveClients(allClients);
          window.showToast('Cliente removido com sucesso!', 'success');
          this.render();
        }
      };

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  checkBirthdays(clients) {
    const currentMonth = new Date().getMonth() + 1;
    const birthdayClients = clients.filter(c => {
      if (!c.birthDate) return false;
      const parts = c.birthDate.split('-');
      if (parts.length === 3) {
        return parseInt(parts[1], 10) === currentMonth;
      }
      return false;
    });

    const alertSection = document.getElementById('birthdayAlertSection');
    const birthdayContainer = document.getElementById('birthdayListContainer');
    const badge = document.getElementById('birthdayBadge');

    if (badge) {
      badge.textContent = birthdayClients.length;
      if (birthdayClients.length > 0) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }

    if (!alertSection || !birthdayContainer) return;

    if (birthdayClients.length === 0) {
      alertSection.classList.add('hidden');
      return;
    }

    alertSection.classList.remove('hidden');
    birthdayContainer.innerHTML = '';

    birthdayClients.forEach(c => {
      const div = document.createElement('div');
      div.className = 'birthday-item';
      div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid rgba(0,0,0,0.05)';
      div.innerHTML = `
        <span>🎂 <strong>${c.name}</strong> - Aniversário no dia ${c.birthDate.split('-')[2]}</span>
        <button class="btn btn-whatsapp btn-xs">
          <i data-lucide="gift"></i> Parabenizar no WhatsApp
        </button>
      `;

      div.querySelector('button').onclick = () => {
        window.App.openWhatsAppModal(c.phone, 'birthday', { clientName: c.name });
      };

      birthdayContainer.appendChild(div);
    });
  }

  formatDateBR(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }
}

window.Clients = new ClientsView();
