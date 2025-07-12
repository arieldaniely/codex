/**
 * Utility functions for handling platform-specific commands
 */

import { log } from "../logger/log.js";

/**
 * Map of Unix commands to their Windows equivalents
 */
const COMMAND_MAP: Record<string, string> = {
  ls: "dir",
  grep: "powershell",
  cat: "type",
  rm: "del",
  cp: "copy",
  mv: "move",
  touch: "echo.>",
  mkdir: "md",
};

/**
 * Map of common Unix command options to their Windows equivalents
 */
const OPTION_MAP: Record<string, Record<string, string>> = {
  ls: {
    "-l": "/p",
    "-a": "/a",
    "-R": "/s",
  },
  grep: {
    "-i": "-CaseSensitive:$false",
    "-r": "-Recurse",
  },
};

/**
 * Adapts a command for the current platform.
 * On Windows, this will translate Unix commands to their Windows equivalents.
 * On Unix-like systems, this will return the original command.
 *
 * @param command The command array to adapt
 * @returns The adapted command array
 */
export function adaptCommandForPlatform(command: Array<string>): Array<string> {
  // If not on Windows, return the original command
  if (process.platform !== "win32") {
    return command;
  }

  // Nothing to adapt if the command is empty
  if (command.length === 0) {
    return command;
  }

  const cmd = command[0];

  // If cmd is undefined or the command doesn't need adaptation, return it as is
  if (!cmd || !COMMAND_MAP[cmd]) {
    return command;
  }

  log(`Adapting command '${cmd}' for Windows platform`);

  // Create a new command array with the adapted command
  let adaptedCommand = [...command];
  adaptedCommand[0] = COMMAND_MAP[cmd];

  if (cmd === "grep") {
    const grepOptions = OPTION_MAP[cmd];
    const args: Array<string> = [];
    let patternInjected = false;
    for (let i = 1; i < command.length; i++) {
      const arg = command[i];
      if (grepOptions[arg]) {
        args.push(grepOptions[arg]);
      } else if (!arg.startsWith("-") && !patternInjected) {
        args.push("-Pattern", arg);
        patternInjected = true;
      } else {
        args.push(arg);
      }
    }
    adaptedCommand = ["powershell", "-Command", "Select-String", ...args];
    log(`Adapted command: ${adaptedCommand.join(" ")}`);
    return adaptedCommand;
  }

  // Adapt options if needed
  const optionsForCmd = OPTION_MAP[cmd];
  if (optionsForCmd) {
    for (let i = 1; i < adaptedCommand.length; i++) {
      const option = adaptedCommand[i];
      if (option && optionsForCmd[option]) {
        adaptedCommand[i] = optionsForCmd[option];
      }
    }
  }

  log(`Adapted command: ${adaptedCommand.join(" ")}`);

  return adaptedCommand;
}
