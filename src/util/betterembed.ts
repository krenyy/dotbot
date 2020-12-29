import Discord from "discord.js";

type BetterEmbedType = "recyclable" | "musik";

export default class BetterEmbed extends Discord.MessageEmbed {
  setAuthor(author: Discord.User) {
    if (!author) {
      super.author = null;
    } else {
      super.setAuthor(author.tag, author.avatarURL());
    }
    return this;
  }

  setType(type: BetterEmbedType) {
    return this.setFooter(type);
  }

  setInfo(description: string, title?: string) {
    return this.setTitle(title || "Info")
      .setDescription(description)
      .setColor("#0090ff");
  }

  setSuccess(description: string, title?: string) {
    return this.setTitle(title || "Success")
      .setDescription(description)
      .setColor("#00ff00");
  }

  setWarning(description: string, title?: string) {
    return this.setTitle(title || "Warning")
      .setDescription(description)
      .setColor("#ffff00");
  }

  setError(description: string, title?: string) {
    return this.setTitle(title || "Error")
      .setDescription(description)
      .setColor("#ff0000");
  }
}
