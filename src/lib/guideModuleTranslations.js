/**
 * Interactive app guide copy (HowToUse). Flattened into t[lang].guide_m{N}_* keys via pageTranslations.
 */
export const GUIDE_MODULES = {
  en: [
    { name: 'Getting Started', steps: [
      { title: 'Welcome to Stewardship Hub', desc: 'This app helps you manage finances with faith-based principles. Track budget, investments, loans, and grow with a community.', tip: 'Available in 15 languages — tap the flag button at the top!' },
      { title: 'Navigate with bottom tabs', desc: 'The bottom bar has 6 tabs: Home, Budget, Invest, Loans, Community, and Explore. Tap any tab to switch features.', tip: 'The Home tab shows your full financial summary at a glance.' },
      { title: 'Settings & profile', desc: 'Tap the ⚙️ gear icon at the top right to access Settings — set your currency, language, and manage your account.', tip: 'Set your currency first! It affects all amounts across the app.' },
    ]},
    { name: 'Budget Tracker', steps: [
      { title: 'Open the Budget tab', desc: 'Tap "Budget" in the bottom nav. You\'ll see Income, Expenses, and Net Surplus cards for the current month.', tip: 'Use the ‹ › arrows to navigate between past and future months.' },
      { title: 'Add income & expenses', desc: 'Tap "+ Add row" under Income or Expenses. Enter description and amount, choose a category, then tap Save.', tip: 'Categories: Needs = rent/food. Wants = entertainment. Giving = tithe.' },
      { title: 'Your surplus is auto-calculated', desc: 'The app shows your NET SURPLUS automatically. Green means you\'re ahead. Red means you\'re overspending.', tip: 'Aim to save at least 20% of your income every month.' },
    ]},
    { name: 'Investment Tracker', steps: [
      { title: 'Track your portfolio', desc: 'Tap "Invest" in the bottom nav. See total portfolio value, invested amount, and overall ROI updated live.', tip: 'ROI = Return on Investment. It shows how much your money has grown.' },
      { title: 'Add investments with live prices', desc: 'Tap "+ Add row". Enter name (e.g. "Bitcoin" or "S&P 500") — the type is auto-detected and live price appears instantly.', tip: 'Type is auto-detected: "Bitcoin" → Crypto, "S&P 500" → Index funds.' },
      { title: 'View live market prices', desc: 'Tap "🌐 View Live Market Prices" to see real-time prices for stocks, ETFs, and 16+ cryptocurrencies.', tip: 'Tap 🔄 Refresh to get the latest prices anytime.' },
    ]},
    { name: 'Loan Tracker', steps: [
      { title: 'Track all your debt', desc: 'Tap "Loans" in the bottom nav. See total debt, monthly payment, and a list of all loans.', tip: 'Goal: get ALL loans to zero. Debt freedom = financial freedom.' },
      { title: 'Add a loan', desc: 'Tap +. Enter loan type, lender, principal amount, interest rate (%), and term in months. Monthly payment auto-calculates.', tip: 'Example: Car loan, Chase Bank, $20,000, 6.5%, 60 months.' },
      { title: 'View amortization table', desc: 'Tap any loan to expand it. See the full month-by-month breakdown of principal vs interest payments.', tip: 'Debt snowball strategy: pay off the smallest loan first, then roll payments to the next.' },
    ]},
    { name: '$100 Challenge', steps: [
      { title: '30-day financial challenge', desc: 'The $100 Challenge has 30 daily tasks. Each one builds a new financial habit. Tap "Challenge" to start.', tip: '30 days, 30 tasks, $100 saved. The habit matters more than the amount.' },
      { title: 'Complete a day', desc: 'Tap the current day card. Read the task, enter the amount you saved, write a reflection, then tap "Mark complete".', tip: 'Even saving $1 counts. Start small and build momentum.' },
      { title: 'Track your 30-day grid', desc: 'The dot grid shows your progress: Green ✓ = done, green outline = today, gray = upcoming.', tip: 'After the challenge, invest your $100 in an index fund!' },
    ]},
    { name: 'Real Estate Guide', steps: [
      { title: 'Home buying checklist', desc: 'The Real Estate Guide walks you through 5 phases: Financial Prep, Mortgage Ready, House Search, Offer & Closing, and After Purchase.', tip: 'Don\'t skip phases! Each one prepares you for the next.' },
      { title: 'Track each step', desc: 'Tap a checklist item to cycle its status: Not Started → In Progress → Done. The progress bar fills as you complete steps.', tip: 'Tap the status badge on the right to change status quickly.' },
      { title: 'Compare home types', desc: 'Tap the "Home Types" tab to compare Brick, Wood Frame, Condo, Duplex, and Modular homes side by side.', tip: 'Duplexes are great — rent one unit to help pay the mortgage!' },
    ]},
    { name: 'Community', steps: [
      { title: 'Share & grow together', desc: 'The Community tab shows posts from all Stewardship Hub members — testimonies, questions, prayers, and milestones.', tip: 'A faith-based encouraging space. Build each other up.' },
      { title: 'Post an update', desc: 'Tap + to share. Choose your post type: Update, Testimony, Question, Prayer, or Milestone. Then write and tap Post.', tip: 'Sharing wins like "I paid off my credit card!" inspires others!' },
      { title: 'Like and comment', desc: 'Tap ♥ to like any post. Tap 💬 to leave a comment. Your encouragement can change someone\'s financial journey.', tip: 'Accountability increases goal achievement by 95%.' },
    ]},
    { name: 'Faith & Stewardship', steps: [
      { title: 'Faith-based finance', desc: 'The Faith tab has 7 devotionals connecting scripture to money management. Each takes 3–5 minutes to read.', tip: 'Managing money well IS an act of worship.' },
      { title: 'Read & reflect', desc: 'Tap any devotional card. Read the scripture and teaching, then write your personal reflection and tap "Mark as read".', tip: 'Journaling your reflections helps you grow faster than just reading.' },
      { title: 'The 6 Principles', desc: 'Tap the "Principles" tab to study the 6 pillars: Earn, Budget, Save, Invest, Give, and Be Free. Your financial foundation.', tip: 'The Stewardship Commitment at the bottom is worth memorizing.' },
    ]},
  ],
  fr: [
    { name: 'Pour commencer', steps: [
      { title: 'Bienvenue sur Stewardship Hub', desc: 'Cette application vous aide à gérer vos finances selon des principes inspirés par la foi : budget, investissements, prêts et communauté.', tip: 'Disponible en 15 langues — appuyez sur le drapeau en haut !' },
      { title: 'Naviguez avec les onglets du bas', desc: 'La barre du bas comporte 6 onglets : Accueil, Budget, Investir, Prêts, Communauté et Explorer. Touchez un onglet pour changer de fonction.', tip: 'L’onglet Accueil affiche votre synthèse financière en un coup d’œil.' },
      { title: 'Réglages et profil', desc: 'Touchez l’icône ⚙️ en haut à droite pour ouvrir les Réglages : devise, langue et compte.', tip: 'Réglez d’abord votre devise ! Tous les montants de l’app en dépendent.' },
    ]},
    { name: 'Suivi du budget', steps: [
      { title: 'Ouvrez l’onglet Budget', desc: 'Touchez « Budget » dans la barre du bas. Vous verrez les cartes Revenus, Dépenses et Excédent net du mois en cours.', tip: 'Utilisez les flèches ‹ › pour passer aux mois précédents ou suivants.' },
      { title: 'Ajoutez revenus et dépenses', desc: 'Touchez « + Ajouter une ligne » sous Revenus ou Dépenses. Saisissez la description et le montant, choisissez une catégorie, puis Enregistrer.', tip: 'Besoins = loyer/nourriture. Envies = loisirs. Don = dîme et générosité.' },
      { title: 'Votre surplus est calculé automatiquement', desc: 'L’app affiche votre EXCÉDENT NET automatiquement. Le vert = vous êtes dans le positif. Le rouge = dépenses trop élevées.', tip: 'Visez au moins 20 % d’épargne sur vos revenus chaque mois.' },
    ]},
    { name: 'Suivi des investissements', steps: [
      { title: 'Suivez votre portefeuille', desc: 'Touchez « Investir » dans la barre du bas. Voyez la valeur totale, le montant investi et le TRI global mis à jour en direct.', tip: 'TRI = rendement sur investissement : combien votre argent a progressé.' },
      { title: 'Ajoutez des investissements avec cours en direct', desc: 'Touchez « + Ajouter une ligne ». Saisissez le nom (ex. « Bitcoin » ou « S&P 500 ») — le type est détecté et le cours apparaît.', tip: 'Détection auto : « Bitcoin » → Crypto, « S&P 500 » → Fonds indiciels.' },
      { title: 'Voir les cours du marché en direct', desc: 'Touchez « Voir les prix du marché » pour les cours en temps réel des actions, ETF et plus de 16 cryptomonnaies.', tip: 'Touchez Actualiser pour rafraîchir les cours à tout moment.' },
    ]},
    { name: 'Suivi des prêts', steps: [
      { title: 'Suivez toute votre dette', desc: 'Touchez « Prêts » dans la barre du bas. Voyez la dette totale, la mensualité et la liste de tous les prêts.', tip: 'Objectif : ramener TOUS les prêts à zéro. Liberté vis-à-vis de la dette = liberté financière.' },
      { title: 'Ajouter un prêt', desc: 'Touchez +. Indiquez le type, le prêteur, le capital, le taux d’intérêt (%) et la durée en mois. La mensualité est calculée automatiquement.', tip: 'Exemple : prêt auto, banque, 20 000 $, 6,5 %, 60 mois.' },
      { title: 'Voir le tableau d’amortissement', desc: 'Touchez un prêt pour l’ouvrir. Consultez le détail mois par mois : capital vs intérêts.', tip: 'Boule de neige : remboursez d’abord le plus petit prêt, puis reportez la mensualité sur le suivant.' },
    ]},
    { name: 'Défi 100 $', steps: [
      { title: 'Défi financier sur 30 jours', desc: 'Le défi 100 $ propose 30 tâches quotidiennes pour créer de nouvelles habitudes. Touchez « Défi » pour commencer.', tip: '30 jours, 30 tâches, 100 $ épargnés — l’habitude compte plus que le montant.' },
      { title: 'Compléter une journée', desc: 'Touchez la carte du jour. Lisez la tâche, indiquez le montant épargné, écrivez une réflexion, puis « Marquer comme terminé ».', tip: 'Même 1 $ compte. Commencez petit et prenez de l’élan.' },
      { title: 'Suivez votre grille sur 30 jours', desc: 'La grille de points montre votre progression : ✓ vert = fait, contour vert = aujourd’hui, gris = à venir.', tip: 'Après le défi, investissez vos 100 $ dans un fonds indiciel !' },
    ]},
    { name: 'Guide immobilier', steps: [
      { title: 'Liste pour acheter une maison', desc: 'Le guide vous accompagne en 5 phases : préparation financière, prêt, recherche, offre et clôture, puis après l’achat.', tip: 'Ne sautez pas d’étapes — chacune prépare la suivante.' },
      { title: 'Suivez chaque étape', desc: 'Touchez une ligne pour faire défiler le statut : Non commencé → En cours → Terminé. La barre de progression se remplit.', tip: 'Touchez le badge de statut à droite pour le changer rapidement.' },
      { title: 'Comparez les types de logements', desc: 'Ouvrez l’onglet « Types de logement » pour comparer brique, ossature bois, condo, duplex et modulaire.', tip: 'Les duplex sont pratiques — louez une unité pour aider à payer le prêt !' },
    ]},
    { name: 'Communauté', steps: [
      { title: 'Partagez et grandissez ensemble', desc: 'L’onglet Communauté affiche les publications des membres : témoignages, questions, prières et étapes importantes.', tip: 'Un espace encourageant et ancré dans la foi.' },
      { title: 'Publier une mise à jour', desc: 'Touchez + pour partager. Choisissez le type : Mise à jour, Témoignage, Question, Prière ou Étape importante, puis Publier.', tip: 'Partager « J’ai soldé ma carte ! » inspire les autres.' },
      { title: 'Aimer et commenter', desc: 'Touchez ♥ pour aimer. Touchez 💬 pour commenter. Votre encouragement peut changer le parcours de quelqu’un.', tip: 'L’engagement mutuel renforce la réussite des objectifs.' },
    ]},
    { name: 'Foi et gestion', steps: [
      { title: 'Finance inspirée par la foi', desc: 'L’onglet Foi propose 7 méditations reliant la Bible à l’argent. Comptez 3 à 5 minutes par lecture.', tip: 'Bien gérer l’argent est aussi une forme de louange.' },
      { title: 'Lire et réfléchir', desc: 'Touchez une carte. Lisez le passage et l’enseignement, écrivez votre réflexion, puis « Marquer comme lu ».', tip: 'Noter vos réflexions accélère la croissance par rapport à la seule lecture.' },
      { title: 'Les 6 principes', desc: 'Ouvrez l’onglet « Principes » pour étudier les six piliers : Gagner, Budgétiser, Épargner, Investir, Donner et être libre.', tip: 'L’engagement de gestion en bas de page mérite d’être retenu.' },
    ]},
  ],
  es: [
    { name: 'Primeros pasos', steps: [
      { title: 'Bienvenido a Stewardship Hub', desc: 'Esta app te ayuda a administrar el dinero con principios de fe: presupuesto, inversiones, préstamos y comunidad.', tip: 'Disponible en 15 idiomas — toca la bandera arriba.' },
      { title: 'Navega con las pestañas inferiores', desc: 'La barra inferior tiene 6 pestañas: Inicio, Presupuesto, Invertir, Préstamos, Comunidad y Explorar.', tip: 'Inicio muestra tu resumen financiero de un vistazo.' },
      { title: 'Ajustes y perfil', desc: 'Toca el icono ⚙️ arriba a la derecha para Ajustes: moneda, idioma y cuenta.', tip: '¡Configura primero tu moneda! Afecta a todos los importes.' },
    ]},
    { name: 'Control de presupuesto', steps: [
      { title: 'Abre la pestaña Presupuesto', desc: 'Toca « Presupuesto » en la barra inferior. Verás tarjetas de ingresos, gastos y superávit neto del mes.', tip: 'Usa las flechas ‹ › para cambiar de mes.' },
      { title: 'Añade ingresos y gastos', desc: 'Toca « + Añadir fila » en ingresos o gastos. Escribe descripción e importe, elige categoría y Guardar.', tip: 'Necesidades = alquiler/comida. Deseos = ocio. Dar = diezmo y caridad.' },
      { title: 'Tu superávit se calcula solo', desc: 'La app muestra tu SUPERÁVIT NETO automáticamente. Verde = vas bien. Rojo = gastas de más.', tip: 'Intenta ahorrar al menos el 20 % de tus ingresos cada mes.' },
    ]},
    { name: 'Control de inversiones', steps: [
      { title: 'Haz seguimiento de tu cartera', desc: 'Toca « Invertir ». Ve el valor total, lo invertido y el ROI global en vivo.', tip: 'ROI = retorno: cuánto ha crecido tu dinero.' },
      { title: 'Añade inversiones con precios en vivo', desc: 'Toca « + Añadir fila ». Escribe el nombre (p. ej. « Bitcoin » o « S&P 500 ») — el tipo se detecta y aparece el precio.', tip: 'Auto: « Bitcoin » → Cripto, « S&P 500 » → Fondos indexados.' },
      { title: 'Ver precios de mercado en vivo', desc: 'Toca « Ver precios del mercado » para acciones, ETF y más de 16 criptomonedas en tiempo real.', tip: 'Toca Actualizar cuando quieras datos nuevos.' },
    ]},
    { name: 'Control de préstamos', steps: [
      { title: 'Haz seguimiento de toda tu deuda', desc: 'Toca « Préstamos ». Ve deuda total, pago mensual y lista de préstamos.', tip: 'Meta: llevar TODOS los préstamos a cero.' },
      { title: 'Añadir un préstamo', desc: 'Toca +. Tipo, prestamista, capital, tipo de interés (%) y plazo en meses. El pago mensual se calcula solo.', tip: 'Ejemplo: coche, banco, 20 000 $, 6,5 %, 60 meses.' },
      { title: 'Ver tabla de amortización', desc: 'Toca un préstamo para expandirlo. Desglose mes a mes: capital vs intereses.', tip: 'Bola de nieve: paga primero el préstamo más pequeño.' },
    ]},
    { name: 'Desafío $100', steps: [
      { title: 'Desafío financiero de 30 días', desc: '30 tareas diarias para nuevos hábitos. Toca « Desafío » para empezar.', tip: '30 días, 30 tareas, 100 $ — el hábito importa más que la cifra.' },
      { title: 'Completa un día', desc: 'Toca la tarjeta del día. Lee la tarea, importe ahorrado, reflexión y « Marcar completado ».', tip: 'Aunque sea 1 $ cuenta. Empieza pequeño.' },
      { title: 'Sigue tu cuadrícula de 30 días', desc: 'La cuadrícula muestra el progreso: ✓ verde = hecho, borde verde = hoy, gris = pendiente.', tip: 'Después, invierte tus 100 $ en un fondo indexado.' },
    ]},
    { name: 'Guía de bienes raíces', steps: [
      { title: 'Lista para comprar casa', desc: 'Cinco fases: preparación financiera, hipoteca, búsqueda, oferta y cierre, y después de comprar.', tip: 'No te saltes fases — cada una prepara la siguiente.' },
      { title: 'Sigue cada paso', desc: 'Toca un ítem para cambiar el estado: No iniciado → En progreso → Hecho.', tip: 'Toca la insignia de estado a la derecha para ir más rápido.' },
      { title: 'Compara tipos de vivienda', desc: 'Pestaña « Tipos de vivienda »: ladrillo, madera, condominio, dúplex y modular.', tip: 'Los dúplex ayudan — alquila una unidad para la hipoteca.' },
    ]},
    { name: 'Comunidad', steps: [
      { title: 'Comparte y creced juntos', desc: 'Publicaciones de miembros: testimonios, preguntas, oraciones e hitos.', tip: 'Un espacio de ánimo basado en la fe.' },
      { title: 'Publicar una actualización', desc: 'Toca +, elige tipo (Actualización, Testimonio, etc.) y Publicar.', tip: 'Compartir victorias inspira a otros.' },
      { title: 'Me gusta y comentar', desc: '♥ para dar me gusta, 💬 para comentar.', tip: 'La responsabilidad mutua fortalece los objetivos.' },
    ]},
    { name: 'Fe y mayordomía', steps: [
      { title: 'Finanzas con fe', desc: '7 devocionales que conectan la Escritura con el dinero. 3–5 minutos cada uno.', tip: 'Administrar bien el dinero también es culto.' },
      { title: 'Leer y reflexionar', desc: 'Toca una tarjeta, lee, escribe tu reflexión y « Marcar como leído ».', tip: 'Escribir acelera el crecimiento.' },
      { title: 'Los 6 principios', desc: 'Pestaña « Principios »: Ganar, Presupuestar, Ahorrar, Invertir, Dar y ser libre.', tip: 'El compromiso de mayordomía abajo vale la pena memorizarlo.' },
    ]},
  ],
  pt: [
    { name: 'Começando', steps: [
      { title: 'Bem-vindo ao Stewardship Hub', desc: 'O app ajuda você a administrar o dinheiro com princípios de fé: orçamento, investimentos, empréstimos e comunidade.', tip: 'Disponível em 15 idiomas — toque na bandeira no topo.' },
      { title: 'Navegue pelas abas inferiores', desc: 'A barra inferior tem 6 abas: Início, Orçamento, Investir, Empréstimos, Comunidade e Explorar.', tip: 'A aba Início mostra seu resumo financeiro.' },
      { title: 'Configurações e perfil', desc: 'Toque no ícone ⚙️ no canto superior direito para moeda, idioma e conta.', tip: 'Defina a moeda primeiro! Ela vale para todos os valores.' },
    ]},
    { name: 'Controle de orçamento', steps: [
      { title: 'Abra a aba Orçamento', desc: 'Toque em « Orçamento » na barra inferior. Veja receitas, despesas e superávit líquido do mês.', tip: 'Use ‹ › para outros meses.' },
      { title: 'Adicione receitas e despesas', desc: 'Toque em « + Adicionar linha », preencha descrição e valor, categoria e Salvar.', tip: 'Necessidades = aluguel/comida. Desejos = lazer. Dar = dízimo e caridade.' },
      { title: 'Seu superávit é calculado automaticamente', desc: 'O app mostra o SUPERÁVIT LÍQUIDO sozinho. Verde = sobra. Vermelho = gastos altos.', tip: 'Meta: poupar pelo menos 20 % da renda por mês.' },
    ]},
    { name: 'Controle de investimentos', steps: [
      { title: 'Acompanhe sua carteira', desc: 'Toque em « Investir ». Valor total, investido e ROI geral ao vivo.', tip: 'ROI mostra quanto seu dinheiro cresceu.' },
      { title: 'Adicione investimentos com preços ao vivo', desc: 'Toque em « + Adicionar linha ». Nome (ex. « Bitcoin » ou « S&P 500 ») — tipo detectado e preço na hora.', tip: 'Auto: « Bitcoin » → Cripto, « S&P 500 » → Fundos indexados.' },
      { title: 'Ver preços de mercado ao vivo', desc: 'Toque em ver preços para ações, ETFs e mais de 16 criptomoedas.', tip: 'Toque em Atualizar a qualquer momento.' },
    ]},
    { name: 'Controle de empréstimos', steps: [
      { title: 'Acompanhe toda a sua dívida', desc: 'Toque em « Empréstimos ». Dívida total, parcela mensal e lista.', tip: 'Meta: zerar TODOS os empréstimos.' },
      { title: 'Adicionar um empréstimo', desc: 'Toque em +. Tipo, credor, principal, taxa (%) e prazo em meses. A parcela é calculada.', tip: 'Exemplo: carro, banco, US$ 20.000, 6,5 %, 60 meses.' },
      { title: 'Ver tabela de amortização', desc: 'Toque em um empréstimo para expandir. Detalhe mês a mês: principal vs juros.', tip: 'Bola de neve: pague o menor primeiro.' },
    ]},
    { name: 'Desafio $100', steps: [
      { title: 'Desafio financeiro de 30 dias', desc: '30 tarefas diárias para hábitos novos. Toque em « Desafio ».', tip: '30 dias, 30 tarefas, US$ 100 — o hábito importa mais.' },
      { title: 'Complete um dia', desc: 'Toque no dia, leia a tarefa, valor poupado, reflexão e « Marcar como concluído ».', tip: 'Até US$ 1 conta. Comece pequeno.' },
      { title: 'Acompanhe sua grade de 30 dias', desc: 'Grade mostra progresso: ✓ verde = feito, contorno verde = hoje, cinza = futuro.', tip: 'Depois, invista os US$ 100 em um fundo indexado.' },
    ]},
    { name: 'Guia imobiliário', steps: [
      { title: 'Lista para comprar casa', desc: 'Cinco fases: preparação financeira, financiamento, busca, oferta e fechamento, e depois da compra.', tip: 'Não pule etapas.' },
      { title: 'Acompanhe cada etapa', desc: 'Toque no item para alternar: Não iniciado → Em andamento → Concluído.', tip: 'Toque no selo de status à direita para ir rápido.' },
      { title: 'Compare tipos de moradia', desc: 'Aba « Tipos de moradia »: tijolo, madeira, condomínio, duplex e modular.', tip: 'Duplex ajuda — alugue uma unidade para a parcela.' },
    ]},
    { name: 'Comunidade', steps: [
      { title: 'Compartilhe e cresçam juntos', desc: 'Publicações: testemunhos, perguntas, orações e marcos.', tip: 'Espaço de encorajamento na fé.' },
      { title: 'Publicar uma atualização', desc: 'Toque em +, escolha o tipo e Publicar.', tip: 'Vitórias inspiram outros.' },
      { title: 'Curtir e comentar', desc: '♥ para curtir, 💬 para comentar.', tip: 'Responsabilidade mútua fortalece metas.' },
    ]},
    { name: 'Fé e mordomia', steps: [
      { title: 'Finanças com fé', desc: '7 devocionais ligando a Escritura ao dinheiro. 3–5 minutos cada.', tip: 'Administrar bem é adoração.' },
      { title: 'Ler e refletir', desc: 'Toque no cartão, leia, escreva e « Marcar como lido ».', tip: 'Escrever acelera o crescimento.' },
      { title: 'Os 6 princípios', desc: 'Aba « Princípios »: Ganhar, Orçamentar, Poupar, Investir, Dar e ser livre.', tip: 'O compromisso de mordomia no rodapé vale memorizar.' },
    ]},
  ],
}

function deepFallback(loc, base) {
  if (!loc) return base
  return base.map((mod, mi) => {
    const lm = loc[mi]
    if (!lm) return mod
    return {
      name: lm.name || mod.name,
      steps: mod.steps.map((step, si) => {
        const ls = lm.steps && lm.steps[si]
        if (!ls) return step
        return {
          title: ls.title || step.title,
          desc: ls.desc || step.desc,
          tip: ls.tip || step.tip,
        }
      }),
    }
  })
}

export function flattenGuideModules(lang) {
  const base = GUIDE_MODULES.en
  const loc = GUIDE_MODULES[lang]
  if (lang !== 'en' && !loc) return {}
  const merged = lang === 'en' ? base : deepFallback(loc, base)
  const out = {}
  merged.forEach((mod, mi) => {
    out[`guide_m${mi}_name`] = mod.name
    mod.steps.forEach((s, si) => {
      out[`guide_m${mi}_s${si}_title`] = s.title
      out[`guide_m${mi}_s${si}_desc`] = s.desc
      out[`guide_m${mi}_s${si}_tip`] = s.tip
    })
  })
  return out
}
