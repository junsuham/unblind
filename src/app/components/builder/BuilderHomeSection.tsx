import {
  fetchOneEntry,
  getBuilderSearchParams,
  type BuilderContent,
} from '@builder.io/sdk-react/edge'
import {
  BUILDER_HOME_MODEL,
  getBuilderPublicApiKey,
} from '@/lib/builder'
import { BuilderHomeRenderer } from './BuilderHomeRenderer'

export type BuilderSearchParams = Record<
  string,
  string | string[] | undefined
>

type BuilderHomeSectionProps = {
  searchParams?: BuilderSearchParams
}

function toUrlSearchParams(searchParams: BuilderSearchParams) {
  const urlSearchParams = new URLSearchParams()

  for (const [name, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) urlSearchParams.append(name, item)
    } else if (value !== undefined) {
      urlSearchParams.set(name, value)
    }
  }

  return urlSearchParams
}

async function getBuilderHomeContent(
  apiKey: string,
  builderOptions: Record<string, unknown>
): Promise<BuilderContent | null> {
  try {
    return await fetchOneEntry({
      apiKey,
      model: BUILDER_HOME_MODEL,
      options: builderOptions,
      userAttributes: { urlPath: '/' },
      cacheSeconds: 5,
      staleCacheSeconds: 5,
      canTrack: false,
    })
  } catch (error) {
    console.error('Builder home content could not be loaded.', error)
    return null
  }
}

export async function BuilderHomeSection({
  searchParams = {},
}: BuilderHomeSectionProps) {
  const apiKey = getBuilderPublicApiKey()

  if (!apiKey) return null

  const builderOptions = getBuilderSearchParams(toUrlSearchParams(searchParams))
  const content = await getBuilderHomeContent(apiKey, builderOptions)

  if (!content && Object.keys(builderOptions).length === 0) return null

  return (
    <section aria-label="운영자가 편집한 홈 콘텐츠" className="mb-4">
      <BuilderHomeRenderer apiKey={apiKey} content={content} />
    </section>
  )
}
