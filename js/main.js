import { prompt } from "./prompt.js";

$(function () {
  // 音声認識
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "ja";
  recognition.continuous = true;
  recognition.onresult = async ({ results }) => {
    const talk = results[results.length - 1][0].transcript;
    if (talk) {
      $('.line__contents').append(outputUser(talk));
      $('.line__contents').scrollTop($('.line__contents').get(0).scrollHeight);

      const responseText = await requestChatAPI(talk);

      $('.line__contents').append(outputAssistant(responseText));
      $('.line__contents').scrollTop($('.line__contents').get(0).scrollHeight);

      // 読み上げ
      recognition.stop();
      await createAudio(responseText);
    }
  };

  $('.start').on('click', function () {
    // $(this).attr('disabled', true);
    recognition.start();

  });

  // 読み上げ
  async function createAudio(text) {
    const data = await createVoice(text);
    const audio = document.querySelector(".audio");
    audio.src = URL.createObjectURL(data);
    await audio.play();
  }

  const audio1 = document.querySelector(".audio");
  audio1.addEventListener("ended", () => {
    document.querySelector(".start").click();
  });

  async function createQuery(text) {
    const response = await axios.post(
      `http://localhost:50021/audio_query?speaker=${document.querySelector('[name=speaker]').value}&text=${text}`
    );
    return response.data;
  }
  async function createVoice(text) {
    const query = await createQuery(text);
    const response = await axios.post(
      `http://localhost:50021/synthesis?speaker=${document.querySelector('[name=speaker]').value}`,
      query,
      { responseType: "blob" }
    );
    return response.data;
  }

  // ChatGPT
  const api_key = 'XXXXX';

  const messages = [
    {
      role: 'system',
      content: prompt
    },
  ];

  async function requestChatAPI(text) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
    };

    messages.push({
      role: 'user',
      content: text,
    });

    const payload = {
      model: "gpt-3.5-turbo",
      max_tokens: 128,
      messages: messages,
    };
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      {
        headers: headers,
      }
    );

    let message = response.data.choices[0].message.content;
    console.log('message', message);

    if (message.match(/([。！？][^。！？]+)$/)) {
      message = message.replace(/([。！？][^。！？]+)$/, '。');
    }

    messages.push({
      role: 'assistant',
      content: message,
    });
    return message;
  }

  const outputAssistant = (message) => {
    return `
      <div class="line__left">
      <figure>
        <img src="/img/chara-img-sakana.png" />
      </figure>
      <div class="line__left-text">
        <div class="name">さかな王子</div>
        <div class="text">${message}</div>
      </div>
    </div>
    `;
  }

  const outputUser = (message) => {
    const now = new Date();
    const h = `0${now.getHours()}`.slice(-2);
    const m = `0${now.getMinutes()}`.slice(-2);
    return `
      <div class="line__right">
        <div class="text">${message}</div>
        <span class="date">既読<br>${h}:${m}</span>
      </div>
    `;
  }
});
