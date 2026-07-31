/* ==========================================================================
   SIMPLES AGENDA PRO - EMPLOYEES & AUTOMATIC COMMISSION CALCULATOR ENGINE
   ========================================================================== */

class EmployeesView {
  constructor() {}

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.getElementById('btnAddEmployeeModal')?.addEventListener('click', () => {
      this.openEmployeeModal();
    });

    document.getElementById('employeeSearchInput')?.addEventListener('input', (e) => {
      this.render(e.target.value);
    });

    document.getElementById('formEmployee')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEmployeeForm();
    });
  }

  render(filterQuery = '') {
    const grid = document.getElementById('employeesGrid');
    if (!grid) return;

    let employees = window.Store.getEmployees() || [];
    const appointments = window.Store.getAppointments() || [];

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      employees = employees.filter(emp =>
        emp.name.toLowerCase().includes(q) ||
        (emp.role && emp.role.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q))
      );
    }

    // Calcular métricas gerais de comissão
    let grandTotalCommission = 0;
    let totalEmployeesCount = employees.length;

    let html = '';

    if (employees.length === 0) {
      html = `
        <div class="card full-width text-center" style="grid-column: 1 / -1; padding: 2.5rem 1rem">
          <i data-lucide="user-x" style="width:48px; height:48px; color:var(--text-muted); margin-bottom:1rem"></i>
          <h3>Nenhum funcionário encontrado</h3>
          <p class="text-muted">Cadastre seus funcionários para controlar horários e comissões automáticas.</p>
          <button class="btn btn-orange margin-top" onclick="window.Employees.openEmployeeModal()">
            <i data-lucide="user-plus"></i> + Cadastrar Primeiro Funcionário
          </button>
        </div>
      `;
    } else {
      employees.forEach(emp => {
        // Calcular agendamentos deste funcionário
        const empAppts = appointments.filter(a => a.employeeId === emp.id);
        const completedAppts = empAppts.filter(a => a.status === 'completed');

        // Soma do Faturamento Total Gerado pelo Funcionário
        const totalRevenueGenerated = completedAppts.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);

        // Comissão (%)
        const commissionPercent = parseFloat(emp.commissionRate) || 0;
        const totalCommissionEarned = (totalRevenueGenerated * commissionPercent) / 100;
        grandTotalCommission += totalCommissionEarned;

        const initials = emp.name ? emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'FC';

        html += `
          <div class="client-card">
            <div class="client-header">
              <div class="client-avatar" style="background:var(--primary-gradient)">
                ${initials}
              </div>
              <div class="client-details">
                <h4>${emp.name}</h4>
                <div class="client-contact">
                  <i data-lucide="briefcase" style="width:14px; height:14px"></i>
                  <span style="font-weight:700; color:var(--primary-hover)">${emp.role || 'Profissional'}</span>
                </div>
                ${emp.phone ? `
                  <div class="client-contact" style="margin-top:2px">
                    <i data-lucide="phone" style="width:14px; height:14px"></i> ${emp.phone}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Dados de Horário & Dias -->
            <div style="background:var(--bg-surface-secondary); padding:0.75rem; border-radius:var(--radius-md); font-size:0.825rem; display:flex; flex-direction:column; gap:0.35rem">
              <div><strong>🗓️ Dias de Trabalho:</strong> ${emp.workDays || 'Segunda a Sábado'}</div>
              <div><strong>⏰ Horário:</strong> ${emp.workHours || '08:00 às 18:00'}</div>
              <div><strong>📊 Atendimentos Concluídos:</strong> ${completedAppts.length} serviços</div>
            </div>

            <!-- Painel de Comissão -->
            <div style="background:var(--accent-orange-light); border:1px solid #FDBA74; padding:0.85rem; border-radius:var(--radius-md)">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#C2410C">
                <span>Taxa de Comissão:</span>
                <strong style="font-size:1rem; color:var(--accent-orange)">${commissionPercent}%</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.35rem; font-size:0.9rem">
                <strong>Comissão a Pagar:</strong>
                <strong style="font-size:1.15rem; color:var(--success)">R$ ${totalCommissionEarned.toFixed(2).replace('.', ',')}</strong>
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted); text-align:right; margin-top:2px">
                (Faturou R$ ${totalRevenueGenerated.toFixed(2).replace('.', ',')} no total)
              </div>
            </div>

            <div style="display:flex; gap:0.5rem; margin-top:0.5rem">
              <button class="btn btn-outline btn-xs style="flex:1" onclick="window.Employees.openEmployeeModal(window.Store.getEmployees().find(e=>e.id==='${emp.id}'))">
                <i data-lucide="edit-3"></i> Editar
              </button>
              <button class="btn btn-whatsapp btn-xs" onclick="window.WhatsApp.getWhatsAppUrl('${emp.phone || ''}', 'Olá ${emp.name}! Segue o resumo das suas comissões acumuladas: R$ ${totalCommissionEarned.toFixed(2).replace('.', ',')}')">
                <i data-lucide="message-circle"></i> Extrato WA
              </button>
              <button class="btn btn-danger-outline btn-xs" onclick="window.Employees.deleteEmployee('${emp.id}')" title="Excluir">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
      });
    }

    grid.innerHTML = html;

    // Atualizar os cards de topo
    const metricCount = document.getElementById('metricTotalEmployees');
    const metricComm = document.getElementById('metricTotalCommissions');

    if (metricCount) metricCount.textContent = `${totalEmployeesCount} Profissionais`;
    if (metricComm) metricComm.textContent = `R$ ${grandTotalCommission.toFixed(2).replace('.', ',')}`;

    if (window.lucide) window.lucide.createIcons();
  }

  openEmployeeModal(empData = null) {
    const modal = document.getElementById('modalEmployee');
    if (!modal) return;

    document.getElementById('modalEmployeeTitle').textContent = empData ? 'Editar Funcionário' : 'Novo Funcionário';
    document.getElementById('empId').value = empData ? empData.id : '';
    document.getElementById('empName').value = empData ? empData.name : '';
    document.getElementById('empRole').value = empData ? empData.role : '';
    document.getElementById('empPhone').value = empData ? empData.phone : '';
    document.getElementById('empWorkDays').value = empData ? empData.workDays : 'Segunda a Sábado';
    document.getElementById('empWorkHours').value = empData ? empData.workHours : '08:00 às 18:00';
    document.getElementById('empCommissionRate').value = empData ? empData.commissionRate : 50;

    modal.classList.add('active');
  }

  saveEmployeeForm() {
    const id = document.getElementById('empId').value;
    const name = document.getElementById('empName').value;
    const role = document.getElementById('empRole').value;
    const phone = document.getElementById('empPhone').value;
    const workDays = document.getElementById('empWorkDays').value;
    const workHours = document.getElementById('empWorkHours').value;
    const commissionRate = parseFloat(document.getElementById('empCommissionRate').value) || 0;

    if (!name) {
      window.showToast('Por favor, digite o nome do funcionário.', 'warning');
      return;
    }

    let employees = window.Store.getEmployees() || [];

    const newEmp = {
      id: id || window.Store.generateId('emp'),
      name,
      role: role || 'Profissional',
      phone,
      workDays: workDays || 'Segunda a Sábado',
      workHours: workHours || '08:00 às 18:00',
      commissionRate
    };

    if (id) {
      const idx = employees.findIndex(e => e.id === id);
      if (idx !== -1) employees[idx] = newEmp;
    } else {
      employees.push(newEmp);
    }

    window.Store.saveEmployees(employees);
    if (window.CloudSync) window.CloudSync.pushToCloud();

    window.showToast(`Funcionário "${name}" salvo com sucesso!`, 'success');
    document.getElementById('modalEmployee')?.classList.remove('active');

    this.render();
  }

  deleteEmployee(id) {
    if (confirm('Deseja realmente remover este funcionário do cadastro?')) {
      let employees = window.Store.getEmployees() || [];
      employees = employees.filter(e => e.id !== id);
      window.Store.saveEmployees(employees);
      if (window.CloudSync) window.CloudSync.pushToCloud();

      window.showToast('Funcionário removido.', 'warning');
      this.render();
    }
  }
}

window.Employees = new EmployeesView();
