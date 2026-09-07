<script setup>
import { nextTick, ref } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Write your message...' }
});
const emit = defineEmits(['update:modelValue']);

const editor = ref(null);
const emojiPickerVisible = ref(false);
const emojis = ['😀', '😊', '👋', '💪', '🏋️', '🎯', '🔥', '⭐', '✅', '📅', '⏰', '🎉', '🙏', '💳', '📣', '❤️'];

function update(event) {
  emit('update:modelValue', event.target.value);
}

async function replaceSelection(text, selectionOffset = text.length) {
  const element = editor.value;
  if (!element) return;
  const start = element.selectionStart;
  const end = element.selectionEnd;
  emit('update:modelValue', `${props.modelValue.slice(0, start)}${text}${props.modelValue.slice(end)}`);
  await nextTick();
  element.focus();
  element.setSelectionRange(start + selectionOffset, start + selectionOffset);
}

async function formatSelection(marker) {
  const element = editor.value;
  if (!element) return;
  const start = element.selectionStart;
  const end = element.selectionEnd;
  const selected = props.modelValue.slice(start, end);
  const replacement = `${marker}${selected}${marker}`;
  emit('update:modelValue', `${props.modelValue.slice(0, start)}${replacement}${props.modelValue.slice(end)}`);
  await nextTick();
  element.focus();
  if (selected) element.setSelectionRange(start + replacement.length, start + replacement.length);
  else element.setSelectionRange(start + marker.length, start + marker.length);
}

async function formatList() {
  const element = editor.value;
  if (!element) return;
  const start = element.selectionStart;
  const end = element.selectionEnd;
  const selected = props.modelValue.slice(start, end) || 'List item';
  const replacement = selected.split('\n').map((line) => `• ${line}`).join('\n');
  emit('update:modelValue', `${props.modelValue.slice(0, start)}${replacement}${props.modelValue.slice(end)}`);
  await nextTick();
  element.focus();
  element.setSelectionRange(start, start + replacement.length);
}

function insertEmoji(emoji) {
  replaceSelection(emoji);
  emojiPickerVisible.value = false;
}

function insertVariable(variable) {
  replaceSelection(`{{${variable}}}`);
}

defineExpose({ insertVariable });
</script>

<template>
  <div class="message-editor">
    <div class="message-editor__toolbar" role="toolbar" aria-label="Message formatting">
      <button type="button" aria-label="Bold" title="Bold" @click="formatSelection('*')"><strong>B</strong></button>
      <button type="button" aria-label="Italic" title="Italic" @click="formatSelection('_')"><em>I</em></button>
      <button type="button" aria-label="Strikethrough" title="Strikethrough" @click="formatSelection('~')"><s>S</s></button>
      <button type="button" aria-label="Monospace" title="Monospace" @click="formatSelection('```')"><i class="pi pi-code" /></button>
      <span class="message-editor__divider" />
      <button type="button" aria-label="Bulleted list" title="Bulleted list" @click="formatList"><i class="pi pi-list" /></button>
      <div class="message-editor__emoji-wrap">
        <button type="button" aria-label="Insert emoji" title="Insert emoji" :aria-expanded="emojiPickerVisible" @click="emojiPickerVisible = !emojiPickerVisible">😊</button>
        <div v-if="emojiPickerVisible" class="message-editor__emoji-picker" aria-label="Choose an emoji">
          <button v-for="emoji in emojis" :key="emoji" type="button" :aria-label="`Insert ${emoji}`" @click="insertEmoji(emoji)">{{ emoji }}</button>
        </div>
      </div>
      <span class="message-editor__hint">WhatsApp formatting</span>
    </div>
    <textarea
      ref="editor"
      :value="modelValue"
      :placeholder="placeholder"
      rows="9"
      class="message-editor__input p-inputtextarea p-inputtext p-component"
      @input="update"
    />
  </div>
</template>

<style scoped>
.message-editor { overflow: visible; border: 1px solid #d8dce5; border-radius: 9px; background: #fff; transition: border-color 180ms ease, box-shadow 180ms ease; }
.message-editor:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 110, 247, .12); }
.message-editor__toolbar { position: relative; min-height: 44px; display: flex; align-items: center; gap: 3px; padding: 5px 8px; border-bottom: 1px solid var(--border-soft); background: #f8f9f7; border-radius: 9px 9px 0 0; }
.message-editor__toolbar > button, .message-editor__emoji-wrap > button { width: 32px; height: 32px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--text-primary); cursor: pointer; transition: background 160ms ease, color 160ms ease; }
.message-editor__toolbar button:hover, .message-editor__toolbar button:focus-visible { outline: none; color: var(--primary); background: #e9edff; }
.message-editor__divider { width: 1px; height: 22px; margin: 0 4px; background: var(--border-soft); }
.message-editor__hint { margin-left: auto; color: var(--text-muted); font-size: .7rem; }
.message-editor__input { width: 100%; min-height: 190px; display: block; resize: vertical; padding: 14px; border: 0; border-radius: 0 0 9px 9px; box-shadow: none; line-height: 1.55; }
.message-editor__input:focus { outline: none; box-shadow: none; }
.message-editor__emoji-wrap { position: relative; }
.message-editor__emoji-picker { position: absolute; z-index: 5; top: 38px; left: 0; width: 220px; display: grid; grid-template-columns: repeat(8, 1fr); gap: 3px; padding: 9px; border: 1px solid var(--border-soft); border-radius: 9px; background: #fff; box-shadow: 0 12px 28px rgba(16, 31, 72, .16); }
.message-editor__emoji-picker button { width: 24px; height: 28px; padding: 0; border: 0; border-radius: 5px; background: transparent; font-size: 1rem; cursor: pointer; }
.message-editor__emoji-picker button:hover { background: var(--tint-violet); }
@media (max-width: 520px) { .message-editor__hint { display: none; }.message-editor__emoji-picker { left: -75px; } }
</style>