import { useState, type FormEvent } from 'react'
import styles from './manittoMakerRoom.module.css'

export type RosterPerson = { id: string; name: string; invitePending: boolean }

type Props = {
  people: RosterPerson[]
  completed: boolean
  pending: boolean
  hasSpace: boolean
  add: (name: string) => Promise<boolean>
  rename: (participantId: string, name: string) => Promise<boolean>
  remove: (person: RosterPerson) => Promise<void>
  prepareInvite: (person: RosterPerson) => Promise<void>
}

export function ManittoMakerRoster({ people, completed, pending, hasSpace, add, rename, remove, prepareInvite }: Props) {
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<RosterPerson | null>(null)

  async function addParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newName.trim() && await add(newName)) setNewName('')
  }

  async function saveParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editing?.name.trim() && await rename(editing.id, editing.name)) setEditing(null)
  }

  return (
    <>
      <h3>{completed ? '개인 초대 보내기' : '참가자 명단'}</h3>
      <p className={styles.copy}>{completed
        ? '개인 초대를 등록한 사람만 자기 결과를 볼 수 있어요. 방장도 다른 참가자의 결과는 볼 수 없어요.'
        : '방장이 직접 이름을 넣거나 공통 입장 링크를 나눌 수 있어요.'}</p>
      {!completed && (
        <form className={styles.addForm} onSubmit={(event) => void addParticipant(event)}>
          <label className="sr-only" htmlFor="manitto-participant-name">참가자 이름</label>
          <input id="manitto-participant-name" required maxLength={24} value={newName} placeholder="참가자 이름"
            onChange={(event) => setNewName(event.target.value)} disabled={!hasSpace} />
          <button type="submit" className={styles.primary} disabled={pending || !hasSpace || !newName.trim()}>추가</button>
        </form>
      )}
      {people.length > 0 ? (
        <ul className={styles.roster} role="list">
          {people.map((person) => (
            <li key={person.id}>
              {editing?.id === person.id && !completed ? (
                <form className={styles.editForm} onSubmit={(event) => void saveParticipant(event)}>
                  <input aria-label="변경할 참가자 이름" required maxLength={24} value={editing.name}
                    onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
                  <button type="submit" className={styles.rowAction} disabled={pending || !editing.name.trim()}>저장</button>
                  <button type="button" className={styles.rowAction} onClick={() => setEditing(null)}>취소</button>
                </form>
              ) : (
                <>
                  <div className={styles.rosterName}>
                    <strong>{person.name}</strong>
                    <span>{person.invitePending ? '개인 초대 대기' : '참가 등록 완료'}</span>
                  </div>
                  <div className={styles.rowActions}>
                    {person.invitePending && <button type="button" className={styles.rowAction} aria-label={`${person.name}님 개인 초대`}
                      disabled={pending} onClick={() => void prepareInvite(person)}>개인 초대</button>}
                    {!completed && <>
                      <button type="button" className={styles.rowAction} aria-label={`${person.name}님 이름 수정`}
                        disabled={pending} onClick={() => setEditing(person)}>수정</button>
                      <button type="button" className={styles.removeAction} aria-label={`${person.name}님 제외`}
                        disabled={pending} onClick={() => void remove(person)}>제외</button>
                    </>}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : <p className={styles.empty}>아직 참가자가 없어요.</p>}
    </>
  )
}
