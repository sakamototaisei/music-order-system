import streamlit as st
import os
from supabase import create_client, Client
from openai import OpenAI

st.title("音楽注文検索")

# Supabase connection
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    st.error("環境変数 SUPABASE_URL または SUPABASE_KEY が設定されていません。")
    st.info("""
    ターミナルで以下のコマンドを実行して、環境変数を設定してください。  
    **service_roleキー（secretキー）** を設定してください。

    ```
    export SUPABASE_URL="YOUR_SUPABASE_URL"
    export SUPABASE_KEY="YOUR_SERVICE_ROLE_KEY"
    ```
    """)
    st.stop()

try:
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    st.error(f"Supabaseへの接続中にエラーが発生しました: {e}")
    st.stop()

# OpenAI API key
openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    st.error("環境変数 OPENAI_API_KEY が設定されていません。")
    st.stop()

try:
    client = OpenAI(api_key=openai_api_key)
except Exception as e:
    st.error(f"OpenAIクライアントの初期化中にエラーが発生しました: {e}")
    st.stop()


order_id = st.text_input("オーダーIDを入力してください")

if st.button("検索"):
    if order_id:
        try:
            # Supabaseからデータを取得
            response = supabase.table("music_orders").select(
                "*").eq("id", order_id).execute()

            if response.data:
                order_data = response.data[0]
                st.write("取得データ:")
                st.json(order_data)

                # 歌詞の有無でプロンプトとシステムメッセージを分岐
                if order_data.get("has_lyrics"):
                    system_message = "あなたは、作詞、作曲、編曲に関する深い知識を持つ、Suno AI向けの【音楽プロデューサー兼プロンプトエンジニア】です。"
                    prompt_template = '''
ユーザーから提供される音楽のキーワードと「歌詞の元となるアイデア」を組み合わせ、Suno AIが最も高品質な楽曲を生成できるような、プロンプト一式（**Music Style**と**Lyrics**）を生成してください。

# 依頼内容
以下の構成要素に基づき、Suno AI用のプロンプト一式を2つの項目で出力してください。

# 構成要素
*   **ジャンル (Genre):** {genres}
*   **テーマ/コンセプト (Theme):** {theme}
*   **使用楽器 (Instruments):** {instruments}
*   **BPM/テンポ (Tempo):** 曲の速さ。(例: slow, 120 BPM, up-tempo)
*   **ボーカルスタイル (Vocal Style):** (※ボーカルありの場合) 声の性別や特徴。(例: 透明感のある女性ボーカル, パワフルな男性ボーカル)
*   **歌詞案 (Lyric Idea):** {lyrics_content}
*   **その他要望 (Additional Notes):** {additional_notes}

# 出力ルール
*   最終的な出力は、以下の2つのセクションのみで構成してください。
    1.  `[Music Style]`
    2.  `[Lyrics]`
*   プロンプト以外の余計な解説や前置きは一切含めないでください。

---

### [Music Style] の生成ルール
*   全ての構成要素を統合し、**英語で書かれた一つの文章（カンマ区切り）**として出力してください。
*   最も重要となる**ジャンルや雰囲気を先頭に**配置してください。
*   あなたの専門知識を活かし、`soaring guitar solo`, `dreamy synth pads` のような具体的な音楽的表現を加えてください。
*   **ボーカルありの場合:** `Vocal Style`の要素を文章に含めてください。(例: `with emotional female vocal`)
*   **ボーカルなし (インスト) の場合:** 文章の冒頭または重要な箇所に `Instrumental` という単語を必ず含めてください。

### [Lyrics] の生成ルール
*   **ボーカルありの場合:**
    *   ユーザーが入力した **`歌詞案 (Lyric Idea)` を元にして**、歌詞を完成させてください。
    *   **`歌詞案` で使われている言語（日本語、英語など）と完全に同じ言語**で歌詞を作成してください。
    *   以下の構成で、各パート4行程度の歌詞を生成してください。
        `[Intro]`
        `[Verse 1]`
        `[Pre-Chorus]`
        `[Chorus]`
        `[Verse 2]`
        `[Pre-Chorus]`
        `[Chorus]`
        `[Bridge]`
        `[Outro]`
*   **ボーカルなし (インスト) の場合:**
    *   このセクションには、「インストゥルメンタル曲のため、歌詞はありません。」とだけ記載してください。

---

# 実行
*   **入力:**
・テーマ/コンセプト：{theme}
・ジャンル：{genres}
・使用楽器：{instruments}
・歌詞案：{lyrics_content}
・その他要望：{additional_notes}
'''
                    prompt = prompt_template.format(
                        theme=order_data.get('theme', ''),
                        genres=', '.join(order_data.get('genres', [])),
                        instruments=', '.join(order_data.get('instruments', [])),
                        lyrics_content=order_data.get('lyrics_content', ''),
                        additional_notes=order_data.get('additional_notes', '')
                    )
                else:
                    system_message = "あなたは、音楽のジャンル、曲の構成、楽器編成、感情表現に関する深い知識を持つ、Suno AI向けの【インストゥルメンタル楽曲専門】のプロンプトエンジニアです。"
                    prompt_template = '''
ユーザーから提供される複数のキーワードを組み合わせ、Suno AIが最も独創的で高品質なインストゥルメンタル音楽を生成できるような、効果的で魅力的な「Style of music」プロンプトを生成してください。

# 依頼内容
以下の構成要素から、ボーカルを含まない【インストゥルメンタル音楽】のスタイルを示す**英語のフレーズ**を生成してください。

# 構成要素
*   **ジャンル (Genre):** {genres}
*   **テーマ/コンセプト (Theme):** {theme}
*   **リード楽器 (Lead Instrument):** 主旋律を奏でる楽器。(例: Piano, Violin, Lead Guitar, Synthesizer, Flute)
*   **使用楽器 (Instruments):** {instruments}
*   **BPM/テンポ (Tempo):** 曲の速さ。(例: slow, mid-tempo, 90 BPM, fast-paced)
*   **その他要望 (Additional Notes):** {additional_notes}

# 出力ルール
*   構成要素を自然に統合し、カンマ区切りで繋がった**一つの英語フレーズ**として出力してください。
*   プロンプトの冒頭または重要な箇所に `Instrumental` という単語を必ず含めてください。
*   最も重要となる**ジャンルや雰囲気を先頭に**配置してください。
*   **ボーカルに関するキーワードは一切含めないでください。**
*   提供された情報から連想される音楽的表現（例: `soaring violin melody`, `dreamy synth pads`）を、あなたの専門知識で補って、より豊かで具体的なプロンプトにしてください。
*   プロンプト以外の余計な解説や前置きは一切含めないでください。

# 実行
*   **入力:**
・テーマ/コンセプト：{theme}
・ジャンル：{genres}
・使用楽器：{instruments}
・その他要望：{additional_notes}
'''
                    prompt = prompt_template.format(
                        theme=order_data.get('theme', ''),
                        genres=', '.join(order_data.get('genres', [])),
                        instruments=', '.join(order_data.get('instruments', [])),
                        additional_notes=order_data.get('additional_notes', '')
                    )

                # ChatGPTにデータを送信
                chat_response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt},
                    ],
                )
                st.write("ChatGPTからの応答:")
                st.write(chat_response.choices[0].message.content)
            else:
                st.warning("指定されたオーダーIDのデータが見つかりませんでした。")
        except Exception as e:
            st.error(f"データの取得または処理中にエラーが発生しました: {e}")
    else:
        st.warning("オーダーIDを入力してください。")
