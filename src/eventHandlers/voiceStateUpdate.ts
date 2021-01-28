import Discord from "discord.js";
import TempChannelHandler from "./custom/tempChannelHandler.js";

export default class VoiceStateUpdateEventHandler {
  static async execute(
    oldState: Discord.VoiceState,
    newState: Discord.VoiceState
  ) {
    if (newState.channel && newState.channel !== oldState.channel) {
      await TempChannelHandler.create(newState);
    }

    if (oldState.channel) {
      await TempChannelHandler.tryCleanup(oldState);
    }
  }
}
