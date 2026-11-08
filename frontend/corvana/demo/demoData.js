// Demo data loader for Corvana presentations
import corvanaDemoData from '~/corvana/demo/corvanaDemoData.json'

export function getDemoData(key) {
  if (!corvanaDemoData[key]) {
    throw new Error(`Demo data key "${key}" not found in corvanaDemoData.json`)
  }
  return corvanaDemoData[key]
}
