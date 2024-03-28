export interface BotCommandsState {
  commands: Record<string, string[]>
}

export type BotCommand = { partnerId: string; command: string }
