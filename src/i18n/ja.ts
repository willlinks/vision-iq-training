import type { StringKey } from "./en";

/** Japanese strings. Natural phrasing — not a literal translation of en.ts. */
export const ja: Record<StringKey, string> = {
  "nav.title": "vision-iq-training · プロトタイプ",
  "nav.home": "ホーム",

  "common.back": "戻る",
  "common.start": "はじめる",
  "common.done": "おつかれさまでした",
  "common.runAgain": "もう一度",
  "common.next": "次へ",

  "lang.switchTo": "EN",

  "home.heading": "プロトタイプ",
  "home.blurb":
    "ローカル動作のみ。いまはコントラスト検出、行列推理、ガボールのパラメータ確認が試せます。",
  "home.contrast": "コントラスト検出",
  "home.matrix": "行列推理",
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

  "matrix.heading": "行列推理",
  "matrix.intro":
    "どのマス目も、行と列にそって隠れた規則で変化しています。右下の空欄に入る模様を選んでください。",
  "matrix.progress": "{n} / {max}",
  "matrix.score": "正解 {n}/{max}",
  "matrix.answerShown": "空欄に入る正解は、この模様です。",
  "matrix.miss": "選んだ模様は {dims} が違います。",
  "matrix.missVague": "おしい。空欄に入る正解はこの模様です。",
  "matrix.dim.theta": "傾き",
  "matrix.dim.wavelength": "縞の幅",
  "matrix.dim.contrast": "濃さ",
  "matrix.dimSep": "・",
  "matrix.seeResults": "結果を見る",

  "mres.correctName": "正解数",
  "mres.correctMeaning": "今回解けた問題の数です。",
  "mres.totalName": "合計時間",
  "mres.totalMeaning": "今回のラウンド全体にかかった時間です。",
  "mres.timeName": "解答時間の中央値",
  "mres.timeMeaning": "解答の半分は、これより速かったということです。",
  "mres.about1": "規則を見つけて当てはめる、パターン推理の力です。",
  "mres.about2": "練習で伸びますが、その効果の多くはこの種の問題に限られます。",
  "mres.about3": "速さと正確さは両立しにくく、急ぐと正答率は下がりがちです。",

  "mtip.scan.t": "行と列を分けて見る",
  "mtip.scan.b": "規則は一つずつ見つけて、あとで組み合わせます。",
  "mtip.eliminate.t": "選択肢を消していく",
  "mtip.eliminate.b": "見つけた規則に合わない選択肢を外します。",
  "mtip.variety.t": "いろいろな問題に触れる",
  "mtip.variety.b": "1種類の反復より、種類を変えるほうが役立ちます。",
  "mtip.sleep.t": "睡眠をとる",
  "mtip.sleep.b": "睡眠不足だと推理力はすぐに落ちます。",
  "mtip.daily.t": "短く、こまめに",
  "mtip.daily.b": "たまの長時間より、毎日数分のほうが効きます。",

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
