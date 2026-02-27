# CoStrict-System-Notify

Desktop notification plugin for CoStrict.

## Features

Monitors human intervention events and sends notifications via multiple channels when:

- **Permission requests** - Tool execution requires user permission
- **Question asked** - AI needs user input
- **Session idle** - AI waiting for user input

## Notification Channels

### System Notification (Default Enabled)
Desktop notifications using `node-notifier` - works across Windows, macOS, and Linux.

### Bark Notification
Push notifications via Bark service (iOS/macOS).

## Configuration

Configure notification channels using environment variables:

```bash
# Enable/disable notification channels (default: system enabled)
NOTIFY_ENABLE_SYSTEM=true    # System notification (default: true)
NOTIFY_ENABLE_BARK=false     # Bark notification (default: false)

# Bark configuration (required if Bark enabled)
BARK_URL="https://api.day.app/YOUR_BARK_KEY"
```

### Examples

**Enable only system notifications** (default):
```bash
# No configuration needed - system notifications are enabled by default
```

**Enable Bark notifications**:
```bash
export NOTIFY_ENABLE_BARK=true
export BARK_URL="https://api.day.app/YOUR_BARK_KEY"
```

**Enable multiple channels**:
```bash
export NOTIFY_ENABLE_BARK=true
export BARK_URL="https://api.day.app/YOUR_BARK_KEY"
```

**Disable system notifications**:
```bash
export NOTIFY_ENABLE_SYSTEM=false
```

## Architecture

The plugin implements a single hook:

- **intervention.required hook** - Receives notification events and displays desktop notifications

The filtering logic for idle events (main session vs sub-agent) is handled by the TDD plugin which triggers this hook. This plugin simply displays whatever notifications it receives.

## Installation

### Add to CoStrict Config

Add to your `~/.config/costrict/config.json`:

```json
{
  "plugin": ["@costrict/notify"]
}
```

### Build Plugin

```bash
cd D:/DEV/costrict-notify
bun install
```

No build step required - pure JavaScript implementation.

### Configuration Template

Copy `.env.example` to create your own environment configuration:

```bash
cp .env.example .env
# Edit .env with your notification settings
```

## Project Structure

```
costrict-notify/
├── src/
│   └── index.js          # Main plugin code with multi-channel support
├── package.json          # Dependencies and scripts
├── .env.example          # Environment configuration template
├── .gitignore           # Git ignore rules
├── LICENSE              # MIT License
└── README.md            # This file
```

## Notification Details

### Permission Notification

- **Trigger**: `intervention.required` hook (type: "permission")
- **Title**: "需要权限"
- **Message**: Permission request message

### Question Notification

- **Trigger**: `intervention.required` hook (type: "question")
- **Title**: "问题"
- **Message**: First question text

### Idle Notification

- **Trigger**: `intervention.required` hook (type: "idle")
- **Title**: "会话空闲"
- **Message**: "AI 正在等待您的输入"
- **Filtered**: Only for main sessions (handled by TDD plugin)

## Technical Details

- Uses `node-notifier` v10.0.1 for cross-platform desktop notifications
- Supports multiple notification channels (System, Bark, WeChat)
- Configurable via environment variables
- Implements `intervention.required` hook
- Pure JavaScript - no build step required
- Compatible with CoStrict plugin system
- Smart filtering delegated to TDD plugin

## License

MIT
