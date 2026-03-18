export const generateMinute = (type, transcript) => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

    const commonHeader = `【作成日時】${formattedDate} ${timeStr}\n\n`;
    const transcriptSection = `\n\n=== 録音テキスト ===\n${transcript || '（録音データなし）'}`;

    if (type === 'monitoring') {
        return `${commonHeader}■ モニタリング訪問記録

【訪問先（対象者）】: 
【訪問者】: 
【訪問日時】: ${formattedDate}
【バイタルサイン】:
  - 体温:   ℃
  - 血圧:   /   mmHg
  - 脈拍:   回/分

【現在の状況・様子の変化】:
・

【提供サービスの利用状況】:
・

【本人・家族の意向・要望】:
・

【今後の課題と支援方針】:
・
${transcriptSection}`;
    }

    if (type === 'conference') {
        return `${commonHeader}■ サービス担当者会議 議事録

【開催日時】: ${formattedDate}
【開催場所】: 
【対象者】: 
【参加者】: 
  - 本人/家族: 
  - ケアマネジャー: 
  - サービス事業所: 

【会議の目的】:
・

【検討内容・各事業所からの報告】:
・

【本人・家族の意見】:
・

【結論・決定事項】:
・

【今後のスケジュール・次回予定】:
・
${transcriptSection}`;
    }

    // Fallback
    return `${commonHeader}${transcriptSection}`;
};
