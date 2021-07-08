import Discord from 'discord.js';
import MessageCreateHandler from './eventHandlers/messageCreate.js';
import VoiceStateUpdateHandler from './eventHandlers/voiceStateUpdate.js';
import ReadyHandler from './eventHandlers/ready.js';
import InteractionCreateHandler from './eventHandlers/interactionCreate.js';

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
  intents: new Discord.Intents('0b111111111111111'),
  partials: ['CHANNEL', 'MESSAGE', 'REACTION'],
})
  //.on("debug", (info) => console.debug(`[DEBUG] ${info}`))
  .on('error', (error) => console.error(`[ERROR] ${error}`))
  .on('warn', (warning) => console.warn(`[WARNING] ${warning}`))

  .on('messageCreate', MessageCreateHandler.execute)
  .on('voiceStateUpdate', VoiceStateUpdateHandler.execute)
  .on('interactionCreate', InteractionCreateHandler.execute)
  .on('ready', ReadyHandler.execute);

export default client;

await client.login(process.env.DOTBOT_TOKEN);
