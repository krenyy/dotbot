import Discord from 'discord.js';
import SlashCommand from './base.js';
import js_beautify from 'js-beautify';
import axios from 'axios';

const _Discord = Discord;
const _axios = axios;

async function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export default class EvalCommand implements SlashCommand {
  public static readonly data: Discord.ApplicationCommandData = {
    name: 'eval',
    description: 'Evaluates a Javascript expression',
    options: [
      {
        name: 'expression',
        description: 'Expression to evaluate',
        type: 'STRING',
        required: true,
      },
    ],
  };

  static async execute(interaction: Discord.CommandInteraction) {
    if (interaction.user !== interaction.client.application.owner) {
      await interaction.reply({
        content: 'Only the owner can use this command!',
        ephemeral: true,
      });
      return;
    }

    const expression = interaction.options.get('expression').value as string;

    if (
      expression.includes('setTimeout') ||
      expression.includes('setInterval')
    ) {
      await interaction.reply({
        content:
          'Cannot use `setTimeout` or `setInterval` inside an eval!\n' +
          'Use special `await sleep(ms)` instead!',
        ephemeral: true,
      });
      return;
    }

    const codeBlock = `\`\`\`js\n${js_beautify(expression)}\`\`\`\n`;

    await interaction.reply({
      embeds: [
        new Discord.MessageEmbed({
          title: 'Running...',
          color: '#0090ff',
          description: codeBlock,
        }),
      ],
      ephemeral: true,
    });

    await sleep(500);

    try {
      const evalResult = await eval(`(async()=>{${expression}})()`);
      await interaction.editReply({
        embeds: [
          new Discord.MessageEmbed({
            title: 'Finished!',
            color: '#00ff00',
            description: codeBlock + evalResult,
          }),
        ],
      });
    } catch (err) {
      await interaction.editReply({
        embeds: [
          new Discord.MessageEmbed({
            title: 'Failed!',
            color: '#ff0000',
            description: codeBlock + err,
          }),
        ],
      });
    }
  }
}
