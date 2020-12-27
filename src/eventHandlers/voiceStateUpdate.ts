import Discord from "discord.js";
import TempChannelHandler from "./custom/tempChannelHandler.js";

export default class VoiceStateUpdateEventHandler {
  static async execute(
    oldState: Discord.VoiceState,
    newState: Discord.VoiceState
  ) {
    if (newState.channel && newState.channel !== oldState.channel) {
      if (
        newState.channel.name.startsWith(
          process.env.KBOT_TMP_CHANNEL_FACTORY_PREFIX
        )
      ) {
        await TempChannelHandler.create(newState);
      }
    }

    if (oldState.channel) {
      if (oldState.channel.parent.name.startsWith(TempChannelHandler.prefix)) {
        await TempChannelHandler.tryCleanup(oldState);
      }
    }
  }
}
