import Discord from "discord.js";
import TempChannelHandler from "./custom/tempChannelHandler.js";

export default class VoiceStateUpdateHandler {
  static async execute(
    oldState: Discord.VoiceState,
    newState: Discord.VoiceState
  ) {
    if (newState.channel) {
      if (newState.member === newState.member.guild.me && !newState.deaf) {
        await newState.setDeaf(true, "Save bandwidth!");
      }
      if (newState.channel !== oldState.channel) {
        await TempChannelHandler.create(newState);
      }
    }

    if (oldState.channel) {
      await TempChannelHandler.tryCleanup(oldState);
    }
  }
}
