# CoStrict-System-Notify

Windows 10 notification plugin for CoStrict.

## Features

Monitors human intervention events and displays Windows 10 desktop notifications when:

- Permission requests (tool execution requires user permission)
- Question asked (AI needs user input)
- Session idle (AI waiting for user input)

## Installation

1. Add plugin to CoStrict config:

```json
{
  "plugin": ["@costrict/system-notify"]
}
```

2. Install dependencies:

```bash
bun install
```

## Architecture

- Uses `notification.human.intervention` hook to receive events
- Listens to `session.created` to track main sessions (not sub-agents)
- Only notifies on idle events from main sessions (not from sub-agent completions)

## Development

```bash
# Build
bun run build

# Development
bun run dev
```

## License

MIT
