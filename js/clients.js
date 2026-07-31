/* ==========================================================================
   SIMPLES AGENDA PRO - CLIENTS CONTROLLER WITH COMPANY & CITY FIELDS
   ========================================================================== */

class ClientsController {
  constructor() {
    this.container = null;
    this.searchInput = null;
  }

  init() {
    this.container = document.getElementById('clientsGrid');
    this.searchInput = document.getElementById('clientSearchInput');

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('btnAddClientModal')?.addEventListener('click', () => {
      if (window.App) window.App.openClientModal();
    });

    this.searchInput?.addEventListener('input', (e) => {
      this.render(e.target.value.toLowerCase().trim());
    });
  }

  render(filterQuery = '') {
    if (!this.container) return;

    let clients = window.Store.getClients();

    if (filterQuery) {
      clients = clients.filter(c => 
        (c.name && c.name.toLowerCase().includes(filterQuery)) ||
        (c.phone && c.phone.includes(filterQuery)) ||
        (c.company && c.company.toLowerCase().includes(filterQuery)) ||
        (c.city && c.city.toLowerCase().includes(filterQuery)) ||
        (c.anamnesis && c.anamnesis.toLowerCase().includes(filterQuery))
      );
    }

    if (clients.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i data-lucide="users"></i>
          <h3>Nenhum cliente encontrado</h3>
          <p>Cadastre seus clientes com Nome, Telefone, Empresa e Cidade.</p>
          <button class="btn btn-orange btn-sm margin-top" onclick="window.App.openClientModal()">
            <i data-lucide="user-plus"></i> + Cadastrar Primeiro Cliente
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let html = '';
    clients.forEach(c => {
      const initial = c.name ? c.name.charAt(0).toUpperCase() : 'C';

      html += `
        <div class="client-card">
          <div class="client-card-header">
            <div class="client-avatar">${initial}</div>
            <div class="client-info-primary">
              <h4 class="client-name">${c.name}</h4>
              <span class="client-phone"><i data-lucide="phone" style="width:13px; height:13px; vertical-align:middle; display:inline-block"></i> ${c.phone}</span>
            </div>
            <div class="client-actions-dropdown">
              <button class="icon-btn" onclick="window.App.openClientModal(window.Store.getClients().find(x=>x.id==='${c.id}'))" title="Editar Cliente">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="icon-btn text-danger" onclick="window.Clients.deleteClient('${c.id}')" title="Excluir Cliente">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>

          <div class="client-details-body" style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.75rem; font-size:0.875rem">
            ${c.company ? `<div><i data-lucide="building-2" style="width:14px; height:14px; color:var(--primary); vertical-align:middle"></i> <strong>Empresa:</strong> ${c.company}</div>` : ''}
            ${c.city ? `<div><i data-lucide="map-pin" style="width:14px; height:14px; color:var(--accent-orange); vertical-align:middle"></i> <strong>Cidade:</strong> ${c.city}</div>` : ''}
            ${c.anamnesis ? `
              <div class="client-anamnesis-box" style="margin-top:0.4rem; background:var(--bg-surface-secondary); padding:0.5rem 0.75rem; border-radius:var(--radius-sm); font-size:0.8rem">
                <strong>Obs / Anamnese:</strong> ${c.anamnesis}
              </div>
            ` : ''}
          </div>

          <div class="client-card-footer" style="margin-top:0.85rem; pt:0.5rem; border-top:1px dashed var(--border-color); display:flex; justify-content:space-between; align-items:center">
            <button class="btn btn-whatsapp btn-xs" onclick="window.WhatsApp.openDirectChat('${c.phone}')">
              <i data-lucide="message-circle"></i> Enviar Mensagem
            </button>
            <button class="btn btn-outline btn-xs" onclick="window.App.openAppointmentModal(null, null, {clientId: '${c.id}'})">
              <i data-lucide="calendar-plus"></i> Agendar
            </button>
          </div>
        </div>
      `;
    });

    this.container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  deleteClient(id) {
    if (confirm('Deseja realmente excluir este cliente do sistema?')) {
      let clients = window.Store.getClients();
      clients = clients.filter(c => c.id !== id);
      window.Store.saveClients(clients);

      window.showToast('Cliente excluído com sucesso!', 'success');
      this.render();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.Clients = new ClientsController();
});
