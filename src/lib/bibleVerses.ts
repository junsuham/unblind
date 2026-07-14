export type BibleVerse = {
  reference: string
  text: string
}

const bibleVerses: BibleVerse[] = [
  {
    reference: '창세기 1:1',
    text: '태초에 하나님이 천지를 창조하시니라',
  },
  {
    reference: '시편 23:1',
    text: '여호와는 나의 목자시니 내가 부족함이 없으리로다',
  },
  {
    reference: '이사야 41:10',
    text: '두려워 말라 내가 너와 함께 함이니라 놀라지 말라 나는 네 하나님이 됨이니라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라 참으로 나의 의로운 오른손으로 너를 붙들리라',
  },
  {
    reference: '마태복음 6:33',
    text: '너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라',
  },
  {
    reference: '마태복음 11:28–29',
    text: '수고하고 무거운 짐진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라. 나는 마음이 온유하고 겸손하니 나의 멍에를 메고 내게 배우라 그러면 너희 마음이 쉼을 얻으리니',
  },
  {
    reference: '요한복음 3:16',
    text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라',
  },
  {
    reference: '로마서 8:28',
    text: '우리가 알거니와 하나님을 사랑하는 자 곧 그 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라',
  },
  {
    reference: '빌립보서 4:6–7',
    text: '아무 것도 염려하지 말고 오직 모든 일에 기도와 간구로 너희 구할 것을 감사함으로 하나님께 아뢰라. 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라',
  },
]

export function getRandomBibleVerse() {
  return bibleVerses[Math.floor(Math.random() * bibleVerses.length)]
}
