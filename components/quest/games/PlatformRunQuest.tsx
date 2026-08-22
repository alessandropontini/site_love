'use client';

import { useCallback, useEffect, useRef, useState } from "react";

import {
  PixelCharacter,
  type PixelCharacterVariant
} from "@/components/pixel/PixelCharacter";

const WIDTH = 420;
const HEIGHT = 220;
const GROUND_Y = 170;
const RUN_SPEED = 135;
const GRAVITY = 1700;
const JUMP_FORCE = -620;
const DOUBLE_JUMP_FORCE = -520;
const MAX_FALL_SPEED = 900;
const GLIDE_FALL_SPEED = 210;
const CEILING_Y = -140;
const COYOTE_WINDOW = 0.08;
const JUMP_BUFFER = 0.12;
const ENEMY_BOUNCE = -420;
const LEVEL_LENGTH = 720;

type PlayerState = {
  x: number;
  y: number;
  velocityY: number;
};

type Obstacle = {
  x: number;
  width: number;
  height: number;
};

type Coin = {
  id: number;
  x: number;
  y: number;
};

type Enemy = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  minX: number;
  maxX: number;
  direction: 1 | -1;
  speed: number;
  alive: boolean;
};

const OBSTACLES: Obstacle[] = [
  { x: 160, width: 34, height: 46 },
  { x: 300, width: 44, height: 60 },
  { x: 440, width: 50, height: 38 },
  { x: 580, width: 36, height: 58 }
];

const COINS: Coin[] = [
  { id: 1, x: 120, y: 105 },
  { id: 2, x: 215, y: 76 },
  { id: 3, x: 360, y: 126 },
  { id: 4, x: 480, y: 86 },
  { id: 5, x: 640, y: 112 }
];

const INITIAL_PLAYER: PlayerState = { x: 32, y: 0, velocityY: 0 };

const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 42;
const INITIAL_ENEMIES: Enemy[] = [
  {
    id: 1,
    x: 280,
    y: -26,
    width: 28,
    height: 26,
    minX: 260,
    maxX: 360,
    direction: 1,
    speed: 40,
    alive: true
  }
];

function createInitialEnemies(): Enemy[] {
  return INITIAL_ENEMIES.map((enemy) => ({ ...enemy }));
}

export function PlatformRunQuest({
  rewardHearts,
  onComplete,
  playerCharacter,
  partnerCharacter: _partnerCharacter
}: {
  rewardHearts: number;
  onComplete: (hearts: number) => void;
  playerCharacter: PixelCharacterVariant;
  partnerCharacter: PixelCharacterVariant;
}) {
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER);
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string>(
    "Jump over jitters and grab every vow coin."
  );
  const [running, setRunning] = useState<boolean>(true);
  const [finished, setFinished] = useState<boolean>(false);
  const [enemies, setEnemies] = useState<Enemy[]>(() => createInitialEnemies());

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const playerRef = useRef<PlayerState>(player);
  const collectedRef = useRef<Set<number>>(new Set());
  const runningRef = useRef<boolean>(running);
  const finishedRef = useRef<boolean>(finished);
  const canDoubleJumpRef = useRef<boolean>(false);
  const glideHoldRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<number | undefined>(undefined);
  const finishTimeoutRef = useRef<number | undefined>(undefined);
  const groundedRef = useRef<boolean>(true);
  const coyoteRef = useRef<number>(COYOTE_WINDOW);
  const jumpBufferRef = useRef<number | null>(null);
  const enemiesRef = useRef<Enemy[]>(createInitialEnemies());

  playerRef.current = player;
  runningRef.current = running;
  finishedRef.current = finished;
  collectedRef.current = collected;
  enemiesRef.current = enemies;

  const clearPendingTimers = useCallback(() => {
    if (restartTimeoutRef.current !== undefined) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = undefined;
    }
    if (finishTimeoutRef.current !== undefined) {
      window.clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = undefined;
    }
  }, []);

  const resetLevel = useCallback(() => {
    clearPendingTimers();
    playerRef.current = INITIAL_PLAYER;
    collectedRef.current = new Set();
    canDoubleJumpRef.current = false;
    glideHoldRef.current = false;
    groundedRef.current = true;
    coyoteRef.current = COYOTE_WINDOW;
    jumpBufferRef.current = null;
    const freshEnemies = createInitialEnemies();
    enemiesRef.current = freshEnemies;
    runningRef.current = true;
    finishedRef.current = false;
    setPlayer(INITIAL_PLAYER);
    setCollected(new Set());
    setEnemies(freshEnemies);
    setMessage("Back at the start—steady strides win.");
    setRunning(true);
    setFinished(false);
  }, [clearPendingTimers]);

  const triggerFail = useCallback(
    (text: string) => {
      setMessage(text);
      setRunning(false);
      runningRef.current = false;
      clearPendingTimers();
      restartTimeoutRef.current = window.setTimeout(() => {
        resetLevel();
      }, 720);
    },
    [clearPendingTimers, resetLevel]
  );

  const enqueueJump = useCallback(() => {
    if (!runningRef.current) return;
    jumpBufferRef.current = JUMP_BUFFER;
    glideHoldRef.current = true;
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowUp" || event.key === "w") {
        event.preventDefault();
        enqueueJump();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowUp" || event.key === "w") {
        glideHoldRef.current = false;
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enqueueJump]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const last = lastTimeRef.current ?? timestamp;
      let delta = (timestamp - last) / 1000;
      if (delta > 0.05) delta = 0.05;
      lastTimeRef.current = timestamp;

      if (runningRef.current) {
        const previousGrounded = groundedRef.current;

        if (jumpBufferRef.current !== null) {
          jumpBufferRef.current -= delta;
          if (jumpBufferRef.current <= 0) jumpBufferRef.current = null;
        }

        if (coyoteRef.current > 0) {
          coyoteRef.current = Math.max(0, coyoteRef.current - delta);
        }

        let enemiesChanged = false;
        const advancedEnemies = enemiesRef.current.map((enemy) => {
          if (!enemy.alive) return enemy;
          let nextX = enemy.x + enemy.direction * enemy.speed * delta;
          let nextDirection = enemy.direction;
          if (nextX < enemy.minX) {
            nextX = enemy.minX;
            nextDirection = 1;
          } else if (nextX > enemy.maxX) {
            nextX = enemy.maxX;
            nextDirection = -1;
          }
          if (nextX !== enemy.x || nextDirection !== enemy.direction) {
            enemiesChanged = true;
          }
          return { ...enemy, x: nextX, direction: nextDirection };
        });
        if (enemiesChanged) {
          enemiesRef.current = advancedEnemies;
          setEnemies(advancedEnemies);
        }

        const previous = playerRef.current;
        let vy = previous.velocityY;
        let y = previous.y;
        let x = Math.min(LEVEL_LENGTH, previous.x + RUN_SPEED * delta);
        let messageToSet: string | null = null;
        let pendingFail: string | null = null;
        let collisionSide: "top" | "bottom" | "left" | "right" | null = null;
        let grounded = false;
        let stompedEnemyId: number | null = null;

        if (jumpBufferRef.current !== null) {
          if (groundedRef.current || coyoteRef.current > 0) {
            vy = JUMP_FORCE;
            jumpBufferRef.current = null;
            canDoubleJumpRef.current = true;
            groundedRef.current = false;
            coyoteRef.current = 0;
            messageToSet = "Leap! We glide past the doubts.";
          } else if (canDoubleJumpRef.current) {
            vy = DOUBLE_JUMP_FORCE;
            jumpBufferRef.current = null;
            canDoubleJumpRef.current = false;
            messageToSet = "Second jump! We keep climbing.";
          }
        }

        const glideActive = glideHoldRef.current && vy > 0;
        const gravityScale = glideActive ? 0.55 : 1;
        vy += GRAVITY * gravityScale * delta;
        const fallCap = glideActive ? GLIDE_FALL_SPEED : MAX_FALL_SPEED;
        if (vy > fallCap) vy = fallCap;
        y += vy * delta;

        if (y > 0) {
          y = 0;
          vy = 0;
          grounded = true;
          collisionSide = "top";
        }
        if (y < CEILING_Y) {
          y = CEILING_Y;
          vy = 0;
          collisionSide = "bottom";
        }

        const prevTop = GROUND_Y + previous.y;
        const prevBottom = prevTop + PLAYER_HEIGHT;

        if (vy >= 0) {
          for (const obstacle of OBSTACLES) {
            const obstacleLeft = obstacle.x;
            const obstacleRight = obstacle.x + obstacle.width;
            const playerLeftX = x;
            const playerRightX = x + PLAYER_WIDTH;
            if (playerRightX > obstacleLeft && playerLeftX < obstacleRight) {
              const obstacleTop = GROUND_Y - obstacle.height;
              const nextTop = GROUND_Y + y;
              const nextBottom = nextTop + PLAYER_HEIGHT;
              if (prevBottom <= obstacleTop && nextBottom >= obstacleTop) {
                y = obstacleTop - GROUND_Y;
                vy = 0;
                grounded = true;
                collisionSide = "top";
                break;
              }
            }
          }
        }

        const playerTopAfterY = GROUND_Y + y;
        const playerBottomAfterY = playerTopAfterY + PLAYER_HEIGHT;
        let playerLeftAfterY = x;
        let playerRightAfterY = x + PLAYER_WIDTH;

        if (vy >= 0) {
          for (const enemy of enemiesRef.current) {
            if (!enemy.alive) continue;
            if (stompedEnemyId !== null) break;
            const enemyLeft = enemy.x;
            const enemyRight = enemy.x + enemy.width;
            if (playerRightAfterY > enemyLeft && playerLeftAfterY < enemyRight) {
              const enemyTop = GROUND_Y + enemy.y;
              const enemyBottom = enemyTop + enemy.height;
              if (prevBottom <= enemyTop && playerBottomAfterY >= enemyTop) {
                stompedEnemyId = enemy.id;
                y = enemyTop - GROUND_Y - 0.01;
                vy = ENEMY_BOUNCE;
                grounded = false;
                collisionSide = "top";
              } else if (prevTop < enemyBottom) {
                pendingFail = "The patroller nudged us—resetting.";
              }
            }
          }
        }

        if (stompedEnemyId !== null) {
          const defeated = enemiesRef.current.map((enemy) =>
            enemy.id === stompedEnemyId ? { ...enemy, alive: false } : enemy
          );
          enemiesRef.current = defeated;
          setEnemies(defeated);
          messageToSet = "Stomp bounce! Keep running.";
          canDoubleJumpRef.current = false;
          grounded = false;
          vy = ENEMY_BOUNCE;
        }

        for (const obstacle of OBSTACLES) {
          const obstacleLeft = obstacle.x;
          const obstacleRight = obstacle.x + obstacle.width;
          const obstacleTop = GROUND_Y - obstacle.height;
          const obstacleBottom = GROUND_Y;
          const verticalOverlap =
            playerBottomAfterY > obstacleTop && playerTopAfterY < obstacleBottom;
          if (!verticalOverlap) continue;
          const prevRight = previous.x + PLAYER_WIDTH;
          if (prevRight <= obstacleLeft && playerRightAfterY > obstacleLeft) {
            x = obstacleLeft - PLAYER_WIDTH;
            collisionSide = collisionSide ?? "right";
            break;
          }
        }

        playerLeftAfterY = x;
        playerRightAfterY = x + PLAYER_WIDTH;

        if (collisionSide === "right") {
          pendingFail = "Ouch! The jitters tripped us. Back to start.";
        }

        if (!pendingFail) {
          for (const enemy of enemiesRef.current) {
            if (!enemy.alive) continue;
            const enemyLeft = enemy.x;
            const enemyRight = enemy.x + enemy.width;
            const enemyTop = GROUND_Y + enemy.y;
            const enemyBottom = enemyTop + enemy.height;
            const verticalOverlap =
              playerBottomAfterY > enemyTop && playerTopAfterY < enemyBottom;
            const prevRight = previous.x + PLAYER_WIDTH;
            if (
              verticalOverlap &&
              prevRight <= enemyLeft &&
              playerRightAfterY > enemyLeft
            ) {
              pendingFail = "The patroller nudged us—resetting.";
              break;
            }
          }
        }

        groundedRef.current = grounded;
        if (grounded) {
          canDoubleJumpRef.current = true;
          coyoteRef.current = COYOTE_WINDOW;
          glideHoldRef.current = false;
        } else if (previousGrounded && vy > 0) {
          coyoteRef.current = COYOTE_WINDOW;
        }

        const nextPlayer: PlayerState = { x, y, velocityY: vy };
        playerRef.current = nextPlayer;
        setPlayer(nextPlayer);

        if (pendingFail) {
          triggerFail(pendingFail);
        } else {
          const nextCollected = new Set(collectedRef.current);
          COINS.forEach((coin) => {
            if (nextCollected.has(coin.id)) return;
            const overlapX = x + PLAYER_WIDTH > coin.x && x < coin.x + 18;
            const overlapY =
              playerBottomAfterY - PLAYER_HEIGHT / 2 < GROUND_Y - coin.y + 20;
            if (overlapX && overlapY) {
              nextCollected.add(coin.id);
              if (!messageToSet) {
                messageToSet = "Coin spark collected! Keep running.";
              }
            }
          });
          if (nextCollected.size !== collectedRef.current.size) {
            collectedRef.current = nextCollected;
            setCollected(new Set(nextCollected));
          }

          if (x >= LEVEL_LENGTH && nextCollected.size < COINS.length) {
            triggerFail("We missed some vows! Sprint it back.");
          } else if (
            !finishedRef.current &&
            x >= LEVEL_LENGTH &&
            nextCollected.size === COINS.length
          ) {
            finishedRef.current = true;
            setFinished(true);
            setRunning(false);
            setMessage("All vows collected! The path ahead is ours.");
            clearPendingTimers();
            finishTimeoutRef.current = window.setTimeout(
              () => onComplete(rewardHearts),
              640
            );
          } else if (messageToSet) {
            setMessage(messageToSet);
          }
        }
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearPendingTimers();
    };
  }, [clearPendingTimers, onComplete, rewardHearts, triggerFail]);

  const cameraX = Math.max(0, player.x - 120);

  return (
    <div className="platform-quest">
      <div
        className="platform-stage"
        style={{ width: WIDTH, height: HEIGHT }}
        role="button"
        tabIndex={0}
        onMouseDown={(event) => {
          event.preventDefault();
          enqueueJump();
        }}
        onMouseUp={() => {
          glideHoldRef.current = false;
        }}
        onMouseLeave={() => {
          glideHoldRef.current = false;
        }}
        onTouchStart={(event) => {
          event.preventDefault();
          enqueueJump();
        }}
        onTouchEnd={() => {
          glideHoldRef.current = false;
        }}
      >
        <div className="platform-ground" />
        {OBSTACLES.map((obstacle, index) => (
          <div
            key={`obstacle-${index}`}
            className="platform-obstacle"
            style={{
              transform: `translateX(${obstacle.x - cameraX}px)`,
              height: obstacle.height
            }}
          />
        ))}
        {COINS.map((coin) => (
          <div
            key={`coin-${coin.id}`}
            className={[
              "platform-coin",
              collected.has(coin.id) ? "collected" : ""
            ]
              .join(" ")
              .trim()}
            style={{
              transform: `translate(${coin.x - cameraX}px, ${GROUND_Y - coin.y}px)`
            }}
          />
        ))}
        {enemies.map((enemy) =>
          enemy.alive ? (
            <div
              key={`enemy-${enemy.id}`}
              className="platform-enemy"
              data-direction={enemy.direction}
              style={{
                transform: `translate(${enemy.x - cameraX}px, ${GROUND_Y + enemy.y}px) scaleX(${enemy.direction})`
              }}
            />
          ) : null
        )}
        <div
          className={[
            "platform-player",
            player.y < 0 ? "jump" : "",
            finished ? "celebrate" : ""
          ]
            .join(" ")
            .trim()}
          style={{
            transform: `translate(${player.x - cameraX}px, ${GROUND_Y + player.y}px)`
          }}
        >
          <PixelCharacter
            variant={playerCharacter}
            size={44}
            className="platform-player-sprite"
          />
        </div>
      </div>
      <div className="platform-panel">
        <h3>Vow coins: {collected.size}/{COINS.length}</h3>
        <p>{message}</p>
        <ul>
          <li>Press space / tap to jump.</li>
          <li>Collect every vow coin before the finish line.</li>
          <li>Touching an obstacle rewinds the run.</li>
        </ul>
      </div>
    </div>
  );
}

export default PlatformRunQuest;
