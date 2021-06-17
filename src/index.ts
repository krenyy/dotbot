import Discord from 'discord.js';
import MessageHandler from './eventHandlers/message.js';
import VoiceStateUpdateHandler from './eventHandlers/voiceStateUpdate.js';
import ReadyHandler from './eventHandlers/ready.js';
import InteractionHandler from './eventHandlers/interaction.js';

function onInterrupt(signal: NodeJS.Signals) {
  console.log(`Process interrupted by ${signal}`);
  process.exit(0);
}

process
  .on('unhandledRejection', (reason, promise) => {
    console.error(promise);
  })
  .on('SIGINT', onInterrupt)
  .on('SIGTERM', onInterrupt)
  .on('exit', (code) => {
    console.log(`Exit code: ${code}`);
    client.destroy();
  });

const client = new Discord.Client({
  intents: Discord.Intents.ALL,
  partials: ['CHANNEL', 'MESSAGE', 'REACTION'],
})
  //.on("debug", (info) => console.debug(`[DEBUG] ${info}`))
  .on('error', (error) => console.error(`[ERROR] ${error}`))
  .on('warn', (warning) => console.warn(`[WARNING] ${warning}`))

  .on('message', MessageHandler.execute)
  .on('voiceStateUpdate', VoiceStateUpdateHandler.execute)
  .on('interaction', InteractionHandler.execute)
  .on('ready', ReadyHandler.execute);

export default client;

await client.login(process.env.DOTBOT_TOKEN);
