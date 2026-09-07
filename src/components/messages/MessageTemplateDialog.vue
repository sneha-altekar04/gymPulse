<script setup>
import { reactive, ref, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';

import MessageRichTextEditor from './MessageRichTextEditor.vue';
import { MESSAGE_CHANNEL, MESSAGE_TYPE, TEMPLATE_VARIABLES } from '../../constants/domain';

const props = defineProps({
  visible: { type: Boolean, default: false },
  template: { type: Object, default: null }
});
const emit = defineEmits(['update:visible', 'save']);
const form = reactive({ name: '', channel: MESSAGE_CHANNEL.WHATSAPP, type: MESSAGE_TYPE.GENERAL_ANNOUNCEMENT, content: '', active: true });
const typeOptions = Object.values(MESSAGE_TYPE);
const richEditor = ref(null);

watch(() => props.visible, (visible) => {
  if (!visible) return;
  Object.assign(form, {
    name: props.template?.name || '',
    channel: props.template?.channel || MESSAGE_CHANNEL.WHATSAPP,
    type: props.template?.type || MESSAGE_TYPE.GENERAL_ANNOUNCEMENT,
    content: props.template?.content || '',
    active: props.template?.active ?? true
  });
});

function save() {
  if (!form.name.trim() || !form.content.trim()) return;
  const variables = TEMPLATE_VARIABLES.filter((name) => form.content.includes(`{{${name}}}`));
  emit('save', { ...form, name: form.name.trim(), content: form.content.trim(), variables });
}

function placeholderLabel(variable) {
  return `{{${variable}}}`;
}

function insertVariable(variable) {
  richEditor.value?.insertVariable(variable);
}
</script>

<template>
  <Dialog :visible="visible" modal :header="template ? 'Edit Template' : 'Create Template'" :style="{ width: 'min(760px, 95vw)' }" @update:visible="emit('update:visible', $event)">
    <div class="stack-16">
      <div class="app-form-grid app-form-grid--two">
        <label class="app-field"><span>Template Name</span><InputText v-model="form.name" /></label>
        <label class="app-field"><span>Message Type</span><Dropdown v-model="form.type" :options="typeOptions" /></label>
        <label class="app-field"><span>Channel</span><Dropdown v-model="form.channel" :options="[MESSAGE_CHANNEL.WHATSAPP]" disabled /></label>
        <label class="app-field app-field--switch"><span>Active</span><InputSwitch v-model="form.active" /></label>
        <label class="app-field app-field--full"><span>Template Content</span><MessageRichTextEditor ref="richEditor" v-model="form.content" /></label>
      </div>
      <div class="template-variables"><span>Insert variable</span><button v-for="variable in TEMPLATE_VARIABLES" :key="variable" type="button" @click="insertVariable(variable)">{{ placeholderLabel(variable) }}</button></div>
      <div class="form-actions">
        <Button label="Cancel" severity="secondary" outlined @click="emit('update:visible', false)" />
        <Button label="Save Template" icon="pi pi-check" :disabled="!form.name.trim() || !form.content.trim()" @click="save" />
      </div>
    </div>
  </Dialog>
</template>