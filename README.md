# CoStrict-System-Notify

Desktop notification plugin for CoStrict.

## Features

Monitors human intervention events and displays desktop notifications when:

- **Permission requests** - Tool execution requires user permission
- **Question asked** - AI needs user input
- **Session idle** - AI waiting for user input

## Architecture

The plugin implements a single hook:

- **intervention.required hook** - Receives notification events and displays desktop notifications

The filtering logic for idle events (main session vs sub-agent) is handled by the TDD plugin which triggers this hook. This plugin simply displays whatever notifications it receives.

## Installation

### Add to CoStrict Config

Add to your `~/.config/costrict/config.json`:

```json
{
  "plugin": ["@costrict/system-notify"]
}
```

### Build Plugin

```bash
cd D:/DEV/CoStrict-System-Notify
bun install
```

No build step required - pure JavaScript implementation.

## Project Structure

```
CoStrict-System-Notify/
├── src/
│   └── index.js          # Main plugin code (JavaScript)
├── package.json           # Dependencies and scripts
├── .gitignore            # Git ignore rules
├── LICENSE               # MIT License
└── README.md             # This file
```

## Notification Details

### Permission Notification

- **Trigger**: `intervention.required` hook (type: "permission")
- **Title**: "需要权限"
- **Message**: Permission request message
- **Sound**: ✅ Yes

### Question Notification

- **Trigger**: `intervention.required` hook (type: "question")
- **Title**: "问题"
- **Message**: First question text
- **Sound**: ✅ Yes

### Idle Notification

- **Trigger**: `intervention.required` hook (type: "idle")
- **Title**: "会话空闲"
- **Message**: "AI 正在等待您的输入"
- **Sound**: ❌ No
- **Filtered**: Only for main sessions (handled by TDD plugin)

## Technical Details

- Uses `node-notifier` v10.0.1 for cross-platform desktop notifications
- Implements `intervention.required` hook
- Pure JavaScript - no build step required
- Compatible with CoStrict plugin system
- Smart filtering delegated to TDD plugin

## License

MIT
