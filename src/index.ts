import type { Hooks, PluginInput } from "@opencode-ai/plugin";

interface NotificationData {
  type: "permission" | "question" | "idle";
  sessionID: string;
  data: any;
}

let notifierInstance: any = null;
const mainSessions = new Set<string>();

async function loadNotifier(): Promise<any> {
  if (notifierInstance) {
    return notifierInstance;
  }

  try {
    const notifierModule = await import("node-notifier");
    const notifier = notifierModule.default || notifierModule;
    return notifier;
  } catch {
    return null;
  }
}

async function handleSessionCreated(input: any): Promise<void> {
  if (input.event.type === "session.created") {
    const sessionInfo = input.event.properties.info;
    if (!sessionInfo.parentID) {
      mainSessions.add(sessionInfo.id);
    }
  }
}

async function handlePermissionAsked(input: any, output: any): Promise<void> {
  const data: NotificationData = {
    type: "permission",
    sessionID: input.sessionID,
    data: {
      permissionID: input.id,
      permissionType: input.permission,
      patterns: input.patterns,
      always: input.always,
      tool: input.tool,
      metadata: input.metadata,
    },
  };

  await triggerNotification(data);
}

async function handleNotificationEvent(input: { event: any }): Promise<void> {
  const eventType = input.event.type;

  if (eventType === "permission.asked") {
    const data: NotificationData = {
      type: "permission",
      sessionID: input.event.properties.sessionID,
      data: {
        permissionID: input.event.properties.id,
        permissionType: input.event.properties.permission,
        patterns: input.event.properties.patterns,
        always: input.event.properties.always,
        tool: input.event.properties.tool,
        metadata: input.event.properties.metadata,
      },
    };

    await triggerNotification(data);
  } else if (eventType === "question.asked") {
    const data: NotificationData = {
      type: "question",
      sessionID: input.event.properties.sessionID,
      data: {
        requestID: input.event.properties.id,
        questions: input.event.properties.questions,
        tool: input.event.properties.tool,
      },
    };

    await triggerNotification(data);
  } else if (
    eventType === "session.status" &&
    input.event.properties.status.type === "idle"
  ) {
    const sessionID = input.event.properties.sessionID;

    if (!mainSessions.has(sessionID)) {
      return;
    }

    const data: NotificationData = {
      type: "idle",
      sessionID,
      data: {
        timestamp: Date.now(),
      },
    };

    await triggerNotification(data);
  }
}

async function triggerNotification(data: NotificationData) {
  const notifier = await loadNotifier();
  if (!notifier) {
    return;
  }

  try {
    notifier.notify({
      title: getTitle(data.type),
      message: getMessage(data),
      sound: data.type !== "idle",
      timeout: 5,
      appID: "CoStrict",
      wait: false,
    });
  } catch {}
}

function getTitle(type: string): string {
  switch (type) {
    case "permission":
      return "需要权限";
    case "question":
      return "问题";
    case "idle":
      return "会话空闲";
    default:
      return "CoStrict";
  }
}

function getMessage(data: NotificationData): string {
  switch (data.type) {
    case "permission":
      return data.data.message || "工具需要权限才能执行";
    case "question":
      const firstQuestion =
        Array.isArray(data.data.questions) && data.data.questions.length > 0
          ? data.data.questions[0].question
          : "请回答问题";
      return firstQuestion;
    case "idle":
      return "AI 正在等待您的输入";
    default:
      return "";
  }
}

export async function CoStrictSystemNotifyPlugin(
  input: PluginInput,
): Promise<Hooks> {
  return {
    event: async (eventInput) => {
      await handleSessionCreated(eventInput);
      await handleNotificationEvent(eventInput);
    },
    "permission.ask": handlePermissionAsked,
  };
}
