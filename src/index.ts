import Discord from "discord.js";
import MessageEventHandler from "./eventHandlers/message.js";
import MessageReactionAddEventHandler from "./eventHandlers/messageReactionAdd.js";
import VoiceStateUpdateEventHandler from "./eventHandlers/voiceStateUpdate.js";
import ReadyEventHandler from "./eventHandlers/ready.js";

process
    .on("unhandledRejection", (reason, promise) => {
        console.error(`[UNHANDLED REJECTION] ${reason}`);
        console.log(promise);
    })
    .on("SIGINT", (signal) => {
        console.log(signal);
        process.exit(0);
    })
    .on("SIGTERM", (signal) => {
        console.log(signal);
        process.exit(0);
    })
    .on("exit", (code) => {
        console.log(code);
        client.destroy();
    });

const client = new Discord.Client({
    partials: ["MESSAGE", "CHANNEL", "REACTION"],
})
    // Logging
    //.on("debug", (info) => console.debug(`[DEBUG] ${info}`))
    .on("error", (error) => console.error(`[ERROR] ${error}`))
    .on("warn", (warning) => console.warn(`[WARNING] ${warning}`))
    // ---
    .on("message", MessageEventHandler.execute)
    .on("messageReactionAdd", MessageReactionAddEventHandler.execute)
    .on("voiceStateUpdate", VoiceStateUpdateEventHandler.execute)
    .on("ready", ReadyEventHandler.execute);

await client.login(process.env.KBOT_TOKEN);

export default client;
