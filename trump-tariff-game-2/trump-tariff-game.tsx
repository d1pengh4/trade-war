"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import "./news-ticker.css"





// --- TYPE DEFINITIONS ---
type ProjectileShape = "triangle" | "square" | "diamond" | "star" | "circle" | "shuriken" | "maple_leaf" | "hexagon"

interface PhaseAttack {
  pattern: AttackPatternType
  shape: ProjectileShape
  intensityModifier: number
}

interface Country {
  name: string
  flag: string
  color: string
  specialAbility: string
  tariffRate: number
  stats: { speed: number; agility: number; defense: number; cooldown: number }
  description: string
  phaseAttacks: PhaseAttack[]
}

interface TariffBomb {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  type: BombType
  life: number
  rotation: number
  shape: ProjectileShape
  trail: Array<{ x: number; y: number; alpha: number }>
  update?: (bomb: TariffBomb, player: Player) => TariffBomb
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Player {
  x: number
  y: number
  width: number
  height: number
  hitboxRadius: number
  shield: number
  speedBoost: number
  invulnerable: number
  trail: Array<{ x: number; y: number }>
}

interface Telegraph {
  id: number
  type: "line" | "circle"
  x: number
  y: number
  endX?: number
  endY?: number
  radius?: number
  life: number
  maxLife: number
}

interface Star {
  x: number
  y: number
  z: number
}

interface GameModel {
  player: Player
  tariffBombs: TariffBomb[]
  particles: Particle[]
  telegraphs: Telegraph[]
  stars: Star[]
  trumpPosition: { x: number; y: number }
  score: number
  graze: number
  phase: number
  specialAbilityCharge: number
  screenShake: number
  attackCooldown: number
}

type BombType = "normal" | "mega" | "homing" | "laser"
type AttackPatternType = "spiral" | "burst" | "wall" | "laserSweep" | "homingSwarm" | "targetedBarrage" | "meteorShower"

// --- GAME DATA & CONFIGURATION ---
const countriesData: Omit<Country, "phaseAttacks">[] = [
  {
    name: "멕시코",
    flag: "🇲🇽",
    color: "#006847",
    specialAbility: "USMCA 재협상",
    tariffRate: 58,
    stats: { speed: 1.4, agility: 1.6, defense: 0.8, cooldown: 0.5 },
    description: "국경을 맞댄 최대 교역국. 관세는 생존의 문제.",
  },
  {
    name: "캐나다",
    flag: "🇨🇦",
    color: "#D8292F",
    specialAbility: "메이플 실드",
    tariffRate: 55,
    stats: { speed: 1.3, agility: 1.4, defense: 1.0, cooldown: 0.7 },
    description: "자원 부국. 강력한 한 방을 가진 우방국.",
  },
  {
    name: "캄보디아",
    flag: "🇰🇭",
    color: "#032EA1",
    specialAbility: "최빈국 특혜",
    tariffRate: 49,
    stats: { speed: 1.1, agility: 2.0, defense: 0.6, cooldown: 0.3 },
    description: "가장 약한 고리, 그러나 가장 예측 불가능한 움직임.",
  },
  {
    name: "베트남",
    flag: "🇻🇳",
    color: "#DA251D",
    specialAbility: "공급망 이전",
    tariffRate: 46,
    stats: { speed: 1.3, agility: 1.8, defense: 0.8, cooldown: 0.4 },
    description: "새로운 생산 기지로 급부상하며 전장의 중심으로.",
  },
  {
    name: "태국",
    flag: "🇹🇭",
    color: "#2E3192",
    specialAbility: "관광객 방어",
    tariffRate: 36,
    stats: { speed: 1.2, agility: 1.7, defense: 0.9, cooldown: 0.5 },
    description: "동남아의 허브, 복잡한 비관세 장벽으로 저항.",
  },
  {
    name: "중국",
    flag: "🇨🇳",
    color: "#EE1C25",
    specialAbility: "만리장성 방벽",
    tariffRate: 34,
    stats: { speed: 1.1, agility: 1.3, defense: 1.5, cooldown: 0.7 },
    description: "초강대국과의 무역 패권 전쟁. 모든 것을 건 전면전.",
  },
  {
    name: "대만",
    flag: "🇹🇼",
    color: "#0074DF",
    specialAbility: "반도체 공급망",
    tariffRate: 32,
    stats: { speed: 1.6, agility: 1.9, defense: 0.7, cooldown: 0.4 },
    description: "세계 경제의 혈맥, 반도체를 둘러싼 치열한 공방.",
  },
  {
    name: "남아공",
    flag: "🇿🇦",
    color: "#007749",
    specialAbility: "다이아몬드 반격",
    tariffRate: 30,
    stats: { speed: 1.2, agility: 1.5, defense: 1.2, cooldown: 0.6 },
    description: "아프리카의 경제 대국, 자원의 힘으로 맞선다.",
  },
  {
    name: "한국",
    flag: "🇰🇷",
    color: "#CD2E3A",
    specialAbility: "K-방산 시스템",
    tariffRate: 25,
    stats: { speed: 1.5, agility: 1.5, defense: 1.2, cooldown: 0.6 },
    description: "첨단 기술과 빠른 대응 속도가 최대 무기.",
  },
  {
    name: "일본",
    flag: "🇯🇵",
    color: "#BC002D",
    specialAbility: "엔저 방어선",
    tariffRate: 24,
    stats: { speed: 1.4, agility: 1.7, defense: 0.9, cooldown: 0.5 },
    description: "정밀한 공격과 견고한 방어 체계를 갖춘 전통의 강호.",
  },
  {
    name: "유럽연합",
    flag: "🇪🇺",
    color: "#003399",
    specialAbility: "유로존 단결",
    tariffRate: 20,
    stats: { speed: 1.2, agility: 1.1, defense: 1.3, cooldown: 0.7 },
    description: "복잡한 규제와 공동 관세로 무장한 거대 경제 블록.",
  },
  {
    name: "영국",
    flag: "🇬🇧",
    color: "#012169",
    specialAbility: "브렉시트 변수",
    tariffRate: 10,
    stats: { speed: 1.2, agility: 1.3, defense: 1.1, cooldown: 0.7 },
    description: "독자 노선을 걷는 금융 허브. 변칙적인 플레이 가능.",
  },
  {
    name: "호주",
    flag: "🇦🇺",
    color: "#00008B",
    specialAbility: "자원 방어",
    tariffRate: 10,
    stats: { speed: 1.3, agility: 1.4, defense: 1.0, cooldown: 0.6 },
    description: "광활한 대륙의 힘. 안정적인 방어와 기동성.",
  },
  {
    name: "브라질",
    flag: "🇧🇷",
    color: "#009B3A",
    specialAbility: "삼바 스텝",
    tariffRate: 10,
    stats: { speed: 1.4, agility: 1.8, defense: 0.8, cooldown: 0.5 },
    description: "남미의 거인, 예측불허의 리듬으로 전장을 흔든다.",
  },
  {
    name: "싱가포르",
    flag: "🇸🇬",
    color: "#ED2939",
    specialAbility: "금융 허브",
    tariffRate: 10,
    stats: { speed: 1.5, agility: 1.9, defense: 0.7, cooldown: 0.4 },
    description: "아시아의 무역 중심지, 빠른 기동력으로 승부.",
  },
  {
    name: "UAE",
    flag: "🇦🇪",
    color: "#00732F",
    specialAbility: "오일 머니",
    tariffRate: 10,
    stats: { speed: 1.1, agility: 1.2, defense: 1.4, cooldown: 0.8 },
    description: "막대한 자본력으로 전세를 뒤집는 사막의 강자.",
  },
]

const getPhaseAttacks = (name: string): PhaseAttack[] => {
  switch (name) {
    case "중국":
      return [
        { pattern: "wall", shape: "square", intensityModifier: 1.2 },
        { pattern: "homingSwarm", shape: "square", intensityModifier: 1.0 },
        { pattern: "meteorShower", shape: "square", intensityModifier: 1.5 },
        { pattern: "laserSweep", shape: "square", intensityModifier: 1.3 },
        { pattern: "wall", shape: "square", intensityModifier: 2.0 },
      ]
    case "멕시코":
      return [
        { pattern: "burst", shape: "diamond", intensityModifier: 1.5 },
        { pattern: "targetedBarrage", shape: "diamond", intensityModifier: 1.2 },
        { pattern: "spiral", shape: "diamond", intensityModifier: 1.4 },
        { pattern: "meteorShower", shape: "diamond", intensityModifier: 1.8 },
        { pattern: "burst", shape: "diamond", intensityModifier: 2.2 },
      ]
    case "캐나다":
      return [
        { pattern: "wall", shape: "maple_leaf", intensityModifier: 1.4 },
        { pattern: "meteorShower", shape: "maple_leaf", intensityModifier: 1.2 },
        { pattern: "targetedBarrage", shape: "maple_leaf", intensityModifier: 1.6 },
        { pattern: "spiral", shape: "maple_leaf", intensityModifier: 1.5 },
        { pattern: "wall", shape: "maple_leaf", intensityModifier: 2.1 },
      ]
    case "일본":
      return [
        { pattern: "laserSweep", shape: "shuriken", intensityModifier: 1.3 },
        { pattern: "spiral", shape: "shuriken", intensityModifier: 1.1 },
        { pattern: "burst", shape: "shuriken", intensityModifier: 1.4 },
        { pattern: "homingSwarm", shape: "shuriken", intensityModifier: 1.6 },
        { pattern: "laserSweep", shape: "shuriken", intensityModifier: 2.0 },
      ]
    case "한국":
      return [
        { pattern: "targetedBarrage", shape: "hexagon", intensityModifier: 1.4 },
        { pattern: "laserSweep", shape: "hexagon", intensityModifier: 1.2 },
        { pattern: "burst", shape: "hexagon", intensityModifier: 1.5 },
        { pattern: "spiral", shape: "hexagon", intensityModifier: 1.7 },
        { pattern: "targetedBarrage", shape: "hexagon", intensityModifier: 2.1 },
      ]
    case "유럽연합":
      return [
        { pattern: "spiral", shape: "circle", intensityModifier: 1.2 },
        { pattern: "wall", shape: "circle", intensityModifier: 1.0 },
        { pattern: "burst", shape: "circle", intensityModifier: 1.3 },
        { pattern: "laserSweep", shape: "circle", intensityModifier: 1.5 },
        { pattern: "spiral", shape: "circle", intensityModifier: 1.9 },
      ]
    case "남아공":
      return [
        { pattern: "burst", shape: "diamond", intensityModifier: 1.2 },
        { pattern: "spiral", shape: "diamond", intensityModifier: 1.4 },
        { pattern: "meteorShower", shape: "diamond", intensityModifier: 1.6 },
        { pattern: "burst", shape: "diamond", intensityModifier: 2.0 },
      ]
    case "대만":
      return [
        { pattern: "homingSwarm", shape: "hexagon", intensityModifier: 1.5 },
        { pattern: "laserSweep", shape: "hexagon", intensityModifier: 1.3 },
        { pattern: "spiral", shape: "hexagon", intensityModifier: 1.6 },
        { pattern: "homingSwarm", shape: "hexagon", intensityModifier: 2.2 },
      ]
    default:
      return [
        { pattern: "spiral", shape: "triangle", intensityModifier: 1.0 },
        { pattern: "burst", shape: "triangle", intensityModifier: 1.1 },
        { pattern: "wall", shape: "triangle", intensityModifier: 1.2 },
        { pattern: "targetedBarrage", shape: "triangle", intensityModifier: 1.3 },
        { pattern: "meteorShower", shape: "triangle", intensityModifier: 1.5 },
      ]
  }
}

const allCountries: Country[] = countriesData.map((c) => ({ ...c, phaseAttacks: getPhaseAttacks(c.name) }))
const worstViolators = allCountries.filter((c) => c.tariffRate >= 20)
const baseTariffCountries = allCountries.filter((c) => c.tariffRate < 20)

const newsItems = [
  "트럼프, 캐나다·멕시코·중국에 관세 전면 부과하기로 (2025년 2월 2일)",
  "트럼프의 관세는 중국의 거대 제조업에 타격을 줄 수 있을까? (2025년 3월 6일)",
  "트럼프의 '추가 관세' 엄포에 격화하는 무역 전쟁 (2025년 3월 13일)",
  "백악관, 약 60개국 '최악의 침해국'에 상호 관세율 부과 발표 (2025년 9월 9일)",
]

export default function Component() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver">("menu")
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [finalGraze, setFinalGraze] = useState(0)
  const [finalPhase, setFinalPhase] = useState(1)
  const [highScore, setHighScore] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const animationFrameId = useRef<number>()
  const gameModelRef = useRef<GameModel>({
    player: {
      x: 0,
      y: 0,
      width: 28,
      height: 28,
      hitboxRadius: 4,
      shield: 0,
      speedBoost: 0,
      invulnerable: 120,
      trail: [],
    },
    tariffBombs: [],
    particles: [],
    telegraphs: [],
    stars: [],
    trumpPosition: { x: 0, y: 150 },
    score: 0,
    graze: 0,
    phase: 1,
    specialAbilityCharge: 0,
    screenShake: 0,
    attackCooldown: 0,
  })

  const createExplosion = (x: number, y: number, color: string, intensity = 1) => {
    const model = gameModelRef.current
    for (let i = 0; i < 50 * intensity; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 12 * intensity
      model.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 80,
        maxLife: 80,
        color,
        size: Math.random() * 4 + 1,
      })
    }
    model.screenShake = Math.max(model.screenShake, 20 * intensity)
  }

  const addTelegraph = (telegraph: Omit<Telegraph, "id" | "maxLife">) => {
    gameModelRef.current.telegraphs.push({ ...telegraph, id: Date.now() + Math.random(), maxLife: telegraph.life })
  }

  const attackLibrary = {
    spiral: (intensity: number, shape: ProjectileShape) => {
      const bombs: TariffBomb[] = []
      const arms = 4 + Math.floor(intensity / 2)
      const bulletsPerArm = 15 + intensity * 3
      for (let i = 0; i < arms; i++) {
        for (let j = 0; j < bulletsPerArm; j++) {
          const angle = (i / arms) * Math.PI * 2 + (j / bulletsPerArm) * Math.PI * (intensity > 2 ? 1.8 : 1.0)
          const speed = 3 + intensity * 0.4
          bombs.push({
            x: gameModelRef.current.trumpPosition.x,
            y: gameModelRef.current.trumpPosition.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 12,
            type: "normal",
            life: 800,
            rotation: 0,
            trail: [],
            shape,
          })
        }
      }
      return bombs
    },
    burst: (intensity: number, shape: ProjectileShape) => {
      const bombs: TariffBomb[] = []
      const count = 20 + intensity * 7
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const speed = 3.5 + Math.random() * intensity * 2
        bombs.push({
          x: gameModelRef.current.trumpPosition.x,
          y: gameModelRef.current.trumpPosition.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 14,
          type: "normal",
          life: 600,
          rotation: 0,
          trail: [],
          shape,
        })
      }
      return bombs
    },
    wall: (intensity: number, shape: ProjectileShape) => {
      const bombs: TariffBomb[] = []
      const canvas = canvasRef.current!
      const count = 30 + intensity * 6
      const gapIndex = Math.floor(Math.random() * (count - 4)) + 2
      const speed = 3 + intensity * 0.5
      for (let i = 0; i < count; i++) {
        if (i >= gapIndex && i < gapIndex + 3) continue
        bombs.push({
          x: (i / count) * canvas.width,
          y: gameModelRef.current.trumpPosition.y,
          vx: 0,
          vy: speed,
          size: 20,
          type: "normal",
          life: 800,
          rotation: 0,
          trail: [],
          shape,
        })
      }
      return bombs
    },
    laserSweep: (intensity: number, shape: ProjectileShape) => {
      const { player, trumpPosition } = gameModelRef.current
      const angle = Math.atan2(player.y - trumpPosition.y, player.x - trumpPosition.x)
      const sweepAngle = Math.PI / (3.0 - intensity * 0.5)
      const startAngle = angle - sweepAngle / 2
      addTelegraph({
        type: "line",
        x: trumpPosition.x,
        y: trumpPosition.y,
        endX: trumpPosition.x + Math.cos(startAngle) * 2000,
        endY: trumpPosition.y + Math.sin(startAngle) * 2000,
        life: 40,
      })
      addTelegraph({
        type: "line",
        x: trumpPosition.x,
        y: trumpPosition.y,
        endX: trumpPosition.x + Math.cos(startAngle + sweepAngle) * 2000,
        endY: trumpPosition.y + Math.sin(startAngle + sweepAngle) * 2000,
        life: 40,
      })
      setTimeout(() => {
        const laserBombs: TariffBomb[] = []
        const bulletCount = 50 + intensity * 20
        for (let i = 0; i < bulletCount; i++) {
          const currentAngle = startAngle + (i / bulletCount) * sweepAngle
          const speed = 9 + intensity * 2
          laserBombs.push({
            x: gameModelRef.current.trumpPosition.x,
            y: gameModelRef.current.trumpPosition.y,
            vx: Math.cos(currentAngle) * speed,
            vy: Math.sin(currentAngle) * speed,
            size: 9,
            type: "laser",
            life: 300,
            rotation: 0,
            trail: [],
            shape,
          })
        }
        gameModelRef.current.tariffBombs.push(...laserBombs)
      }, 650)
      return []
    },
    homingSwarm: (intensity: number, shape: ProjectileShape) => {
      const bombs: TariffBomb[] = []
      const { trumpPosition } = gameModelRef.current
      const count = 5 + intensity * 2
      for (let i = 0; i < count; i++) {
        bombs.push({
          x: trumpPosition.x + (Math.random() - 0.5) * 400,
          y: trumpPosition.y,
          vx: (Math.random() - 0.5) * 4,
          vy: 2,
          size: 20,
          type: "homing",
          life: 700,
          rotation: 0,
          trail: [],
          shape,
          update: (bomb, p) => {
            const dx = p.x - bomb.x
            const dy = p.y - bomb.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const speed = 0.06 + intensity * 0.015
            return { ...bomb, vx: bomb.vx * 0.985 + (dx / dist) * speed, vy: bomb.vy * 0.985 + (dy / dist) * speed }
          },
        })
      }
      return bombs
    },
    targetedBarrage: (intensity: number, shape: ProjectileShape) => {
      const { player } = gameModelRef.current
      const count = 5 + intensity
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const targetX = player.x + (Math.random() - 0.5) * 50
          const targetY = player.y + (Math.random() - 0.5) * 50
          addTelegraph({ type: "circle", x: targetX, y: targetY, radius: 70, life: 40 })
          setTimeout(() => {
            const explosionBombs: TariffBomb[] = []
            for (let j = 0; j < 16; j++) {
              const angle = (j / 16) * Math.PI * 2
              explosionBombs.push({
                x: targetX,
                y: targetY,
                vx: Math.cos(angle) * 6,
                vy: Math.sin(angle) * 6,
                size: 14,
                type: "mega",
                life: 150,
                rotation: 0,
                trail: [],
                shape,
              })
            }
            gameModelRef.current.tariffBombs.push(...explosionBombs)
            createExplosion(targetX, targetY, "#feca57", 2.5)
          }, 600)
        }, i * 200)
      }
      return []
    },
    meteorShower: (intensity: number, shape: ProjectileShape) => {
      const bombs: TariffBomb[] = []
      const count = 20 + intensity * 10
      for (let i = 0; i < count; i++) {
        bombs.push({
          x: Math.random() * window.innerWidth,
          y: -50,
          vx: (Math.random() - 0.5) * 2,
          vy: 4 + Math.random() * 3 + intensity,
          size: Math.random() * 25 + 10,
          type: "mega",
          life: 500,
          rotation: 0,
          trail: [],
          shape,
        })
      }
      return bombs
    },
  }

  const useSpecialAbility = () => {
    const model = gameModelRef.current
    if (model.specialAbilityCharge < 100 || !selectedCountry) return
    model.specialAbilityCharge = 0
    switch (selectedCountry.name) {
      case "중국":
        model.tariffBombs = []
        createExplosion(model.player.x, model.player.y, selectedCountry.color, 5)
        model.player.invulnerable = 180
        break
      case "한국":
        model.player.shield = 500
        model.player.invulnerable = 180
        model.tariffBombs.forEach((b) => {
          b.vx *= 0.4
          b.vy *= 0.4
        })
        createExplosion(model.player.x, model.player.y, selectedCountry.color, 2)
        break
      case "대만":
        const bombsToConvert = model.tariffBombs.splice(0, 50)
        model.score += bombsToConvert.length * 500
        createExplosion(model.player.x, model.player.y, selectedCountry.color, 3)
        break
      default:
        model.player.invulnerable = 300
        createExplosion(model.player.x, model.player.y, selectedCountry.color, 2)
        break
    }
  }

  const gameOver = () => {
    const model = gameModelRef.current
    setFinalScore(model.score)
    setFinalGraze(model.graze)
    setFinalPhase(model.phase)
    if (model.score > highScore) {
      setHighScore(model.score)
    }
    setGameState("gameOver")
  }

  const gameLoop = () => {
    const model = gameModelRef.current
    const canvas = canvasRef.current
    if (!canvas || !selectedCountry) return
    // --- UPDATE LOGIC ---
    const moveSpeed = (model.player.speedBoost > 0 ? 12 : 8) * selectedCountry.stats.speed
    if (keysRef.current.has("arrowleft") || keysRef.current.has("a"))
      model.player.x = Math.max(0, model.player.x - moveSpeed)
    if (keysRef.current.has("arrowright") || keysRef.current.has("d"))
      model.player.x = Math.min(canvas.width - model.player.width, model.player.x + moveSpeed)
    if (keysRef.current.has("arrowup") || keysRef.current.has("w"))
      model.player.y = Math.max(0, model.player.y - moveSpeed)
    if (keysRef.current.has("arrowdown") || keysRef.current.has("s"))
      model.player.y = Math.min(canvas.height - model.player.height, model.player.y + moveSpeed)
    model.player.shield = Math.max(0, model.player.shield - 1)
    model.player.speedBoost = Math.max(0, model.player.speedBoost - 1)
    model.player.invulnerable = Math.max(0, model.player.invulnerable - 1)
    model.player.trail.push({ x: model.player.x + model.player.width / 2, y: model.player.y + model.player.height / 2 })
    if (model.player.trail.length > 10) model.player.trail.shift()
    model.screenShake = Math.max(0, model.screenShake - 0.8)
    model.trumpPosition = { x: canvas.width / 2 + Math.sin(Date.now() / 1300) * (canvas.width / 2.5), y: 150 }
    const newPhase = Math.floor(model.score / 35000) + 1
    if (newPhase > model.phase) {
      model.phase = newPhase
      model.player.invulnerable = 180
      model.attackCooldown = 0
    }
    model.attackCooldown--
    if (model.attackCooldown <= 0) {
      const phaseIndex = Math.min(model.phase - 1, selectedCountry.phaseAttacks.length - 1)
      const attackDef = selectedCountry.phaseAttacks[phaseIndex]
      const tariffIntensity = (selectedCountry.tariffRate / 50) * model.phase * attackDef.intensityModifier
      const baseIntensity = model.phase * 1.5
      const totalIntensity = baseIntensity + tariffIntensity
      const newBombs = attackLibrary[attackDef.pattern](totalIntensity, attackDef.shape)
      model.tariffBombs.push(...newBombs)
      model.attackCooldown = 100 - model.phase * 9 - totalIntensity
    }
    model.tariffBombs = model.tariffBombs
      .map((b) => {
        const ub = b.update ? b.update(b, model.player) : b
        ub.rotation += 0.05
        ub.trail.push({ x: ub.x, y: ub.y, alpha: 1.0 })
        if (ub.trail.length > 20) ub.trail.shift()
        ub.trail.forEach((t) => (t.alpha -= 0.05))
        return { ...ub, x: ub.x + ub.vx, y: ub.y + ub.vy, life: ub.life - 1 }
      })
      .filter((b) => b.life > 0 && b.x > -50 && b.x < canvas.width + 50 && b.y > -50 && b.y < canvas.height + 50)
    model.particles = model.particles
      .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1, vx: p.vx * 0.99, vy: p.vy * 0.99 }))
      .filter((p) => p.life > 0)
    model.telegraphs = model.telegraphs.map((tel) => ({ ...tel, life: tel.life - 1 })).filter((tel) => tel.life > 0)
    model.stars.forEach((star) => {
      star.z -= 3
      if (star.z <= 0) {
        star.x = (Math.random() - 0.5) * window.innerWidth * 2
        star.y = (Math.random() - 0.5) * window.innerHeight * 2
        star.z = window.innerWidth
      }
    })
    const grazeRadius = model.player.width * 3.0
    let grazedInFrame = false
    for (const bomb of model.tariffBombs) {
      const playerCenterX = model.player.x + model.player.width / 2
      const playerCenterY = model.player.y + model.player.height / 2
      const dist = Math.hypot(bomb.x - playerCenterX, bomb.y - playerCenterY)
      if (model.player.invulnerable === 0 && dist < bomb.size / 2 + model.player.hitboxRadius) {
        if (model.player.shield > 0) {
          model.player.shield -= 100
          model.tariffBombs = model.tariffBombs.filter((b) => b !== bomb)
          createExplosion(bomb.x, bomb.y, "#00FFFF", 1.5)
        } else {
          createExplosion(playerCenterX, playerCenterY, selectedCountry.color, 5)
          gameOver()
          return
        }
      } else if (dist < bomb.size / 2 + grazeRadius) {
        if (!grazedInFrame) {
          model.graze++
          model.score += 25
          model.specialAbilityCharge = Math.min(100, model.specialAbilityCharge + 0.8)
          grazedInFrame = true
        }
      }
    }
    model.score += 1 + model.phase * 2
    model.specialAbilityCharge = Math.min(100, model.specialAbilityCharge + 0.05)

    // --- DRAW LOGIC ---
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#000011"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    model.stars.forEach((star) => {
      const sx = star.x / star.z
      const sy = star.y / star.z
      const r = (1 - star.z / canvas.width) * 2.5
      ctx.beginPath()
      ctx.arc(sx, sy, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - star.z / canvas.width})`
      ctx.fill()
    })
    ctx.restore()
    if (model.screenShake > 0) {
      ctx.save()
      const dx = (Math.random() - 0.5) * model.screenShake
      const dy = (Math.random() - 0.5) * model.screenShake
      ctx.translate(dx, dy)
    }
    const drawWithGlow = (drawCall: () => void, color: string, blur = 15) => {
      ctx.shadowColor = color
      ctx.shadowBlur = blur
      drawCall()
      ctx.shadowBlur = 0
    }
    model.particles.forEach((p) => {
      ctx.globalAlpha = p.life / p.maxLife
      drawWithGlow(
        () => {
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        },
        p.color,
        20,
      )
    })
    ctx.globalAlpha = 1
    model.telegraphs.forEach((t) => {
      ctx.globalAlpha = (t.life / t.maxLife) * 0.8
      const color = "#ff6348"
      drawWithGlow(
        () => {
          ctx.strokeStyle = color
          ctx.lineWidth = 7
          ctx.beginPath()
          if (t.type === "circle") ctx.arc(t.x, t.y, t.radius!, 0, Math.PI * 2)
          if (t.type === "line") {
            ctx.moveTo(t.x, t.y)
            ctx.lineTo(t.endX!, t.endY!)
          }
          ctx.stroke()
        },
        color,
        25,
      )
    })
    ctx.globalAlpha = 1
drawWithGlow(
  () => {
    ctx.fillStyle = model.phase > 3 ? "#ff4757" : "#feca57"
    ctx.font = "120px Arial"
    ctx.fillText(model.phase > 3 ? "😡" : "😠", model.trumpPosition.x - 60, model.trumpPosition.y + 40)
  },
  model.phase > 3 ? "#ff4757" : "#feca57",
  30,
)


    const drawProjectile = (bomb: TariffBomb) => {
      ctx.save()
      ctx.translate(bomb.x, bomb.y)
      ctx.rotate(bomb.rotation)
      ctx.beginPath()
      switch (bomb.shape) {
        case "triangle":
          ctx.moveTo(0, -bomb.size)
          ctx.lineTo(bomb.size, bomb.size)
          ctx.lineTo(-bomb.size, bomb.size)
          break
        case "square":
          ctx.rect(-bomb.size / 1.5, -bomb.size / 1.5, bomb.size * 1.5, bomb.size * 1.5)
          break
        case "diamond":
          ctx.moveTo(0, -bomb.size)
          ctx.lineTo(bomb.size / 1.5, 0)
          ctx.lineTo(0, bomb.size)
          ctx.lineTo(-bomb.size / 1.5, 0)
          break
        case "star":
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(
              Math.cos(((18 + i * 72) / 180) * Math.PI) * bomb.size,
              -Math.sin(((18 + i * 72) / 180) * Math.PI) * bomb.size,
            )
            ctx.lineTo(
              Math.cos(((54 + i * 72) / 180) * Math.PI) * bomb.size * 0.5,
              -Math.sin(((54 + i * 72) / 180) * Math.PI) * bomb.size * 0.5,
            )
          }
          break
        case "shuriken":
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2
            ctx.moveTo(0, 0)
            ctx.lineTo(Math.cos(angle) * bomb.size, Math.sin(angle) * bomb.size)
            ctx.lineTo(Math.cos(angle + Math.PI / 4) * bomb.size * 0.6, Math.sin(angle + Math.PI / 4) * bomb.size * 0.6)
          }
          break
        case "maple_leaf":
          ctx.moveTo(0, -bomb.size)
          ctx.lineTo(bomb.size * 0.2, -bomb.size * 0.5)
          ctx.lineTo(bomb.size, -bomb.size * 0.4)
          ctx.lineTo(bomb.size * 0.4, 0)
          ctx.lineTo(bomb.size * 0.6, bomb.size * 0.8)
          ctx.lineTo(0, bomb.size * 0.4)
          ctx.lineTo(-bomb.size * 0.6, bomb.size * 0.8)
          ctx.lineTo(-bomb.size * 0.4, 0)
          ctx.lineTo(-bomb.size, -bomb.size * 0.4)
          ctx.lineTo(-bomb.size * 0.2, -bomb.size * 0.5)
          break
        case "hexagon":
          for (let i = 0; i < 6; i++) {
            ctx.lineTo(bomb.size * Math.cos((i * Math.PI) / 3), bomb.size * Math.sin((i * Math.PI) / 3))
          }
          break
        case "circle":
        default:
          ctx.arc(0, 0, bomb.size / 1.5, 0, Math.PI * 2)
          break
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    model.tariffBombs.forEach((b) => {
      const color = b.type === "laser" ? "#00d2d3" : b.type === "homing" ? "#ff6b81" : selectedCountry.color
      b.trail.forEach((t) => {
        ctx.beginPath()
        ctx.arc(t.x, t.y, b.size / 2, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = t.alpha * 0.5
        ctx.fill()
      })
      ctx.globalAlpha = 1.0
      drawWithGlow(
        () => {
          ctx.fillStyle = color
          drawProjectile(b)
        },
        color,
        20,
      )
    })

    const playerColor = selectedCountry.color
    const playerCenterX = model.player.x + model.player.width / 2
    const playerCenterY = model.player.y + model.player.height / 2
    model.player.trail.forEach((p, index) => {
      ctx.globalAlpha = (index / model.player.trail.length) * 0.5
      ctx.fillStyle = playerColor
      ctx.beginPath()
      ctx.arc(p.x, p.y, (model.player.width / 2) * (index / model.player.trail.length), 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
    if (model.player.invulnerable > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 40)
    drawWithGlow(() => {
      ctx.fillStyle = playerColor
      ctx.fillRect(model.player.x, model.player.y, model.player.width, model.player.height)
    }, playerColor)
    drawWithGlow(
      () => {
        ctx.fillStyle = "white"
        ctx.beginPath()
        ctx.arc(playerCenterX, playerCenterY, model.player.hitboxRadius, 0, Math.PI * 2)
        ctx.fill()
      },
      "white",
      10,
    )
    ctx.globalAlpha = 1
    if (model.player.shield > 0) {
      ctx.globalAlpha = 0.6 + (model.player.shield / 500) * 0.4
      drawWithGlow(
        () => {
          ctx.strokeStyle = "#00FFFF"
          ctx.lineWidth = 3 + Math.sin(Date.now() / 100) * 2
          ctx.beginPath()
          ctx.arc(playerCenterX, playerCenterY, model.player.width * 1.2, 0, Math.PI * 2)
          ctx.stroke()
        },
        "#00FFFF",
        30,
      )
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = "white"
    ctx.font = "bold 24px 'Orbitron', sans-serif"
    ctx.textAlign = "left"
    drawWithGlow(() => ctx.fillText(`SCORE: ${model.score.toLocaleString()}`, 20, 40), "white", 10)
    drawWithGlow(() => ctx.fillText(`PHASE: ${model.phase}`, 20, 70), "white", 10)
    drawWithGlow(() => ctx.fillText(`GRAZE: ${model.graze}`, 20, 100), "white", 10)
    ctx.textAlign = "right"
    drawWithGlow(() => ctx.fillText(`HIGH SCORE: ${highScore.toLocaleString()}`, canvas.width - 20, 40), "white", 10)
    ctx.textAlign = "left"
    const barWidth = 250
    const barHeight = 30
    const barX = 20
    const barY = canvas.height - 50
    ctx.strokeStyle = "#00FF7F"
    ctx.lineWidth = 2
    ctx.strokeRect(barX, barY, barWidth, barHeight)
    const chargeColor = model.specialAbilityCharge >= 100 ? "#fffa65" : "#00FF7F"
    drawWithGlow(() => {
      ctx.fillStyle = chargeColor
      ctx.fillRect(barX, barY, barWidth * (model.specialAbilityCharge / 100), barHeight)
    }, chargeColor)
    ctx.fillStyle = "black"
    ctx.font = "bold 18px 'Orbitron', sans-serif"
    ctx.fillText("SPECIAL (SPACE)", barX + 10, barY + 21)
    if (model.specialAbilityCharge >= 100) {
      ctx.fillStyle = "#fffa65"
      drawWithGlow(() => ctx.fillText("READY!", barX + barWidth + 10, barY + 21), "#fffa65", 15)
    }
    if (model.screenShake > 0) ctx.restore()
    animationFrameId.current = requestAnimationFrame(gameLoop)
  }

  const startGame = (country: Country) => {
    setSelectedCountry(country)
    setGameState("playing")
  }
  const resetGame = () => {
    setGameState("menu")
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.key.toLowerCase())
      if (event.key === " ") {
        event.preventDefault()
        useSpecialAbility()
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase())
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [selectedCountry])

  useEffect(() => {
    if (gameState === "playing" && selectedCountry) {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      gameModelRef.current = {
        player: {
          x: canvas.width / 2,
          y: canvas.height - 150,
          width: 28,
          height: 28,
          hitboxRadius: 4,
          shield: 0,
          speedBoost: 0,
          invulnerable: 180,
          trail: [],
        },
        tariffBombs: [],
        particles: [],
        telegraphs: [],
        stars: Array.from({ length: 500 }, () => ({
          x: (Math.random() - 0.5) * window.innerWidth * 2,
          y: (Math.random() - 0.5) * window.innerHeight * 2,
          z: Math.random() * window.innerWidth,
        })),
        trumpPosition: { x: canvas.width / 2, y: 150 },
        score: 0,
        graze: 0,
        phase: 1,
        specialAbilityCharge: 0,
        screenShake: 0,
        attackCooldown: 120,
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [gameState, selectedCountry])

  useEffect(() => {
    if (gameState === "playing" && selectedCountry) {
      const canvas = canvasRef.current
      if (!canvas) return
      animationFrameId.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [gameState, selectedCountry])

  const renderCountryCard = (country: Country) => (
    <Card
      key={country.name}
      className="cursor-pointer bg-gray-900/70 border border-gray-700 hover:border-yellow-400 hover:bg-gray-800/90 transition-all duration-300 transform hover:scale-105"
      onClick={() => startGame(country)}
    >
      <CardContent className="p-4 text-center flex flex-col justify-between h-full">
        <div>
          <div className="text-6xl mb-2">{country.flag}</div>
          <h3 className="font-bold text-xl text-yellow-300">{country.name}</h3>
          <div
            className={`mt-1 text-base ${country.tariffRate >= 30 ? "bg-red-600" : country.tariffRate >= 20 ? "bg-orange-500" : "bg-blue-500"}`}
          >
            {" "}
            관세 {country.tariffRate}%{" "}
          </div>
          <p className="text-sm text-gray-400 mt-3 h-12">{country.description}</p>
        </div>
      </CardContent>
    </Card>
  )

  if (gameState === "menu") {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-7xl bg-black/60 backdrop-blur-md border-2 border-yellow-400 text-white shadow-[0_0_30px_rgba(255,223,0,0.5)]">
          <CardHeader className="text-center pb-4">
            <h1
              className="text-6xl font-black tracking-widest bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent uppercase"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {" "}
              Global Trade War{" "}
            </h1>
            <CardTitle
              className="text-3xl font-bold text-yellow-300 tracking-wider"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {" "}
              SOVEREIGN'S GAMBIT{" "}
            </CardTitle>
            <p className="text-lg text-gray-300 mt-2">세계 경제의 명운을 건 최후의 회피 기동</p>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-red-500 text-center mb-3">최악의 침해국 (Worst Violators)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {" "}
                {worstViolators.map(renderCountryCard)}{" "}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-400 text-center mb-3">기본 관세 적용국 (Base Tariff)</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {" "}
                {baseTariffCountries.map(renderCountryCard)}{" "}
              </div>
            </div>
            <div className="text-center mt-8 text-gray-400">
              <p className="text-lg">WASD/화살표: 이동 | 스페이스바: 특수 능력</p>
              <p className="text-lg">최고 점수: {highScore.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <div className="news-ticker-container">
          <div className="news-ticker">
            {" "}
            {newsItems.map((item, index) => (
              <span key={index}>{item}</span>
            ))}{" "}
          </div>
        </div>
      </div>
    )
  }

  if (gameState === "gameOver") {
    return (
      <div className="w-full h-full bg-black/80 flex items-center justify-center p-4 backdrop-blur-lg">
        <Card className="w-full max-w-lg text-center bg-gray-900/80 border-2 border-red-500 text-white shadow-[0_0_30px_rgba(255,0,0,0.6)]">
          <CardHeader>
            <CardTitle className="text-6xl font-black text-red-500" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {" "}
              SOVEREIGNTY DEFAULT{" "}
            </CardTitle>
            <p className="text-xl text-gray-300 mt-2">주권 불이행: 협상 테이블이 전복되었습니다.</p>
          </CardHeader>
          <CardContent className="space-y-4 text-2xl">
            <div className="text-5xl font-bold text-yellow-400">{finalScore.toLocaleString()}</div>
            <p>최종 페이즈: {finalPhase}</p>
            <p>총 그레이즈: {finalGraze}</p>
            <p>
              {" "}
              선택 국가: {selectedCountry?.flag} {selectedCountry?.name}{" "}
            </p>
            {finalScore > highScore && <div className="text-xl bg-green-500">NEW HIGH SCORE!</div>}
            <div className="flex flex-col gap-3 pt-6">
              <Button
                onClick={() => selectedCountry && startGame(selectedCountry)}
                className="text-xl py-6 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                {" "}
                RE-ENGAGE (재도전){" "}
              </Button>
              <Button
                onClick={resetGame}
                variant="outline"
                className="text-xl py-6 border-gray-500 hover:bg-gray-700 bg-transparent"
              >
                {" "}
                RETREAT (메인 메뉴로){" "}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <canvas ref={canvasRef} className="bg-black block cursor-none" />
}
