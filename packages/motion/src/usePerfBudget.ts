export type PerfBudget = {
  tier: 1 | 2 | 3
  particles: number
  bloom: number
  animations: number
}

export function usePerfBudget(): PerfBudget {
  const mem = (navigator as { deviceMemory?: number })?.deviceMemory ?? 4
  const cores = navigator?.hardwareConcurrency ?? 4
  const tier = mem >= 12 && cores >= 12 ? 3 : mem >= 8 && cores >= 8 ? 2 : 1

  return {
    tier: tier,
    particles: tier === 3 ? 240 : tier === 2 ? 140 : 70,
    bloom: tier === 3 ? 1.0 : tier === 2 ? 0.6 : 0.3,
    animations: tier === 3 ? 1 : tier === 2 ? 0.75 : 0.5,
  }
}
