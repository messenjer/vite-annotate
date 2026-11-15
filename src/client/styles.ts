// Lives in the overlay's shadow root: the host app's styles never reach it, and it never reaches them.
export const STYLES = /* css */ `
:host {
  all: initial;
  --accent: #e5484d;
  --accent-soft: rgb(229 72 77 / 0.12);
  --bg: #ffffff;
  --fg: #1c2024;
  --muted: #60646c;
  --line: #e0e1e6;
  --done: #30a46c;
  --shadow: 0 12px 32px rgb(0 0 0 / 0.16), 0 2px 6px rgb(0 0 0 / 0.08);
  font: 13px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--fg);
}
@media (prefers-color-scheme: dark) {
  :host {
    --bg: #18191b;
    --fg: #edeef0;
    --muted: #b0b4ba;
    --line: #2e3135;
    --shadow: 0 12px 32px rgb(0 0 0 / 0.5);
  }
}
* { box-sizing: border-box; }
/* Above everything, including modal dialogs; only the controls take the pointer. */
.layer { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; }
.layer > .interactive, .pin, .toggle { pointer-events: auto; }

.outline, .picked {
  position: fixed; border: 2px dashed var(--accent); border-radius: 4px;
  background: var(--accent-soft); pointer-events: none;
}
.picked { border-style: solid; background: transparent; }
.outline-label {
  position: absolute; left: -2px; bottom: 100%; margin-bottom: 4px; padding: 1px 6px;
  border-radius: 4px; background: var(--accent); color: #fff; font: 11px/1.6 ui-monospace, monospace;
  white-space: nowrap;
}

.pin {
  position: fixed; width: 22px; height: 22px; margin: -11px 0 0 -11px; border: 2px solid #fff;
  border-radius: 50%; background: var(--accent); color: #fff; font-weight: 600; font-size: 11px;
  cursor: pointer; box-shadow: var(--shadow); padding: 0;
}

.toggle {
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; display: flex; align-items: center;
  gap: 6px; height: 36px; padding: 0 12px; border: 1px solid var(--line); border-radius: 18px;
  background: var(--bg); color: var(--fg); box-shadow: var(--shadow); cursor: pointer; font: inherit;
}
.toggle[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
.count {
  min-width: 18px; padding: 0 5px; border-radius: 9px; background: var(--accent); color: #fff;
  font-size: 11px; font-weight: 600; line-height: 18px; text-align: center;
}
.toggle[aria-pressed="true"] .count { background: #fff; color: var(--accent); }

.panel {
  position: fixed; right: 16px; bottom: 64px; width: 340px; max-height: min(70vh, 640px);
  display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line);
  border-radius: 12px; background: var(--bg); box-shadow: var(--shadow);
}
@media (max-width: 480px) { .panel { left: 8px; right: 8px; width: auto; } }
header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--line); }
header strong { font-size: 13px; }
.hint { color: var(--muted); font-size: 12px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

form { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--line); }
textarea, input {
  width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: transparent;
  color: inherit; font: inherit; resize: vertical;
}
textarea { min-height: 72px; }
textarea:focus, input:focus { outline: 2px solid var(--accent); outline-offset: -1px; border-color: transparent; }
.row { display: flex; justify-content: flex-end; gap: 6px; }

button.btn {
  height: 28px; padding: 0 10px; border: 1px solid var(--line); border-radius: 6px; background: transparent;
  color: inherit; font: inherit; cursor: pointer;
}
button.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
button.btn:disabled { opacity: 0.5; cursor: default; }
button.icon { width: 28px; padding: 0; border: none; background: transparent; color: var(--muted); cursor: pointer; border-radius: 6px; font-size: 14px; }
button.icon:hover { background: var(--accent-soft); color: var(--fg); }

ol { list-style: none; margin: 0; padding: 0; overflow-y: auto; }
li { display: flex; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--line); }
li:last-child { border-bottom: none; }
li.editing { background: var(--accent-soft); }
.num {
  flex: none; width: 20px; height: 20px; margin-top: 1px; border-radius: 50%; background: var(--line);
  color: var(--muted); font-size: 11px; font-weight: 600; line-height: 20px; text-align: center;
}
.num.on-screen { background: var(--accent); color: #fff; }
.num.done { background: var(--done); color: #fff; }
.body { flex: 1; min-width: 0; }
.note { white-space: pre-wrap; overflow-wrap: anywhere; }
.reply { margin-top: 6px; padding: 6px 8px; border-left: 3px solid var(--done); border-radius: 4px; background: rgb(48 164 108 / 0.08); white-space: pre-wrap; }
.actions { display: flex; align-items: flex-start; }
.empty { padding: 16px 14px; color: var(--muted); }
footer { padding: 10px 14px; border-top: 1px solid var(--line); }
footer .btn { width: 100%; }
`
