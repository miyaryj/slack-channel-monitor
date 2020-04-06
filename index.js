require("dotenv").config();
const fetch = require("node-fetch");
const ProxyAgent = require("proxy-agent");
const moment = require("moment");

const ENDPOINT = "https://slack.com/api";
const ALERT_CHANNEL = "admin";

const userToken = process.env.USER_OAUTH_TOKEN;
const botToken = process.env.BOT_OAUTH_TOKEN;
const whitelist = process.env.WHITELIST.split(",");

const agent = new ProxyAgent();
checkUnusedChannels();

async function checkUnusedChannels() {
  const current = moment();
  const channels = await getChannels();
  console.log(`Channels: ${channels.length}`);

  const unused = [];
  for (const c of channels) {
    const messages = await getChannelMessages(c.id);
    const latest = messages.filter(m => !m.subtype || !m.subtype.startsWith("channel_"))[0];
    if (latest) {
      if (current.diff(moment.unix(latest.ts), "months") >= 12) {
        console.log(`Unused: ${c.name} ([${latest.subtype}] ${latest.text.substr(0, 20)})`);
        c.since = moment.unix(latest.ts).format("YYYY-MM-DD");
      }
    } else {
      console.log(`No latest: ${c.name}; Created: ${moment.unix(c.created).format("YYYY-MM-DD")}`);
      if (current.diff(moment.unix(c.created), "months") >= 12) {
        c.since = moment.unix(c.created).format("YYYY-MM-DD");
      }
    }
    if (c.since && whitelist.indexOf(c.name) < 0) {
      unused.push(c);
    }
  }

  if (unused.length) {
    const summary = ["Unused channels found!\n"];
    await Promise.all(unused.map(c => {
      summary.push(`<#${c.id}> (since ${c.since})`);

      const indivisual = [
        `This channel will be archived because unsed since ${c.since}.`,
        `Please contact admin if you want this channel kept as active.`
      ];
      return postMessage(c.id, indivisual.join("\n"));
    }));
    console.log(summary.join("\n"));
    await postMessage(ALERT_CHANNEL, summary.join("\n"));
  }
}

async function getChannels() {
  const resp = await fetch(`${ENDPOINT}/conversations.list?token=${userToken}&exclude_archived=true&limit=1000`, {
    agent
  });
  const body = await resp.json();
  if (!body.ok) console.error(`getChannels failed: ${body.error}`);
  return body.channels;
}

async function getChannelMessages(channelId) {
  const resp = await fetch(`${ENDPOINT}/conversations.history?token=${userToken}&channel=${channelId}&limit=30`, {
    agent
  });
  const body = await resp.json();
  if (!body.ok) console.error(`getChannelMessages failed: ${body.error}`);
  return body.messages;
}

async function postMessage(channelId, text) {
  var payload = {
    channel: channelId,
    text: text
  };
  const resp = await fetch(`${ENDPOINT}/chat.postMessage`, {
    agent,
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${botToken}`
    },
    body: JSON.stringify(payload)
  });
  const body = await resp.json();
  if (!body.ok) console.error(`postMessage failed: ${body.error}`);
  return true;
}
