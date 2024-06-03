export interface BotCommandsState {
  commands: Record<string, BotCommand[]>
}

export type BotCommand = { command: string; timestamp: number }
