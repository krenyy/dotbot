import Discord from "discord.js";

type BetterEmbedType = "recyclable" | "musik";

export default class BetterEmbed extends Discord.MessageEmbed {
  setAuthor(author: Discord.User) {
    super.setAuthor(author.id, author.avatarURL());
    return this;
  }

  setType(type: BetterEmbedType) {
    return this.setFooter(type);
  }

  setInfo(description: string) {
    return this.setTitle("Info")
      .setDescription(description)
      .setColor("#0090ff");
  }

  setSuccess(description: string) {
    return this.setTitle("Success")
      .setDescription(description)
      .setColor("#00ff00");
  }

  setWarning(description: string) {
    return this.setTitle("Warning")
      .setDescription(description)
      .setColor("#ffff00");
  }

  setError(description: string) {
    return this.setTitle("Error")
      .setDescription(description)
      .setColor("#ff0000");
  }
}
