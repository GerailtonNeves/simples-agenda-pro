/* ==========================================================================
   SIMPLES AGENDA PRO - SERVICES & PRODUCTS INVENTORY MONITORING
   ========================================================================== */

class ServicesView {
  constructor() {}

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Subtabs de Serviços vs Produtos
    document.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.subtab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const subtabId = `subtab-${btn.dataset.subtab}`;
        document.getElementById(subtabId)?.classList.add('active');
      });
    });

    // Botão de Cadastrar Serviço
    document.getElementById('btnAddServiceModal')?.addEventListener('click', () => {
      window.App.openServiceModal();
    });

    // Botão de Cadastrar Produto no Estoque
    document.getElementById('btnAddProductModal')?.addEventListener('click', () => {
      window.App.openProductModal();
    });

    // Busca de Produtos
    const productSearch = document.getElementById('productSearchInput');
    productSearch?.addEventListener('input', (e) => {
      this.renderProducts(e.target.value.toLowerCase());
    });

    // Busca de Serviços
    const serviceSearch = document.getElementById('serviceSearchInput');
    serviceSearch?.addEventListener('input', (e) => {
      this.renderServices(e.target.value.toLowerCase());
    });
  }

  render() {
    this.renderServices();
    this.renderProducts();
  }

  renderServices(filterQuery = '') {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const services = window.Store.getServices();

    // Atualizar métricas de serviços
    this.updateServicesMetrics(services);

    const filtered = services.filter(s => {
      if (!filterQuery) return true;
      return s.name.toLowerCase().includes(filterQuery);
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="card text-center" style="grid-column: 1 / -1; padding: 2.5rem;">
          <i data-lucide="scissors" style="width:48px; height:48px; color:var(--text-muted); margin-bottom:0.75rem;"></i>
          <p class="text-muted">Nenhum serviço cadastrado.</p>
          <button class="btn btn-orange btn-sm margin-top" onclick="window.App.openServiceModal()">
            + Cadastrar Novo Serviço
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    filtered.forEach(srv => {
      const card = document.createElement('div');
      card.className = 'service-card';
      card.style.borderTop = `5px solid ${srv.color || '#0EA5E9'}`;

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem">
            <div>
              <h4 style="font-size:1.15rem; font-weight:900; color:var(--text-main); margin-bottom:6px">${srv.name}</h4>
              <span class="badge" style="background:#E0F2FE; color:#0284C7; border:1px solid #7DD3FC; font-size:0.775rem; font-weight:800">
                ⏱️ ${srv.duration} minutos de duração
              </span>
            </div>
            <div style="font-size:1.35rem; font-weight:900; color:var(--primary); text-align:right">
              R$ ${parseFloat(srv.price).toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.25rem; padding-top:0.75rem; border-top:1px solid var(--border-color)">
          <button class="btn btn-outline btn-xs btn-edit-srv" style="flex:1">
            <i data-lucide="edit"></i> Editar Serviço
          </button>
          <button class="icon-btn btn-delete-srv text-danger" title="Excluir Serviço">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      card.querySelector('.btn-edit-srv').onclick = () => window.App.openServiceModal(srv);
      card.querySelector('.btn-delete-srv').onclick = () => {
        if (confirm(`Remover permanentemente o serviço "${srv.name}"?`)) {
          window.Store.markAsDeleted(srv.id);
          let list = window.Store.getServices();
          list = list.filter(s => s.id !== srv.id);
          window.Store.saveServices(list);
          if (window.CloudSync) window.CloudSync.pushToCloud();

          window.showToast('Serviço removido com sucesso!', 'success');
          this.renderServices();
        }
      };

      grid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  updateServicesMetrics(services) {
    const totalCount = services.length;
    const totalPrice = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    const totalDuration = services.reduce((sum, s) => sum + (parseInt(s.duration, 10) || 0), 0);

    const avgPrice = totalCount > 0 ? (totalPrice / totalCount) : 0;
    const avgDuration = totalCount > 0 ? Math.round(totalDuration / totalCount) : 0;

    const countElem = document.getElementById('metricTotalServicesCount');
    const priceElem = document.getElementById('metricAvgServicePrice');
    const durationElem = document.getElementById('metricAvgServiceDuration');

    if (countElem) countElem.textContent = `${totalCount} Serviços`;
    if (priceElem) priceElem.textContent = `R$ ${avgPrice.toFixed(2).replace('.', ',')}`;
    if (durationElem) durationElem.textContent = `${avgDuration} min`;
  }

  // MONITORAMENTO COMPLETO DE ESTOQUE DE PRODUTOS
  renderProducts(filterQuery = '') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const products = window.Store.getProducts();

    this.updateStockMetrics(products);

    const filtered = products.filter(p => {
      if (!filterQuery) return true;
      return p.name.toLowerCase().includes(filterQuery) ||
             (p.category && p.category.toLowerCase().includes(filterQuery)) ||
             (p.sku && p.sku.toLowerCase().includes(filterQuery));
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="card text-center" style="grid-column: 1 / -1; padding: 2.5rem;">
          <i data-lucide="package-open" style="width:48px; height:48px; color:var(--text-muted); margin-bottom:0.75rem;"></i>
          <p class="text-muted">Nenhum produto em estoque encontrado.</p>
          <button class="btn btn-orange btn-sm margin-top" onclick="window.App.openProductModal()">
            + Cadastrar Produto no Estoque
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    filtered.forEach(prod => {
      const stock = parseInt(prod.stock, 10) || 0;
      const minStock = parseInt(prod.minStock, 10) || 5;

      let statusBadge = '';
      let borderStyle = '';

      if (stock === 0) {
        statusBadge = `<span class="badge badge-danger">🔴 ESGOTADO (0 un)</span>`;
        borderStyle = 'border-top: 5px solid var(--danger);';
      } else if (stock <= minStock) {
        statusBadge = `<span class="badge badge-warning">⚠️ Estoque Baixo (${stock} un)</span>`;
        borderStyle = 'border-top: 5px solid var(--warning);';
      } else {
        statusBadge = `<span class="badge badge-success">🟢 Em Estoque (${stock} un)</span>`;
        borderStyle = 'border-top: 5px solid var(--success);';
      }

      const card = document.createElement('div');
      card.className = 'product-card';
      if (borderStyle) card.setAttribute('style', borderStyle);

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem">
            <div>
              <h4 style="font-size:1.15rem; font-weight:900; color:var(--text-main); margin-bottom:4px">${prod.name}</h4>
              <span class="text-muted" style="font-size:0.775rem">${prod.category || 'Geral'} ${prod.sku ? `• SKU: ${prod.sku}` : ''}</span>
            </div>
            ${statusBadge}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; background:var(--bg-surface-secondary); padding:0.65rem; border-radius:var(--radius-md)">
            <div>
              <span class="text-muted" style="font-size:0.75rem">Preço de Venda:</span>
              <div style="font-size:1.25rem; font-weight:800; color:var(--primary)">
                R$ ${parseFloat(prod.price || 0).toFixed(2).replace('.', ',')}
              </div>
            </div>
            ${prod.costPrice ? `
              <div style="text-align:right">
                <span class="text-muted" style="font-size:0.75rem">Preço Custo:</span>
                <div style="font-size:0.95rem; font-weight:700; color:var(--text-muted)">
                  R$ ${parseFloat(prod.costPrice).toFixed(2).replace('.', ',')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-color)">
          <div style="display:flex; gap:0.5rem; justify-content:space-between">
            <button class="btn btn-outline btn-xs btn-add-stock" style="flex:1" title="Dar Entrada no Estoque">
              <i data-lucide="plus-circle"></i> + Entrada
            </button>
            <button class="btn btn-orange btn-xs btn-sell-stock" style="flex:1" title="Dar Baixa / Registrar Venda">
              <i data-lucide="shopping-cart"></i> - Venda
            </button>
          </div>
          <div style="display:flex; gap:0.5rem; justify-content:flex-end">
            <button class="icon-btn btn-edit-prod" title="Editar Produto">
              <i data-lucide="edit"></i>
            </button>
            <button class="icon-btn btn-delete-prod text-danger" title="Excluir Produto">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-add-stock').onclick = () => {
        const qtyStr = prompt(`Quantas unidades deseja adicionar ao estoque de "${prod.name}"?`, '5');
        if (qtyStr && !isNaN(qtyStr) && parseInt(qtyStr, 10) > 0) {
          const qty = parseInt(qtyStr, 10);
          prod.stock = (parseInt(prod.stock, 10) || 0) + qty;

          this.updateSingleProduct(prod);
          if (window.CloudSync) window.CloudSync.pushToCloud();
          window.showToast(`Adicionadas +${qty} unidades ao estoque de ${prod.name}!`, 'success');
          this.renderProducts();
        }
      };

      card.querySelector('.btn-sell-stock').onclick = () => {
        if (stock === 0) {
          window.showToast(`Produto "${prod.name}" está esgotado! Não é possível dar baixa.`, 'danger');
          return;
        }

        const qtyStr = prompt(`Quantas unidades foram vendidas/utilizadas de "${prod.name}"? (Estoque atual: ${stock})`, '1');
        if (qtyStr && !isNaN(qtyStr) && parseInt(qtyStr, 10) > 0) {
          const qty = parseInt(qtyStr, 10);
          if (qty > stock) {
            window.showToast(`Quantidade informada (${qty}) é maior que o estoque atual (${stock}).`, 'warning');
            return;
          }

          prod.stock = stock - qty;
          this.updateSingleProduct(prod);
          if (window.CloudSync) window.CloudSync.pushToCloud();

          const totalSale = qty * parseFloat(prod.price || 0);
          let trans = window.Store.getTransactions();
          trans.push({
            id: window.Store.generateId('tr'),
            type: 'income',
            description: `Venda de Produto: ${qty}x ${prod.name}`,
            amount: totalSale,
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Pix',
            status: 'paid'
          });
          window.Store.saveTransactions(trans);

          window.showToast(`Baixa realizada (-${qty} un). Lançado R$ ${totalSale.toFixed(2)} no Financeiro!`, 'success');
          this.renderProducts();
        }
      };

      card.querySelector('.btn-edit-prod').onclick = () => window.App.openProductModal(prod);

      card.querySelector('.btn-delete-prod').onclick = () => {
        if (confirm(`Remover permanentemente o produto "${prod.name}" do estoque?`)) {
          window.Store.markAsDeleted(prod.id);
          let list = window.Store.getProducts();
          list = list.filter(p => p.id !== prod.id);
          window.Store.saveProducts(list);
          if (window.CloudSync) window.CloudSync.pushToCloud();

          window.showToast('Produto excluído do estoque.', 'success');
          this.renderProducts();
        }
      };

      grid.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  updateSingleProduct(updatedProd) {
    const products = window.Store.getProducts();
    const idx = products.findIndex(p => p.id === updatedProd.id);
    if (idx !== -1) {
      products[idx] = updatedProd;
      window.Store.saveProducts(products);
    }
  }

  updateStockMetrics(products) {
    let lowStockCount = 0;
    let totalValue = 0;

    products.forEach(p => {
      const stock = parseInt(p.stock, 10) || 0;
      const minStock = parseInt(p.minStock, 10) || 5;
      const price = parseFloat(p.price) || 0;

      if (stock <= minStock) lowStockCount++;
      totalValue += stock * price;
    });

    const totalProdElem = document.getElementById('metricTotalProducts');
    const lowStockElem = document.getElementById('metricLowStockCount');
    const valStockElem = document.getElementById('metricTotalStockValue');
    const sidebarBadge = document.getElementById('lowStockBadge');

    if (totalProdElem) totalProdElem.textContent = `${products.length} Itens`;
    if (lowStockElem) lowStockElem.textContent = `${lowStockCount} Produtos`;
    if (valStockElem) valStockElem.textContent = `R$ ${totalValue.toFixed(2).replace('.', ',')}`;

    if (sidebarBadge) {
      sidebarBadge.textContent = lowStockCount;
      if (lowStockCount > 0) sidebarBadge.classList.remove('hidden');
      else sidebarBadge.classList.add('hidden');
    }
  }
}

window.Services = new ServicesView();
