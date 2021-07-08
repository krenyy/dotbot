import Discord from 'discord.js';
import InteractionCommandHandler from './custom/interactionCommand.js';
import InteractionMessageComponentHandler from './custom/interactionMessageComponent.js';

export default class InteractionCreateHandler {
  static async execute(interaction: Discord.Interaction) {
    if (interaction.isCommand()) {
      InteractionCommandHandler.execute(interaction);
      return;
    }

    if (interaction.isMessageComponent()) {
      InteractionMessageComponentHandler.execute(interaction);
      return;
    }
  }
}
