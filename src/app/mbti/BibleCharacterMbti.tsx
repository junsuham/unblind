'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'
import {
  axisCopy,
  bibleCharacterImages,
  bibleMbtiQuestions,
  calculateBibleMbtiResult,
  type BibleMbtiAnswers,
  type BibleMbtiResult,
  type MbtiPole,
} from '@/lib/bibleCharacterMbti'
import { createBibleMbtiShareImage } from '@/lib/bibleMbtiShareCard'
import styles from './mbti.module.css'

type Stage = 'intro' | 'questions' | 'result'

type SavedAssessment = {
  answers: BibleMbtiAnswers
  current: number
  complete: boolean
}

const STORAGE_KEY = 'unblind-bible-character-mbti-v1'

function isSavedAssessment(value: unknown): value is SavedAssessment {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SavedAssessment>
  if (
    !candidate.answers
    || typeof candidate.answers !== 'object'
    || !Number.isInteger(candidate.current)
    || typeof candidate.complete !== 'boolean'
  ) return false

  const entries = Object.entries(candidate.answers)
  const validAnswers = entries.every(([questionId, pole]) => {
    const question = bibleMbtiQuestions.find((item) => item.id === questionId)
    return question?.options.some((option) => option.pole === pole) === true
  })

  return Boolean(
    validAnswers
      && entries.length <= bibleMbtiQuestions.length
      && candidate.current! >= 0
      && candidate.current! < bibleMbtiQuestions.length
      && (!candidate.complete || entries.length === bibleMbtiQuestions.length),
  )
}

function saveAssessment(value: SavedAssessment) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // The assessment still works when Safari private mode blocks storage.
  }
}

function Intro({
  savedCount,
  savedComplete,
  onStart,
  onResume,
}: {
  savedCount: number
  savedComplete: boolean
  onStart: () => void
  onResume: () => void
}) {
  return (
    <div className={styles.introStack}>
      <section className={styles.introHero} aria-labelledby="bible-mbti-title">
        <div className={styles.typeConstellation} aria-hidden>
          <span>E</span><span>N</span><span>F</span><span>J</span>
          <strong><SystemIcon name="sparkles" size={28} /></strong>
        </div>
        <p className={styles.englishEyebrow}>My Bible character Type Indicator</p>
        <h1 id="bible-mbti-title">나는 어떤 성경 인물과 닮았을까?</h1>
        <p className={styles.introCopy}>
          관계, 말씀을 바라보는 방식, 결정과 생활 리듬을 따라
          성경 속 믿음의 인물과 닮은 모습을 발견해보세요.
        </p>

        <div className={styles.introMeta} aria-label="검사 정보">
          <span><SystemIcon name="compose" size={15} />28문항</span>
          <span><SystemIcon name="timer" size={15} />약 4분</span>
          <span><SystemIcon name="person" size={15} />16가지 결과</span>
        </div>

        <button type="button" className={styles.primaryButton} onClick={onStart}>
          검사 시작하기
          <span aria-hidden>›</span>
        </button>

        {savedCount > 0 && (
          <button type="button" className={styles.resumeButton} onClick={onResume}>
            {savedComplete ? '최근 결과 다시 보기' : `이어서 하기 · ${savedCount}/28`}
          </button>
        )}
      </section>

      <section className={styles.guideCard} aria-labelledby="bible-mbti-guide">
        <span className={styles.guideIcon}><SystemIcon name="heart" size={20} /></span>
        <div>
          <h2 id="bible-mbti-guide">정답보다 지금의 나답게</h2>
          <p>되고 싶은 모습보다 평소 자연스럽게 행동하는 쪽을 골라주세요.</p>
        </div>
      </section>

      <p className={styles.disclaimer}>
        성경 기록을 바탕으로 만든 묵상형 콘텐츠이며 공식 MBTI 검사나 신앙·성격의 평가는 아닙니다.
      </p>
    </div>
  )
}

function Questions({
  current,
  answers,
  onAnswer,
  onBack,
  onExit,
}: {
  current: number
  answers: BibleMbtiAnswers
  onAnswer: (pole: MbtiPole) => void
  onBack: () => void
  onExit: () => void
}) {
  const question = bibleMbtiQuestions[current]
  const selected = answers[question.id]
  const progress = Math.round(((current + 1) / bibleMbtiQuestions.length) * 100)

  return (
    <div className={styles.questionScreen}>
      <header className={styles.questionHeader}>
        <button type="button" onClick={current === 0 ? onExit : onBack} aria-label={current === 0 ? '검사 나가기' : '이전 질문'}>
          <span aria-hidden>‹</span>
        </button>
        <div>
          <span>{current + 1}</span>
          <small>/ {bibleMbtiQuestions.length}</small>
        </div>
        <button type="button" onClick={onExit} aria-label="검사 나가기">
          <SystemIcon name="close" size={17} />
        </button>
      </header>

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="검사 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className={styles.questionCard} aria-labelledby={`question-${question.id}`}>
        <p>평소의 나와 더 가까운 쪽은?</p>
        <h1 id={`question-${question.id}`}>{question.prompt}</h1>

        <div className={styles.answerList}>
          {question.options.map((option, index) => (
            <button
              key={option.pole}
              type="button"
              aria-pressed={selected === option.pole}
              className={selected === option.pole ? styles.answerSelected : styles.answer}
              onClick={() => onAnswer(option.pole)}
            >
              <span>{index === 0 ? 'A' : 'B'}</span>
              <strong>{option.text}</strong>
              <i aria-hidden><SystemIcon name="check" size={17} /></i>
            </button>
          ))}
        </div>
      </section>

      <p className={styles.questionHint}>오래 고민하지 말고 더 자연스러운 모습을 선택해보세요.</p>
    </div>
  )
}

function AxisBars({ result }: { result: BibleMbtiResult }) {
  return (
    <section className={styles.axisCard} aria-labelledby="axis-result-title">
      <div className={styles.sectionTitleRow}>
        <h2 id="axis-result-title">나의 성향 균형</h2>
        <span>{result.type}</span>
      </div>
      <div className={styles.axisList}>
        {result.axes.map((axis) => {
          const copy = axisCopy[axis.axis]
          const total = Math.max(1, axis.leftScore + axis.rightScore)
          const leftWidth = Math.round((axis.leftScore / total) * 100)
          const barStyle = { '--axis-left': `${leftWidth}%` } as CSSProperties

          return (
            <div key={axis.axis} className={styles.axisRow}>
              <div>
                <span className={axis.selectedPole === copy.left.pole ? styles.axisSelected : undefined}>
                  <b>{copy.left.pole}</b>{copy.left.label}
                </span>
                <span className={axis.selectedPole === copy.right.pole ? styles.axisSelected : undefined}>
                  {copy.right.label}<b>{copy.right.pole}</b>
                </span>
              </div>
              <div className={styles.axisTrack} style={barStyle}>
                <span />
                <i />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Result({
  result,
  onRetake,
}: {
  result: BibleMbtiResult
  onRetake: () => void
}) {
  const [shareMessage, setShareMessage] = useState('')
  const [shareFile, setShareFile] = useState<File | null>(null)
  const character = result.character
  const characterImage = bibleCharacterImages[result.type]

  useEffect(() => {
    let cancelled = false
    createBibleMbtiShareImage(result)
      .then((file) => {
        if (!cancelled) setShareFile(file)
      })
      .catch(() => {
        if (!cancelled) setShareMessage('공유 이미지를 만들지 못했어요. 잠시 후 다시 시도해주세요.')
      })
    return () => {
      cancelled = true
    }
  }, [result])

  async function shareResult() {
    const text = `나와 닮은 성경 인물은 ${character.name} (${result.type})! ${character.tagline}`
    if (!shareFile) return

    try {
      const fileShare = { files: [shareFile] }
      if (navigator.share && navigator.canShare?.(fileShare)) {
        await navigator.share({
          ...fileShare,
          title: `성경 인물 MBTI · ${character.name}`,
          text,
        })
        return
      }

      const downloadUrl = URL.createObjectURL(shareFile)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = shareFile.name
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000)
      setShareMessage('결과 이미지를 저장했어요.')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setShareMessage('공유하지 못했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div className={styles.resultStack} aria-live="polite">
      <section className={styles.resultHero} aria-labelledby="result-character-name">
        <p className={styles.englishEyebrow}>My Bible character Type Indicator</p>
        <div className={styles.resultType} aria-label={`유형 ${result.type}`}>
          {result.type.split('').map((letter) => <span key={letter}>{letter}</span>)}
        </div>
        <div className={styles.resultPortrait}>
          <Image
            fill
            src={characterImage}
            alt={`${character.name} 캐릭터`}
            sizes="(max-width: 350px) 78vw, 224px"
            loading="eager"
          />
        </div>
        <p className={styles.resultLabel}>나와 닮은 성경 인물</p>
        <h1 id="result-character-name">{character.name}</h1>
        <strong>{character.tagline}</strong>
        <p>{character.summary}</p>
        <div className={styles.similarityBadge}>
          <SystemIcon name="sparkles" size={16} />
          성향 선명도 {result.similarity}%
        </div>
      </section>

      <AxisBars result={result} />

      <section className={styles.contentCard} aria-labelledby="result-traits-title">
        <h2 id="result-traits-title">닮은 모습</h2>
        <div className={styles.traitList}>
          {character.traits.map((trait) => <span key={trait}>{trait}</span>)}
        </div>
        <ul className={styles.recordList}>
          {character.records.map((record) => (
            <li key={record}><SystemIcon name="check" size={17} /><span>{record}</span></li>
          ))}
        </ul>
      </section>

      <section className={styles.referenceCard} aria-labelledby="result-reference-title">
        <div className={styles.sectionTitleRow}>
          <h2 id="result-reference-title">성경에서 더 만나기</h2>
          <SystemIcon name="bookmark" size={18} />
        </div>
        <div className={styles.referenceList}>
          {character.references.map((reference) => <span key={reference}>{reference}</span>)}
        </div>
      </section>

      <section className={styles.reflectionCard} aria-labelledby="result-reflection-title">
        <span><SystemIcon name="heart" size={19} /></span>
        <div>
          <h2 id="result-reflection-title">오늘의 묵상 질문</h2>
          <p>{character.reflection}</p>
        </div>
      </section>

      <div className={styles.resultActions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!shareFile}
          onClick={shareResult}
        >
          <SystemIcon name="external" size={18} />
          {shareFile ? '결과 이미지 공유하기' : '공유 이미지 준비 중'}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onRetake}>
          다시 검사하기
        </button>
        {shareMessage && <p role="status">{shareMessage}</p>}
      </div>

      <p className={styles.disclaimer}>
        모든 성경 인물은 여러 모습과 성장의 과정을 지닙니다. 이 결과는 우열이나 신앙의 깊이를 판단하지 않습니다.
      </p>
    </div>
  )
}

export default function BibleCharacterMbti() {
  const [stage, setStage] = useState<Stage>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<BibleMbtiAnswers>({})
  const [saved, setSaved] = useState<SavedAssessment | null>(null)
  const [result, setResult] = useState<BibleMbtiResult | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed: unknown = JSON.parse(raw)
        if (isSavedAssessment(parsed)) setSaved(parsed)
      } catch {
        // A previous result is optional when storage is unavailable.
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const savedCount = useMemo(
    () => saved ? Object.keys(saved.answers).length : 0,
    [saved],
  )

  function startFresh() {
    setAnswers({})
    setCurrent(0)
    setResult(null)
    setStage('questions')
    setSaved(null)
    saveAssessment({ answers: {}, current: 0, complete: false })
  }

  function resume() {
    if (!saved) return startFresh()
    setAnswers(saved.answers)
    if (saved.complete && savedCount === bibleMbtiQuestions.length) {
      setResult(calculateBibleMbtiResult(saved.answers))
      setStage('result')
      return
    }
    const firstUnanswered = bibleMbtiQuestions.findIndex((question) => !saved.answers[question.id])
    setCurrent(firstUnanswered >= 0 ? firstUnanswered : Math.min(saved.current, bibleMbtiQuestions.length - 1))
    setStage('questions')
  }

  function answerQuestion(pole: MbtiPole) {
    const question = bibleMbtiQuestions[current]
    const nextAnswers = { ...answers, [question.id]: pole }
    const complete = current === bibleMbtiQuestions.length - 1

    setAnswers(nextAnswers)
    saveAssessment({ answers: nextAnswers, current: complete ? current : current + 1, complete })

    if (complete) {
      const nextResult = calculateBibleMbtiResult(nextAnswers)
      setResult(nextResult)
      setSaved({ answers: nextAnswers, current, complete: true })
      setStage('result')
      document.querySelector<HTMLElement>('.ub-app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setCurrent((value) => value + 1)
  }

  if (stage === 'questions') {
    return (
      <Questions
        current={current}
        answers={answers}
        onAnswer={answerQuestion}
        onBack={() => setCurrent((value) => Math.max(0, value - 1))}
        onExit={() => {
          setSaved({ answers, current, complete: false })
          saveAssessment({ answers, current, complete: false })
          setStage('intro')
        }}
      />
    )
  }

  if (stage === 'result' && result) {
    return <Result result={result} onRetake={startFresh} />
  }

  return (
    <Intro
      savedCount={savedCount}
      savedComplete={Boolean(saved?.complete)}
      onStart={startFresh}
      onResume={resume}
    />
  )
}
