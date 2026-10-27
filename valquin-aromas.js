// ==========================================================================
// GUÍA OFICIAL DE AROMAS - CREMAS CORPORALES VALQUIN (19 AROMAS)
// Tiffany Cosmetic EC
// ==========================================================================

const VALQUIN_CATALOGO_DEFAULT = [
  // ----------------- CABALLEROS (10 AROMAS) -----------------
  {
    id: "mediterraneo-h",
    nombre: "MEDITERRÁNEO",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Amaderado Especiado Oriental",
    icono: "🌊",
    salida: "Azafrán, nuez moscada y lavanda.",
    corazon: "Madera de oud y pachulí.",
    fondo: "Madera de oud, pachulí y almizcle.",
    disponible: true
  },
  {
    id: "dubai-h",
    nombre: "DUBAI (Hombre)",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Ámbar Cálido & Especiado",
    icono: "🏜️",
    salida: "Bergamota, pimienta rosa, jazmín y flor de azahar del naranjo.",
    corazon: "Lavanda, elemí, geranio, azafrán, vetiver y cempasúchil.",
    fondo: "Ambroxan, ámbar, pachulí, cedro y ládano.",
    disponible: true
  },
  {
    id: "eros-h",
    nombre: "EROS",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Cálido, Dulce & Ambarado",
    icono: "🔥",
    salida: "Canela, nuez moscada y bergamota.",
    corazon: "Dátiles, praliné, nardos y mahonial.",
    fondo: "Haba tonka, amberwood, mirra, benjuí y akigalawood.",
    disponible: true
  },
  {
    id: "monaco-h",
    nombre: "MÓNACO",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Especiado con Cuero y Vainilla",
    icono: "🏎️",
    salida: "Jengibre, tomillo, toronja (pomelo), bergamota y acordes verdes.",
    corazon: "Vainilla, licor, canela, cuero y manzana.",
    fondo: "Mirra, azúcar, cedro, notas amaderadas, cachemira y pachulí.",
    disponible: true
  },
  {
    id: "constelation-h",
    nombre: "CONSTELATION (Hombre)",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Cítrico Frutal Elegante",
    icono: "✨",
    salida: "Limón (lima ácida), piña, bergamota, grosellas negras y manzana.",
    corazon: "Abedul, jazmín y rosa.",
    fondo: "Almizcle, ámbar gris, pachulí y vainilla.",
    disponible: true
  },
  {
    id: "la-nuit-h",
    nombre: "LA NUIT",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Dulce Gourmand & Frutal",
    icono: "🌙",
    salida: "Casis (grosellero negro), algodón de azúcar, bergamota, jazmín, coco, melón y mandarina.",
    corazon: "Miel, ciruela, bayas rojas, frambuesa negra, durazno, rosa, orquídea y lirio.",
    fondo: "Pachulí, chocolate, caramelo, haba tonka, vainilla, ámbar y almizcle.",
    disponible: true
  },
  {
    id: "la-rue-h",
    nombre: "LA RUE",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Cítrico Aromático & Marino",
    icono: "⚓",
    salida: "Limón de Amalfi (lima de Amalfi) y lavanda.",
    corazon: "Cipriol (nagarmota) y notas marinas.",
    fondo: "Ámbar y pachulí.",
    disponible: true
  },
  {
    id: "rio-janeiro-h",
    nombre: "RÍO DE JANEIRO (Hombre)",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Cítrico Acuático & Amaderado Tropical",
    icono: "🌊",
    salida: "Lima brasileña, bergamota fresca y brisa marina tropical.",
    corazon: "Lavanda ligera, notas verdes y un toque chispeante de jengibre.",
    fondo: "Madera de cedro, ámbar cálido y almizcle limpio.",
    disponible: true
  },
  {
    id: "deja-vu-h",
    nombre: "DÉJÀ VU",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Oriental Especiado & Cuero Distinguido",
    icono: "🎩",
    salida: "Cardamomo y nuez moscada especiada.",
    corazon: "Cuero elegante y lavanda aromática refinada.",
    fondo: "Vainilla cremosa, pachulí y ládano ambarado.",
    disponible: true
  },
  {
    id: "natores-h",
    nombre: "NATORES (Aroma de Dioses)",
    genero: "hombre",
    generoLabel: "Caballero",
    familia: "Amaderado Licoroso & Aromático Espartano",
    icono: "⚔️",
    salida: "Helado refrescante, anís, regaliz y ajenjo.",
    corazon: "Ron añejo, notas amaderadas, flor de azahar, rosa, almendra y azúcar tostada.",
    fondo: "Madera de cedro, ládano, vainilla profunda y almizcle potente.",
    disponible: true
  },

  // ----------------- DAMAS (9 AROMAS) -----------------
  {
    id: "aphrodite-m",
    nombre: "APHRODITE",
    genero: "mujer",
    generoLabel: "Dama",
    familia: "Oriental Floral & Gourmand",
    icono: "👑",
    salida: "Café, bergamota y limón (lima ácida).",
    corazon: "Nardos, jazmín sambac, flor de azahar del naranjo, rosa de Bulgaria y raíz de lirio.",
    fondo: "Haba tonka, cacao, vainilla, praliné, sándalo, almizcle, ámbar, cachemira y canela.",
    disponible: true
  },
  {
    id: "dubai-m",
    nombre: "DUBAI (Mujer)",
    genero: "mujer",
    generoLabel: "Dama",
    familia: "Frutal Exótico con Mango & Vainilla",
    icono: "🥭",
    salida: "Mango y bergamota.",
    corazon: "Jazmín e incienso de olíbano (franquincienso).",
    fondo: "Sándalo y vainilla.",
    disponible: true
  },
  {
    id: "marcella-m",
    nombre: "MARCELLA",
    genero: "mujer",
    generoLabel: "Dama",
    familia: "Floral Blanco & Frutal Fresco",
    icono: "🌸",
    salida: "Pera, naranja tangerina, gardenia y jazmín.",
    corazon: "Madreselva, flor del naranjo africano y lirio de los valles.",
    fondo: "Vainilla, ámbar, almizcle y sándalo.",
    disponible: true
  },
  {
    id: "constelacion-m",
    nombre: "CONSTELACIÓN (Mujer)",
    genero: "mujer",
    generoLabel: "Dama",
    familia: "Frutal Floral & Dulce",
    icono: "⭐",
    salida: "Lichi y grosella roja.",
    corazon: "Rosa fina.",
    fondo: "Vainilla y vetiver.",
    disponible: true
  },
  {
    id: "bellisima-m",
    nombre: "BELLÍSIMA",
    genero: "mujer",
    generoLabel: "Dama",
    familia: "Floral Soleado con Coco & Vainilla",
    icono: "🥥",
    salida: "Aceite de bergamota, mandarina, pimienta y rosa.",
    corazon: "Acorde de coco soleado, flor de naranja y jazmín de sambac.",
    fondo: "Concreto de iris, pachulí balinés e infusión de vainilla de Madagascar.",
    disponible: true
  },
  {
    id: "sexe-a-paris-m",
    nombre: "SEXE A PARIS",
    genero: "mujer",
    generoLabel: "Dama",
    familia: "Cítrico Vainilla, Sal & Maderas",
    icono: "🗼",
    salida: "Flor de azahar del naranjo, cáscara de naranja y mandarina.",
    corazon: "Vainilla y sal marina.",
    fondo: "Ámbar gris, madera de cachemira y sándalo.",
    disponible: true
  },
  {
    id: "rio-janeiro-m",
    nombre: "RÍO DE JANEIRO (Mujer)",
    genero: "mujer",
    generoLabel: "Dama",
    familia: "Gourmand Tropical & Floral Cálido",
    icono: "🌴",
    salida: "Pistacho, almendra dulce y acordes frutales cítricos tropicales.",
    corazon: "Pétalos de jazmín, heliotropo y toques solares envolventes.",
    fondo: "Vainilla dulce, caramelo salado, sándalo y almizcle suave.",
    disponible: true
  },
  {
    id: "ikigai-m",
    nombre: "IKIGAI",
    genero: "mujer",
    generoLabel: "Dama",
    familia: "Cítrico Zen / Floral Fresco & Relajante",
    icono: "🎍",
    salida: "Madera de amberwood y petitgrain vivaz.",
    corazon: "Yuzu japonés fresco, equilibrado y aromático.",
    fondo: "Pomelo dulce y almizcle blanco sedoso.",
    disponible: true
  },
  {
    id: "venecia-m",
    nombre: "VENECIA",
    genero: "mujer",
    generoLabel: "Dama / Unisex",
    familia: "Gourmand Envolvente & Dulce Ambarado",
    icono: "🎭",
    salida: "Acordes azucarados chispeantes, bayas rojas y cítricos suaves.",
    corazon: "Flores blancas delicadas, crema batida y vainilla sedosa.",
    fondo: "Ámbar cálido, haba tonka y almizcle aterciopelado.",
    disponible: true
  }
];

// Módulo Global de Gestión de Aromas Valquin
window.ValquinAromasManager = {
  STORAGE_KEY: "valquin_aromas_status_v1",

  // Aromas guardados en Supabase (columna "tonos" del producto Valquin).
  // Si existen, mandan sobre la lista de abajo y sobre lo guardado en este navegador.
  _desdeSupabase: null,

  esValquin: function(p) {
    const id = String((p && p.id) || "").toLowerCase();
    const titulo = String((p && (p.titulo || p.title)) || "").toLowerCase();
    return id.includes("valquin") || titulo.includes("valquin");
  },

  usarTonosDeProducto: function(tonos) {
    this._desdeSupabase = Array.isArray(tonos) && tonos.length ? tonos : null;
  },

  // Obtener lista completa combinando defaults con el estado guardado (disponible / agotado)
  getAromas: function() {
    if (this._desdeSupabase) {
      return this._desdeSupabase.map(t => {
        // Un aroma agregado desde el formulario de edición solo trae el nombre:
        // se completa con valores por defecto para que aparezca en la guía
        const base = VALQUIN_CATALOGO_DEFAULT.find(a => a.id === t.id) ||
          { genero: "mujer", generoLabel: "Dama / Unisex", familia: "", icono: "🌸", salida: "", corazon: "", fondo: "" };
        return { ...base, ...t, disponible: t.disponible !== false };
      });
    }

    let savedStatus = {};
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) savedStatus = JSON.parse(raw);
    } catch (e) {
      console.warn("Error leyendo status de aromas:", e);
    }

    return VALQUIN_CATALOGO_DEFAULT.map(a => {
      const isOverridden = savedStatus.hasOwnProperty(a.id);
      return {
        ...a,
        disponible: isOverridden ? Boolean(savedStatus[a.id]) : a.disponible
      };
    });
  },

  // Obtener aroma por ID
  getAromaById: function(aromaId) {
    return this.getAromas().find(a => a.id === aromaId) || null;
  },

  // Cambiar disponibilidad de un aroma (true = disponible, false = agotado)
  setAvailability: function(aromaId, isAvailable) {
    let savedStatus = {};
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) savedStatus = JSON.parse(raw);
    } catch (e) {}

    savedStatus[aromaId] = Boolean(isAvailable);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedStatus));
    return this.getAromas();
  },

  // Restablecer todos a disponibles
  resetAll: function() {
    localStorage.removeItem(this.STORAGE_KEY);
    return VALQUIN_CATALOGO_DEFAULT;
  }
};
