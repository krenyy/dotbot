import client from '../index.js';

export interface DiscordMusicPlayerTrack {
  requestedBy: `${bigint}`;
  trackData: DiscordMusicPlayerTrackData;
}

export interface DiscordMusicPlayerTrackData {
  title: string;
  url: string;
  thumbnailURL: string;
  averageColor: string;
}

export class DiscordMusicPlayerQueue {
  private items: DiscordMusicPlayerTrack[];
  private pos: number;

  public looping: boolean;

  public load(config: DiscordMusicPlayerQueue) {
    this.items = config!.items;
    this.pos = config!.pos;
  }

  public get(): readonly DiscordMusicPlayerTrack[] {
    return this.items;
  }

  public length() {
    return this.items.length;
  }

  public position() {
    return this.pos;
  }

  public isAtStart() {
    return this.pos === 0;
  }

  public isAtEnd() {
    return this.pos === this.items.length - 1;
  }

  constructor() {
    this.items = [];
    this.pos = -1;
  }

  add(item: DiscordMusicPlayerTrack) {
    if (this.pos < 0) this.pos++;
    return this.items.push(item) - 1;
  }

  remove(index: number, count?: number) {
    if (index <= this.pos) this.pos--;
    this.items.splice(index, count ?? 1);
  }

  current() {
    return this.items[this.pos];
  }

  next(keepCursorPosition?: boolean) {
    let newPosition =
      this.pos + 1 === this.items.length && this.looping
        ? this.pos + 1 - this.items.length
        : this.pos + 1;

    const entry = this.items[newPosition];

    if (!keepCursorPosition) this.pos = newPosition;
    return entry;
  }

  previous(keepCursorPosition?: boolean) {
    const newPosition =
      this.pos - 1 < 0 && this.looping
        ? this.pos - 1 + this.items.length
        : this.pos - 1;

    const entry = this.items[newPosition];

    if (!keepCursorPosition) this.pos = newPosition;
    return entry;
  }

  at(index: number) {
    return this.items[index];
  }

  getFormatted() {
    return this.items
      .map(
        (item, index) =>
          `${index === this.pos ? '> ' : '  '}${index + 1}.\t${
            item.trackData.title
          }\t\t(requested by ${
            client.users.resolve(item.requestedBy).username
          })`
      )
      .join('\n');
  }
}
