import { GoogleGenerativeAI } from '@google/generative-ai';

const getAvailableModel = async (apiKey) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            throw new Error('APIキーが無効か、モデル一覧の取得に失敗しました。');
        }
        const data = await response.json();
        const availableModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

        if (availableModels.length === 0) {
            throw new Error('利用可能なモデルが見つかりません。');
        }

        // Prefer flash, then pro, then whatever is available
        const flashModel = availableModels.find(m => m.name.includes("flash"));
        const proModel = availableModels.find(m => m.name.includes("pro"));

        const selectedModelInfo = flashModel || proModel || availableModels[0];

        // name is usually returned as "models/gemini-1.5-flash", we only want the suffix
        return selectedModelInfo.name.replace('models/', '');
    } catch (err) {
        console.error("Failed to fetch available models", err);
        return "gemini-1.5-flash"; // fallback to default
    }
};

export const generateMinuteWithAI = async (transcript, type) => {
    const apiKey = localStorage.getItem('gemini_api_key');

    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。ヘッダーの設定アイコンからAPIキーを入力してください。');
    }

    if (!transcript || transcript.trim() === '') {
        throw new Error('文字起こしテキストがありません。録音を行ってください。');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = await getAvailableModel(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const systemPrompt = type === 'monitoring'
        ? `あなたは優秀なケアマネージャーのアシスタントです。
以下の会話録音テキストをもとに、「モニタリング訪問記録」を作成してください。
出力は以下のフォーマットに厳密に従い、会話から読み取れる情報を該当箇所に要約して記載してください。箇条書きを多用して読みやすくしてください。
情報が不足している箇所は空欄または「特になし」としてください。

■ モニタリング訪問記録
【訪問先（対象者）】: 
【訪問者】: 
【訪問日時】: (テキストから推測できなければ空欄)
【バイタルサイン】: (体温、血圧、脈拍などがあれば記載)
【現在の状況・様子の変化】:
【提供サービスの利用状況】:
【本人・家族の意向・要望】:
【今後の課題と支援方針】:`
        : `あなたは優秀なケアマネージャーのアシスタントです。
以下の会話録音テキストをもとに、「サービス担当者会議 議事録」を作成してください。
出力は以下のフォーマットに厳密に従い、会話から読み取れる情報を該当箇所に要約して記載してください。箇条書きを多用して読みやすくしてください。
情報が不足している箇所は空欄または「特になし」としてください。

■ サービス担当者会議 議事録
【開催日時】: 
【開催場所】: 
【対象者】: 
【参加者】: (本人/家族、ケアマネ、サービス事業所などをリスト化)
【会議の目的】:
【検討内容・各事業所からの報告】:
【本人・家族の意見】:
【結論・決定事項】:
【今後のスケジュール・次回予定】:`;

    try {
        const result = await model.generateContent([
            { text: systemPrompt },
            { text: `会話テキスト:\n${transcript}` }
        ]);

        const aiText = result.response.text();

        const date = new Date();
        const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

        return `【作成日時】${formattedDate} ${timeStr}\n\n${aiText}\n\n=== 録音テキスト ===\n${transcript}`;
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error.message && error.message.includes('API key not valid')) {
            throw new Error('Gemini APIキーが無効です。設定画面から正しいAPIキーを入力してください。');
        }
        throw new Error(`AIからの応答の取得に失敗しました: ${error.message}`);
    }
};

export const reconstructTranscriptWithAI = async (transcript) => {
    const apiKey = localStorage.getItem('gemini_api_key');

    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。設定画面からAPIキーを入力してください。');
    }

    if (!transcript || transcript.trim() === '') {
        throw new Error('文字起こしテキストがありません。録音を行ってください。');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = await getAvailableModel(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const systemPrompt = `あなたは優秀な文字起こしアシスタントです。
以下のテキストは、ケアマネージャーと利用者（またはその家族、その他関係者）が面談した際の、音声認識によるベタ書きの文字起こしデータです。音声認識の性質上、句読点がない、誤字脱字がある、話者の区別がない状態です。

あなたの任務は、文章の文脈、敬語の使われ方、相槌、話題の切り替わりなどを手がかりにして、このテキストから「誰が話しているか」を推測し、会話形式のスクリプトとして再構成することです。
出力は以下のルールに従ってください：
- 話者は「ケアマネージャー」「利用者」「家族（推測される場合）」などのラベルを使用すること。
- 話者が交替するごとに改行し、「話者名: 発言内容」の形式で出力すること。
- 意味をなさない相槌の連続などは適宜整理して読みやすくすること。ただし、重要な会話の内容は変えたり省略したりしないこと。
- 会話ログのみを出力し、挨拶文や解説は一切含めないこと。`;

    try {
        const result = await model.generateContent([
            { text: systemPrompt },
            { text: `元のテキスト:\n${transcript}` }
        ]);

        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error.message && error.message.includes('API key not valid')) {
            throw new Error('Gemini APIキーが無効です。設定画面から正しいAPIキーを入力してください。');
        }
        throw new Error(`AIからの応答の取得に失敗しました: ${error.message}`);
    }
};
