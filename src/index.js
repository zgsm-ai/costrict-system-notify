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

    const axios = (await import("axios")).default;

    let url = `${this.url}/${encodeURIComponent(title)}/${encodeURIComponent(message)}`;
    const params = {};

    if (options.timeout) {
      params.timeout = options.timeout;
    }

    await axios.get(url, { params });
  }
}

async function sendNotification(title, message, options = {}) {
  const enableSystem = process.env.NOTIFY_ENABLE_SYSTEM !== "false";
  const enableBark = process.env.NOTIFY_ENABLE_BARK === "true";

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

  const hasSuccess = results.some((r) => r.success);
  return hasSuccess;
}

export async function CoStrictSystemNotifyPlugin(input) {
  if (notifierInstance) {
    notifierInstance = null;
  }

  return {
    "intervention.required": async (input, output) => {
      const { type, data } = input;

      let title = "CoStrict";
      let message = "";
      let timeout = 5;

      switch (type) {
        case "permission":
          title = "需要权限";
          message = data.message || "工具需要权限才能执行";
          break;

        case "question":
          title = "问题";
          const firstQuestion =
            Array.isArray(data.questions) && data.questions.length > 0
              ? data.questions[0].question
              : "请回答问题";
          message = firstQuestion;
          break;

        case "idle":
          title = "会话空闲";
          message = "AI 正在等待您的输入";
          break;
      }

      try {
        const success = await sendNotification(title, message, { timeout });
        output.handled = success;
      } catch {
        output.handled = false;
      }
    },
  };
}
