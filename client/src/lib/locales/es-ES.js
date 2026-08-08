// Español (España) language pack
export default {
  __meta: { code: 'es-ES', label: 'Español', short: 'ES' },

  common: {
    yes: 'Sí',
    no: 'No',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    submit: 'Enviar',
    loading: 'Cargando…',
    retry: 'Reintentar',
    back: 'Atrás',
    next: 'Siguiente',
    prev: 'Anterior',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    all: 'Todos',
    more: 'Más',
    less: 'Menos',
    close: 'Cerrar',
    edit: 'Editar',
    delete: 'Eliminar',
    copy: 'Copiar',
    share: 'Compartir',
    minutesAgo: 'hace {n} min',
    hoursAgo: 'hace {n}h',
    daysAgo: 'hace {n}d',
    online: 'En línea',
    offline: 'Sin conexión'
  },

  nav: {
    home: 'Inicio',
    problems: 'Problemas',
    leaderboard: 'Clasificación',
    chain: 'Cadena',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    logout: 'Cerrar sesión',
    profile: 'Perfil',
    language: 'Idioma'
  },

  home: {
    title: 'Resuelve los {n} problemas más difíciles del mundo con IA',
    subtitle: 'De Riemann a superconductores a temperatura ambiente, de la consciencia a la fusión',
    desc: 'Cualquiera puede usar IA para intentarlo. Cada solución gana {reward}.',
    reward: 'puntos HPW en cadena',
    cta: 'Empezar a resolver →',
    ctaLeaderboard: 'Clasificación',
    statsProblems: 'Problemas',
    statsSolved: 'Soluciones',
    statsUsers: 'Solucionadores',
    statsRewards: 'HPW pagados',
    categories: '{n} disciplinas',
    categoriesDesc: 'Elige un campo para ver lo que la humanidad aún no ha resuelto',
    viewAll: 'Todos los problemas →',
    liveOnChain: '{txs} txs en cadena · {blocks} bloques'
  },

  problems: {
    title: 'Todos los problemas difíciles',
    subtitle: '{n} desafíos en 8 disciplinas',
    searchPlaceholder: 'Buscar problemas, etiquetas, palabras clave…',
    filterCategory: 'Categoría',
    filterStatus: 'Estado',
    statusAll: 'Todos',
    statusOpen: 'Abierto',
    statusPartial: 'Parcial',
    statusSolved: 'Resuelto',
    difficulty: 'Dificultad',
    reward: 'Recompensa',
    solutions: 'Soluciones',
    votes: 'Votos netos',
    tags: 'Etiquetas',
    year: 'Año',
    proposer: 'Proponente',
    empty: 'No hay problemas que coincidan con tu búsqueda'
  },

  problem: {
    back: '← Volver a problemas',
    info: 'Información',
    kidExplain: 'Explicación para niños',
    formalStatement: 'Declaración formal',
    whyHard: 'Por qué es difícil',
    howToEarn: 'Cómo ganar puntos',
    earnSubmit: 'Enviar cualquier solución: +{n} HPW',
    earnAi: 'Puntuación IA ≥ {n}: +{m} HPW por punto',
    earnVote: 'Votos positivos (cada uno): +{n} HPW al autor',
    earnFullSolve: 'Resolver completo: hasta {n} HPW',
    earnRule: 'Todos los puntos se auto-apuestan en 5s. Permanentes en cadena.',
    aiSolver: 'Asistente IA',
    aiSolverDesc: 'Dile a la IA tu ángulo. Responderá en 3 capas: popular → académico → dirección de investigación.',
    aiUsingLLM: 'usando LLM real',
    aiFallback: 'respaldo heurístico',
    userInputPlaceholder: '(opcional) ¿ej. explicar con un ejemplo?',
    runAi: 'Preguntar a la IA',
    noSolution: 'Aún no hay soluciones. ¡Sé el primero!',
    submitSolution: 'Enviar solución',
    submittedBy: 'por {user}',
    quality: 'Puntuación IA',
    selfTest: 'Mi solución'
  },

  submit: {
    title: 'Mi solución',
    contentPlaceholder: 'Escribe tus ideas. Al menos 20 caracteres. Mejor estructura = mayor puntuación.',
    tooShort: 'Solución demasiado corta (mín. 20 caracteres)',
    submitted: '¡Enviado!',
    submitFailed: 'Error al enviar: {msg}'
  },

  leaderboard: {
    title: 'Clasificación',
    subtitle: 'Ordenado por HPW en cadena. Nuevo bloque cada 5 segundos.',
    solvers: 'Solucionadores',
    solutions: 'Soluciones totales',
    txOnChain: 'Txs en cadena',
    height: 'Altura de cadena',
    rewardsPaid: 'Recompensas pagadas',
    rank: 'Rango',
    score: 'Puntos',
    badges: 'Insignias',
    badgesTitle: '{n} niveles de insignia de challenger'
  },

  chain: {
    title: 'Explorador de blockchain',
    subtitle: 'Cada transacción de puntos está inmutablemente en cadena. Haz clic en un bloque para ver detalles.',
    height: 'Altura (bloques)',
    totalTxs: 'Txs totales',
    totalSupply: 'Suministro total (HPW)',
    valid: 'Válido',
    invalid: 'Inválido',
    selectBlock: 'Haz clic en un bloque de la izquierda para ver las transacciones',
    latestBlocks: 'Últimos bloques',
    latestTxs: 'Últimas txs',
    txId: 'ID de tx',
    type: 'Tipo',
    to: 'Para',
    amount: 'Cantidad',
    time: 'Hora',
    empty: 'Sin datos'
  },

  auth: {
    title: 'Únete a los problemas difíciles',
    subtitle: 'Crea una cuenta y empieza a resolver',
    username: 'Usuario',
    usernameHint: '2-30 caracteres, alfanuméricos, _, CJK, -',
    password: 'Contraseña',
    passwordHint: '6-200 caracteres',
    bio: 'Bio (opcional)',
    bioHint: 'máx 200 caracteres',
    register: 'Registrarse',
    login: 'Iniciar sesión',
    switchToLogin: '¿Ya tienes cuenta? Inicia sesión',
    switchToRegister: '¿No tienes cuenta? Regístrate',
    welcome: 'Bono de bienvenida de 100 HPW',
    errUsername: 'El usuario debe tener 2-30 caracteres',
    errPassword: 'La contraseña debe tener 6-200 caracteres',
    errTaken: 'Usuario en uso',
    errWrong: 'Usuario o contraseña incorrectos'
  },

  notFound: {
    title: '404 — Página no encontrada',
    desc: 'La página que buscas no existe, o aún no ha sido indexada. ¿Qué tal explorar {n} problemas difíciles?',
    home: '← Inicio',
    browse: 'Explorar problemas',
    rank: 'Clasificación'
  },

  pwa: {
    install: 'Instala HardProblems en tu dispositivo para acceso rápido',
    installShort: 'Instalar',
    update: 'Nueva versión lista',
    updateNow: 'Actualizar ahora',
    offline: 'Estás sin conexión · algunas funciones no disponibles'
  },

  categories: {
    mathematics: 'Matemáticas',
    physics: 'Física',
    chemistry: 'Química',
    biology: 'Ciencias de la Vida',
    cs: 'Ciencias de la Computación',
    philosophy: 'Filosofía',
    engineering: 'Ingeniería',
    social: 'Ciencias Sociales'
  }
};
