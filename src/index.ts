import Discord from "discord.js";
import MessageEventHandler from "./eventHandlers/message.js";
import MessageUpdateEventHandler from "./eventHandlers/messageUpdate.js";
import MessageReactionAddEventHandler from "./eventHandlers/messageReactionAdd.js";
import VoiceStateUpdateEventHandler from "./eventHandlers/voiceStateUpdate.js";
import ReadyEventHandler from "./eventHandlers/ready.js";

function onInterrupt(signal: NodeJS.Signals) {
  console.log(`Process interrupted by ${signal}`);
  process.exit(0);
}

process
  .on("unhandledRejection", (reason, promise) => {
    console.error(`[UNHANDLED REJECTION] ${reason}`);
    console.log(promise);
  })
  .on("SIGINT", onInterrupt)
  .on("SIGTERM", onInterrupt)
  .on("exit", (code) => {
    console.log(`Exit code: ${code}`);
    client.destroy();
  });

const client = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
})
  //.on("debug", (info) => console.debug(`[DEBUG] ${info}`))
  .on("error", (error) => console.error(`[ERROR] ${error}`))
  .on("warn", (warning) => console.warn(`[WARNING] ${warning}`))
  // ---
  .on("message", MessageEventHandler.execute)
  .on("messageUpdate", MessageUpdateEventHandler.execute)
  .on("messageReactionAdd", MessageReactionAddEventHandler.execute)
  .on("voiceStateUpdate", VoiceStateUpdateEventHandler.execute)
  .on("ready", ReadyEventHandler.execute);

export default client;

await client.login(process.env.DOTBOT_TOKEN);
