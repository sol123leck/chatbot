# ============================================================
#  SNAKE GAME  —  Version Pygame avec design amélioré
# ============================================================
#  Commande pour jouer : python snake.py
#  Dépendance          : pip install pygame
# ============================================================

import pygame
import random
import math
import json
import os
import sys

# ============================================================
#  CONFIGURATION GÉNÉRALE
# ============================================================

WINDOW_W  = 800          # Largeur de la fenêtre en pixels
WINDOW_H  = 640          # Hauteur de la fenêtre en pixels
SCORE_H   = 50           # Hauteur réservée pour la barre de score en haut
CELL      = 24           # Taille d'une case de la grille (pixels)
COLS      = WINDOW_W // CELL                  # Nombre de colonnes de la grille
ROWS      = (WINDOW_H - SCORE_H) // CELL      # Nombre de lignes  de la grille
FPS_INIT  = 10           # Vitesse de départ (cases par seconde)
FPS_MAX   = 22           # Vitesse maximale

# Vecteurs de direction (colonne, ligne)
UP    = ( 0, -1)
DOWN  = ( 0,  1)
LEFT  = (-1,  0)
RIGHT = ( 1,  0)

# Fichier de sauvegarde du meilleur score
HIGH_SCORE_FILE = os.path.join(os.path.dirname(__file__), ".snake_highscore.json")

# ============================================================
#  PALETTE DE COULEURS
# ============================================================

BG_COLOR     = ( 15,  35,  15)   # Fond de la zone de jeu (vert très sombre)
GRID_COLOR   = ( 22,  50,  22)   # Lignes de la grille (légèrement plus claires)
SCORE_BG     = ( 10,  25,  10)   # Fond de la barre de score
SNAKE_HEAD   = ( 90, 230,  70)   # Couleur de la tête (vert vif)
SNAKE_MID    = ( 55, 170,  45)   # Couleur du milieu du corps
SNAKE_TAIL   = ( 28,  95,  20)   # Couleur de la queue (vert foncé)
EYE_WHITE    = (245, 245, 245)   # Blanc des yeux
EYE_PUPIL    = ( 15,  15,  15)   # Pupille noire
TONGUE_RED   = (210,  45,  45)   # Langue rouge fourchue
APPLE_RED    = (215,  38,  38)   # Corps de la pomme
APPLE_SHINE  = (255, 115, 115)   # Reflet brillant sur la pomme
STEM_BROWN   = ( 90,  55,  15)   # Tige de la pomme
LEAF_GREEN   = ( 55, 175,  40)   # Feuille de la pomme
SCORE_COLOR  = (190, 225, 190)   # Texte du score
WHITE        = (255, 255, 255)   # Blanc pur (texte game over)
OBS_COLOR    = ( 90,  70,  45)   # Corps des obstacles (marron pierre)
OBS_LIGHT    = (125, 100,  65)   # Reflet clair en haut à gauche
OBS_DARK     = ( 50,  38,  22)   # Ombre en bas à droite

# Règles d'apparition des obstacles
OBSTACLES_START = 10   # Nombre de pommes avant les premiers obstacles
OBSTACLES_STEP  =  5   # Un nouvel obstacle tous les X pommes après le départ
OBSTACLES_MAX   = 20   # Plafond d'obstacles simultanés

# ============================================================
#  GESTION DU MEILLEUR SCORE  (lecture / écriture fichier JSON)
# ============================================================

def load_high_score():
    """Lit le meilleur score sauvegardé. Retourne 0 si le fichier n'existe pas."""
    try:
        with open(HIGH_SCORE_FILE) as f:
            return json.load(f).get("high_score", 0)
    except (FileNotFoundError, json.JSONDecodeError):
        return 0

def save_high_score(score):
    """Sauvegarde le meilleur score dans un fichier JSON."""
    with open(HIGH_SCORE_FILE, "w") as f:
        json.dump({"high_score": score}, f)

# ============================================================
#  UTILITAIRES
# ============================================================

def cell_to_px(col, row):
    """
    Convertit une position de grille (colonne, ligne)
    en coordonnées pixel (centre de la case).
    """
    return (col * CELL + CELL // 2,
            SCORE_H + row * CELL + CELL // 2)

def lerp_color(c1, c2, t):
    """
    Interpolation linéaire entre deux couleurs.
    t = 0.0 → retourne c1 (tête)
    t = 1.0 → retourne c2 (queue)
    """
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

# ============================================================
#  DESSIN DU FOND  (grille de jeu)
# ============================================================

def draw_background(surface):
    """
    Remplit le fond en vert très sombre et trace
    une grille subtile pour matérialiser les cases.
    """
    surface.fill(BG_COLOR)
    for col in range(COLS + 1):
        x = col * CELL
        pygame.draw.line(surface, GRID_COLOR, (x, SCORE_H), (x, WINDOW_H), 1)
    for row in range(ROWS + 1):
        y = SCORE_H + row * CELL
        pygame.draw.line(surface, GRID_COLOR, (0, y), (WINDOW_W, y), 1)

# ============================================================
#  DESSIN DE LA POMME
# ============================================================

def draw_apple(surface, col, row):
    """
    Dessine une pomme stylisée composée de :
      - Un corps rouge arrondi
      - Un reflet brillant en haut à gauche
      - Une tige brune
      - Une feuille verte inclinée
    """
    cx, cy = cell_to_px(col, row)
    r = CELL // 2 - 2

    # Corps principal rouge (légèrement décalé vers le bas pour laisser place à la tige)
    pygame.draw.circle(surface, APPLE_RED, (cx, cy + 2), r)

    # Reflet brillant (petit ovale clair en haut à gauche du corps)
    shine_rect = pygame.Rect(cx - r // 2, cy - r // 3, r // 2, r // 3)
    pygame.draw.ellipse(surface, APPLE_SHINE, shine_rect)

    # Tige brune (ligne courte partant du sommet)
    pygame.draw.line(surface, STEM_BROWN,
                     (cx + 1, cy - r + 2),
                     (cx + 3, cy - r - 5), 2)

    # Feuille verte (petit ovale dessiné sur une surface transparente puis tourné)
    leaf_surf = pygame.Surface((10, 5), pygame.SRCALPHA)
    pygame.draw.ellipse(leaf_surf, LEAF_GREEN, (0, 0, 10, 5))
    rotated_leaf = pygame.transform.rotate(leaf_surf, -35)
    surface.blit(rotated_leaf, (cx + 2, cy - r - 6))

# ============================================================
#  DESSIN DU SERPENT  (corps + effet d'ondulation)
# ============================================================

def draw_snake(surface, segments, direction, anim_tick):
    """
    Dessine tous les segments du serpent avec :
      - Un dégradé de couleur : vert vif (tête) → vert foncé (queue)
      - Un effet d'ondulation sinusoïdal perpendiculaire au déplacement
      - Les segments de la queue dessinés en premier (sous la tête)
    """
    n = len(segments)

    # On dessine de la queue vers la tête pour que la tête soit au-dessus
    for i in range(n - 1, -1, -1):
        col, row = segments[i]

        # t = 0 pour la tête, t = 1 pour l'extrémité de la queue
        t = i / max(n - 1, 1)

        # Couleur interpolée selon la position dans le corps
        color = lerp_color(SNAKE_HEAD, SNAKE_TAIL, t)

        # ---- Effet d'ondulation ----
        # La phase combine l'indice du segment et l'horloge d'animation.
        # Cela crée une onde qui voyage de la tête vers la queue.
        phase     = i * 0.7 - anim_tick * 0.4
        amplitude = 3.5 * (1.0 - t * 0.4)   # amplitude diminue vers la queue
        wave      = amplitude * math.sin(phase)

        cx, cy = cell_to_px(col, row)

        # L'ondulation est perpendiculaire à la direction de déplacement
        if direction in (LEFT, RIGHT):
            cx_draw, cy_draw = cx, cy + int(wave)    # oscillation verticale
        else:
            cx_draw, cy_draw = cx + int(wave), cy    # oscillation horizontale

        # Rayon légèrement plus grand pour la tête
        radius = (CELL // 2 + 1) if i == 0 else (CELL // 2 - 1)

        pygame.draw.circle(surface, color, (cx_draw, cy_draw), radius)

        # Contour sombre pour séparer visuellement les segments
        if i > 0:
            outline_color = lerp_color(color, (0, 0, 0), 0.35)
            pygame.draw.circle(surface, outline_color, (cx_draw, cy_draw), radius, 1)

    # Dessin des détails de la tête par-dessus le reste
    draw_snake_head(surface, segments[0], direction, anim_tick)


def draw_snake_head(surface, head_pos, direction, anim_tick):
    """
    Ajoute les détails visuels de la tête du serpent :
      - Deux yeux blancs avec pupilles noires
      - Une langue rouge fourchue qui clignote
    Les positions des yeux et de la langue s'adaptent à la direction.
    """
    col, row = head_pos
    cx, cy   = cell_to_px(col, row)
    r        = CELL // 2 + 1

    # Calcul des positions des yeux et de la langue selon la direction
    if direction == RIGHT:
        eye1         = (cx + r // 3,  cy - r // 2)
        eye2         = (cx + r // 3,  cy + r // 2 - 1)
        tongue_root  = (cx + r,       cy)
        tongue_fork  = (cx + r + 5,   cy)
        tongue_tip1  = (cx + r + 9,   cy - 4)
        tongue_tip2  = (cx + r + 9,   cy + 4)
    elif direction == LEFT:
        eye1         = (cx - r // 3,  cy - r // 2)
        eye2         = (cx - r // 3,  cy + r // 2 - 1)
        tongue_root  = (cx - r,       cy)
        tongue_fork  = (cx - r - 5,   cy)
        tongue_tip1  = (cx - r - 9,   cy - 4)
        tongue_tip2  = (cx - r - 9,   cy + 4)
    elif direction == UP:
        eye1         = (cx - r // 2 + 1, cy - r // 3)
        eye2         = (cx + r // 2 - 1, cy - r // 3)
        tongue_root  = (cx,              cy - r)
        tongue_fork  = (cx,              cy - r - 5)
        tongue_tip1  = (cx - 4,          cy - r - 9)
        tongue_tip2  = (cx + 4,          cy - r - 9)
    else:  # DOWN
        eye1         = (cx - r // 2 + 1, cy + r // 3)
        eye2         = (cx + r // 2 - 1, cy + r // 3)
        tongue_root  = (cx,              cy + r)
        tongue_fork  = (cx,              cy + r + 5)
        tongue_tip1  = (cx - 4,          cy + r + 9)
        tongue_tip2  = (cx + 4,          cy + r + 9)

    # Yeux : cercle blanc puis pupille noire par-dessus
    pygame.draw.circle(surface, EYE_WHITE, eye1, 3)
    pygame.draw.circle(surface, EYE_WHITE, eye2, 3)
    pygame.draw.circle(surface, EYE_PUPIL, eye1, 1)
    pygame.draw.circle(surface, EYE_PUPIL, eye2, 1)

    # Langue fourchue : visible 6 ticks sur 9 (effet de clignotement rapide)
    if anim_tick % 9 < 6:
        pygame.draw.line(surface, TONGUE_RED, tongue_root, tongue_fork, 2)
        pygame.draw.line(surface, TONGUE_RED, tongue_fork, tongue_tip1, 1)
        pygame.draw.line(surface, TONGUE_RED, tongue_fork, tongue_tip2, 1)

# ============================================================
#  DESSIN DE LA BARRE DE SCORE
# ============================================================

def draw_score(surface, font, score, high_score):
    """
    Affiche le score courant à gauche et le meilleur score à droite,
    dans la barre noire en haut de l'écran.
    """
    pygame.draw.rect(surface, SCORE_BG, (0, 0, WINDOW_W, SCORE_H))

    score_text = font.render(f"Score : {score}",          True, SCORE_COLOR)
    best_text  = font.render(f"Meilleur : {high_score}",  True, SCORE_COLOR)

    # Score à gauche, meilleur score à droite, centrés verticalement dans la barre
    y = SCORE_H // 2 - score_text.get_height() // 2
    surface.blit(score_text, (20, y))
    surface.blit(best_text,  (WINDOW_W - best_text.get_width() - 20, y))

# ============================================================
#  ÉCRAN DE FIN DE PARTIE
# ============================================================

def draw_game_over(surface, font_big, font_small, score, high_score):
    """
    Affiche un écran semi-transparent par-dessus le jeu avec :
      - Le titre GAME OVER en rouge
      - Le score de la partie et le meilleur score
      - Les instructions pour rejouer ou quitter
    """
    # Couche noire semi-transparente sur tout l'écran
    overlay = pygame.Surface((WINDOW_W, WINDOW_H), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 175))
    surface.blit(overlay, (0, 0))

    title  = font_big.render("GAME OVER",                               True, (220, 55, 55))
    s_text = font_small.render(f"Score : {score}   Meilleur : {high_score}", True, WHITE)
    r_text = font_small.render("[R] Rejouer      [Q] Quitter",           True, (160, 210, 160))

    cx = WINDOW_W // 2
    cy = WINDOW_H // 2
    surface.blit(title,  (cx - title.get_width()  // 2, cy - 70))
    surface.blit(s_text, (cx - s_text.get_width() // 2, cy -  5))
    surface.blit(r_text, (cx - r_text.get_width() // 2, cy + 45))

# ============================================================
#  DESSIN DES OBSTACLES
# ============================================================

def draw_obstacles(surface, obstacles):
    """
    Dessine chaque obstacle comme un bloc rocheux marron avec :
      - Un corps principal
      - Un reflet clair en haut à gauche (effet 3D)
      - Une ombre foncée en bas à droite (effet 3D)
    """
    for (col, row) in obstacles:
        cx, cy = cell_to_px(col, row)
        r = CELL // 2 - 1
        rect = pygame.Rect(cx - r, cy - r, r * 2, r * 2)

        # Corps du bloc
        pygame.draw.rect(surface, OBS_COLOR, rect, border_radius=4)

        # Reflet en haut à gauche
        pygame.draw.line(surface, OBS_LIGHT, (cx - r + 2, cy - r + 2), (cx + r - 2, cy - r + 2), 2)
        pygame.draw.line(surface, OBS_LIGHT, (cx - r + 2, cy - r + 2), (cx - r + 2, cy + r - 2), 2)

        # Ombre en bas à droite
        pygame.draw.line(surface, OBS_DARK, (cx - r + 2, cy + r - 1), (cx + r - 1, cy + r - 1), 2)
        pygame.draw.line(surface, OBS_DARK, (cx + r - 1, cy - r + 2), (cx + r - 1, cy + r - 1), 2)

# ============================================================
#  GÉNÉRATION DE LA NOURRITURE ET DES OBSTACLES
# ============================================================

def spawn_food(snake, obstacles=None):
    """
    Choisit une position aléatoire non occupée par le serpent
    ni par un obstacle.
    """
    blocked = set(snake) | set(obstacles or [])
    while True:
        pos = (random.randint(0, COLS - 1), random.randint(0, ROWS - 1))
        if pos not in blocked:
            return pos

def spawn_obstacle(snake, food, obstacles):
    """
    Génère un obstacle à une position aléatoire libre,
    loin du serpent et de la nourriture.
    Retourne None si aucune place n'est disponible après 200 essais.
    """
    blocked = set(snake) | set(obstacles) | {food}
    for _ in range(200):
        pos = (random.randint(1, COLS - 2), random.randint(1, ROWS - 2))
        if pos not in blocked:
            return pos
    return None

# ============================================================
#  BOUCLE PRINCIPALE
# ============================================================

def main():
    pygame.init()
    pygame.display.set_caption("Snake")
    screen = pygame.display.set_mode((WINDOW_W, WINDOW_H))
    clock  = pygame.time.Clock()

    # Polices de caractères pour le score et le game over
    font_big   = pygame.font.SysFont("consolas", 54, bold=True)
    font_small = pygame.font.SysFont("consolas", 26)

    high_score = load_high_score()

    # ---- Boucle de sessions (permet de rejouer sans relancer le programme) ----
    while True:

        # Initialisation d'une nouvelle partie
        snake        = [(COLS // 2, ROWS // 2),
                        (COLS // 2 - 1, ROWS // 2),
                        (COLS // 2 - 2, ROWS // 2)]
        direction    = RIGHT
        next_dir     = RIGHT
        obstacles    = []    # Liste des positions des blocs obstacles
        apples_eaten = 0     # Compte les pommes avalées (déclenche les obstacles)
        food         = spawn_food(snake, obstacles)
        score        = 0
        fps          = FPS_INIT
        anim_tick    = 0
        game_over    = False

        # ---- Boucle d'une partie ----
        while not game_over:
            clock.tick(fps)
            anim_tick += 1

            # -- Lecture des entrées clavier --
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit(); sys.exit()

                if event.type == pygame.KEYDOWN:
                    # On interdit le demi-tour (impossible de faire marche arrière)
                    if event.key == pygame.K_UP    and direction != DOWN:
                        next_dir = UP
                    elif event.key == pygame.K_DOWN  and direction != UP:
                        next_dir = DOWN
                    elif event.key == pygame.K_LEFT  and direction != RIGHT:
                        next_dir = LEFT
                    elif event.key == pygame.K_RIGHT and direction != LEFT:
                        next_dir = RIGHT

            direction = next_dir

            # -- Calcul de la nouvelle position de la tête --
            hx, hy = snake[0]
            dx, dy = direction
            nx, ny = hx + dx, hy + dy

            # -- Collision avec les murs : toucher le bord = game over --
            if nx < 0 or nx >= COLS or ny < 0 or ny >= ROWS:
                game_over = True
                continue

            new_head = (nx, ny)

            # -- Collision avec soi-même --
            if new_head in snake:
                game_over = True
                continue

            # -- Collision avec un obstacle --
            if new_head in obstacles:
                game_over = True
                continue

            # -- Déplacement : on insère la nouvelle tête en position 0 --
            snake.insert(0, new_head)

            # -- Vérification si la tête est sur la pomme --
            if new_head == food:
                score        += 10
                apples_eaten += 1

                if score > high_score:
                    high_score = score
                    save_high_score(high_score)

                food = spawn_food(snake, obstacles)

                # Vitesse : +1 case/s toutes les 2 pommes mangées
                fps = min(FPS_MAX, FPS_INIT + apples_eaten // 2)

                # Obstacles : 2 blocs à la 10ème pomme, puis +1 tous les 5
                if apples_eaten == OBSTACLES_START:
                    for _ in range(2):
                        obs = spawn_obstacle(snake, food, obstacles)
                        if obs:
                            obstacles.append(obs)
                elif apples_eaten > OBSTACLES_START and len(obstacles) < OBSTACLES_MAX:
                    if (apples_eaten - OBSTACLES_START) % OBSTACLES_STEP == 0:
                        obs = spawn_obstacle(snake, food, obstacles)
                        if obs:
                            obstacles.append(obs)
            else:
                snake.pop()   # On retire la queue seulement si aucune pomme mangée

            # -- Rendu graphique --
            draw_background(screen)
            draw_obstacles(screen, obstacles)
            draw_apple(screen, *food)
            draw_snake(screen, snake, direction, anim_tick)
            draw_score(screen, font_small, score, high_score)
            pygame.display.flip()

        # ---- Affichage de l'écran Game Over ----
        draw_game_over(screen, font_big, font_small, score, high_score)
        pygame.display.flip()

        # Attente de la saisie du joueur (R = rejouer, Q = quitter)
        waiting = True
        while waiting:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit(); sys.exit()
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_r:
                        waiting = False       # Lance une nouvelle partie
                    if event.key == pygame.K_q:
                        pygame.quit(); sys.exit()


if __name__ == "__main__":
    main()
