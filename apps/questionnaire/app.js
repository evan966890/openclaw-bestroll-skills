import {
  createEmptyProfile,
  COMMUNICATION_STYLE_OPTIONS,
  REPLY_LENGTH_OPTIONS,
  FORMAT_OPTIONS,
  ANNOYANCE_OPTIONS,
  DECISION_FRAMEWORK_OPTIONS,
  KNOWLEDGE_INTEREST_OPTIONS,
  PUSH_MODE_OPTIONS,
  PUSH_FREQUENCY_OPTIONS,
  PUSH_TIME_OPTIONS,
  PUSH_COUNT_OPTIONS,
  CONTENT_LANGUAGE_OPTIONS,
} from "../../lib/profile-schema.mjs";
import { renderDocuments } from "../../lib/profile-renderer.mjs";

const STORAGE_KEY = "executive-profile-questionnaire";
const steps = [
  { title: "基础信息", hint: "姓名、称呼、岗位与业务语境" },
  { title: "沟通偏好", hint: "怎么说、说多长、说成什么样" },
  { title: "决策风格", hint: "常用框架与判断原则" },
  { title: "关键人物", hint: "高频协同对象与关系定位" },
  { title: "工作重点", hint: "今年 / 本季度最关心的 3-5 件事" },
  { title: "敏感事项", hint: "需要格外克制的话题边界" },
  { title: "知识偏好", hint: "兴趣方向与知识雷达推送模式" },
  { title: "预览导出", hint: "直接复制 USER.md / MEMORY.md / INTERESTS.md" },
];

const state = {
  profile: loadState(),
  currentStep: 0,
  previewTab: "USER.md",
  drafts: {
    priority: "",
  },
  errors: {},
  toast: "",
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyProfile();
    }
    const parsed = JSON.parse(raw);
    return {
      ...createEmptyProfile(),
      ...parsed,
      basic: { ...createEmptyProfile().basic, ...(parsed.basic ?? {}) },
      communication: { ...createEmptyProfile().communication, ...(parsed.communication ?? {}) },
      decision: { ...createEmptyProfile().decision, ...(parsed.decision ?? {}) },
      knowledge: { ...createEmptyProfile().knowledge, ...(parsed.knowledge ?? {}) },
      stakeholders: Array.isArray(parsed.stakeholders) && parsed.stakeholders.length
        ? parsed.stakeholders
        : createEmptyProfile().stakeholders,
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities : [],
    };
  } catch {
    return createEmptyProfile();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));
}

function text(value) {
  return String(value ?? "").trim();
}

function setField(path, value, options = { render: true }) {
  const keys = path.split(".");
  let target = state.profile;
  while (keys.length > 1) {
    target = target[keys.shift()];
  }
  target[keys[0]] = value;
  if (state.errors[path] && text(value)) {
    delete state.errors[path];
  }
  persist();
  if (options.render) {
    render();
  }
}

function toggleListValue(path, value) {
  const keys = path.split(".");
  let target = state.profile;
  while (keys.length > 1) {
    target = target[keys.shift()];
  }
  const list = Array.isArray(target[keys[0]]) ? [...target[keys[0]]] : [];
  if (list.includes(value)) {
    target[keys[0]] = list.filter((item) => item !== value);
  } else {
    target[keys[0]] = [...list, value];
  }
  persist();
  render();
}

function addPriority() {
  const value = state.drafts.priority.trim();
  if (!value) return;
  if (!state.profile.priorities.includes(value)) {
    state.profile.priorities.push(value);
    persist();
  }
  state.drafts.priority = "";
  render();
}

function removePriority(value) {
  state.profile.priorities = state.profile.priorities.filter((item) => item !== value);
  persist();
  render();
}

function addStakeholder() {
  state.profile.stakeholders.push({ name: "", role: "", note: "" });
  persist();
  render();
}

function removeStakeholder(index) {
  state.profile.stakeholders = state.profile.stakeholders.filter((_, itemIndex) => itemIndex !== index);
  if (!state.profile.stakeholders.length) {
    state.profile.stakeholders = [{ name: "", role: "", note: "" }];
  }
  persist();
  render();
}

function setStakeholder(index, key, value) {
  state.profile.stakeholders[index][key] = value;
  persist();
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    state.toast = "已复制到剪贴板";
    render();
    setTimeout(() => {
      state.toast = "";
      render();
    }, 1800);
  });
}

function field(label, path, placeholder = "", options = {}) {
  const value = path.split(".").reduce((acc, key) => acc?.[key], state.profile) ?? "";
  const error = state.errors[path];
  return `
    <label class="field ${error ? "has-error" : ""}">
      <div class="field-head">
        <span>${label}</span>
        ${options.required ? '<em class="required-pill">必填</em>' : ""}
      </div>
      ${options.hint ? `<div class="hint">${options.hint}</div>` : ""}
      ${options.multiline
        ? `<textarea data-field="${path}" placeholder="${placeholder}">${escapeHtml(value)}</textarea>`
        : `<input type="text" data-field="${path}" value="${escapeHtml(value)}" placeholder="${placeholder}" />`}
      ${error ? `<div class="error-text">${error}</div>` : ""}
    </label>
  `;
}

function choiceGroup(label, path, values, type = "radio", hint = "") {
  const current = path.split(".").reduce((acc, key) => acc?.[key], state.profile);
  return `
    <div class="fieldset">
      <strong>${label}</strong>
      ${hint ? `<div class="hint">${hint}</div>` : ""}
      <div class="choice-grid">
        ${values
          .map((value) => {
            const checked = type === "checkbox"
              ? Array.isArray(current) && current.includes(value)
              : current === value;
            return `
              <label class="choice">
                <input type="${type}" data-choice="${path}" value="${escapeHtml(value)}" ${checked ? "checked" : ""} />
                <span>${value}</span>
              </label>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderStepBody() {
  const docs = renderDocuments(state.profile);
  const showRadarFields = ["主动推送型", "混合型"].includes(state.profile.knowledge.pushMode);

  switch (state.currentStep) {
    case 0:
      return `
        <div class="grid cols-2">
          ${field("姓名", "basic.name", "请输入姓名", { required: true })}
          ${field("希望 AI 怎么称呼你", "basic.callName", "如：张总 / 三哥 / Sam", { required: true })}
          ${field("职位", "basic.title", "默认：总经理", { hint: "可跳过，默认值已预置为“总经理”" })}
          ${field("所在部门", "basic.department", "如：国际业务部")}
        </div>
        ${field("主要业务领域", "basic.industryFocus", "如：消费电子国际零售、IoT生态", {
          hint: "帮助 AI 理解你的业务语境",
        })}
      `;
    case 1:
      return `
        ${choiceGroup("2a 你希望 AI 怎么跟你说话？", "communication.style", COMMUNICATION_STYLE_OPTIONS)}
        ${choiceGroup("2b 默认回复长度", "communication.replyLength", REPLY_LENGTH_OPTIONS)}
        ${choiceGroup("2c 偏好的信息格式", "communication.formats", FORMAT_OPTIONS, "checkbox")}
        ${choiceGroup("2d 最让你反感的 AI 行为", "communication.annoyances", ANNOYANCE_OPTIONS, "checkbox")}
        ${field("还有其他讨厌的？", "communication.annoyancesOther", "可留空")}
        ${field("2e 语言偏好", "communication.language", "中文为主，专业术语保留 English")}
      `;
    case 2:
      return `
        ${choiceGroup("3a 你常用的思维框架", "decision.frameworks", DECISION_FRAMEWORK_OPTIONS, "checkbox")}
        ${field("3b 你的决策习惯或原则", "decision.habits", "如：先看最坏情况；大事不过夜；能量化的不拍脑袋", {
          multiline: true,
          hint: "帮助商业参谋学习你的判断模式",
        })}
      `;
    case 3:
      return `
        <div class="grid">
          ${state.profile.stakeholders
            .map(
              (row, index) => `
                <div class="row-card">
                  <div class="grid cols-2">
                    <label class="field">
                      <span>姓名 / 称呼</span>
                      <input type="text" data-stakeholder="${index}" data-key="name" value="${escapeHtml(row.name)}" placeholder="如：雷总" />
                    </label>
                    <label class="field">
                      <span>角色</span>
                      <input type="text" data-stakeholder="${index}" data-key="role" value="${escapeHtml(row.role)}" placeholder="如：董事长 / CFO / 助理" />
                    </label>
                  </div>
                  <label class="field">
                    <span>备注</span>
                    <input type="text" data-stakeholder="${index}" data-key="note" value="${escapeHtml(row.note)}" placeholder="可选" />
                  </label>
                  <button class="ghost" data-remove-stakeholder="${index}">删除这一行</button>
                </div>
              `,
            )
            .join("")}
          <button class="secondary" data-add-stakeholder>添加人物</button>
        </div>
      `;
    case 4:
      return `
        <div class="fieldset">
          <strong>当前最重要的事</strong>
          <div class="hint">你今年 / 本季度最关注的 3-5 个重点，AI 会以此为锚点排列优先级。</div>
          <div class="grid cols-2">
            <input id="priorityInput" type="text" value="${escapeHtml(state.drafts.priority)}" placeholder="输入后点“添加”" />
            <button class="secondary" data-add-priority>添加</button>
          </div>
          <div class="tags">
            ${state.profile.priorities.length
              ? state.profile.priorities.map((item) => `<span class="tag">${item}<button data-remove-priority="${escapeHtml(item)}">×</button></span>`).join("")
              : `<span class="hint">还没有添加重点，可跳过。</span>`}
          </div>
        </div>
      `;
    case 5:
      return field("敏感业务 / 合作 / 话题", "sensitivities", "如：与 XX 公司的合作谈判细节；未公开组织调整；某产品线裁撤计划", {
        multiline: true,
      });
    case 6:
      return `
        ${choiceGroup("7a 知识兴趣领域", "knowledge.interests", KNOWLEDGE_INTEREST_OPTIONS, "checkbox")}
        ${field("还有其他关注方向？", "knowledge.interestsOther", "可选")}
        ${choiceGroup("7b 知识管家希望多主动还是多被动？", "knowledge.pushMode", PUSH_MODE_OPTIONS)}
        ${showRadarFields ? choiceGroup("7c 推送频率", "knowledge.pushFrequency", PUSH_FREQUENCY_OPTIONS) : ""}
        ${showRadarFields ? choiceGroup("7d 推送时间偏好", "knowledge.pushTime", PUSH_TIME_OPTIONS) : ""}
        ${showRadarFields ? choiceGroup("7e 每次推送条数", "knowledge.pushCount", PUSH_COUNT_OPTIONS) : ""}
        ${choiceGroup("7f 信息语言偏好", "knowledge.contentLanguage", CONTENT_LANGUAGE_OPTIONS)}
        ${field("7g 阅读 / 学习习惯", "knowledge.studyHabits", "如：通勤时听播客；每周读 1-2 本书；偏好英文原版", {
          multiline: true,
        })}
      `;
    case 7: {
      const tabs = [
        { id: "USER.md", label: "USER.md", content: docs.user },
        { id: "MEMORY.md", label: "MEMORY.md", content: docs.memory },
        ...(docs.radar ? [{ id: "radar/INTERESTS.md", label: "radar/INTERESTS.md", content: docs.radar }] : []),
      ];
      const currentTab = tabs.find((tab) => tab.id === state.previewTab) ?? tabs[0];
      state.previewTab = currentTab.id;
      return `
        <div class="preview-tabs">
          ${tabs
            .map((tab) => `<button class="tab ${tab.id === currentTab.id ? "active" : ""}" data-tab="${tab.id}">${tab.label}</button>`)
            .join("")}
        </div>
        <div class="status">问卷数据实时映射为 Markdown，可直接复制。</div>
        <div class="code-shell">
          <div class="code-head">
            <strong>${currentTab.label}</strong>
            <button class="secondary" data-copy="${currentTab.id}">复制</button>
          </div>
          <pre>${escapeHtml(currentTab.content)}</pre>
        </div>
      `;
    }
    default:
      return "";
  }
}

function validateCurrentStep() {
  if (state.currentStep !== 0) {
    state.errors = {};
    return true;
  }

  const nextErrors = {};
  if (!text(state.profile.basic.name)) {
    nextErrors["basic.name"] = "姓名必填";
  }
  if (!text(state.profile.basic.callName)) {
    nextErrors["basic.callName"] = "称呼必填";
  }
  state.errors = nextErrors;

  if (Object.keys(nextErrors).length) {
    state.toast = "请先补全姓名和称呼";
    setTimeout(() => {
      if (state.toast === "请先补全姓名和称呼") {
        state.toast = "";
        render();
      }
    }, 1800);
    return false;
  }

  return true;
}

function focusFirstError() {
  const firstPath = Object.keys(state.errors)[0];
  if (!firstPath) return;
  requestAnimationFrame(() => {
    document.querySelector(`[data-field="${firstPath}"]`)?.focus();
  });
}

function render() {
  const root = document.querySelector("#app");
  const current = steps[state.currentStep];
  const progress = ((state.currentStep + 1) / steps.length) * 100;
  root.innerHTML = `
    <div class="shell">
      <section class="hero">
        <div class="eyebrow">Executive Onboarding</div>
        <h1>高管画像初始化问卷</h1>
        <p>用 8 组以内问题收集高管画像，最后自动生成 4 个 Agent 共用的 <code>USER.md</code>、<code>MEMORY.md</code>，以及可选的 <code>radar/INTERESTS.md</code>。</p>
      </section>
      <div class="layout">
        <aside class="sidebar">
          <div class="progress-head">
            <strong>进度</strong>
            <span>${state.currentStep + 1} / ${steps.length}</span>
          </div>
          <div class="bar"><div style="width:${progress}%"></div></div>
          <div class="step-list">
            ${steps
              .map(
                (step, index) => `
                  <div class="step-item ${index === state.currentStep ? "active" : ""}">
                    <div>第 ${index + 1} 组 · ${step.title}</div>
                    <small>${step.hint}</small>
                  </div>
                `,
              )
              .join("")}
          </div>
        </aside>
        <main class="panel">
          <div class="panel-head">
            <h2>第 ${state.currentStep + 1} 组 · ${current.title}</h2>
            <p>${current.hint}</p>
          </div>
          <div class="panel-body">${renderStepBody()}</div>
          <div class="actions">
            <button class="secondary" data-nav="prev" ${state.currentStep === 0 ? "disabled" : ""}>上一步</button>
            <div class="actions-right">
              <button class="secondary" data-reset>清空</button>
              <button class="primary" data-nav="next">${state.currentStep === steps.length - 1 ? "停留在预览" : "下一步"}</button>
            </div>
          </div>
        </main>
      </div>
    </div>
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-field]")) {
    setField(target.dataset.field, target.value, { render: false });
    return;
  }
  if (target.id === "priorityInput") {
    state.drafts.priority = target.value;
  }
  if (target.matches("[data-stakeholder]")) {
    setStakeholder(Number(target.dataset.stakeholder), target.dataset.key, target.value);
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!target.matches("[data-choice]")) return;
  const path = target.dataset.choice;
  if (target.type === "checkbox") {
    toggleListValue(path, target.value);
  } else {
    setField(path, target.value);
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset.nav === "prev") {
    state.currentStep = Math.max(0, state.currentStep - 1);
    render();
    return;
  }
  if (target.dataset.nav === "next") {
    if (!validateCurrentStep()) {
      render();
      focusFirstError();
      return;
    }
    state.currentStep = Math.min(steps.length - 1, state.currentStep + 1);
    render();
    return;
  }
  if (target.dataset.addPriority !== undefined) {
    addPriority();
    return;
  }
  if (target.dataset.removePriority) {
    removePriority(target.dataset.removePriority);
    return;
  }
  if (target.dataset.addStakeholder !== undefined) {
    addStakeholder();
    return;
  }
  if (target.dataset.removeStakeholder !== undefined) {
    removeStakeholder(Number(target.dataset.removeStakeholder));
    return;
  }
  if (target.dataset.tab) {
    state.previewTab = target.dataset.tab;
    render();
    return;
  }
  if (target.dataset.copy) {
    const docs = renderDocuments(state.profile);
    const map = {
      "USER.md": docs.user,
      "MEMORY.md": docs.memory,
      "radar/INTERESTS.md": docs.radar,
    };
    copyText(map[target.dataset.copy] || "");
    return;
  }
  if (target.dataset.reset !== undefined) {
    state.profile = createEmptyProfile();
    state.currentStep = 0;
    state.previewTab = "USER.md";
    state.drafts.priority = "";
    state.errors = {};
    persist();
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target?.id === "priorityInput") {
    event.preventDefault();
    addPriority();
  }
});

render();
