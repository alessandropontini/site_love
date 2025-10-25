'use client';

import { useCallback, useEffect, useRef, useState } from "react";

import {
  PixelCharacter,
  type PixelCharacterVariant
} from "@/components/pixel/PixelCharacter";

const WIDTH = 420;
const HEIGHT = 220;
const GROUND_Y = 170;
const RUN_SPEED = 125;
const GRAVITY = 900;
const JUMP_FORCE = -440;
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

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const playerRef = useRef<PlayerState>(player);
  const collectedRef = useRef<Set<number>>(new Set());
  const runningRef = useRef<boolean>(running);
  const finishedRef = useRef<boolean>(finished);
  const canDoubleJumpRef = useRef<boolean>(false);
  const glideHoldRef = useRef<boolean>(false);

  playerRef.current = player;
  runningRef.current = running;
  finishedRef.current = finished;
  collectedRef.current = collected;

  const resetLevel = useCallback(() => {
    playerRef.current = INITIAL_PLAYER;
    collectedRef.current = new Set();
    canDoubleJumpRef.current = false;
    glideHoldRef.current = false;
    setPlayer(INITIAL_PLAYER);
    setCollected(new Set());
    setMessage("Back at the start—steady strides win.");
    setRunning(true);
    setFinished(false);
  }, []);

  const triggerJump = useCallback(() => {
    if (!runningRef.current) return;
    setPlayer((prev) => {
      if (prev.y === 0) {
        setMessage("Leap! We glide past the doubts.");
        const next = { ...prev, velocityY: JUMP_FORCE, y: prev.y - 1 };
        playerRef.current = next;
        canDoubleJumpRef.current = true;
        return next;
      }
      if (canDoubleJumpRef.current) {
        setMessage("Second jump! We keep climbing.");
        const next = {
          ...prev,
          velocityY: JUMP_FORCE * 0.7
        };
        playerRef.current = next;
        canDoubleJumpRef.current = false;
        return next;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowUp" || event.key === "w") {
        event.preventDefault();
        triggerJump();
        glideHoldRef.current = true;
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
  }, [triggerJump]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      const last = lastTimeRef.current ?? timestamp;
      const delta = Math.min(0.05, (timestamp - last) / 1000);
      lastTimeRef.current = timestamp;

      if (runningRef.current) {
        const previous = playerRef.current;
        const isAirborne = previous.y < 0;
        const glideFactor = glideHoldRef.current && isAirborne ? 0.42 : 1;
        let velocityY = previous.velocityY + GRAVITY * delta * glideFactor;
        if (glideHoldRef.current && isAirborne && velocityY > 120) {
          velocityY = 120;
        }
        let y = previous.y + velocityY * delta;
        if (y > 0) {
          y = 0;
          velocityY = 0;
          canDoubleJumpRef.current = false;
        }
        const x = Math.min(LEVEL_LENGTH, previous.x + RUN_SPEED * delta);
        const nextPlayer: PlayerState = { x, y, velocityY };
        playerRef.current = nextPlayer;
        setPlayer(nextPlayer);

        const nextCollected = new Set(collectedRef.current);
        COINS.forEach((coin) => {
          if (nextCollected.has(coin.id)) return;
          const overlapX =
            x + PLAYER_WIDTH > coin.x && x < coin.x + 18;
          const overlapY =
            GROUND_Y + y - PLAYER_HEIGHT / 2 < GROUND_Y - coin.y + 20;
          if (overlapX && overlapY) {
            nextCollected.add(coin.id);
            setMessage("Coin spark collected! Keep running.");
          }
        });
        if (nextCollected.size !== collectedRef.current.size) {
          collectedRef.current = nextCollected;
          setCollected(new Set(nextCollected));
        }

        const playerBottom = GROUND_Y + y;
        const collided = OBSTACLES.some((obstacle) => {
          const obstacleTop = GROUND_Y - obstacle.height;
          const overlapX =
            x + PLAYER_WIDTH > obstacle.x && x < obstacle.x + obstacle.width;
          const overlapY = playerBottom > obstacleTop;
          return overlapX && overlapY;
        });

        if (collided) {
          setMessage("Ouch! The jitters tripped us. Back to start.");
          setRunning(false);
          setTimeout(resetLevel, 720);
        } else if (x >= LEVEL_LENGTH && collectedRef.current.size < COINS.length) {
          setMessage("We missed some vows! Sprint it back.");
          setRunning(false);
          setTimeout(resetLevel, 720);
        } else if (
          !finishedRef.current &&
          x >= LEVEL_LENGTH &&
          collectedRef.current.size === COINS.length
        ) {
          finishedRef.current = true;
          setFinished(true);
          setRunning(false);
          setMessage("All vows collected! The path ahead is ours.");
          setTimeout(() => onComplete(rewardHearts), 640);
        }
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [onComplete, resetLevel, rewardHearts]);

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
          triggerJump();
          glideHoldRef.current = true;
        }}
        onMouseUp={() => {
          glideHoldRef.current = false;
        }}
        onMouseLeave={() => {
          glideHoldRef.current = false;
        }}
        onTouchStart={(event) => {
          event.preventDefault();
          triggerJump();
          glideHoldRef.current = true;
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
