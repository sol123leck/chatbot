import curses
import random
import json
import os

HIGH_SCORE_FILE = os.path.join(os.path.dirname(__file__), ".snake_highscore.json")

def load_high_score():
    try:
        with open(HIGH_SCORE_FILE) as f:
            return json.load(f).get("high_score", 0)
    except (FileNotFoundError, json.JSONDecodeError):
        return 0

def save_high_score(score):
    with open(HIGH_SCORE_FILE, "w") as f:
        json.dump({"high_score": score}, f)

def spawn_food(snake, height, width):
    while True:
        pos = (random.randint(1, height - 2), random.randint(1, width - 2))
        if pos not in snake:
            return pos

def game_loop(stdscr):
    curses.curs_set(0)
    curses.start_color()
    curses.init_pair(1, curses.COLOR_GREEN, curses.COLOR_BLACK)   # snake
    curses.init_pair(2, curses.COLOR_RED, curses.COLOR_BLACK)     # food
    curses.init_pair(3, curses.COLOR_YELLOW, curses.COLOR_BLACK)  # score
    curses.init_pair(4, curses.COLOR_WHITE, curses.COLOR_BLACK)   # border

    high_score = load_high_score()

    while True:
        height, width = stdscr.getmaxyx()

        snake = [(height // 2, width // 2),
                 (height // 2, width // 2 - 1),
                 (height // 2, width // 2 - 2)]
        direction = curses.KEY_RIGHT
        food = spawn_food(snake, height, width)
        score = 0
        speed = 120  # ms

        stdscr.nodelay(True)
        stdscr.timeout(speed)

        while True:
            stdscr.clear()

            # Border
            stdscr.attron(curses.color_pair(4))
            stdscr.border()
            stdscr.attroff(curses.color_pair(4))

            # Score bar
            stdscr.attron(curses.color_pair(3))
            stdscr.addstr(0, 2, f" Score: {score}  Best: {high_score} ")
            stdscr.attroff(curses.color_pair(3))

            # Food
            stdscr.attron(curses.color_pair(2))
            stdscr.addstr(food[0], food[1], "●")
            stdscr.attroff(curses.color_pair(2))

            # Snake
            stdscr.attron(curses.color_pair(1))
            for i, seg in enumerate(snake):
                char = "█" if i == 0 else "▓"
                stdscr.addstr(seg[0], seg[1], char)
            stdscr.attroff(curses.color_pair(1))

            stdscr.refresh()

            key = stdscr.getch()

            # Direction change (prevent 180° reversal)
            opposites = {
                curses.KEY_UP: curses.KEY_DOWN,
                curses.KEY_DOWN: curses.KEY_UP,
                curses.KEY_LEFT: curses.KEY_RIGHT,
                curses.KEY_RIGHT: curses.KEY_LEFT,
            }
            if key in opposites and key != opposites[direction]:
                direction = key

            # Move head
            y, x = snake[0]
            if direction == curses.KEY_UP:
                y -= 1
            elif direction == curses.KEY_DOWN:
                y += 1
            elif direction == curses.KEY_LEFT:
                x -= 1
            elif direction == curses.KEY_RIGHT:
                x += 1

            # Wrap around walls
            y = (y - 1) % (height - 2) + 1
            x = (x - 1) % (width - 2) + 1

            new_head = (y, x)

            # Self-collision
            if new_head in snake:
                break

            snake.insert(0, new_head)

            if new_head == food:
                score += 10
                if score > high_score:
                    high_score = score
                    save_high_score(high_score)
                food = spawn_food(snake, height, width)
                # Speed up every 50 points
                if score % 50 == 0 and speed > 50:
                    speed = max(50, speed - 10)
                    stdscr.timeout(speed)
            else:
                snake.pop()

        # Game over screen
        stdscr.nodelay(False)
        stdscr.timeout(-1)

        msg1 = "★  GAME OVER  ★"
        msg2 = f"Score : {score}   Meilleur : {high_score}"
        msg3 = "[R] Rejouer    [Q] Quitter"

        cy, cx = height // 2, width // 2
        stdscr.attron(curses.A_BOLD)
        stdscr.addstr(cy - 1, cx - len(msg1) // 2, msg1)
        stdscr.addstr(cy,     cx - len(msg2) // 2, msg2)
        stdscr.addstr(cy + 1, cx - len(msg3) // 2, msg3)
        stdscr.attroff(curses.A_BOLD)
        stdscr.refresh()

        while True:
            ch = stdscr.getch()
            if ch in (ord("r"), ord("R")):
                break
            if ch in (ord("q"), ord("Q")):
                return

def main():
    curses.wrapper(game_loop)

if __name__ == "__main__":
    main()
