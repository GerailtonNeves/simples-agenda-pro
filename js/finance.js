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
    document.getElementById('btnAddTransactionModal')?.addEventListener('click', () => {
      window.App.openTransactionModal();
    });
  }

  render() {
    const transactions = window.Store.getTransactions();
    const periodFilter = document.getElementById('financePeriodFilter')?.value || 'month';
    const typeFilter = document.getElementById('financeTypeFilter')?.value || 'all';
    const statusFilter = document.getElementById('financeStatusFilter')?.value || 'all';

    const todayStr = new Date().toISOString().split('T')[0];

    const filtered = transactions.filter(tr => {
      if (periodFilter === 'today' && tr.date !== todayStr) return false;
      if (typeFilter !== 'all' && tr.type !== typeFilter) return false;
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

    const incomeElem = document.getElementById('financeTotalIncome');
    const expenseElem = document.getElementById('financeTotalExpense');
    const pendingElem = document.getElementById('financePendingTotal');
    const netElem = document.getElementById('financeNetProfit');
    const sidebarPendingBadge = document.getElementById('pendingTransBadge');

    if (incomeElem) incomeElem.textContent = `R$ ${totalIncome.toFixed(2).replace('.', ',')}`;
    if (expenseElem) expenseElem.textContent = `R$ ${totalExpense.toFixed(2).replace('.', ',')}`;
    if (pendingElem) pendingElem.textContent = `R$ ${totalPending.toFixed(2).replace('.', ',')}`;
    if (netElem) {
      netElem.textContent = `R$ ${netProfit.toFixed(2).replace('.', ',')}`;
      netElem.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    if (sidebarPendingBadge) {
      sidebarPendingBadge.textContent = pendingCount;
      if (pendingCount > 0) sidebarPendingBadge.classList.remove('hidden');
      else sidebarPendingBadge.classList.add('hidden');
    }

    const tbody = document.getElementById('financeTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted" style="padding: 2rem;">
            Nenhuma transação encontrada no período.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(tr => {
      const row = document.createElement('tr');
      const isIncome = tr.type === 'income';
      const status = tr.status || 'paid';

      let statusBadgeHtml = '';
      if (status === 'paid') {
        statusBadgeHtml = `<span class="badge badge-success">🟩 Pago / Recebido</span>`;
      } else {
        statusBadgeHtml = `<span class="badge badge-warning">🟧 Pendente (${isIncome ? 'A Receber' : 'A Pagar'})</span>`;
      }

      row.innerHTML = `
        <td>${this.formatDateBR(tr.date)}</td>
        <td><strong>${tr.description}</strong></td>
        <td><span class="badge ${isIncome ? 'badge-primary' : 'badge-secondary'}">${isIncome ? 'Receita' : 'Despesa'}</span></td>
        <td>${tr.paymentMethod || 'Pix'}</td>
        <td>${statusBadgeHtml}</td>
        <td style="font-weight:800; color:${isIncome ? 'var(--success)' : 'var(--danger)'}">
          ${isIncome ? '+' : '-'} R$ ${parseFloat(tr.amount).toFixed(2).replace('.', ',')}
        </td>
        <td>
          <div style="display:flex; gap:0.4rem; align-items:center">
            ${status === 'pending' ? `
              <button class="btn btn-whatsapp btn-xs btn-baixa-trans" title="Dar Baixa (Marcar como Pago/Recebido)">
                <i data-lucide="check-circle"></i> Dar Baixa
              </button>
            ` : ''}
            <button class="icon-btn btn-delete-trans" style="color:var(--danger)" title="Excluir Transação">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;

      const baixaBtn = row.querySelector('.btn-baixa-trans');
      if (baixaBtn) {
        baixaBtn.onclick = () => {
          tr.status = 'paid';
          this.updateSingleTransaction(tr);
          window.showToast(`Baixa realizada! Lançamento marcado como Pago/Recebido.`, 'success');
          this.render();
        };
      }

      row.querySelector('.btn-delete-trans').onclick = () => {
        if (confirm(`Excluir permanentemente o lançamento "${tr.description}"?`)) {
          let allTrans = window.Store.getTransactions();
          allTrans = allTrans.filter(t => t.id !== tr.id);
          window.Store.saveTransactions(allTrans);
          window.showToast('Lançamento removido com sucesso!', 'success');
          this.render();
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
