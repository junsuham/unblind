export const BUILDER_HOME_MODEL = 'unblind-home-section'
export const BUILDER_HOME_PREVIEW_PATH = '/builder-preview/home'

export function getBuilderPublicApiKey() {
  return process.env.NEXT_PUBLIC_BUILDER_API_KEY?.trim() ?? ''
}

export function isBuilderConfigured() {
  return getBuilderPublicApiKey().length > 0
}
