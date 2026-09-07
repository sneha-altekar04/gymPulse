<script setup>
import { computed, reactive, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

import { DURATION_UNIT, PLAN_STATUS } from '../../constants/domain';

const props = defineProps({ visible: Boolean, plan: { type: Object, default: null } });
const emit = defineEmits(['update:visible', 'save']);
const form = reactive({ name: '', duration: 1, durationUnit: DURATION_UNIT.MONTH, price: null, description: '', status: PLAN_STATUS.ACTIVE });
const durationUnits = Object.values(DURATION_UNIT);
const valid = computed(() => !!form.name.trim() && Number(form.duration) > 0 && !!form.durationUnit && Number(form.price) > 0 && !!form.status);

watch(() => props.visible, (visible) => {
  if (visible) Object.assign(form, { name: '', duration: 1, durationUnit: DURATION_UNIT.MONTH, price: null, description: '', status: PLAN_STATUS.ACTIVE }, props.plan || {});
});

function save() {
  if (!valid.value) return;
  emit('save', { ...form, duration: Number(form.duration), price: Number(form.price) });
}
</script>

<template>
  <Dialog :visible="visible" modal :header="plan ? 'Edit Personal Training Plan' : 'Create Personal Training Plan'" :style="{ width: 'min(680px, 95vw)' }" @update:visible="emit('update:visible', $event)">
    <div class="stack-16">
      <div class="app-form-grid app-form-grid--two">
        <label class="app-field app-field--full"><span>Plan Name</span><InputText v-model="form.name" /></label>
        <label class="app-field"><span>Duration</span><InputNumber v-model="form.duration" :min="1" /></label>
        <label class="app-field"><span>Duration Unit</span><Dropdown v-model="form.durationUnit" :options="durationUnits" /></label>
        <label class="app-field"><span>Price</span><InputNumber v-model="form.price" :min="0" mode="currency" currency="INR" locale="en-IN" placeholder="Enter price" /></label>
        <label class="app-field"><span>Status</span><Dropdown v-model="form.status" :options="Object.values(PLAN_STATUS)" /></label>
        <label class="app-field app-field--full"><span>Description (optional)</span><Textarea v-model="form.description" rows="3" auto-resize /></label>
      </div>
      <div class="form-actions"><Button label="Cancel" severity="secondary" outlined @click="emit('update:visible', false)" /><Button label="Save Plan" :disabled="!valid" @click="save" /></div>
    </div>
  </Dialog>
</template>