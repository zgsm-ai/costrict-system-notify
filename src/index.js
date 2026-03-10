let notifierInstance = null;

async function loadNotifier() {
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

class SystemNotifier {
  async notify(title, message, options = {}) {
    const notifier = await loadNotifier();
    if (!notifier) {
      throw new Error("System notifier not available");
    }

    return new Promise((resolve, reject) => {
      notifier.notify(
        {
          title,
          message,
          timeout: options.timeout || 5,
          icon: "nothing",
          appID: "CoStrict",
          wait: false,
        },
        (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

class BarkNotifier {
  constructor() {
    this.url = process.env.BARK_URL;
  }

  async notify(title, message, options = {}) {
    if (!this.url) {
      throw new Error("Bark URL not configured");
    }

    let url = `${this.url}/${encodeURIComponent(title)}/${encodeURIComponent(message)}`;
    const params = {};

    if (options.timeout) {
      params.timeout = options.timeout;
    }

    if (Object.keys(params).length > 0) {
      url += '?' + new URLSearchParams(params).toString();
    }

    await fetch(url);
  }
}

class WecomNotifier {
  constructor() {
    const webhookUrl = process.env.WECOM_WEBHOOK_URL;
    const webhookKey = process.env.WECOM_WEBHOOK_KEY;
    
    if (webhookUrl) {
      this.webhookUrl = webhookUrl;
    } else if (webhookKey) {
      this.webhookUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${webhookKey}`;
    } else {
      this.webhookUrl = null;
    }
  }

  async notify(title, message, options = {}) {
    if (!this.webhookUrl) {
      throw new Error("Wecom webhook URL or KEY not configured");
    }

    const content = `${title}\n${message}`;
    
    await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msgtype: "text",
        text: {
          content: content,
        },
      }),
    });
  }
}

async function sendNotification(title, message, options = {}) {
  const enableSystem = process.env.NOTIFY_ENABLE_SYSTEM === "true";
  const enableBark = process.env.NOTIFY_ENABLE_BARK === "true";
  const enableWecom = process.env.NOTIFY_ENABLE_WECOM === "true";

  const results = [];

  if (enableSystem) {
    try {
      const systemNotifier = new SystemNotifier();
      await systemNotifier.notify(title, message, options);
      results.push({ type: "system", success: true });
    } catch (error) {
      results.push({ type: "system", success: false, error: error.message });
    }
  }

  if (enableBark) {
    try {
      const barkNotifier = new BarkNotifier();
      await barkNotifier.notify(title, message, options);
      results.push({ type: "bark", success: true });
    } catch (error) {
      results.push({ type: "bark", success: false, error: error.message });
    }
  }

  if (enableWecom) {
    try {
      const wecomNotifier = new WecomNotifier();
      await wecomNotifier.notify(title, message, options);
      results.push({ type: "wecom", success: true });
    } catch (error) {
      results.push({ type: "wecom", success: false, error: error.message });
    }
  }

  const hasSuccess = results.some((r) => r.success);
  return hasSuccess;
}

export async function CoStrictSystemNotifyPlugin(ctx) {
  if (notifierInstance) {
    notifierInstance = null;
  }

  const { client } = ctx;

  return {
    "intervention.required": async (input, output) => {
      const { type, data, sessionID } = input;

      let title = "CoStrict";
      let message = "";
      let timeout = 5;

      let sessionTitle = "任务";
      let userMessage = "";
      let latestMessage = "";

      if (sessionID && client?.session) {
        try {
          const session = await client.session.get({ path: { id: sessionID } });
          if (session?.data?.title) {
            sessionTitle = session.data.title.length > 50 ? session.data.title.slice(0, 50) + "..." : session.data.title;
          }

          const result = await client.session.messages({ path: { id: sessionID }, query: { limit: 10 } });
          const data = result.data ?? [];
          const lastUserMsg = data.findLast(m => m.info?.role === "user");
          if (lastUserMsg?.parts) {
            const textPart = lastUserMsg.parts.find(p => p.type === "text");
            if (textPart?.text) {
              userMessage = textPart.text.length > 100 ? textPart.text.slice(0, 100) + "..." : textPart.text;
            }
          }
          const latestNonUserMsg = data.findLast(m => m.info?.role !== "user");
          if (latestNonUserMsg?.parts) {
            const textPart = latestNonUserMsg.parts.find(p => p.type === "text");
            if (textPart?.text) {
              latestMessage = textPart.text.length > 100 ? textPart.text.slice(0, 100) + "..." : textPart.text;
            }
          }
        } catch (err) {
          console.error("Failed to get session messages:", err);
        }
      }

      let formattedMessage = "";

      switch (type) {
        case "permission":
          title = "需要权限";
          const permission = data.permission || "";
          const pattern = Array.isArray(data.patterns) && data.patterns.length > 0 ? data.patterns[0] : "";
          const permissionMessage = permission ? `[${permission}] ${pattern}` : (pattern || "工具需要权限才能执行");
          formattedMessage = [
            `会话标题：${sessionTitle}`,
            `权限请求：${permissionMessage}`
          ].join("\n");
          break;

        case "question":
          title = "问题";
          const firstQuestion =
            Array.isArray(data.questions) && data.questions.length > 0
              ? data.questions[0].question
              : "请回答问题";
          formattedMessage = [
            `会话标题：${sessionTitle}`,
            `待回答问题：${firstQuestion}`
          ].join("\n");
          break;

        case "idle":
          title = "会话空闲";
          formattedMessage = [
            `会话标题：${sessionTitle}`,
            userMessage ? `用户上一条提问内容：${userMessage}` : "用户上一条提问内容：（无）",
            latestMessage ? `最新一条消息：${latestMessage}` : "最新一条消息：（无）"
          ].join("\n");
          break;
      }

      try {
        const success = await sendNotification(title, formattedMessage, { timeout });
        output.handled = success;
      } catch {
        output.handled = false;
      }
    },
  };
}
