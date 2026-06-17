const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.10Ed4X3KsWSPcjVsOEIpxKvIB7aNUjmwFzHWn5++4PQqvRSvI7wDOgHf+vyzU8X6NJoR9BIakoZ66Z8miEKsj7IpF2N1DtoNH1uMs9gz1x/0aoGtRffWeMiPNV6SLdYLTkAb6XuqzkZcn6oPLMMNXgdB04t89/1O/w1cDnyilFU
"
  channelSecret: process.env.U505a37e3411e98b1b3ec88d33c2b18ab
};

exports.handler = async (event) => {
  const client = new line.messagingApi.MessagingApiClient({ 
    channelAccessToken: config.channelAccessToken 
  });

  try {
    const body = JSON.parse(event.body);
    for (let event of body.events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const flex = {
          type: "flex",
          altText: "สถานะแก๊ส",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📊 สถานะเซ็นเซอร์", weight: "bold", size: "lg" },
                { type: "text", text: `ค่าปัจจุบัน: ${event.message.text} ppm` }
              ]
            }
          }
        };

        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [flex]
        });
      }
    }
  } catch (err) {
    console.error(err);
  }

  return { statusCode: 200 };
};