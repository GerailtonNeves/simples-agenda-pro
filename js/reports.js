/* ==========================================================================
   SIMPLES AGENDA PRO - INTERACTIVE SVG REPORTS & CHARTS ENGINE
   ========================================================================== */

class ReportsController {
  constructor() {
    this.revenueContainer = null;
    this.servicesContainer = null;
    this.statusContainer = null;
  }

  init() {
    this.revenueContainer = document.getElementById('revenueChartContainer');
    this.servicesContainer = document.getElementById('topServicesChartContainer');
    this.statusContainer = document.getElementById('appointmentStatusChartContainer');

    this.render();
  }

  render() {
    this.renderRevenueChart();
    this.renderTopServicesChart();
    this.renderStatusChart();
  }

  renderRevenueChart() {
    if (!this.revenueContainer) return;

    const months = ['Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
    const values = [1850, 2400, 3100, 2800, 3950, 4800];
    const maxVal = Math.max(...values, 5000);

    let barsHtml = '';
    const width = 360;
    const height = 180;
    const barWidth = 36;
    const gap = (width - (months.length * barWidth)) / (months.length + 1);

    values.forEach((val, idx) => {
      const barHeight = (val / maxVal) * 130;
      const x = gap + idx * (barWidth + gap);
      const y = height - barHeight - 25;

      barsHtml += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="url(#blueGrad)" />
        <text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text-main)">R$${val}</text>
        <text x="${x + barWidth/2}" y="${height - 5}" text-anchor="middle" font-size="12" fill="var(--text-muted)">${months[idx]}</text>
      `;
    });

    this.revenueContainer.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible">
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38BDF8" />
            <stop offset="100%" stop-color="#0284C7" />
          </linearGradient>
        </defs>
        ${barsHtml}
      </svg>
    `;
  }

  renderTopServicesChart() {
    if (!this.servicesContainer) return;

    const items = [
      { name: 'Corte Masculino / Barba', count: 42, color: '#0EA5E9' },
      { name: 'Atendimento VIP', count: 28, color: '#F97316' },
      { name: 'Avaliação Médica', count: 18, color: '#10B981' }
    ];

    const max = Math.max(...items.map(i => i.count), 50);

    let html = '<div style="display:flex; flex-direction:column; gap:0.85rem; padding:0.5rem 0">';
    items.forEach(item => {
      const pct = (item.count / max) * 100;
      html += `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700; margin-bottom:0.25rem">
            <span>${item.name}</span>
            <span>${item.count} atendimentos</span>
          </div>
          <div style="width:100%; height:10px; background:var(--bg-surface-secondary); border-radius:var(--radius-full); overflow:hidden">
            <div style="width:${pct}%; height:100%; background:${item.color}; border-radius:var(--radius-full)"></div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    this.servicesContainer.innerHTML = html;
  }

  renderStatusChart() {
    if (!this.statusContainer) return;

    const appts = window.Store.getAppointments();
    const scheduled = appts.filter(a => a.status === 'scheduled').length || 3;
    const confirmed = appts.filter(a => a.status === 'confirmed').length || 5;
    const completed = appts.filter(a => a.status === 'completed').length || 8;

    this.statusContainer.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem; text-align:center; padding:1rem 0">
        <div style="background:var(--primary-light); padding:1rem; border-radius:var(--radius-md)">
          <h4 style="font-size:1.4rem; font-weight:800; color:var(--primary)">${scheduled}</h4>
          <span class="text-muted" style="font-size:0.8rem; font-weight:700">Agendados</span>
        </div>
        <div style="background:var(--accent-orange-light); padding:1rem; border-radius:var(--radius-md)">
          <h4 style="font-size:1.4rem; font-weight:800; color:var(--accent-orange)">${confirmed}</h4>
          <span class="text-muted" style="font-size:0.8rem; font-weight:700">Confirmados</span>
        </div>
        <div style="background:var(--success-light); padding:1rem; border-radius:var(--radius-md)">
          <h4 style="font-size:1.4rem; font-weight:800; color:var(--success)">${completed}</h4>
          <span class="text-muted" style="font-size:0.8rem; font-weight:700">Concluídos</span>
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.Reports = new ReportsController();
});
