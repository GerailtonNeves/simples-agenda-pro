/* ==========================================================================
   SIMPLES AGENDA PRO - CLIENTS CONTROLLER (NOME, TELEFONE, EMPRESA & CIDADE)
   ========================================================================== */

class ClientsController {
  constructor() {
    this.gridContainer = null;
    this.searchInput = null;
  }

  init() {
    this.gridContainer = document.getElementById('clientsGrid');
    this.searchInput = document.getElementById('clientSearchInput');

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('btnAddClientModal')?.addEventListener('click', () => {
      if (window.App) window.App.openClientModal();
    });

    document.getElementById('btnApptQuickNewClient')?.addEventListener('click', () => {
      if (window.App) window.App.openClientModal();
    });

    this.searchInput?.addEventListener('input', (e) => {
      this.render(e.target.value.toLowerCase().trim());
    });
  }

  render(filterQuery = '') {
    if (!this.gridContainer) return;

    let clients = window.Store.getClients();

    if (filterQuery) {
      clients = clients.filter(c =>
        (c.name && c.name.toLowerCase().includes(filterQuery)) ||
        (c.phone && c.phone.toLowerCase().includes(filterQuery)) ||
        (c.company && c.company.toLowerCase().includes(filterQuery)) ||
        (c.city && c.city.toLowerCase().includes(filterQuery))
      );
    }

    if (clients.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 2.5rem; text-align: center;">
          <i data-lucide="users" style="width:48px; height:48px; color:var(--text-muted)"></i>
          <h3 style="margin-top:0.75rem; font-weight:800">Nenhum cliente encontrado</h3>
          <p class="text-muted">Cadastre seus clientes com Nome, Telefone, Empresa e Cidade.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let html = '';
    clients.forEach(client => {
      html += `
        <div class="card client-card" style="padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <h4 style="font-size:1.1rem; font-weight:800">${client.name}</h4>
              <button class="icon-btn btn-xs" onclick="window.App.openClientModal(window.Store.getClients().find(x=>x.id==='${client.id}'))" title="Editar Cliente">
                <i data-lucide="edit-3"></i>
              </button>
            </div>

            <div style="margin-top:0.75rem; display:flex; flex-direction:column; gap:0.35rem; font-size:0.875rem">
              <div style="color:var(--primary); font-weight:700">
                <i data-lucide="phone" style="width:14px; height:14px; vertical-align:middle"></i> ${client.phone}
              </div>
              ${client.company ? `
                <div class="text-muted">
                  <i data-lucide="building-2" style="width:14px; height:14px; vertical-align:middle"></i> <strong>Empresa:</strong> ${client.company}
                </div>
              ` : ''}
              ${client.city ? `
                <div class="text-muted">
                  <i data-lucide="map-pin" style="width:14px; height:14px; vertical-align:middle"></i> <strong>Cidade:</strong> ${client.city}
                </div>
              ` : ''}
              ${client.anamnesis ? `
                <div class="text-muted" style="margin-top:0.35rem; font-size:0.8rem; background:var(--bg-surface-secondary); padding:0.5rem; border-radius:var(--radius-sm)">
                  <strong>Obs:</strong> ${client.anamnesis}
                </div>
              ` : ''}
            </div>
          </div>

          <div style="margin-top:1.25rem; display:flex; gap:0.5rem">
            <button class="btn btn-whatsapp btn-xs w-full" onclick="window.App.openWhatsAppModal('${client.phone}', 'reminder', { cliente: '${client.name}' })">
              <i data-lucide="message-circle"></i> Mensagem WhatsApp
            </button>
            <button class="icon-btn text-danger btn-xs" onclick="window.Clients.deleteClient('${client.id}')" title="Excluir Cliente">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;
    });

    this.gridContainer.innerHTML = html;
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
