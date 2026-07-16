import * as Updates from 'expo-updates'

export type UpdateStatus = {
  enabled: boolean
  channel: string
  runtimeVersion: string
  updateId: string | null
  embedded: boolean
}

export function getUpdateStatus(): UpdateStatus {
  return {
    enabled: Updates.isEnabled,
    channel: Updates.channel ?? '로컬 빌드',
    runtimeVersion: Updates.runtimeVersion ?? '미설정',
    updateId: Updates.updateId ?? null,
    embedded: Updates.isEmbeddedLaunch,
  }
}

export async function checkForAppUpdate() {
  if (!Updates.isEnabled) {
    return { available: false, reason: 'Expo 프로젝트 연결 후 자동 업데이트를 사용할 수 있습니다.' }
  }

  const check = await Updates.checkForUpdateAsync()
  if (!check.isAvailable) return { available: false, reason: '최신 버전입니다.' }

  await Updates.fetchUpdateAsync()
  return { available: true, reason: '업데이트를 내려받았습니다.' }
}

export async function reloadWithUpdate() {
  if (Updates.isEnabled) await Updates.reloadAsync()
}
