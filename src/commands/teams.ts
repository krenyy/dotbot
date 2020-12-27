import Discord from "discord.js";
import DiscordCommand from "./base.js";
import BetterEmbed from "../util/betterembed.js";

export default class TeamsCommand implements DiscordCommand {
  public static readonly id = "teams";
  public static readonly description =
    "Divides current voice channel members to teams.";

  static async shuffle(
    players: Array<string>,
    teamCount: number,
    playerCountPerTeam: number
  ) {
    const shuffle = <T>(arr: Array<T>) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
    };

    shuffle(players);

    const teams = new Array<Array<string>>();

    for (let i = 0; i < teamCount; i++) {
      teams.push(
        new Array<string>(
          ...players.slice(i * playerCountPerTeam, (i + 1) * playerCountPerTeam)
        )
      );
    }

    const remainingPlayers = players.slice(teamCount * playerCountPerTeam);

    remainingPlayers.map((player, index) => teams[index].push(player));

    return teams.map((team, index) => {
      return { name: `Team ${index + 1}`, value: team.join(", ") };
    });
  }

  static async execute(message: Discord.Message, args: Array<string>) {
    if (!message.member.voice.channel) {
      await message.channel.send(
        new BetterEmbed()
          .setError("You're not connected to a voice channel!")
          .setType("recyclable")
      );
      return;
    }

    const parsedTeamCount = Number(args[0]);
    const teamCount = parsedTeamCount > 1 ? parsedTeamCount : 2;

    const players = Array.from(
      message.member.voice.channel.members
        .filter((member) => !member.user.bot)
        .map((member) => member.displayName)
    );

    const playerCountPerTeam = Math.floor(players.length / teamCount);

    if (!playerCountPerTeam) {
      await message.channel.send(
        new BetterEmbed()
          .setAuthor(message.author)
          .setError("Not enough users in voice channel!")
          .setType("recyclable")
      );
      return;
    }

    await message.channel.send(
      new BetterEmbed()
        .setTitle("Teams")
        .addFields(await this.shuffle(players, teamCount, playerCountPerTeam))
    );
  }
}
