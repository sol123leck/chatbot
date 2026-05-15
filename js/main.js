/* ============================================================
   SHADOW STUDIO — JAVASCRIPT PRINCIPAL
   ============================================================

   Ce fichier contient 6 modules indépendants :
   1. Three.js Hero Canvas  → animation 3D en arrière-plan
   2. Navigation            → fond opaque au scroll + menu mobile
   3. Filtre Portfolio      → afficher/cacher les projets par catégorie
   4. Compteurs Stats       → animation des chiffres de 0 à leur valeur
   5. Scroll Reveal         → apparition des éléments au scroll
   6. Formulaire Contact    → simulation d'envoi avec message de succès
   + Liens d'ancrage        → défilement fluide vers les sections

   Chaque module est dans une IIFE (fonction auto-exécutée) :
   (function() { ... })()
   → Ça isole le code et évite les conflits entre variables
   ============================================================ */


/* ============================================================
   1. ANIMATION THREE.JS — Hero Canvas
   Three.js est une bibliothèque qui permet de créer de la 3D
   dans un navigateur web grâce au <canvas> HTML5 et WebGL
   ============================================================ */

(function initHeroCanvas() {

  /* Récupère l'élément <canvas> dans la page HTML */
  const canvas = document.getElementById('heroCanvas');

  /*
    Si le canvas n'existe pas OU si Three.js n'est pas chargé,
    on arrête immédiatement cette fonction (sécurité)
  */
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── RENDERER : le moteur de rendu ── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true, /* anti-crénelage : lisse les bords des formes */
    alpha: true,     /* fond transparent (pour voir le fond CSS noir derrière) */
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  /* devicePixelRatio = densité de pixels de l'écran.
     On limite à 2 maximum pour ne pas surcharger les GPU bas de gamme */
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setClearColor(0x000000, 0); /* couleur de fond = noir, opacité = 0 (transparent) */

  /* ── SCENE : le "monde" 3D où on place les objets ── */
  const scene = new THREE.Scene();

  /* ── CAMERA : le point de vue du spectateur ── */
  const camera = new THREE.PerspectiveCamera(
    60,                                       /* champ de vision en degrés (comme un objectif photo) */
    canvas.offsetWidth / canvas.offsetHeight, /* ratio largeur/hauteur */
    0.1,                                      /* distance minimale de rendu */
    1000                                      /* distance maximale de rendu */
  );
  camera.position.z = 30; /* recule la caméra de 30 unités pour voir la scène */


  /* ── SYSTÈME DE PARTICULES ── */
  const particleCount = 1800; /* nombre de points flottants */

  /* Float32Array = tableau de nombres optimisé pour le GPU (plus rapide qu'un tableau normal) */
  const positions = new Float32Array(particleCount * 3);
  /* × 3 car chaque particule a 3 coordonnées : X, Y, Z */

  const velocities = []; /* vecteurs de déplacement de chaque particule */
  const spread = 60;     /* zone de dispersion des particules (cube de 60×60×60 unités) */

  /* Initialise les particules à des positions aléatoires */
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - .5) * spread; /* X aléatoire entre -30 et +30 */
    positions[i * 3 + 1] = (Math.random() - .5) * spread; /* Y */
    positions[i * 3 + 2] = (Math.random() - .5) * spread; /* Z */

    /* Vélocité aléatoire = direction et vitesse de déplacement */
    velocities.push({
      x: (Math.random() - .5) * .008, /* très lent, entre -0.004 et +0.004 */
      y: (Math.random() - .5) * .008,
      z: (Math.random() - .5) * .003,
    });
  }

  /* Crée la géométrie avec les positions */
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  /* BufferAttribute dit à Three.js : "utilise ce tableau, avec 3 valeurs par point" */

  /* Matériau des particules : petits points violets semi-transparents */
  const mat = new THREE.PointsMaterial({
    size: .15,
    color: 0x9d5fff,   /* violet clair (0x = préfixe hexadécimal) */
    transparent: true,
    opacity: .6,
    sizeAttenuation: true, /* les particules lointaines semblent plus petites (perspective) */
  });

  /* Crée l'objet Points et l'ajoute à la scène */
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);


  /* ── FORMES GÉOMÉTRIQUES WIREFRAME (filaires) ── */
  const shapes = []; /* tableau qui contiendra nos formes */

  /* Les 5 géométries (formes mathématiques 3D) */
  const shapeGeometries = [
    new THREE.IcosahedronGeometry(1.5, 0), /* icosaèdre = 20 faces triangulaires */
    new THREE.OctahedronGeometry(1.8, 0),  /* octaèdre = 8 faces (diamant) */
    new THREE.TetrahedronGeometry(1.6, 0), /* tétraèdre = pyramide triangulaire */
    new THREE.IcosahedronGeometry(1.2, 0),
    new THREE.OctahedronGeometry(1.1, 0),
  ];

  /* Les matériaux wireframe (juste les arêtes, pas les faces) */
  const wireMats = [
    new THREE.MeshBasicMaterial({ color: 0x7c3aed, wireframe: true, opacity: .25, transparent: true }),
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9, wireframe: true, opacity: .2,  transparent: true }),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, opacity: .18, transparent: true }),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, opacity: .2,  transparent: true }),
    new THREE.MeshBasicMaterial({ color: 0x6d28d9, wireframe: true, opacity: .15, transparent: true }),
  ];

  /* Positions de chaque forme dans l'espace [X, Y, Z] */
  const shapePositions = [
    [-18, 10, -8], [14, -8, -12], [-8, -14, -5], [20, 12, -15], [-15, -5, -10]
  ];

  /* Crée les 5 formes et les configure */
  shapeGeometries.forEach((g, i) => {
    const mesh = new THREE.Mesh(g, wireMats[i]); /* combine géométrie + matériau */
    mesh.position.set(...shapePositions[i]);      /* ... = spread operator, déploie le tableau */

    /* userData = on peut stocker des données personnalisées sur un objet Three.js */
    mesh.userData = {
      rotSpeed: { x: .003 + Math.random()*.004, y: .004 + Math.random()*.004, z: .002 },
      /* vitesse de rotation différente pour chaque axe = mouvement organique */
      floatOffset: Math.random() * Math.PI * 2, /* décalage de phase pour la flottaison */
      floatSpeed: .3 + Math.random() * .3,      /* vitesse de flottaison verticale */
      baseY: shapePositions[i][1],              /* position Y de départ (pour le calcul de flottaison) */
    };

    scene.add(mesh);
    shapes.push(mesh); /* ajoute au tableau pour y accéder dans l'animation */
  });


  /* ── PARALLAXE SOURIS ── */
  /* Quand la souris bouge, la caméra se déplace légèrement */
  let mouse  = { x: 0, y: 0 };        /* position actuelle de la caméra */
  let targetMouse = { x: 0, y: 0 };   /* cible (où la caméra veut aller) */

  window.addEventListener('mousemove', e => {
    /* Normalise la position de la souris entre -1 et +1 */
    targetMouse.x = (e.clientX / window.innerWidth  - .5) * 2;
    targetMouse.y = (e.clientY / window.innerHeight - .5) * 2;
  });


  /* ── REDIMENSIONNEMENT DE FENÊTRE ── */
  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    camera.aspect = w / h;           /* met à jour le ratio de la caméra */
    camera.updateProjectionMatrix(); /* recalcule la matrice de projection */
    renderer.setSize(w, h);          /* redimensionne le renderer */
  });


  /* ── BOUCLE D'ANIMATION ── */
  /*
    Three.js Clock mesure le temps écoulé.
    On l'utilise pour des animations basées sur le temps (et non sur les FPS)
    → l'animation a la même vitesse quel que soit la fréquence d'images
  */
  let clock = new THREE.Clock();

  function animate() {
    /*
      requestAnimationFrame = demande au navigateur d'appeler "animate"
      avant le prochain rafraîchissement de l'écran (environ 60 fois/seconde)
      C'est la façon standard de faire des animations en JavaScript
    */
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime(); /* secondes écoulées depuis le départ */

    /* Lerp (interpolation linéaire) : mouvement fluide vers la cible
       .04 = facteur de lissage : 4% de la distance restante par frame */
    mouse.x += (targetMouse.x - mouse.x) * .04;
    mouse.y += (targetMouse.y - mouse.y) * .04;
    camera.position.x = mouse.x * 3;  /* amplitude du mouvement horizontal */
    camera.position.y = -mouse.y * 2; /* amplitude verticale (inversée : souris haut = caméra haut) */

    /* Déplace chaque particule selon sa vélocité */
    const pos = geo.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      pos.array[i * 3]     += velocities[i].x;
      pos.array[i * 3 + 1] += velocities[i].y;
      pos.array[i * 3 + 2] += velocities[i].z;

      /* Rebond : si une particule sort de la zone, elle repart dans l'autre sens */
      if (Math.abs(pos.array[i * 3])     > spread / 2) velocities[i].x *= -1;
      if (Math.abs(pos.array[i * 3 + 1]) > spread / 2) velocities[i].y *= -1;
      if (Math.abs(pos.array[i * 3 + 2]) > spread / 2) velocities[i].z *= -1;
    }
    pos.needsUpdate = true; /* signale à Three.js que les positions ont changé */

    /* Anime chaque forme géométrique */
    shapes.forEach(s => {
      /* Rotation continue sur les 3 axes */
      s.rotation.x += s.userData.rotSpeed.x;
      s.rotation.y += s.userData.rotSpeed.y;
      s.rotation.z += s.userData.rotSpeed.z;

      /* Flottaison verticale : oscillation sinusoïdale
         Math.sin() renvoie une valeur entre -1 et +1
         La forme monte et descend doucement */
      s.position.y = s.userData.baseY +
        Math.sin(elapsed * s.userData.floatSpeed + s.userData.floatOffset) * 1.5;
    });

    /* Rotation lente du nuage de particules */
    particles.rotation.y += .0003;

    /* Rend la scène : "prend une photo" et l'affiche sur le canvas */
    renderer.render(scene, camera);
  }

  animate(); /* démarre la boucle */

})(); /* fin IIFE - s'exécute immédiatement */


/* ============================================================
   2. NAVIGATION
   - Ajoute un fond opaque quand on scroll
   - Gère le menu hamburger sur mobile
   ============================================================ */

(function initNav() {

  const nav = document.getElementById('nav');
  if (!nav) return;

  /* Fonction appelée à chaque scroll */
  const onScroll = () => {
    /* Si on a scrollé plus de 60px, ajoute la classe "scrolled" */
    /* Le CSS de .nav.scrolled ajoute le fond opaque et le flou */
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };

  /* passive: true = optimisation de performance pour les événements de scroll */
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); /* appel initial pour gérer le cas où la page est déjà scrollée */

  /* ── MENU HAMBURGER MOBILE ── */
  const burger = document.getElementById('navBurger');
  const links  = nav.querySelector('.nav__links');
  const cta    = nav.querySelector('.nav__cta');

  if (burger && links) {
    burger.addEventListener('click', () => {
      /* Si le menu est déjà ouvert (display: flex), on le ferme */
      const open = links.style.display === 'flex';

      if (open) {
        /* Ferme : enlève les styles inline */
        links.style.cssText = '';
        if (cta) cta.style.display = '';
      } else {
        /* Ouvre : transforme le menu horizontal en liste verticale */
        links.style.cssText = `
          display: flex;
          flex-direction: column;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(7,7,15,.97);
          padding: 1.5rem 2rem;
          gap: 1rem;
          border-bottom: 1px solid rgba(255,255,255,.07)
        `;
        /* Cache le bouton CTA dans le menu mobile pour économiser l'espace */
        if (cta) cta.style.display = 'none';
      }
    });
  }

})();


/* ============================================================
   3. FILTRE PORTFOLIO
   Affiche/cache les projets selon la catégorie sélectionnée
   ============================================================ */

(function initPortfolioFilter() {

  /* Sélectionne tous les boutons de filtre et tous les projets */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.portfolio-item');

  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {

      /* Récupère la valeur du data-filter du bouton cliqué */
      const filter = btn.dataset.filter; /* ex: "3d", "2d", "game", "all" */

      /* 1. Retire la classe active de TOUS les boutons */
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'));

      /* 2. Ajoute la classe active AU bouton cliqué */
      btn.classList.add('filter-btn--active');

      /* 3. Pour chaque projet : affiche-le ou cache-le */
      items.forEach(item => {
        /*
          "all" → tout afficher
          sinon → comparer data-category du projet avec le filtre
          ex: item.dataset.category === "3d"
        */
        const show = filter === 'all' || item.dataset.category === filter;

        /* Ajoute/retire la classe qui cache l'élément (display: none en CSS) */
        item.classList.toggle('portfolio-item--hidden', !show);
        /* toggle(class, condition) : ajoute si condition=true, retire si condition=false */
      });

    });
  });

})();


/* ============================================================
   4. COMPTEURS ANIMÉS (Stats)
   Les chiffres s'animent de 0 jusqu'à leur valeur cible
   quand ils entrent dans le champ de vision
   ============================================================ */

(function initCounters() {

  /* Sélectionne tous les éléments avec la classe stat-item__number */
  const nums = document.querySelectorAll('.stat-item__number');
  if (!nums.length) return;

  /*
    countUp = fonction qui anime un nombre de 0 à "target" en "duration" millisecondes
    el = l'élément HTML à modifier
    target = valeur finale
    duration = durée de l'animation en ms (1800ms = 1.8 secondes)
  */
  const countUp = (el, target, duration = 1800) => {
    let start = null; /* timestamp du début de l'animation */

    const step = (timestamp) => {
      /*
        requestAnimationFrame passe le timestamp (temps en ms depuis le début de la page)
        à la fonction step à chaque frame
      */
      if (!start) start = timestamp;

      /* Calcule la progression : entre 0 et 1 */
      const progress = Math.min((timestamp - start) / duration, 1);

      /* Affiche le nombre arrondi à l'entier le plus proche */
      el.textContent = Math.floor(progress * target);

      /* Continue l'animation tant que progress < 1 */
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target; /* valeur exacte à la fin (évite les arrondis) */
    };

    requestAnimationFrame(step); /* lance la première frame */
  };

  /*
    IntersectionObserver : observe les éléments et déclenche un callback
    quand ils entrent (ou sortent) de la zone visible de l'écran
    C'est plus performant que d'écouter l'événement scroll
  */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        /* L'élément est maintenant visible → lance l'animation */
        const el = entry.target;
        countUp(el, parseInt(el.dataset.target, 10));
        /* parseInt(valeur, 10) = convertit la chaîne "120" en nombre 120, base 10 */

        io.unobserve(el); /* arrête d'observer cet élément (animation unique) */
      }
    });
  }, { threshold: .5 }); /* threshold: 0.5 = déclenche quand 50% de l'élément est visible */

  /* Lance l'observation sur chaque chiffre */
  nums.forEach(n => io.observe(n));

})();


/* ============================================================
   5. SCROLL REVEAL
   Les éléments "apparaissent" (fade-in + slide-up) quand ils
   entrent dans le champ de vision lors du scroll
   ============================================================ */

(function initReveal() {

  /* Sélectionne tous les éléments à animer */
  const els = document.querySelectorAll(
    '.service-card, .portfolio-item, .process-step, .audience-card, .stat-item, .section__header'
  );

  /* Prépare chaque élément pour l'animation */
  els.forEach((el, i) => {
    el.classList.add('reveal'); /* état initial : opacity:0, translateY:30px (voir CSS) */

    /* Ajoute un délai différent selon la position dans le groupe (effet cascade) */
    if (i % 3 === 1) el.classList.add('reveal-delay-1'); /* 100ms de délai */
    if (i % 3 === 2) el.classList.add('reveal-delay-2'); /* 200ms de délai */
  });

  /*
    IntersectionObserver : déclenche quand l'élément entre dans la vue
    threshold: 0.12 = se déclenche quand 12% de l'élément est visible
  */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible'); /* état final : opacity:1, translateY:0 (voir CSS) */
        io.unobserve(e.target);            /* animation unique, on arrête d'observer */
      }
    });
  }, { threshold: .12 });

  /* Lance l'observation */
  els.forEach(el => io.observe(el));

})();


/* ============================================================
   6. FORMULAIRE DE CONTACT
   Intercepte la soumission, simule un envoi, affiche un succès
   ⚠️ Pour un vrai envoi d'email, connecter à Formspree ou EmailJS
   ============================================================ */

(function initForm() {

  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  /*
    'submit' = événement déclenché quand on clique sur le bouton d'envoi
    e.preventDefault() = empêche le comportement par défaut du navigateur
    (qui rechargerait la page ou naviguerait vers une autre URL)
  */
  form.addEventListener('submit', e => {
    e.preventDefault();

    /* Récupère le bouton d'envoi et le désactive pendant l'"envoi" */
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Envoi en cours…';
    btn.disabled = true;

    /*
      setTimeout = exécute une fonction après un délai (en millisecondes)
      Ici on simule 1,2 secondes de "traitement" pour un effet réaliste
    */
    setTimeout(() => {
      form.reset();                    /* vide tous les champs du formulaire */
      btn.style.display = 'none';      /* cache le bouton */
      success.classList.add('visible'); /* affiche le message de succès (voir CSS) */
    }, 1200);

  });

})();


/* ============================================================
   DÉFILEMENT FLUIDE POUR LES LIENS D'ANCRAGE
   Quand on clique sur href="#section", défilement animé
   (Le CSS scroll-behavior:smooth fait déjà ça, mais ceci gère
   aussi les cas où le CSS ne suffit pas)
   ============================================================ */

document.querySelectorAll('a[href^="#"]').forEach(a => {
  /* Pour chaque lien dont href commence par "#" */
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    /* Cherche l'élément correspondant à l'ancre (ex: #services → section#services) */

    if (!target) return; /* si l'élément n'existe pas, ne fait rien */

    e.preventDefault(); /* empêche le saut brusque par défaut */
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    /* scrollIntoView : fait défiler jusqu'à l'élément */
    /* behavior: 'smooth' = défilement animé */
    /* block: 'start' = aligne le haut de l'élément avec le haut de la fenêtre */
  });
});
