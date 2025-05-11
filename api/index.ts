const express = require("express");
const app = express();
const line = require("@line/bot-sdk");
const { Client } = require("@notionhq/client");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Notionクライアントを初期化
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// NotionデータベースのIDを設定
const databaseId = process.env.NOTION_DATABASE_ID;

// LINEクライアントを初期化
const client = new line.Client(config);

const handleEvent = async (event) => {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }
  // メッセージに対する処理をここに記述します
  const userId = event.source.userId;
  const messageText = event.message.text;

  // LINE APIを使ってユーザーのプロフィール情報を取得
  const profile = await client.getProfile(userId);
  const userName = profile.displayName;

  // NotionデータにuserIdが一致する かつ Doneがfalseのデータがあるかどうかを確認
  // const database = await notion.databases.query({
  //   database_id: databaseId,
  //   filter: {
  //     and: [
  //       {
  //         property: "SenderID",
  //         rich_text: {
  //           equals: userId,
  //         },
  //       },
  //       {
  //         property: "DONE",
  //         checkbox: {
  //           equals: false,
  //         },
  //       },
  //     ],
  //   },
  // });
  // if (database.results.length) {
  //   return;
  // }

  // Notionにデータを追加
  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      SenderID: {
        title: [
          {
            type: "text",
            text: {
              content: userId,
            },
          },
        ],
      },
      SenderName: {
        rich_text: [
          {
            type: "text",
            text: {
              content: userName,
            },
          },
        ],
      },
      Message: {
        rich_text: [
          {
            type: "text",
            text: {
              content: messageText,
            },
          },
        ],
      },
    },
  });
};

// app.listen(3000, () => console.log("Server ready on port 3000."));
module.exports = app;
