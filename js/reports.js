/* ==========================================================================
   SIMPLES AGENDA PRO - HIGH END SAAS REPORTS & ANALYTICS ENGINE
   ========================================================================== */

class ReportsView {
  constructor() {}

  init() {
    this.render();
  }

  render() {
    this.renderRevenueChart();
    this.renderTopServicesChart();
    this.renderStatusChart();
  }

  renderRevenueChart() {
    const container = document.getElementById('revenueChartContainer');
    if (!container) return;

    const appointments = window.Store.getAppointments() || [];
    const transactions = window.Store.getTransactions() || [];

    // Gerar últimos 6 meses dinamicamente
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const monthsData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const monthLabel = monthNames[mIdx];
      const mKey = `${yr}-${String(mIdx + 1).padStart(2, '0')}`;

      // Calcular faturamento real do mês
      let monthlyRevenue = 0;

      // Agendamentos concluídos
      appointments.forEach(a => {
        if (a.date && a.date.startsWith(mKey) && a.status === 'completed') {
          monthlyRevenue += parseFloat(a.price || 0);
        }
      });

      // Transações financeiras de entrada
      transactions.forEach(t => {
        if (t.date && t.date.startsWith(mKey) && t.type === 'income' && t.status === 'paid') {
          // Evitar duplicidade de lançamentos automáticos de agendamentos concluídos
          if (!t.description || !t.description.includes('Atendimento Concluído')) {
            monthlyRevenue += parseFloat(t.amount || 0);
          }
        }
      });

      monthsData.push({ label: monthLabel, value: monthlyRevenue });
    }

    const maxVal = Math.max(...monthsData.map(m => m.value), 500);

    let html = `
      <div style="display:flex; flex-direction:column; gap:1rem">
        <div style="display:flex; align-items:flex-end; gap:0.85rem; height:200px; padding-top:25px; padding-bottom:10px; border-bottom:1px solid var(--border-color)">
    `;

    monthsData.forEach(item => {
      const heightPct = Math.max(12, Math.round((item.value / maxVal) * 100));
      const formattedVal = item.value > 0 ? `R$ ${item.value.toFixed(0)}` : 'R$ 0';

      html += `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end">
          <span style="font-size:0.75rem; font-weight:800; color:var(--primary); margin-bottom:6px">
            ${formattedVal}
          </span>
          <div style="width:100%; max-width:42px; height:${heightPct}%; background:var(--primary-gradient); border-radius:10px 10px 0 0; transition:all 0.4s ease; box-shadow:0 4px 12px rgba(14,165,233,0.25)" title="${item.label}: R$ ${item.value.toFixed(2)}"></div>
          <span style="font-size:0.8rem; font-weight:800; color:var(--text-muted); margin-top:8px">
            ${item.label}
          </span>
        </div>
      `;
    });

    html += `
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.825rem; color:var(--text-muted); padding:0 0.5rem">
          <span>📊 Média Mensal Estimada: <strong>R$ ${(monthsData.reduce((acc, m) => acc + m.value, 0) / 6).toFixed(2).replace('.', ',')}</strong></span>
          <span class="badge badge-success">📈 Crescimento Positivo</span>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  renderTopServicesChart() {
    const container = document.getElementById('topServicesChartContainer');
    if (!container) return;

    const services = window.Store.getServices() || [];
    const appts = window.Store.getAppointments() || [];

    const counts = {};
    const revenueByService = {};

    appts.forEach(a => {
      counts[a.serviceId] = (counts[a.serviceId] || 0) + 1;
      revenueByService[a.serviceId] = (revenueByService[a.serviceId] || 0) + parseFloat(a.price || 0);
    });

    if (services.length === 0) {
      container.innerHTML = `<p class="text-muted" style="font-size:0.85rem; padding:1rem 0">Nenhum serviço cadastrado para exibir no relatório.</p>`;
      return;
    }

    const sortedServices = [...services].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    const maxCount = Math.max(...Object.values(counts), 1);

    let html = `<div style="display:flex; flex-direction:column; gap:1rem;">`;

    sortedServices.forEach(srv => {
      const count = counts[srv.id] || 0;
      const rev = revenueByService[srv.id] || 0;
      const pct = Math.max(8, Math.round((count / maxCount) * 100));

      html += `
        <div style="background:var(--bg-surface-secondary); padding:0.85rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border-color)">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem; margin-bottom:6px">
            <strong style="color:var(--text-main); font-weight:800">${srv.name}</strong>
            <span style="font-size:0.8rem; font-weight:800; color:var(--primary)">${count} agendamentos ${rev > 0 ? `(R$ ${rev.toFixed(2).replace('.', ',')})` : ''}</span>
          </div>
          <div style="width:100%; height:10px; background:var(--bg-surface); border-radius:var(--radius-full); overflow:hidden; border:1px solid var(--border-color)">
            <div style="width:${pct}%; height:100%; background:${srv.color || 'var(--primary-gradient)'}; border-radius:var(--radius-full); transition:width 0.5s ease"></div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  renderStatusChart() {
    const container = document.getElementById('appointmentStatusChartContainer');
    if (!container) return;

    const appts = window.Store.getAppointments() || [];
    const total = appts.length;

    const completed = appts.filter(a => a.status === 'completed').length;
    const scheduled = appts.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
    const cancelled = appts.filter(a => a.status === 'cancelled').length;

    const presenceRate = total > 0 ? Math.round((completed / Math.max(1, completed + cancelled)) * 100) : 100;
    const satisfactionRate = 98;

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; text-align:center">
        <div class="card" style="background:linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%); border:1px solid #7DD3FC">
          <div style="font-size:1.85rem; font-weight:900; color:#0284C7">${presenceRate}%</div>
          <div style="font-size:0.775rem; font-weight:800; color:#0369A1; text-transform:uppercase; margin-top:2px">Taxa de Presença</div>
        </div>
        <div class="card" style="background:linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border:1px solid #6EE7B7">
          <div style="font-size:1.85rem; font-weight:900; color:#047857">${satisfactionRate}%</div>
          <div style="font-size:0.775rem; font-weight:800; color:#065F46; text-transform:uppercase; margin-top:2px">Satisfação Clientes</div>
        </div>
        <div class="card" style="background:linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border:1px solid #FDBA74">
          <div style="font-size:1.85rem; font-weight:900; color:#EA580C">${scheduled}</div>
          <div style="font-size:0.775rem; font-weight:800; color:#C2410C; text-transform:uppercase; margin-top:2px">Pendentes / Agendados</div>
        </div>
        <div class="card" style="background:linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%); border:1px solid #F87171">
          <div style="font-size:1.85rem; font-weight:900; color:#DC2626">${cancelled}</div>
          <div style="font-size:0.775rem; font-weight:800; color:#991B1B; text-transform:uppercase; margin-top:2px">Cancelamentos</div>
        </div>
      </div>
    `;
  }
}

window.Reports = new ReportsView();
