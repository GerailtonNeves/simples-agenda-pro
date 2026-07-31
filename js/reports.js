/* ==========================================================================
   SIMPLES AGENDA PRO - REPORTS & CHARTS ANALYTICS
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

    // Dados de exemplo de faturamento mensal últimos 6 meses
    const months = ['Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
    const values = [2400, 3100, 2800, 3900, 4200, 4850];
    const maxValue = Math.max(...values);

    let html = `<div style="display:flex; align-items:flex-end; gap:1.2rem; height:180px; padding-top:20px;">`;

    months.forEach((m, idx) => {
      const val = values[idx];
      const heightPct = Math.round((val / maxValue) * 100);

      html += `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
          <span style="font-size:0.75rem; font-weight:700; color:var(--primary); margin-bottom:4px">R$ ${val}</span>
          <div style="width:100%; max-width:36px; height:${heightPct}%; background:var(--primary); border-radius:var(--radius-sm) var(--radius-sm) 0 0; transition:height 0.5s ease"></div>
          <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted); margin-top:6px">${m}</span>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  renderTopServicesChart() {
    const container = document.getElementById('topServicesChartContainer');
    if (!container) return;

    const services = window.Store.getServices();
    const appts = window.Store.getAppointments();

    const counts = {};
    appts.forEach(a => {
      counts[a.serviceId] = (counts[a.serviceId] || 0) + 1;
    });

    let html = `<div style="display:flex; flex-direction:column; gap:0.75rem;">`;

    services.slice(0, 4).forEach(srv => {
      const count = counts[srv.id] || Math.floor(Math.random() * 8) + 2;
      const pct = Math.min(100, count * 10);

      html += `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600; margin-bottom:4px">
            <span>${srv.name}</span>
            <span>${count} agendamentos</span>
          </div>
          <div style="width:100%; height:10px; background:var(--bg-surface-secondary); border-radius:var(--radius-full); overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${srv.color || 'var(--primary)'}; border-radius:var(--radius-full)"></div>
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

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; text-align:center;">
        <div class="card" style="background:#EFF6FF;">
          <div style="font-size:1.5rem; font-weight:800; color:#2563EB">85%</div>
          <div style="font-size:0.75rem; font-weight:600; color:#1E40AF">Taxa de Presença</div>
        </div>
        <div class="card" style="background:#ECFDF5;">
          <div style="font-size:1.5rem; font-weight:800; color:#10B981">92%</div>
          <div style="font-size:0.75rem; font-weight:600; color:#065F46">Satisfação Clientes</div>
        </div>
      </div>
    `;
  }
}

window.Reports = new ReportsView();
