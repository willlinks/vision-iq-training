import type { StringKey } from "./en";

/** Japanese strings. Natural phrasing — not a literal translation of en.ts. */
export const ja: Record<StringKey, string> = {
  "nav.title": "vision-iq-training · プロトタイプ",
  "nav.home": "ホーム",

  "common.back": "戻る",

  "lang.switchTo": "EN",

  "home.heading": "プロトタイプ",
  "home.blurb":
    "ローカル動作のみ。いまはコントラスト検出と、ガボールのパラメータ確認画面が試せます。",
  "home.contrast": "コントラスト検出",
  "home.lab": "ガボール ラボ",

  "contrast.heading": "コントラスト検出",
  "contrast.intro":
    "左右どちらかの丸の中に、うすい縞模様が一瞬だけ出ます。出たと思う方をタップしてください。わからないときは「わからない」でかまいません。続けるほど模様はうすくなります。",
  "contrast.tip":
    "端末は腕をのばしたくらいの距離で持ち、画面を明るめに、部屋は少し暗めにしてください。",
  "contrast.start": "はじめる",
  "contrast.done": "おつかれさまでした",
  "contrast.trialsDone": "全 {trials} 回",
  "contrast.runAgain": "もう一度",
  "contrast.hudTrial": "{n} / {max} 回",
  "contrast.hudReversals": "反転 {n} / {max}",
  "contrast.leftSquare": "左",
  "contrast.rightSquare": "右",
  "contrast.notSure": "わからない",

  "result.note":
    "おおよその目安です（画面は較正されていません）。1回の数値より、続けたときの変化を見てください。",
  "result.aboutTitle": "この数値について",
  "result.improveTitle": "伸ばすには",
  "result.you": "あなた",
  "result.typical": "通常の見え方",

  "cres.sensitivityName": "コントラスト感度",
  "cres.thresholdName": "コントラスト閾値",
  "cres.meaning":
    "見分けられた、いちばんうすい模様です。数値が大きいほど良好です。",
  "cres.thresholdMeaning":
    "見分けるのに必要だったコントラストの量です。小さいほど良好です。",

  "cres.about1":
    "視力検査とは別の力です。視力は小さな文字、こちらはうすい模様を見分ける力です。",
  "cres.about2":
    "夜の運転、霧の中、人の顔、うすい文字などの見やすさに関わります。",
  "cres.about3":
    "画面は較正されていないので、比べるのは同じ端末での自分の記録だけにしてください。",
  "cres.about4":
    "数週間かけて下がり続けるようなら、一度眼科で診てもらってください。",

  "ctip.daily.t": "毎日のトレーニングを続ける",
  "ctip.daily.b":
    "このガボール課題がそのままトレーニングです。まとめてより、短くても毎日が効きます。",
  "ctip.light.t": "明るくムラのない光で見る",
  "ctip.light.b":
    "十分な明るさがあると使える範囲が広がります。暗くてムラのある光は目に負担です。",
  "ctip.glare.t": "まぶしさ・映り込みを減らす",
  "ctip.glare.b":
    "画面とメガネをきれいに。照明が画面に映り込まない向きにしましょう。",
  "ctip.breaks.t": "こまめに目を休める",
  "ctip.breaks.b":
    "20分ごとに20秒、遠くを見てください。目が疲れるとコントラストの感度は落ちます。",
  "ctip.checkup.t": "下がり続けるときは眼科へ",
  "ctip.checkup.b":
    "はっきりした低下はドライアイや白内障のこともあります。念のため受診を。",

  "lab.heading": "ガボール ラボ",
  "lab.orientation": "傾き",
  "lab.wavelength": "波長",
  "lab.sigma": "ガウス幅",
  "lab.aspect": "縦横比",
  "lab.phase": "位相",
  "lab.contrast": "コントラスト",
};
