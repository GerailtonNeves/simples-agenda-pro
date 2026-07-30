/* ==========================================================================
   SIMPLES AGENDA PRO - FINANCIAL & ACCOUNTS PAYABLE / RECEIVABLE
   ========================================================================== */

class FinanceView {
  constructor() {}

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('financePeriodFilter')?.addEventListener('change', () => this.render());
    document.getElementById('financeTypeFilter')?.addEventListener('change', () => this.render());
    document.getElementById('financeStatusFilter')?.addEventListener('change', () => this.render());
    document.getElementById('financeSearchInput')?.addEventListener('input', () => this.render());

    document.getElementById('btnAddTransactionModal')?.addEventListener('click', () => {
      window.App.openTransactionModal();
    });
  }

  render() {
    const transactions = window.Store.getTransactions() || [];
    const periodFilter = document.getElementById('financePeriodFilter')?.value || 'month';
    const typeFilter = document.getElementById('financeTypeFilter')?.value || 'all';
    const statusFilter = document.getElementById('financeStatusFilter')?.value || 'all';
    const searchQuery = document.getElementById('financeSearchInput')?.value.toLowerCase().trim() || '';

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Início da semana
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // Início do mês
    const startOfMonthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`;

    const filtered = transactions.filter(tr => {
      // Filtro de Busca
      if (searchQuery) {
        const descMatch = tr.description && tr.description.toLowerCase().includes(searchQuery);
        const methodMatch = tr.paymentMethod && tr.paymentMethod.toLowerCase().includes(searchQuery);
        if (!descMatch && !methodMatch) return false;
      }

      // Filtro de Data
      if (periodFilter === 'today' && tr.date !== todayStr) return false;
      if (periodFilter === 'week' && tr.date < startOfWeekStr) return false;
      if (periodFilter === 'month' && tr.date < startOfMonthStr) return false;

      // Filtro de Tipo
      if (typeFilter !== 'all' && tr.type !== typeFilter) return false;

      // Filtro de Status
      if (statusFilter !== 'all' && (tr.status || 'paid') !== statusFilter) return false;

      return true;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalPending = 0;
    let pendingCount = 0;

    transactions.forEach(tr => {
      const amount = parseFloat(tr.amount) || 0;
      const status = tr.status || 'paid';

      if (status === 'paid') {
        if (tr.type === 'income') totalIncome += amount;
        else if (tr.type === 'expense') totalExpense += amount;
      } else if (status === 'pending') {
        totalPending += amount;
        pendingCount++;
      }
    });

    const netProfit = totalIncome - totalExpense;

    // Atualizar UI dos Cards Financeiros
    const incomeElem = document.getElementById('financeTotalIncome');
    const expenseElem = document.getElementById('financeTotalExpense');
    const pendingElem = document.getElementById('financePendingTotal');
    const netElem = document.getElementById('financeNetProfit');
    const sidebarPendingBadge = document.getElementById('pendingTransBadge');

    if (incomeElem) incomeElem.textContent = `R$ ${totalIncome.toFixed(2).replace('.', ',')}`;
    if (expenseElem) expenseElem.textContent = `R$ ${totalExpense.toFixed(2).replace('.', ',')}`;
    if (pendingElem) pendingElem.textContent = `R$ ${totalPending.toFixed(2).replace('.', ',')} (${pendingCount} pendentes)`;
    if (netElem) {
      netElem.textContent = `R$ ${netProfit.toFixed(2).replace('.', ',')}`;
      netElem.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    if (sidebarPendingBadge) {
      sidebarPendingBadge.textContent = pendingCount;
      if (pendingCount > 0) sidebarPendingBadge.classList.remove('hidden');
      else sidebarPendingBadge.classList.add('hidden');
    }

    // Renderizar Tabela
    const tbody = document.getElementById('financeTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted" style="padding: 2.5rem 1rem;">
            <i data-lucide="receipt" style="width:40px; height:40px; color:var(--text-muted); margin-bottom:0.5rem"></i><br>
            Nenhum lançamento financeiro encontrado para os filtros selecionados.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Ordenar mais recentes primeiro
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    filtered.forEach(tr => {
      const row = document.createElement('tr');
      const isIncome = tr.type === 'income';
      const status = tr.status || 'paid';

      let statusBadgeHtml = '';
      if (status === 'paid') {
        statusBadgeHtml = `<span class="badge badge-success" style="font-size:0.75rem">🟩 Concluído (Pago)</span>`;
      } else {
        statusBadgeHtml = `<span class="badge badge-warning" style="background:#FFF7ED; color:#EA580C; border:1px solid #FDBA74; font-size:0.75rem">🟧 Pendente (${isIncome ? 'A Receber' : 'A Pagar'})</span>`;
      }

      let methodIcon = '💳';
      if (tr.paymentMethod === 'Pix') methodIcon = '⚡';
      else if (tr.paymentMethod === 'Dinheiro') methodIcon = '💵';
      else if (tr.paymentMethod === 'Boleto') methodIcon = '📄';

      row.innerHTML = `
        <td><strong style="color:var(--text-main)">${this.formatDateBR(tr.date)}</strong></td>
        <td>
          <div style="font-weight:800; font-size:0.95rem; color:var(--text-main)">${tr.description}</div>
        </td>
        <td>
          <span class="badge" style="background:${isIncome ? '#ECFDF5' : '#FEF2F2'}; color:${isIncome ? '#047857' : '#DC2626'}; border:1px solid ${isIncome ? '#A7F3D0' : '#FCA5A5'}; font-size:0.75rem">
            ${isIncome ? '⬆️ Receita' : '⬇️ Despesa'}
          </span>
        </td>
        <td style="font-size:0.875rem; font-weight:600">${methodIcon} ${tr.paymentMethod || 'Pix'}</td>
        <td>${statusBadgeHtml}</td>
        <td style="font-size:1.05rem; font-weight:800; color:${isIncome ? 'var(--success)' : 'var(--danger)'}">
          ${isIncome ? '+' : '-'} R$ ${parseFloat(tr.amount || 0).toFixed(2).replace('.', ',')}
        </td>
        <td>
          <div style="display:flex; gap:0.4rem; align-items:center">
            ${status === 'pending' ? `
              <button class="btn btn-whatsapp btn-xs btn-baixa-trans" style="background:#10B981 !important; color:#FFF !important" title="Dar Baixa (Marcar como Pago/Recebido)">
                <i data-lucide="check-circle"></i> ✅ Dar Baixa
              </button>
            ` : ''}
            <button class="icon-btn btn-delete-trans text-danger" title="Excluir Transação">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;

      // Evento: Dar Baixa na Conta Pendente
      const baixaBtn = row.querySelector('.btn-baixa-trans');
      if (baixaBtn) {
        baixaBtn.onclick = () => {
          tr.status = 'paid';
          this.updateSingleTransaction(tr);
          window.showToast(`Baixa realizada com sucesso! Lançamento marcado como Concluído/Pago.`, 'success');
          this.render();
          if (window.App) window.App.updateAlertCenterBadge();
        };
      }

      // Evento: Excluir Transação
      row.querySelector('.btn-delete-trans').onclick = () => {
        if (confirm(`Excluir permanentemente o lançamento "${tr.description}"?`)) {
          let allTrans = window.Store.getTransactions();
          allTrans = allTrans.filter(t => t.id !== tr.id);
          window.Store.saveTransactions(allTrans);
          window.showToast('Lançamento removido com sucesso!', 'success');
          this.render();
          if (window.App) window.App.updateAlertCenterBadge();
        }
      };

      tbody.appendChild(row);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  updateSingleTransaction(updatedTr) {
    let allTrans = window.Store.getTransactions();
    const idx = allTrans.findIndex(t => t.id === updatedTr.id);
    if (idx !== -1) {
      allTrans[idx] = updatedTr;
      window.Store.saveTransactions(allTrans);
    }
  }

  formatDateBR(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }
}

window.Finance = new FinanceView();
