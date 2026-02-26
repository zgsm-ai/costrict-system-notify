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

export async function CoStrictSystemNotifyPlugin(input) {
  if (notifierInstance) {
    notifierInstance = null;
  }

  return {
    "intervention.required": async (input, output) => {
      const { type, data } = input;

      let title = "CoStrict";
      let message = "";
      let sound = true;
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
          sound = false;
          break;
      }

      const notifier = await loadNotifier();
      if (!notifier) {
        output.handled = false;
        return;
      }

      try {
        notifier.notify({
          title,
          message,
          sound,
          timeout,
          icon: "nothing",
          appID: "CoStrict",
          wait: false,
        });
        output.handled = true;
      } catch {
        output.handled = false;
      }
    },
  };
}
