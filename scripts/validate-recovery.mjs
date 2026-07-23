import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const runbookPath = path.join(root, 'docs', 'INCIDENT_AND_RESTORE.md')
const migrationsPath = path.join(root, 'supabase', 'migrations')

await access(runbookPath)
const runbook = await readFile(runbookPath, 'utf8')
const requiredRunbookTerms = [
  'RPO',
  'RTO',
  'Vercel',
  'Supabase',
  '복구 검증',
  '분기별 복구 훈련',
]
const missingTerms = requiredRunbookTerms.filter((term) => !runbook.includes(term))
if (missingTerms.length) {
  console.error(`복구 문서에 필요한 항목이 없습니다: ${missingTerms.join(', ')}`)
  process.exit(1)
}

const migrations = (await readdir(migrationsPath))
  .filter((name) => name.endsWith('.sql'))
  .sort()
if (!migrations.length || migrations.some((name, index) => index > 0 && name <= migrations[index - 1])) {
  console.error('Supabase 마이그레이션 순서를 확인해주세요.')
  process.exit(1)
}

const supportMigration = migrations.find((name) => name.includes('support_requests'))
if (!supportMigration) {
  console.error('고객지원 데이터 보유 기간 마이그레이션이 없습니다.')
  process.exit(1)
}
const supportSql = await readFile(path.join(migrationsPath, supportMigration), 'utf8')
if (!supportSql.includes("interval '1 year'")) {
  console.error('처리 완료 고객지원 문의의 삭제 기준이 없습니다.')
  process.exit(1)
}

console.log(`복구 준비 검증 완료: 마이그레이션 ${migrations.length}개, 운영 문서 확인`)
