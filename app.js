// Tiffany Cosmetic Ecuador - Catálogo Web con Escala de 3 Precios
// Configuración principal
const CONFIG = {
  storeName: "Tiffany Cosmetic Ecuador",
  whatsappNumber: "593996251012",
  currencySymbol: "$",
  defaultImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=60"
};

// Estado Global
let state = {
  products: [],
  filteredProducts: [],
  categories: ["Todos"],
  activeCategory: "Todos",
  searchQuery: "",
  sortBy: "featured",
  isWholesale: false,
  cart: [],
  selectedProduct: null,
  modalQty: 1,
  selectedValquinAromaId: null,
  selectedValquinAromaObj: null,
  valquinMultiQtys: {},
  tonosMultiQtys: {}
};

// Determinar el nivel de precio según la cantidad
function getItemTier(item, qty) {
  const quantity = qty !== undefined ? qty : item.qty;
  const unitPrice = item.price || 0;
  const mayorPrice = item.mayor_price || unitPrice;
  const docenaPrice = item.docena_price || mayorPrice;

  if (quantity >= 12) {
    return {
      tier: "docena",
      price: docenaPrice,
      label: "Docena y Cajas (12+)",
      badge: "12+ Docena",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
  } else if (quantity >= 3) {
    return {
      tier: "mayor",
      price: mayorPrice,
      label: "Al Mayor (3-11)",
      badge: "3-11 Mayor",
      badgeClass: "bg-pink-100 text-pink-800 border-pink-200"
    };
  } else {
    return {
      tier: "unitario",
      price: unitPrice,
      label: "Unitario (1-2)",
      badge: "1-2 Unitario",
      badgeClass: "bg-stone-100 text-stone-700 border-stone-200"
    };
  }
}

// Inicialización cuando carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  loadCartFromStorage();
  await loadProducts();
  setupEventListeners();
  renderCategories();
  applyFiltersAndRender();
  updateCartUI();
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: "https://hwwawmzorjlijnswwnpl.supabase.co",
  anonKey: "sb_publishable_Nq4PUpBLhxVYaV5l0LuCCA_4Il5jh_b"
};

let supabaseClient = null;
try {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log("Supabase inicializado correctamente");
  }
} catch (err) {
  console.warn("Supabase init error:", err);
}

// Cargar productos desde Supabase en la nube con fallback local
async function loadProducts() {
  // 1. Cargar desde la tabla productos de Supabase
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('disponible', true)
        .order('titulo', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        state.products = data.map(p => {
          let imgs = p.imagenes || [];
          return {
            id: p.id,
            title: p.titulo,
            description: p.descripcion,
            category: p.categoria || "Cosméticos",
            price: parseFloat(p.precio_unitario) || 0,
            mayor_price: parseFloat(p.precio_mayor) || parseFloat(p.precio_unitario) || 0,
            docena_price: parseFloat(p.precio_docena) || parseFloat(p.precio_mayor) || parseFloat(p.precio_unitario) || 0,
            images: imgs.length > 0 ? imgs : [CONFIG.defaultImage],
            available: p.disponible !== false,
            vendor: p.marca || "",
            tonos: p.tonos || []
          };
        });
        // Los aromas de las Cremas Valquin (y si están agotados) vienen de Supabase
        if (window.ValquinAromasManager) {
          const valquin = state.products.find(p => window.ValquinAromasManager.esValquin(p));
          if (valquin) window.ValquinAromasManager.usarTonosDeProducto(valquin.tonos);
        }
        console.log(`Cargados ${state.products.length} productos directamente desde Supabase en la nube`);
        setupProductCategories();
        return;
      }
    } catch (e) {
      console.warn("Error cargando productos de Supabase, usando respaldo local:", e);
    }
  }

  // 2. Fallback a respaldo local si no hay conexión a internet
  if (window.TIFFANY_PRODUCTS && Array.isArray(window.TIFFANY_PRODUCTS) && window.TIFFANY_PRODUCTS.length > 0) {
    state.products = window.TIFFANY_PRODUCTS;
  } else {
    try {
      const response = await fetch("products.json");
      if (response.ok) {
        state.products = await response.json();
      }
    } catch (err) {
      console.warn("No se pudo cargar products.json via fetch, usando fallback.", err);
    }
  }

  setupProductCategories();
}

function setupProductCategories() {
  const cats = new Set(["Todos"]);
  state.products.forEach(p => {
    // Pre-indexación en memoria para búsqueda instantánea en 0.001s
    p._searchIndex = `${p.title || ''} ${p.category || ''} ${(p.tags || []).join(' ')} ${p.vendor || ''}`.toLowerCase();
    if (p.category && p.category !== "Sin categoría") {
      cats.add(p.category);
    }
  });
  state.categories = Array.from(cats);
}

// Configuración de escuchadores de eventos
function setupEventListeners() {
  // Buscador con debounce optimizado (120ms para máxima fluidez)
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  let searchDebounceTimer = null;

  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.trim().toLowerCase();
    clearSearchBtn.classList.toggle("hidden", val.length === 0);
    
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.searchQuery = val;
      applyFiltersAndRender();
    }, 120);
  });

  clearSearchBtn.addEventListener("click", () => {
    clearTimeout(searchDebounceTimer);
    searchInput.value = "";
    state.searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    applyFiltersAndRender();
  });

  // Selector de Orden
  const sortSelect = document.getElementById("sortSelect");
  sortSelect.addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    applyFiltersAndRender();
  });



  // Botones de Carrito
  const openCartBtn = document.getElementById("openCartBtn");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const mobileCartFloatingBtn = document.getElementById("mobileCartFloatingBtn");

  openCartBtn.addEventListener("click", openCart);
  if (mobileCartFloatingBtn) {
    mobileCartFloatingBtn.addEventListener("click", openCart);
  }
  closeCartBtn.addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);

  // Modal de Entrega Obligatorio (Por Única Vez)
  const openCheckoutModalBtn = document.getElementById("openCheckoutModalBtn");
  const deliveryModal = document.getElementById("deliveryModal");
  const closeDeliveryModalBtn = document.getElementById("closeDeliveryModalBtn");
  const deliveryBackdrop = document.getElementById("deliveryBackdrop");
  const deliveryPanel = document.getElementById("deliveryPanel");
  const deliveryForm = document.getElementById("deliveryForm");

  const openDeliveryModal = () => {
    if (state.cart.length === 0) {
      alert("Agrega al menos un producto a tu pedido antes de continuar.");
      return;
    }
    // Calcular total
    let grandTotal = 0;
    state.cart.forEach(item => {
      const tier = getItemTier(item);
      grandTotal += tier.price * item.qty;
    });
    document.getElementById("deliveryOrderTotalText").textContent = `$${grandTotal.toFixed(2)}`;

    // Cargar datos guardados previamente "por única vez"
    const savedCustomer = localStorage.getItem("tiffany_customer_data");
    if (savedCustomer) {
      try {
        const c = JSON.parse(savedCustomer);
        if (c.name) document.getElementById("deliveryName").value = c.name;
        if (c.phone) document.getElementById("deliveryPhone").value = c.phone;
        if (c.city) document.getElementById("deliveryCity").value = c.city;
        if (c.address) document.getElementById("deliveryAddress").value = c.address;
        if (c.payment) document.getElementById("deliveryPayment").value = c.payment;
      } catch (e) {}
    }

    deliveryModal.classList.remove("hidden");
    setTimeout(() => {
      deliveryBackdrop.classList.remove("opacity-0");
      deliveryPanel.classList.remove("opacity-0", "scale-95");
      deliveryPanel.classList.add("scale-100");
    }, 10);
  };

  const closeDeliveryModal = () => {
    deliveryBackdrop.classList.add("opacity-0");
    deliveryPanel.classList.add("opacity-0", "scale-95");
    deliveryPanel.classList.remove("scale-100");
    setTimeout(() => {
      deliveryModal.classList.add("hidden");
    }, 200);
  };

  if (openCheckoutModalBtn) {
    openCheckoutModalBtn.addEventListener("click", openDeliveryModal);
  }
  if (closeDeliveryModalBtn) {
    closeDeliveryModalBtn.addEventListener("click", closeDeliveryModal);
  }
  if (deliveryBackdrop) {
    deliveryBackdrop.addEventListener("click", closeDeliveryModal);
  }

  if (deliveryForm) {
    deliveryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleWhatsAppCheckout();
      closeDeliveryModal();
      closeCart();
    });
  }

  // Acceso Administrativo con Candado 🔒 (el login real está en admin.html con Supabase Auth)
  const adminPadlockBtn = document.getElementById("adminPadlockBtn");
  if (adminPadlockBtn) {
    adminPadlockBtn.addEventListener("click", () => {
      window.location.href = "admin.html";
    });
  }

  setupGalleryControls();

  // Modal de Detalle
  const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
  const modalBackdrop = document.getElementById("modalBackdrop");
  closeDetailModalBtn.addEventListener("click", closeProductModal);
  modalBackdrop.addEventListener("click", closeProductModal);

  // Controles de cantidad en Modal
  document.getElementById("modalQtyMinus").addEventListener("click", () => {
    if (state.modalQty > 1) {
      state.modalQty--;
      document.getElementById("modalQtyValue").textContent = state.modalQty;
      updateModalDynamicPrice();
    }
  });

  document.getElementById("modalQtyPlus").addEventListener("click", () => {
    state.modalQty++;
    document.getElementById("modalQtyValue").textContent = state.modalQty;
    updateModalDynamicPrice();
  });

  document.getElementById("modalAddToCartBtn").addEventListener("click", () => {
    if (!state.selectedProduct) return;

    const isValquin = (state.selectedProduct.id && state.selectedProduct.id.includes("valquin")) || 
                      (state.selectedProduct.title && state.selectedProduct.title.toLowerCase().includes("valquin"));

    if (isValquin) {
      const selectedEntries = Object.entries(state.valquinMultiQtys).filter(([_, qty]) => qty > 0);
      const totalSelected = selectedEntries.reduce((sum, [_, q]) => sum + q, 0);

      if (totalSelected === 0) {
        showToast("⚠️ Elige al menos 1 crema con el botón [+] de tu aroma favorito.");
        return;
      }

      const aromas = window.ValquinAromasManager ? window.ValquinAromasManager.getAromas() : [];
      let addedCount = 0;

      selectedEntries.forEach(([aromaId, qty]) => {
        const aromaObj = aromas.find(a => a.id === aromaId);
        if (aromaObj && aromaObj.disponible) {
          addToCart(state.selectedProduct, qty, aromaObj, true);
          addedCount += qty;
        }
      });

      if (addedCount > 0) {
        showToast(`¡Agregadas ${addedCount} ${addedCount === 1 ? 'Crema Valquin' : 'Cremas Valquin'} variadas al pedido! ✨`);
        closeProductModal();
      }
      return;
    }

    const hasTonos = Array.isArray(state.selectedProduct.tonos) && state.selectedProduct.tonos.length > 0;
    if (hasTonos) {
      const selectedEntries = Object.entries(state.tonosMultiQtys).filter(([_, qty]) => qty > 0);
      const totalSelected = selectedEntries.reduce((sum, [_, q]) => sum + q, 0);

      if (totalSelected === 0) {
        showToast("⚠️ Elige al menos 1 unidad con el botón [+] de tu tono favorito.");
        return;
      }

      let addedCount = 0;
      selectedEntries.forEach(([tonoId, qty]) => {
        const tonosList = state.selectedProduct.tonos;
        const tonoObj = tonosList.find(t => (t.id || t.nombre || t) === tonoId);
        const tonoName = tonoObj ? (typeof tonoObj === 'object' ? tonoObj.nombre : tonoObj) : tonoId;
        addToCart(state.selectedProduct, qty, { id: tonoId, nombre: tonoName, isTono: true }, true);
        addedCount += qty;
      });

      if (addedCount > 0) {
        showToast(`¡Agregadas ${addedCount} unidades variadas de ${state.selectedProduct.title} al pedido! ✨`);
        closeProductModal();
      }
      return;
    }

    addToCart(state.selectedProduct, state.modalQty);
    closeProductModal();
  });

  // Cerrar alerta de aroma agotado
  const closeAromaBtn = document.getElementById("closeAromaAgotadoBtn");
  if (closeAromaBtn) {
    closeAromaBtn.addEventListener("click", closeAromaAgotadoAlert);
  }
  const aromaAlertModal = document.getElementById("aromaAgotadoAlertModal");
  if (aromaAlertModal) {
    aromaAlertModal.addEventListener("click", (e) => {
      if (e.target === aromaAlertModal) closeAromaAgotadoAlert();
    });
  }

  // Botón reset filtros vacío
  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    state.searchQuery = "";
    state.activeCategory = "Todos";
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    renderCategories();
    applyFiltersAndRender();
  });
}

// Renderizar píldoras de categorías
function renderCategories() {
  const container = document.getElementById("categoryContainer");
  container.innerHTML = "";

  state.categories.forEach(cat => {
    const btn = document.createElement("button");
    const isActive = state.activeCategory === cat;
    
    btn.className = `px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 ${
      isActive 
        ? "bg-brand-600 text-white font-bold shadow-sm shadow-brand-500/25" 
        : "bg-white/90 hover:bg-white text-stone-700 border border-pink-200/70 shadow-xs"
    }`;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      state.activeCategory = cat;
      renderCategories();
      applyFiltersAndRender();
    });
    container.appendChild(btn);
  });
}

// Aplicar filtros, ordenamiento y renderizar lista de productos
function applyFiltersAndRender() {
  let list = [...state.products];

  // Filtro Categoría
  if (state.activeCategory !== "Todos") {
    list = list.filter(p => p.category === state.activeCategory);
  }

  // Filtro Búsqueda ultra rápido (usando pre-índice en memoria)
  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(p => {
      if (p._searchIndex) return p._searchIndex.includes(q);
      const titleMatch = (p.title || "").toLowerCase().includes(q);
      const catMatch = (p.category || "").toLowerCase().includes(q);
      return titleMatch || catMatch;
    });
  }

  // Ordenar
  list.sort((a, b) => {
    const priceA = a.price;
    const priceB = b.price;

    if (state.sortBy === "price-asc") return priceA - priceB;
    if (state.sortBy === "price-desc") return priceB - priceA;
    if (state.sortBy === "name-asc") return a.title.localeCompare(b.title);
    return 0; // featured default
  });

  state.filteredProducts = list;

  // Actualizar encabezados
  const categoryTitle = document.getElementById("currentCategoryTitle");
  const countText = document.getElementById("productsCountText");

  categoryTitle.textContent = state.activeCategory === "Todos" ? "Todos los Productos" : state.activeCategory;
  countText.textContent = `Mostrando ${list.length} de ${state.products.length} productos`;

  renderProductsGrid(list);
}

// Renderizar la cuadrícula de productos con los 3 precios visibles
function renderProductsGrid(products) {
  const grid = document.getElementById("productsGrid");
  const emptyState = document.getElementById("emptyState");

  if (products.length === 0) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    emptyState.classList.add("flex");
    return;
  }

  emptyState.classList.add("hidden");
  emptyState.classList.remove("flex");

  grid.innerHTML = products.map(product => {
    const imageSrc = product.images && product.images.length > 0 ? product.images[0] : CONFIG.defaultImage;
    const unitPrice = product.price || 0;
    const mayorPrice = product.mayor_price || unitPrice;
    const docenaPrice = product.docena_price || mayorPrice;

    return `
      <div class="group bg-white rounded-2xl border border-stone-100 hover:border-brand-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 flex flex-col cursor-pointer"
           onclick="handleProductClick('${product.id}')">
        
        <!-- Image Container -->
        <div class="relative aspect-square overflow-hidden bg-stone-50">
          <img src="${imageSrc}" 
               alt="${product.title}" 
               loading="lazy"
               onerror="this.src='${CONFIG.defaultImage}'"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          
          <!-- Category Badge -->
          <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            <span class="bg-white/95 backdrop-blur text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              ${product.category || 'Cosméticos'}
            </span>
          </div>

          ${product.images && product.images.length > 1 ? `
            <span class="absolute bottom-3 left-2.5 bg-stone-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <i data-lucide="images" class="w-3 h-3"></i> ${product.images.length}
            </span>
          ` : ''}

          <!-- Quick Add Button Overlay -->
          <button 
            onclick="event.stopPropagation(); handleQuickAdd('${product.id}')"
            title="Agregar al Pedido"
            class="absolute bottom-2.5 right-2.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 text-stone-800 hover:bg-brand-600 hover:text-white flex items-center justify-center shadow-md shadow-stone-900/10 transition-all duration-200 active:scale-90">
            <i data-lucide="plus" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Body Info -->
        <div class="p-3 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            ${product.vendor ? `<p class="text-[10px] font-bold uppercase tracking-wider text-brand-600 mb-0.5 truncate">${product.vendor}</p>` : ''}
            <h3 class="text-xs sm:text-sm font-semibold text-stone-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
              ${product.title}
            </h3>
            
            <!-- 3 PRECIOS VISIBLES DIRECTAMENTE EN LA TARJETA -->
            <div class="mt-2.5 text-[10px] sm:text-[11px] bg-stone-50/90 rounded-xl p-2 sm:p-2.5 border border-stone-200/60 space-y-1">
              <div class="flex justify-between items-center text-stone-700">
                <span class="text-stone-500 font-medium">1 - 2 (Unitario):</span>
                <span class="font-bold text-stone-900 font-serif">$${unitPrice.toFixed(2)}</span>
              </div>
              <div class="flex justify-between items-center text-pink-700">
                <span class="text-stone-500 font-medium">3 - 11 (Mayor):</span>
                <span class="font-bold text-brand-600 font-serif">$${mayorPrice.toFixed(2)}</span>
              </div>
              <div class="flex justify-between items-center text-emerald-800">
                <span class="text-stone-500 font-medium">12+ (Docena/Caja):</span>
                <span class="font-bold text-emerald-600 font-serif">$${docenaPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="mt-3 flex items-center justify-between pt-2 border-t border-stone-100">
            <span class="text-[10px] text-stone-400">Escala activa</span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-brand-600 group-hover:underline flex items-center gap-1">
              Pedir <i data-lucide="chevron-right" class="w-3 h-3"></i>
            </span>
          </div>
        </div>

      </div>
    `;
  }).join("");

  if (window.lucide && grid) {
    try {
      window.lucide.createIcons({ root: grid });
    } catch (e) {
      window.lucide.createIcons();
    }
  }
}

// Click en producto para abrir modal
window.handleProductClick = (productId) => {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  openProductModal(product);
};

// Agregar rápido desde la tarjeta
window.handleQuickAdd = (productId) => {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  const isValquin = (product.id && product.id.includes("valquin")) || 
                    (product.title && product.title.toLowerCase().includes("valquin"));
  if (isValquin) {
    openProductModal(product);
    showToast("✨ Selecciona tu fragancia favorita para tus Cremas Valquin");
    return;
  }
  addToCart(product, 1);
};

// Modal de detalle de producto
function openProductModal(product) {
  state.selectedProduct = product;
  state.modalQty = 1;
  state.selectedValquinAromaId = null;
  state.selectedValquinAromaObj = null;

  const modal = document.getElementById("productDetailModal");
  const backdrop = document.getElementById("modalBackdrop");
  const panel = document.getElementById("modalPanel");

  // Rellenar datos
  setupGallery(product);
  document.getElementById("modalCategoryBadge").textContent = product.category || "Cosméticos";
  document.getElementById("modalProductTitle").textContent = product.title;
  const vendorEl = document.getElementById("modalVendor");
  vendorEl.textContent = product.vendor || "";
  vendorEl.classList.toggle("hidden", !product.vendor);

  // Manejo de Descripción / Guía Olfativa Valquin / Tonos
  const isValquin = (product.id && product.id.includes("valquin")) || 
                    (product.title && product.title.toLowerCase().includes("valquin"));
  const hasTonos = Array.isArray(product.tonos) && product.tonos.length > 0;
  const descEl = document.getElementById("modalProductDesc");
  const descTitle = document.getElementById("modalDescTitle");
  const valquinContainer = document.getElementById("valquinSpecialContainer");
  const valquinMultiSummary = document.getElementById("valquinMultiSummaryBox");
  const standardQtyControls = document.getElementById("modalStandardQtyControls");
  const addToCartBtnText = document.getElementById("modalAddToCartBtnText");

  state.valquinMultiQtys = {};
  state.tonosMultiQtys = {};

  if (isValquin) {
    if (standardQtyControls) standardQtyControls.classList.add("hidden");
    if (valquinMultiSummary) valquinMultiSummary.classList.remove("hidden");
    renderValquinAromasGuide(product);
  } else if (hasTonos) {
    if (standardQtyControls) standardQtyControls.classList.add("hidden");
    if (valquinMultiSummary) valquinMultiSummary.classList.remove("hidden");
    renderProductTonosGuide(product);
  } else {
    if (descTitle) descTitle.textContent = "Descripción:";
    descEl.classList.remove("hidden");
    descEl.textContent = product.description || "Sin descripción disponible.";
    if (valquinContainer) valquinContainer.classList.add("hidden");
    if (valquinMultiSummary) valquinMultiSummary.classList.add("hidden");
    if (standardQtyControls) standardQtyControls.classList.remove("hidden");
    if (addToCartBtnText) addToCartBtnText.textContent = "Agregar al Pedido";
  }

  document.getElementById("modalQtyValue").textContent = "1";

  // Precios escalonados en el modal
  const unitPrice = product.price || 0;
  const mayorPrice = product.mayor_price || unitPrice;
  const docenaPrice = product.docena_price || mayorPrice;

  document.getElementById("modalUnitPrice").textContent = `$${unitPrice.toFixed(2)}`;
  document.getElementById("modalMayorPrice").textContent = `$${mayorPrice.toFixed(2)}`;
  document.getElementById("modalDocenaPrice").textContent = `$${docenaPrice.toFixed(2)}`;

  updateModalDynamicPrice();

  // Animación de apertura
  modal.classList.remove("hidden");
  setTimeout(() => {
    backdrop.classList.remove("opacity-0");
    panel.classList.remove("opacity-0", "scale-95");
    panel.classList.add("scale-100");
  }, 10);
}

// ----------------- GALERÍA DE FOTOS DEL PRODUCTO -----------------

const gallery = { images: [], index: 0, title: "" };

function setupGallery(product) {
  gallery.images = product.images && product.images.length > 0 ? product.images : [CONFIG.defaultImage];
  gallery.title = product.title;
  gallery.index = 0;

  const varias = gallery.images.length > 1;
  ["galleryPrevBtn", "galleryNextBtn", "galleryCounter"].forEach(id => {
    document.getElementById(id).classList.toggle("hidden", !varias);
  });

  const thumbs = document.getElementById("galleryThumbs");
  thumbs.classList.toggle("hidden", !varias);
  thumbs.classList.toggle("flex", varias);
  thumbs.innerHTML = varias ? gallery.images.map((src, i) => `
    <button type="button" data-index="${i}" aria-label="Ver foto ${i + 1}"
            class="gallery-thumb shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all">
      <img src="${src}" alt="" loading="lazy" class="w-full h-full object-cover"
           onerror="this.src='${CONFIG.defaultImage}'">
    </button>
  `).join("") : "";

  showGalleryImage(0);
}

function showGalleryImage(i) {
  const total = gallery.images.length;
  gallery.index = (i + total) % total;

  const img = document.getElementById("modalProductImage");
  img.src = gallery.images[gallery.index];
  img.alt = total > 1 ? `${gallery.title} (foto ${gallery.index + 1} de ${total})` : gallery.title;
  img.onerror = () => { img.onerror = null; img.src = CONFIG.defaultImage; };

  document.getElementById("galleryCounter").textContent = `${gallery.index + 1} / ${total}`;
  document.querySelectorAll("#galleryThumbs .gallery-thumb").forEach((btn, n) => {
    const activa = n === gallery.index;
    btn.classList.toggle("border-brand-600", activa);
    btn.classList.toggle("border-transparent", !activa);
    btn.classList.toggle("opacity-60", !activa);
  });
}

function setupGalleryControls() {
  document.getElementById("galleryPrevBtn").addEventListener("click", () => showGalleryImage(gallery.index - 1));
  document.getElementById("galleryNextBtn").addEventListener("click", () => showGalleryImage(gallery.index + 1));

  document.getElementById("galleryThumbs").addEventListener("click", (e) => {
    const btn = e.target.closest(".gallery-thumb");
    if (btn) showGalleryImage(parseInt(btn.dataset.index, 10));
  });

  // Deslizar con el dedo en el celular
  const main = document.getElementById("galleryMain");
  let startX = null;
  main.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  main.addEventListener("touchend", (e) => {
    if (startX === null || gallery.images.length < 2) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) showGalleryImage(gallery.index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  // Flechas del teclado mientras el producto está abierto
  document.addEventListener("keydown", (e) => {
    if (document.getElementById("productDetailModal").classList.contains("hidden")) return;
    if (e.key === "ArrowLeft") showGalleryImage(gallery.index - 1);
    else if (e.key === "ArrowRight") showGalleryImage(gallery.index + 1);
    else if (e.key === "Escape") closeProductModal();
  });
}

function updateModalDynamicPrice() {
  if (!state.selectedProduct) return;
  const tier = getItemTier(state.selectedProduct, state.modalQty);
  const priceEl = document.getElementById("modalProductPrice");
  priceEl.textContent = `$${tier.price.toFixed(2)}`;
  
  // Agregar detalle de qué tarifa aplica
  const compareEl = document.getElementById("modalComparePrice");
  compareEl.textContent = `(${tier.label})`;
  compareEl.className = `text-xs font-bold px-2 py-0.5 rounded-full border ${tier.badgeClass}`;
  compareEl.classList.remove("hidden");
}

function closeProductModal() {
  const modal = document.getElementById("productDetailModal");
  const backdrop = document.getElementById("modalBackdrop");
  const panel = document.getElementById("modalPanel");

  backdrop.classList.add("opacity-0");
  panel.classList.add("opacity-0", "scale-95");
  panel.classList.remove("scale-100");

  setTimeout(() => {
    modal.classList.add("hidden");
    state.selectedProduct = null;
    state.selectedValquinAromaId = null;
    state.selectedValquinAromaObj = null;
  }, 200);
}



// ----------------- GESTIÓN DEL CARRITO CON ESCALA AUTOMÁTICA -----------------

function addToCart(product, qty = 1, aroma = null, silent = false) {
  const variantId = aroma ? (aroma.id || aroma.nombre) : null;
  const cartItemId = variantId ? `${product.id}__${variantId}` : product.id;
  const existing = state.cart.find(item => item.id === cartItemId);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({
      id: cartItemId,
      baseProductId: product.id,
      title: product.title,
      aroma: aroma ? aroma.nombre : null,
      aromaGenero: aroma ? aroma.generoLabel : null,
      isTono: aroma ? Boolean(aroma.isTono) : false,
      price: product.price || 0,
      mayor_price: product.mayor_price || product.price || 0,
      docena_price: product.docena_price || product.mayor_price || product.price || 0,
      image: product.images && product.images.length > 0 ? product.images[0] : CONFIG.defaultImage,
      category: product.category,
      qty: qty
    });
  }

  saveCartToStorage();
  updateCartUI();
  if (!silent) {
    const nombreAviso = aroma ? `${product.title} (${aroma.nombre})` : product.title;
    showToast(`¡${nombreAviso} agregado al pedido!`);
  }
}

function updateCartItemQty(productId, change) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(i => i.id !== productId);
  }

  saveCartToStorage();
  updateCartUI();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter(i => i.id !== productId);
  saveCartToStorage();
  updateCartUI();
}

function updateCartUI() {
  const countBadge = document.getElementById("cartCountBadge");
  const floatingBadge = document.getElementById("mobileFloatingBadge");
  const floatingTotal = document.getElementById("mobileFloatingTotal");
  const itemsSummary = document.getElementById("cartItemsSummary");
  const listEl = document.getElementById("cartItemsList");
  const subtotalEl = document.getElementById("cartSubtotalText");
  const totalEl = document.getElementById("cartTotalText");
  const priceModeEl = document.getElementById("cartPriceModeText");

  const totalCount = state.cart.reduce((acc, item) => acc + item.qty, 0);
  
  // Totales acumulados por producto base para que los tonos/aromas sumen para precio mayorista
  const baseProductTotals = {};
  state.cart.forEach(item => {
    const baseId = item.baseProductId || item.id;
    baseProductTotals[baseId] = (baseProductTotals[baseId] || 0) + item.qty;
  });

  // Calcular total dinámico según la escala de 3 precios de cada producto
  let grandTotal = 0;
  state.cart.forEach(item => {
    const baseId = item.baseProductId || item.id;
    const effectiveQty = baseProductTotals[baseId] || item.qty;
    const tier = getItemTier(item, effectiveQty);
    grandTotal += tier.price * item.qty;
  });

  countBadge.textContent = totalCount;
  if (floatingBadge) floatingBadge.textContent = totalCount;
  if (floatingTotal) floatingTotal.textContent = `$${grandTotal.toFixed(2)}`;
  itemsSummary.textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'} en tu pedido`;
  subtotalEl.textContent = `$${grandTotal.toFixed(2)}`;
  totalEl.textContent = `$${grandTotal.toFixed(2)}`;
  priceModeEl.textContent = "Escala Automática (1-2 / 3-11 / 12+)";

  if (state.cart.length === 0) {
    listEl.innerHTML = `
      <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
        <i data-lucide="shopping-bag" class="w-12 h-12 stroke-[1.5] mb-2 text-stone-300"></i>
        <p class="font-medium text-stone-600 text-sm">Tu pedido está vacío</p>
        <p class="text-xs text-stone-400 mt-1">Selecciona productos para ver el descuento automático por cantidad.</p>
      </div>
    `;
  } else {
    listEl.innerHTML = state.cart.map(item => {
      const baseId = item.baseProductId || item.id;
      const effectiveQty = baseProductTotals[baseId] || item.qty;
      const tier = getItemTier(item, effectiveQty);
      const subtotal = tier.price * item.qty;

      // Mensaje de sugerencia para desbloquear el siguiente nivel
      let hintText = "";
      const currentQty = effectiveQty;
      if (currentQty === 2) {
        hintText = `💡 ¡Agrega 1 más de este producto para pagar precio Al Mayor ($${item.mayor_price.toFixed(2)} c/u)!`;
      } else if (currentQty >= 3 && currentQty < 12 && item.docena_price < item.mayor_price) {
        const remaining = 12 - currentQty;
        hintText = `🔥 ¡Lleva ${remaining} más para tarifa Docena ($${item.docena_price.toFixed(2)} c/u)!`;
      }

      return `
        <div class="flex flex-col gap-2 pt-3 first:pt-0">
          <div class="flex items-center gap-3">
            <img src="${item.image}" alt="${item.title}" class="w-14 h-14 rounded-xl object-cover border border-stone-100 shrink-0">
            
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-semibold text-stone-900 truncate">${item.title}</h4>
              
              ${item.aroma ? `
                <div class="mt-0.5">
                  <span class="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                    ${item.isTono ? '🎨 Tono:' : '✨ Aroma:'} ${item.aroma}
                  </span>
                </div>
              ` : ''}

              <!-- Badges de Nivel Aplicado -->
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border ${tier.badgeClass}">
                  ${tier.badge}
                </span>
                <span class="text-[11px] text-stone-600 font-semibold">
                  $${tier.price.toFixed(2)} c/u
                </span>
              </div>

              <div class="text-xs font-bold text-stone-900 mt-1 font-serif">
                Subtotal: $${subtotal.toFixed(2)}
              </div>
            </div>

            <!-- Quantity Controls -->
            <div class="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
              <button onclick="updateCartItemQty('${item.id}', -1)" class="w-6 h-6 rounded flex items-center justify-center bg-white hover:bg-stone-200 text-stone-700 text-xs font-bold shadow-xs transition-colors">-</button>
              <span class="w-6 text-center text-xs font-bold">${item.qty}</span>
              <button onclick="updateCartItemQty('${item.id}', 1)" class="w-6 h-6 rounded flex items-center justify-center bg-white hover:bg-stone-200 text-stone-700 text-xs font-bold shadow-xs transition-colors">+</button>
            </div>

            <!-- Delete -->
            <button onclick="removeCartItem('${item.id}')" class="p-1.5 text-stone-400 hover:text-red-500 rounded-md transition-colors" title="Eliminar">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          ${hintText ? `
            <div class="text-[10px] text-brand-700 bg-pink-50/80 px-2 py-1 rounded-lg border border-pink-100 font-medium">
              ${hintText}
            </div>
          ` : ''}
        </div>
      `;
    }).join("");
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Abrir y Cerrar Carrito Drawer
function openCart() {
  const modal = document.getElementById("cartModal");
  const backdrop = document.getElementById("cartBackdrop");
  const panel = document.getElementById("cartPanel");

  modal.classList.remove("hidden");
  setTimeout(() => {
    backdrop.classList.remove("opacity-0");
    panel.classList.remove("translate-x-full");
  }, 10);
}

function closeCart() {
  const modal = document.getElementById("cartModal");
  const backdrop = document.getElementById("cartBackdrop");
  const panel = document.getElementById("cartPanel");

  backdrop.classList.add("opacity-0");
  panel.classList.add("translate-x-full");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// ----------------- CHECKOUT WHATSAPP CON DESGLOSE DE 3 PRECIOS -----------------

function handleWhatsAppCheckout() {
  if (state.cart.length === 0) {
    alert("Agrega al menos un producto a tu pedido antes de continuar.");
    return;
  }

  const nameInput = document.getElementById("deliveryName");
  const phoneInput = document.getElementById("deliveryPhone");
  const cityInput = document.getElementById("deliveryCity");
  const addressInput = document.getElementById("deliveryAddress");
  const paymentInput = document.getElementById("deliveryPayment");

  const name = nameInput ? nameInput.value.trim() : "Cliente";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const city = cityInput ? cityInput.value.trim() : "Por coordinar";
  const address = addressInput ? addressInput.value.trim() : "Por coordinar";
  const payment = paymentInput ? paymentInput.value : "Transferencia";

  // Guardar datos en el teléfono de la clienta "Por única vez"
  try {
    localStorage.setItem("tiffany_customer_data", JSON.stringify({
      name, phone, city, address, payment
    }));
  } catch (e) {}

  let grandTotal = 0;
  let itemsText = "";

  // Totales por producto base para que los tonos/aromas sumen al por mayor en WhatsApp
  const baseProductTotals = {};
  state.cart.forEach(item => {
    const baseId = item.baseProductId || item.id;
    baseProductTotals[baseId] = (baseProductTotals[baseId] || 0) + item.qty;
  });

  state.cart.forEach((item) => {
    const baseId = item.baseProductId || item.id;
    const effectiveQty = baseProductTotals[baseId] || item.qty;
    const tier = getItemTier(item, effectiveQty);
    const itemSubtotal = tier.price * item.qty;
    grandTotal += itemSubtotal;

    if (item.aroma) {
      const label = item.isTono ? "Tono" : "Aroma";
      itemsText += `• ${item.qty}x ${item.title}\n   ↳ ${label}: *${item.aroma}*\n   ↳ Tarifa: ${tier.label} ($${tier.price.toFixed(2)} c/u) = *$${itemSubtotal.toFixed(2)}*\n`;
    } else {
      itemsText += `• ${item.qty}x ${item.title}\n   ↳ Tarifa: ${tier.label} ($${tier.price.toFixed(2)} c/u) = *$${itemSubtotal.toFixed(2)}*\n`;
    }
  });

  // Mensaje estructurado para Bot Tiffany en n8n
  const message = 
`🛍️ *NUEVO PEDIDO - TIFFANY COSMETIC*
----------------------------------------
${itemsText}----------------------------------------
💰 *TOTAL A PAGAR:* *$${grandTotal.toFixed(2)}*
📋 *Escala Aplicada:* Descuento por volumen según cantidad

👤 *DATOS DEL CLIENTE:*
• *Nombre:* ${name}
• *WhatsApp / Teléfono:* ${phone}
• *Ciudad:* ${city}
• *Dirección:* ${address}
• *Forma de pago:* ${payment}
----------------------------------------
✨ _Hola Tiffany, me gustaría confirmar mi pedido y coordinar el pago._`;

  // Guardar pedido automáticamente en la base de datos de Supabase con teléfono
  if (supabaseClient) {
    const orderItems = state.cart.map(item => {
      const tier = getItemTier(item);
      return {
        id: item.id,
        titulo: item.title,
        cantidad: item.qty,
        precio_unitario: tier.price,
        tarifa: tier.label,
        subtotal: tier.price * item.qty
      };
    });

    const orderPayload = {
      nombre_cliente: name,
      telefono_cliente: phone,
      ciudad_cliente: city,
      direccion_cliente: address,
      metodo_pago: payment,
      total_pagar: grandTotal,
      detalle_productos: {
        telefono: phone,
        items: orderItems
      },
      estado_pedido: 'pendiente'
    };

    supabaseClient.from('pedidos').insert([orderPayload]).then(({ error }) => {
      if (error) {
        console.warn("Aviso al guardar con columna telefono_cliente, reintentando fallback:", error);
        // Fallback en caso de que la columna aún no exista en Supabase
        delete orderPayload.telefono_cliente;
        orderPayload.nombre_cliente = phone ? `${name} (${phone})` : name;
        supabaseClient.from('pedidos').insert([orderPayload]);
      } else {
        console.log("¡Pedido y número guardados con éxito en Supabase (columna telefono_cliente)!");
      }
    });
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;

  window.open(whatsappUrl, "_blank");
  showToast("¡Pedido y datos enviados a WhatsApp con éxito!");
}

// Guardar / Cargar Carrito LocalStorage
function saveCartToStorage() {
  try {
    localStorage.setItem("tiffany_cart", JSON.stringify(state.cart));
  } catch (e) {
    console.warn("No se pudo guardar carrito en localStorage", e);
  }
}

function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem("tiffany_cart");
    if (stored) {
      state.cart = JSON.parse(stored);
    }
  } catch (e) {
    state.cart = [];
  }
}

// Toast Notificaciones
function showToast(msg) {
  const toast = document.getElementById("toastNotification");
  const msgEl = document.getElementById("toastMessage");
  msgEl.textContent = msg;

  toast.classList.remove("translate-y-12", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");

  setTimeout(() => {
    toast.classList.add("translate-y-12", "opacity-0");
    toast.classList.remove("translate-y-0", "opacity-100");
  }, 2500);
}

// Exportar funciones globales
window.updateCartItemQty = updateCartItemQty;
window.removeCartItem = removeCartItem;
window.showAromaAgotadoAlert = showAromaAgotadoAlert;
window.closeAromaAgotadoAlert = closeAromaAgotadoAlert;

// ----------------- EXPERIENCIA OLFATIVA VALQUIN (19 AROMAS) -----------------

function renderValquinAromasGuide(product) {
  const container = document.getElementById("valquinSpecialContainer");
  const descEl = document.getElementById("modalProductDesc");
  const descTitle = document.getElementById("modalDescTitle");
  const summaryBox = document.getElementById("valquinMultiSummaryBox");
  const totalCountBadge = document.getElementById("valquinMultiTotalCountBadge");
  const itemsListEl = document.getElementById("valquinMultiItemsList");
  const tierBadge = document.getElementById("valquinMultiTierBadge");
  const addBtnText = document.getElementById("modalAddToCartBtnText");

  if (!container) return;

  container.classList.remove("hidden");
  if (summaryBox) summaryBox.classList.remove("hidden");
  if (descTitle) descTitle.textContent = "✨ Fragancias Disponibles & Cantidades:";

  // Breve resumen inicial elegante de la crema
  if (descEl) {
    descEl.innerHTML = `
      <div class="p-2.5 rounded-xl bg-pink-50/60 border border-pink-200/80 text-stone-700 space-y-1">
        <p class="font-medium">🧴 <strong>Cremas Corporales Valquin:</strong> Hidratación profunda y fragancias de perfumería fina inspiradas en aromas icónicos internacionales.</p>
        <p class="text-[11px] text-pink-700 font-semibold">👇 Puedes combinar diferentes aromas en tu pedido. Usa los botones <strong>[+]</strong> y <strong>[-]</strong> para sumar las cantidades de cada fragancia:</p>
      </div>
    `;
  }

  const aromas = window.ValquinAromasManager ? window.ValquinAromasManager.getAromas() : [];
  const damas = aromas.filter(a => a.genero === "mujer");
  const caballeros = aromas.filter(a => a.genero === "hombre");

  // Pestañas y contenedor de tarjetas
  container.innerHTML = `
    <!-- Pestañas de Género -->
    <div class="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/70 text-xs font-bold">
      <button type="button" id="valquinTabDamas" class="flex-1 py-2 px-3 rounded-lg bg-pink-600 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 font-bold">
        <span>🌸 Para Ella (${damas.length})</span>
      </button>
      <button type="button" id="valquinTabCaballeros" class="flex-1 py-2 px-3 rounded-lg text-stone-600 hover:text-stone-900 transition-all flex items-center justify-center gap-1.5 font-bold">
        <span>👔 Para Él (${caballeros.length})</span>
      </button>
    </div>

    <!-- Contenedor Scrollable de Aromas -->
    <div id="valquinAromasCardsList" class="space-y-2 max-h-72 overflow-y-auto pr-1">
      <!-- Se genera dinámicamente -->
    </div>
  `;

  let activeTab = "damas";
  const tabDamasBtn = document.getElementById("valquinTabDamas");
  const tabCaballerosBtn = document.getElementById("valquinTabCaballeros");

  // Función para actualizar resumen en vivo y botón de agregar
  const updateSummaryUI = () => {
    const selectedEntries = Object.entries(state.valquinMultiQtys).filter(([_, qty]) => qty > 0);
    const totalQty = selectedEntries.reduce((sum, [_, q]) => sum + q, 0);

    if (totalCountBadge) {
      totalCountBadge.textContent = `${totalQty} ${totalQty === 1 ? 'crema' : 'cremas'}`;
    }

    if (totalQty === 0) {
      if (itemsListEl) {
        itemsListEl.innerHTML = `<span class="text-stone-400 italic text-[10px]">Toca [+] en los aromas que desees arriba para armar tu pedido variado.</span>`;
      }
      if (tierBadge) {
        tierBadge.classList.add("hidden");
      }
      if (addBtnText) {
        addBtnText.textContent = "Agregar al Pedido (Elige aromas)";
      }
      const priceEl = document.getElementById("modalProductPrice");
      const compareEl = document.getElementById("modalComparePrice");
      if (priceEl) priceEl.textContent = `$${(product.price || 0).toFixed(2)}`;
      if (compareEl) {
        compareEl.textContent = "(Unitario)";
        compareEl.className = "text-xs font-bold px-2 py-0.5 rounded-full border bg-stone-100 text-stone-700 border-stone-200";
      }
      return;
    }

    const tier = getItemTier(product, totalQty);
    const subtotal = tier.price * totalQty;

    if (itemsListEl) {
      itemsListEl.innerHTML = selectedEntries.map(([aromaId, qty]) => {
        const a = aromas.find(x => x.id === aromaId);
        const name = a ? a.nombre : aromaId;
        const genLabel = a ? (a.genero === "mujer" ? "Dama" : "Caballero") : "";
        return `
          <div class="flex items-center justify-between py-1 border-b border-pink-100/60 last:border-b-0 text-xs">
            <span class="font-semibold text-stone-800">${qty}x ${name} <span class="text-[10px] text-pink-600 font-normal">(${genLabel})</span></span>
            <span class="font-serif font-bold text-stone-700">$${(tier.price * qty).toFixed(2)}</span>
          </div>
        `;
      }).join("");
    }

    if (tierBadge) {
      tierBadge.classList.remove("hidden");
      tierBadge.className = `text-[11px] p-2 rounded-xl font-bold text-center border ${tier.badgeClass}`;
      if (totalQty >= 12) {
        tierBadge.innerHTML = `🌟 ¡Tarifa Docena/Caja activada! <strong>$${tier.price.toFixed(2)} c/u</strong> (Total: $${subtotal.toFixed(2)})`;
      } else if (totalQty >= 3) {
        tierBadge.innerHTML = `🎉 ¡Precio al Mayor activado! <strong>$${tier.price.toFixed(2)} c/u</strong> (Total: $${subtotal.toFixed(2)})`;
      } else {
        const falta = 3 - totalQty;
        tierBadge.innerHTML = `💡 Precio Unitario: $${tier.price.toFixed(2)} c/u. <em>¡Agrega ${falta} más para precio al mayor a $${(product.mayor_price || 20).toFixed(2)}!</em>`;
      }
    }

    if (addBtnText) {
      addBtnText.textContent = `Agregar ${totalQty} ${totalQty === 1 ? 'Crema' : 'Cremas'} ($${subtotal.toFixed(2)})`;
    }

    const priceEl = document.getElementById("modalProductPrice");
    const compareEl = document.getElementById("modalComparePrice");
    if (priceEl) priceEl.textContent = `$${tier.price.toFixed(2)}`;
    if (compareEl) {
      compareEl.textContent = `(${tier.label})`;
      compareEl.className = `text-xs font-bold px-2 py-0.5 rounded-full border ${tier.badgeClass}`;
    }
  };

  const renderAromaCards = (genero) => {
    const listEl = document.getElementById("valquinAromasCardsList");
    if (!listEl) return;
    const items = genero === "damas" ? damas : caballeros;

    listEl.innerHTML = items.map(a => {
      const qty = state.valquinMultiQtys[a.id] || 0;
      const isSelected = qty > 0;
      const isAgotado = !a.disponible;

      return `
        <div class="aroma-card border ${isSelected ? 'border-pink-500 bg-pink-50/50 shadow-xs ring-1 ring-pink-400' : isAgotado ? 'border-red-200 bg-red-50/30 opacity-75' : 'border-stone-200 bg-white hover:border-pink-300'} rounded-xl p-2.5 transition-all select-none" data-aroma-id="${a.id}">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-lg shrink-0">${a.icono}</span>
              <div class="truncate flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-xs ${isAgotado ? 'text-stone-500 line-through' : 'text-stone-900'}">${a.nombre}</span>
                  ${isSelected ? `<span class="bg-pink-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">${qty}</span>` : ''}
                </div>
                <span class="text-[10px] text-stone-500 block truncate">${a.familia}</span>
              </div>
            </div>

            <!-- Controles o Estado -->
            <div class="flex items-center gap-1.5 shrink-0">
              ${isAgotado ? `
                <button type="button" class="aroma-agotado-btn px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 transition-colors">
                  Agotado ❌
                </button>
              ` : `
                <!-- Selector de Cantidad Multi [-] [qty] [+] -->
                <div class="flex items-center border ${isSelected ? 'border-pink-400 bg-white' : 'border-stone-200 bg-stone-50'} rounded-lg overflow-hidden shadow-xs">
                  <button type="button" class="aroma-minus-btn px-2.5 py-1 text-xs font-bold ${qty > 0 ? 'text-pink-700 hover:bg-pink-100' : 'text-stone-300 cursor-not-allowed'} transition-colors" ${qty === 0 ? 'disabled' : ''}>
                    -
                  </button>
                  <span class="aroma-qty-val px-2 py-1 text-xs font-black min-w-[24px] text-center ${isSelected ? 'text-pink-700 bg-pink-50' : 'text-stone-600'}">
                    ${qty}
                  </span>
                  <button type="button" class="aroma-plus-btn px-2.5 py-1 text-xs font-bold text-pink-700 hover:bg-pink-100 transition-colors">
                    +
                  </button>
                </div>
              `}

              <!-- Botón Ver Notas Olfativas -->
              <button type="button" class="toggle-notes-btn p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors" title="Ver pirámide olfativa">
                <i data-lucide="chevron-down" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Pirámide Olfativa Acordeón (Desplegable) -->
          <div class="aroma-notes-box hidden mt-2.5 pt-2 border-t border-stone-100 text-[11px] space-y-1.5 bg-stone-50/90 p-2.5 rounded-lg">
            <div class="flex items-start gap-1.5">
              <span class="font-bold text-emerald-800 shrink-0">🍃 Salida:</span>
              <span class="text-stone-600">${a.salida}</span>
            </div>
            <div class="flex items-start gap-1.5">
              <span class="font-bold text-pink-800 shrink-0">🌸 Corazón:</span>
              <span class="text-stone-600">${a.corazon}</span>
            </div>
            <div class="flex items-start gap-1.5">
              <span class="font-bold text-amber-900 shrink-0">🪵 Fondo:</span>
              <span class="text-stone-600">${a.fondo}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();

    // Asignar listeners a cada tarjeta
    listEl.querySelectorAll(".aroma-card").forEach(card => {
      const aromaId = card.dataset.aromaId;
      const aromaObj = aromas.find(x => x.id === aromaId);

      const toggleBtn = card.querySelector(".toggle-notes-btn");
      const notesBox = card.querySelector(".aroma-notes-box");

      const toggleNotes = (e) => {
        if (e) e.stopPropagation();
        const isOpen = !notesBox.classList.contains("hidden");
        notesBox.classList.toggle("hidden", isOpen);
        const icon = card.querySelector(".toggle-notes-btn i");
        if (icon) {
          icon.setAttribute("data-lucide", isOpen ? "chevron-down" : "chevron-up");
          if (window.lucide) window.lucide.createIcons();
        }
      };

      if (toggleBtn) toggleBtn.addEventListener("click", toggleNotes);

      const agotadoBtn = card.querySelector(".aroma-agotado-btn");
      if (agotadoBtn) {
        agotadoBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showAromaAgotadoAlert(aromaObj);
        });
      }

      const minusBtn = card.querySelector(".aroma-minus-btn");
      const plusBtn = card.querySelector(".aroma-plus-btn");

      if (minusBtn) {
        minusBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const current = state.valquinMultiQtys[aromaId] || 0;
          if (current > 0) {
            state.valquinMultiQtys[aromaId] = current - 1;
            renderAromaCards(activeTab);
            updateSummaryUI();
          }
        });
      }

      if (plusBtn) {
        plusBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const current = state.valquinMultiQtys[aromaId] || 0;
          state.valquinMultiQtys[aromaId] = current + 1;
          renderAromaCards(activeTab);
          updateSummaryUI();
        });
      }
    });
  };

  tabDamasBtn.addEventListener("click", () => {
    activeTab = "damas";
    tabDamasBtn.className = "flex-1 py-2 px-3 rounded-lg bg-pink-600 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 font-bold";
    tabCaballerosBtn.className = "flex-1 py-2 px-3 rounded-lg text-stone-600 hover:text-stone-900 transition-all flex items-center justify-center gap-1.5 font-bold";
    renderAromaCards("damas");
  });

  tabCaballerosBtn.addEventListener("click", () => {
    activeTab = "caballeros";
    tabCaballerosBtn.className = "flex-1 py-2 px-3 rounded-lg bg-pink-600 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 font-bold";
    tabDamasBtn.className = "flex-1 py-2 px-3 rounded-lg text-stone-600 hover:text-stone-900 transition-all flex items-center justify-center gap-1.5 font-bold";
    renderAromaCards("caballeros");
  });

  // Render inicial
  renderAromaCards("damas");
  updateSummaryUI();
}

// ----------------- AVISO / MODAL DE AROMA AGOTADO -----------------

function showAromaAgotadoAlert(aroma) {
  const modal = document.getElementById("aromaAgotadoAlertModal");
  const panel = document.getElementById("aromaAgotadoPanel");
  const title = document.getElementById("aromaAgotadoTitle");
  const msg = document.getElementById("aromaAgotadoMessage");

  if (!modal) {
    alert(`⚠️ Lo sentimos, el aroma "${aroma.nombre}" está agotado temporalmente. Por favor elige otro aroma disponible.`);
    return;
  }

  title.textContent = `Aroma Agotado: ${aroma.nombre} ❌`;
  msg.innerHTML = `
    Lo sentimos mucho, la fragancia <strong>"${aroma.nombre}"</strong> (${aroma.generoLabel}) se encuentra <strong>agotada temporalmente</strong>.<br><br>
    ✨ ¡Aún tenemos otros aromas deliciosos disponibles para tus cremas Valquin! Por favor selecciona cualquiera de los que están en stock para tu pedido.
  `;

  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
    panel.classList.remove("scale-95");
    panel.classList.add("scale-100");
  }, 10);
}

function closeAromaAgotadoAlert() {
  const modal = document.getElementById("aromaAgotadoAlertModal");
  const panel = document.getElementById("aromaAgotadoPanel");
  if (!modal) return;

  panel.classList.add("scale-95");
  panel.classList.remove("scale-100");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 150);
}

// ----------------- EXPERIENCIA DE TONOS / VARIANTES GENERAL -----------------

function renderProductTonosGuide(product) {
  const container = document.getElementById("valquinSpecialContainer");
  const descEl = document.getElementById("modalProductDesc");
  const descTitle = document.getElementById("modalDescTitle");
  const summaryBox = document.getElementById("valquinMultiSummaryBox");
  const totalCountBadge = document.getElementById("valquinMultiTotalCountBadge");
  const itemsListEl = document.getElementById("valquinMultiItemsList");
  const tierBadge = document.getElementById("valquinMultiTierBadge");
  const addBtnText = document.getElementById("modalAddToCartBtnText");

  if (!container) return;

  container.classList.remove("hidden");
  if (summaryBox) summaryBox.classList.remove("hidden");
  if (descTitle) descTitle.textContent = "🎨 Tonos Disponibles & Cantidades:";

  if (descEl) {
    descEl.innerHTML = `
      <div class="p-2.5 rounded-xl bg-pink-50/60 border border-pink-200/80 text-stone-700 space-y-1">
        <p class="font-medium">✨ <strong>Tonos / Variantes disponibles:</strong></p>
        <p class="text-[11px] text-pink-700 font-semibold">👇 Puedes combinar diferentes tonos en tu pedido. Usa los botones <strong>[+]</strong> y <strong>[-]</strong> para sumar las cantidades de cada uno:</p>
      </div>
    `;
  }

  const tonos = (product.tonos || []).map((t, idx) => {
    if (typeof t === 'string') {
      return { id: "tono-" + idx, nombre: t, disponible: true };
    }
    return {
      id: t.id || ("tono-" + idx),
      nombre: t.nombre || "Tono " + (idx + 1),
      disponible: t.disponible !== false
    };
  });

  container.innerHTML = `
    <div id="productTonosCardsList" class="space-y-2 max-h-72 overflow-y-auto pr-1">
      <!-- Rellenado dinámicamente -->
    </div>
  `;

  const updateTonosSummaryUI = () => {
    const selectedEntries = Object.entries(state.tonosMultiQtys).filter(([_, qty]) => qty > 0);
    const totalQty = selectedEntries.reduce((sum, [_, q]) => sum + q, 0);

    if (totalCountBadge) {
      totalCountBadge.textContent = `${totalQty} ${totalQty === 1 ? 'unidad' : 'unidades'}`;
    }

    if (totalQty === 0) {
      if (itemsListEl) {
        itemsListEl.innerHTML = `<span class="text-stone-400 italic text-[10px]">Toca [+] en los tonos que desees arriba para armar tu pedido variado.</span>`;
      }
      if (tierBadge) tierBadge.classList.add("hidden");
      if (addBtnText) addBtnText.textContent = "Agregar al Pedido (Elige tonos)";
      const priceEl = document.getElementById("modalProductPrice");
      const compareEl = document.getElementById("modalComparePrice");
      if (priceEl) priceEl.textContent = `$${(product.price || 0).toFixed(2)}`;
      if (compareEl) {
        compareEl.textContent = "(Unitario)";
        compareEl.className = "text-xs font-bold px-2 py-0.5 rounded-full border bg-stone-100 text-stone-700 border-stone-200";
      }
      return;
    }

    const tier = getItemTier(product, totalQty);
    const subtotal = tier.price * totalQty;

    if (itemsListEl) {
      itemsListEl.innerHTML = selectedEntries.map(([tonoId, qty]) => {
        const t = tonos.find(x => x.id === tonoId);
        const name = t ? t.nombre : tonoId;
        return `
          <div class="flex items-center justify-between py-1 border-b border-pink-100/60 last:border-b-0 text-xs">
            <span class="font-semibold text-stone-800">${qty}x ${name}</span>
            <span class="font-serif font-bold text-stone-700">$${(tier.price * qty).toFixed(2)}</span>
          </div>
        `;
      }).join("");
    }

    if (tierBadge) {
      tierBadge.classList.remove("hidden");
      tierBadge.className = `text-[11px] p-2 rounded-xl font-bold text-center border ${tier.badgeClass}`;
      if (totalQty >= 12) {
        tierBadge.innerHTML = `🌟 ¡Tarifa Docena/Caja activada! <strong>$${tier.price.toFixed(2)} c/u</strong> (Total: $${subtotal.toFixed(2)})`;
      } else if (totalQty >= 3) {
        tierBadge.innerHTML = `🎉 ¡Precio al Mayor activado! <strong>$${tier.price.toFixed(2)} c/u</strong> (Total: $${subtotal.toFixed(2)})`;
      } else {
        const falta = 3 - totalQty;
        tierBadge.innerHTML = `💡 Precio Unitario: $${tier.price.toFixed(2)} c/u. <em>¡Agrega ${falta} más para precio al mayor a $${(product.mayor_price || product.price).toFixed(2)}!</em>`;
      }
    }

    if (addBtnText) {
      addBtnText.textContent = `Agregar ${totalQty} ${totalQty === 1 ? 'unidad' : 'unidades'} ($${subtotal.toFixed(2)})`;
    }

    const priceEl = document.getElementById("modalProductPrice");
    const compareEl = document.getElementById("modalComparePrice");
    if (priceEl) priceEl.textContent = `$${tier.price.toFixed(2)}`;
    if (compareEl) {
      compareEl.textContent = `(${tier.label})`;
      compareEl.className = `text-xs font-bold px-2 py-0.5 rounded-full border ${tier.badgeClass}`;
    }
  };

  const renderTonoCards = () => {
    const listEl = document.getElementById("productTonosCardsList");
    if (!listEl) return;

    listEl.innerHTML = tonos.map(t => {
      const qty = state.tonosMultiQtys[t.id] || 0;
      const isSelected = qty > 0;
      const isAgotado = !t.disponible;

      return `
        <div class="tono-card border ${isSelected ? 'border-pink-500 bg-pink-50/50 shadow-xs ring-1 ring-pink-400' : isAgotado ? 'border-red-200 bg-red-50/30 opacity-75' : 'border-stone-200 bg-white hover:border-pink-300'} rounded-xl p-2.5 transition-all select-none" data-tono-id="${t.id}">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="w-2.5 h-2.5 rounded-full ${isAgotado ? 'bg-red-400' : 'bg-pink-500'} shrink-0"></span>
              <div class="truncate flex-1">
                <span class="font-bold text-xs ${isAgotado ? 'text-stone-500 line-through' : 'text-stone-900'}">${t.nombre}</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              ${isAgotado ? `
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  Agotado ❌
                </span>
              ` : `
                <div class="flex items-center border ${isSelected ? 'border-pink-400 bg-white' : 'border-stone-200 bg-stone-50'} rounded-lg overflow-hidden shadow-xs">
                  <button type="button" class="tono-minus-btn px-2.5 py-1 text-xs font-bold ${qty > 0 ? 'text-pink-700 hover:bg-pink-100' : 'text-stone-300 cursor-not-allowed'} transition-colors" ${qty === 0 ? 'disabled' : ''}>
                    -
                  </button>
                  <span class="tono-qty-val px-2 py-1 text-xs font-black min-w-[24px] text-center ${isSelected ? 'text-pink-700 bg-pink-50' : 'text-stone-600'}">
                    ${qty}
                  </span>
                  <button type="button" class="tono-plus-btn px-2.5 py-1 text-xs font-bold text-pink-700 hover:bg-pink-100 transition-colors">
                    +
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".tono-plus-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".tono-card");
        const tonoId = card.dataset.tonoId;
        state.tonosMultiQtys[tonoId] = (state.tonosMultiQtys[tonoId] || 0) + 1;
        renderTonoCards();
        updateTonosSummaryUI();
      });
    });

    listEl.querySelectorAll(".tono-minus-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".tono-card");
        const tonoId = card.dataset.tonoId;
        if ((state.tonosMultiQtys[tonoId] || 0) > 0) {
          state.tonosMultiQtys[tonoId]--;
          renderTonoCards();
          updateTonosSummaryUI();
        }
      });
    });
  };

  renderTonoCards();
  updateTonosSummaryUI();
}
