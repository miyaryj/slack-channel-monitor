require("dotenv").config();
const fetch = require("node-fetch");
const ProxyAgent = require("proxy-agent");
const moment = require("moment");

const ENDPOINT = "https://slack.com/api";

const userToken = process.env.USER_OAUTH_TOKEN;
const botToken = process.env.BOT_OAUTH_TOKEN;

const agent = new ProxyAgent();
checkUnusedChannels();

async function checkUnusedChannels() {
  const current = moment();
  const channels = await getChannels();
  console.log(`Channels: ${channels.length}`);

  for (const c of channels) {
    const messages = await getChannelMessages(c.id);
    const latest = messages.filter(m => !m.subtype || !m.subtype.startsWith("channel_"))[0];
    if (!latest) {
      console.log(`No latest: ${c.name}`);
      continue;
    }
    if (current.diff(moment.unix(latest.ts), "months") >= 12) {
      console.log(`Unused: ${c.name} ([${latest.subtype}] ${latest.text.substr(0, 20)})`);
    }
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
  const resp = await fetch(`${ENDPOINT}/chat.postMessage?token=${botToken}&channel=${channelId}&text=${text}`, {
    agent,
    method: "POST"
  });
  const body = await resp.json();
  if (!body.ok) console.error(`getChannelMessages failed: ${body.error}`);
  return true;
}
