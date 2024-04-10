import { BotCommand } from '@/store/modules/bot-commands/types.ts'

export function uniqCommand(commands: BotCommand[]) {
  const result: BotCommand[] = []
  for (const currentCommand of commands) {
    const index = result.findIndex((item) => item.command === currentCommand.command)
    if (index === -1) {
      result.push(currentCommand)
      continue
    }
    if (result[index].timestamp < currentCommand.timestamp) {
      result[index] = currentCommand
    }
  }
  return result
}
