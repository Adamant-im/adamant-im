import { BotCommand } from '@/store/modules/bot-commands/types'

/**
 * The function returns an array of unique bot commands.
 * If a duplicate is detected, the function gives preference to the one with the larger timestamp.
 * @param commands Bot commands array
 * @return An array of unique bot commands
 * */
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
