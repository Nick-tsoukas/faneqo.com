/**
 * View Model helpers — preferred control path for new Faneqo .riv files.
 * Legacy stateMachineInputs remain as a fallback for older samples.
 */

export function getViewModelInstance(rive) {
  return rive?.viewModelInstance || null
}

export function setViewBoolean(rive, path, value) {
  const prop = getViewModelInstance(rive)?.boolean?.(path)
  if (!prop) return false
  prop.value = !!value
  return true
}

export function setViewNumber(rive, path, value) {
  const prop = getViewModelInstance(rive)?.number?.(path)
  if (!prop) return false
  prop.value = Number(value)
  return true
}

export function setViewString(rive, path, value) {
  const prop = getViewModelInstance(rive)?.string?.(path)
  if (!prop) return false
  prop.value = String(value)
  return true
}

export function fireViewTrigger(rive, path) {
  const prop = getViewModelInstance(rive)?.trigger?.(path)
  if (!prop?.trigger) return false
  prop.trigger()
  return true
}

export function listViewProperties(rive) {
  const vmi = getViewModelInstance(rive)
  if (!vmi?.properties) return []
  try {
    return [...vmi.properties]
  } catch {
    return []
  }
}

export function listStateMachineInputs(rive, stateMachineName) {
  if (!rive || !stateMachineName) return []
  try {
    return rive.stateMachineInputs(stateMachineName) || []
  } catch {
    return []
  }
}

export function fireLegacyInput(rive, stateMachineName, inputName, value) {
  const input = listStateMachineInputs(rive, stateMachineName).find(
    (item) => item.name === inputName
  )
  if (!input) return false
  if (typeof input.fire === 'function' && value === undefined) {
    input.fire()
    return true
  }
  if (value !== undefined) {
    input.value = value
    return true
  }
  return false
}
