/* ==========================================================================
   SIMPLES AGENDA PRO - SERVICES & PRODUCT INVENTORY MANAGEMENT
   ========================================================================== */

class ServicesView {
  constructor() {}

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.subtab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const target = btn.dataset.subtab;
        document.getElementById(`subtab-${target}`)?.classList.add('active');
      });
    });

    document.getElementById('btnAddServiceModal')?.addEventListener('click', () => {
      window.App.openServiceModal();
    });

    document.getElementById('btnAddProductModal')?.addEventListener('click', () => {
      window.App.openProductModal();
    });

    document.getElementById('productSearchInput')?.addEventListener('input', (e) => {
      this.renderProducts(e.target.value);
    });
  }

  render() {
    this.renderServices();
    this.renderProducts();
  }

  renderServices() {
    const services = window.Store.getServices();
    const container = document.getElementById('servicesGrid');
    if (!container) return;

    container.innerHTML = '';

    if (services.length === 0) {
      container.innerHTML = `
        <div class="card text-center full-width" style="padding: 3rem; grid-column: 1 / -1;">
          <i data-lucide="scissors" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3>Nenhum serviço cadastrado</h3>
          <p class="text-muted" style="margin-top:0.5rem">Cadastre os serviços oferecidos no seu estabelecimento.</p>
        </div>
      `;
      return;
    }

    services.forEach(srv => {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.style.borderLeft = `5px solid ${srv.color || '#0EA5E9'}`;
      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start">
            <h4 style="font-size:1.1rem; font-weight:800">${srv.name}</h4>
            <span style="font-size:1.2rem; font-weight:800; color:var(--primary)">
              R$ ${parseFloat(srv.price).toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div class="text-muted" style="margin-top:0.5rem; display:flex; align-items:center; gap:0.4rem">
            <i data-lucide="clock" style="width:14px; height:14px"></i> ${srv.duration} minutos de duração
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.4rem; border-top:1px solid var(--border-color); padding-top:0.75rem; margin-top:0.5rem">
          <button class="icon-btn btn-edit-srv" title="Editar Serviço">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="icon-btn btn-delete-srv" style="color:var(--danger)" title="Excluir">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      card.querySelector('.btn-edit-srv').onclick = () => {
        window.App.openServiceModal(srv);
      };

      card.querySelector('.btn-delete-srv').onclick = () => {
        if (confirm(`Deseja realmente excluir o serviço "${srv.name}"?`)) {
          let allSrv = window.Store.getServices();
          allSrv = allSrv.filter(s => s.id !== srv.id);
          window.Store.saveServices(allSrv);
          window.showToast('Serviço removido com sucesso!', 'success');
          this.renderServices();
        }
      };

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  renderProducts(filterQuery = '') {
    const products = window.Store.getProducts();
    const container = document.getElementById('productsGrid');
    if (!container) return;

    let totalProducts = products.length;
    let lowStockCount = 0;
    let totalStockValue = 0;

    products.forEach(p => {
      const stock = parseInt(p.stock, 10) || 0;
      const minStock = parseInt(p.minStock, 10) || 5;
      const price = parseFloat(p.price) || 0;

      if (stock <= minStock) lowStockCount++;
      totalStockValue += (stock * price);
    });

    // Atualizar Métricas do Estoque
    document.getElementById('metricTotalProducts').textContent = `${totalProducts} Itens`;
    document.getElementById('metricLowStockCount').textContent = `${lowStockCount} Alertas`;
    document.getElementById('metricTotalStockValue').textContent = `R$ ${totalStockValue.toFixed(2).replace('.', ',')}`;

    const badgeSidebar = document.getElementById('lowStockBadge');
    if (badgeSidebar) {
      badgeSidebar.textContent = lowStockCount;
      if (lowStockCount > 0) badgeSidebar.classList.remove('hidden');
      else badgeSidebar.classList.add('hidden');
    }

    const filtered = products.filter(p => {
      const query = filterQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card text-center full-width" style="padding: 3rem; grid-column: 1 / -1;">
          <i data-lucide="package" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3>Nenhum produto cadastrado no estoque</h3>
          <p class="text-muted" style="margin-top:0.5rem">Cadastre produtos para controlar seu estoque e vendas.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(prod => {
      const stock = parseInt(prod.stock, 10) || 0;
      const minStock = parseInt(prod.minStock, 10) || 5;

      let stockBadgeHtml = '';
      if (stock <= 0) {
        stockBadgeHtml = `<span class="badge badge-danger">🔴 ESGOTADO</span>`;
      } else if (stock <= minStock) {
        stockBadgeHtml = `<span class="badge badge-warning">⚠️ ESTOQUE BAIXO (${stock})</span>`;
      } else {
        stockBadgeHtml = `<span class="badge badge-success">🟢 Em Estoque (${stock})</span>`;
      }

      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start">
            <div>
              <span class="badge badge-secondary" style="font-size:0.7rem">${prod.category || 'Geral'}</span>
              <h4 style="font-size:1.05rem; font-weight:800; margin-top:4px">${prod.name}</h4>
              <div class="text-muted" style="font-size:0.75rem">SKU: ${prod.sku || 'Sem Código'}</div>
            </div>
            ${stockBadgeHtml}
          </div>

          <div style="display:flex; justify-content:space-between; margin-top:1rem; background:var(--bg-surface-secondary); padding:0.6rem 0.85rem; border-radius:var(--radius-md)">
            <div>
              <div style="font-size:0.75rem" class="text-muted">Preço Venda</div>
              <strong style="color:var(--primary); font-size:1.1rem">R$ ${parseFloat(prod.price).toFixed(2).replace('.', ',')}</strong>
            </div>
            <div>
              <div style="font-size:0.75rem" class="text-muted">Custo</div>
              <span style="font-size:0.9rem">R$ ${parseFloat(prod.costPrice || 0).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:0.75rem; margin-top:0.5rem">
          <div style="display:flex; gap:0.35rem">
            <button class="btn btn-outline btn-xs btn-add-stock" title="Adicionar Entrada no Estoque">+ Entrada</button>
            <button class="btn btn-orange btn-xs btn-sell-product" title="Dar Baixa por Venda">- Venda</button>
          </div>
          <div style="display:flex; gap:0.35rem">
            <button class="icon-btn btn-edit-prod"><i data-lucide="edit-3"></i></button>
            <button class="icon-btn btn-delete-prod" style="color:var(--danger)"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      `;

      // Evento: Adicionar Estoque (+ Entrada)
      card.querySelector('.btn-add-stock').onclick = () => {
        const qtdStr = prompt(`Quantidade de entrada para "${prod.name}":`, '5');
        const qtd = parseInt(qtdStr, 10);
        if (!isNaN(qtd) && qtd > 0) {
          prod.stock = (parseInt(prod.stock, 10) || 0) + qtd;
          this.updateSingleProduct(prod);
          window.showToast(`Estoque atualizado! +${qtd} unidades de "${prod.name}".`, 'success');
          this.renderProducts();
        }
      };

      // Evento: Dar Baixa por Venda (- Venda)
      card.querySelector('.btn-sell-product').onclick = () => {
        if (prod.stock <= 0) {
          window.showToast(`Produto "${prod.name}" está ESGOTADO no estoque!`, 'warning');
          return;
        }
        const currentStock = parseInt(prod.stock, 10);
        prod.stock = currentStock - 1;
        this.updateSingleProduct(prod);

        // Lançar Venda Automaticamente no Caixa Financeiro!
        let trans = window.Store.getTransactions();
        trans.push({
          id: window.Store.generateId('tr'),
          type: 'income',
          description: `Venda de Produto: ${prod.name}`,
          amount: prod.price,
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Pix',
          status: 'paid'
        });
        window.Store.saveTransactions(trans);

        window.showToast(`Venda registrada! 1 unidade de "${prod.name}" baixada do estoque.`, 'success');
        this.renderProducts();
      };

      card.querySelector('.btn-edit-prod').onclick = () => {
        window.App.openProductModal(prod);
      };

      card.querySelector('.btn-delete-prod').onclick = () => {
        if (confirm(`Excluir permanentemente o produto "${prod.name}" do estoque?`)) {
          let allProds = window.Store.getProducts();
          allProds = allProds.filter(p => p.id !== prod.id);
          window.Store.saveProducts(allProds);
          window.showToast('Produto excluído com sucesso!', 'success');
          this.renderProducts();
        }
      };

      container.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  updateSingleProduct(updatedProd) {
    let products = window.Store.getProducts();
    const idx = products.findIndex(p => p.id === updatedProd.id);
    if (idx !== -1) {
      products[idx] = updatedProd;
      window.Store.saveProducts(products);
    }
  }
}

window.Services = new ServicesView();
