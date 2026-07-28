<script setup>
import { computed, reactive, ref } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';

import PageHeader from '../components/common/PageHeader.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { DURATION_UNITS } from '../constants/domain';
import { useGymStore } from '../stores/gymStore';
import { formatCurrency } from '../utils/formatters';

const gymStore = useGymStore();
const toast = useToast();

const dialogVisible = ref(false);
const editingPlanId = ref('');

const form = reactive({
  name: '',
  price: 0,
  duration: 30,
  durationUnit: 'Days',
  description: '',
  active: true
});

const errors = reactive({});

const plans = computed(() =>
  gymStore.membershipPlans.map((plan) => {
    const activeMembers = gymStore.membersDetailed.filter(
      (member) => member.latestMembership?.planId === plan.id && member.membershipStatus !== 'EXPIRED'
    ).length;

    return {
      ...plan,
      activeMembers
    };
  })
);

function openCreate() {
  editingPlanId.value = '';
  Object.assign(form, {
    name: '',
    price: 0,
    duration: 30,
    durationUnit: 'Days',
    description: '',
    active: true
  });
  dialogVisible.value = true;
}

function openEdit(plan) {
  editingPlanId.value = plan.id;
  Object.assign(form, {
    name: plan.name,
    price: plan.price,
    duration: plan.duration,
    durationUnit: plan.durationUnit,
    description: plan.description,
    active: plan.active
  });
  dialogVisible.value = true;
}

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key]);

  if (!form.name.trim()) {
    errors.name = 'Plan name is required.';
  }

  if (Number(form.price) <= 0) {
    errors.price = 'Price must be greater than 0.';
  }

  if (Number(form.duration) <= 0) {
    errors.duration = 'Duration must be greater than 0.';
  }

  return Object.keys(errors).length === 0;
}

function savePlan() {
  if (!validate()) {
    return;
  }

  if (editingPlanId.value) {
    gymStore.updatePlan(editingPlanId.value, form);
    toast.add({ severity: 'success', summary: 'Plan updated', life: 2400 });
  } else {
    gymStore.createPlan(form);
    toast.add({ severity: 'success', summary: 'Plan created', life: 2400 });
  }

  dialogVisible.value = false;
}

function togglePlan(planId) {
  gymStore.togglePlanActive(planId);
}
</script>

<template>
  <section class="stack-16">
    <PageHeader title="Membership Plans" subtitle="Create and maintain membership plan offerings">
      <template #actions>
        <Button label="Create Plan" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="plan-grid">
      <article v-for="plan in plans" :key="plan.id" class="panel-card stack-16">
        <div class="plan-card-head">
          <div>
            <h3>{{ plan.name }}</h3>
            <p>{{ plan.description }}</p>
          </div>
          <StatusBadge :status="plan.active ? 'ACTIVE' : 'INACTIVE'" />
        </div>

        <div class="plan-card-values">
          <p>{{ formatCurrency(plan.price) }}</p>
          <span>{{ plan.duration }} {{ plan.durationUnit }}</span>
          <span>{{ plan.activeMembers }} active members</span>
        </div>

        <div class="table-actions">
          <Button label="Edit" text icon="pi pi-pencil" @click="openEdit(plan)" />
          <Button
            :label="plan.active ? 'Deactivate' : 'Activate'"
            text
            :icon="plan.active ? 'pi pi-eye-slash' : 'pi pi-check'"
            @click="togglePlan(plan.id)"
          />
        </div>
      </article>
    </div>

    <Dialog
      :visible="dialogVisible"
      modal
      :header="editingPlanId ? 'Edit Membership Plan' : 'Create Membership Plan'"
      :style="{ width: 'min(620px, 95vw)' }"
      @update:visible="dialogVisible = $event"
    >
      <div class="stack-16">
        <div class="app-form-grid app-form-grid--two">
          <label class="app-field">
            <span>Plan Name</span>
            <InputText v-model="form.name" :invalid="!!errors.name" />
            <small v-if="errors.name" class="app-error">{{ errors.name }}</small>
          </label>

          <label class="app-field">
            <span>Price</span>
            <InputNumber v-model="form.price" mode="currency" currency="INR" locale="en-IN" :min="0" />
            <small v-if="errors.price" class="app-error">{{ errors.price }}</small>
          </label>

          <label class="app-field">
            <span>Duration</span>
            <InputNumber v-model="form.duration" :min="1" />
            <small v-if="errors.duration" class="app-error">{{ errors.duration }}</small>
          </label>

          <label class="app-field">
            <span>Duration Unit</span>
            <Dropdown v-model="form.durationUnit" :options="DURATION_UNITS" />
          </label>

          <label class="app-field app-field--full">
            <span>Description</span>
            <Textarea v-model="form.description" rows="3" auto-resize />
          </label>

          <label class="app-field">
            <span>Status</span>
            <Dropdown
              v-model="form.active"
              :options="[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false }
              ]"
              option-label="label"
              option-value="value"
            />
          </label>
        </div>

        <div class="form-actions">
          <Button type="button" label="Cancel" severity="secondary" outlined @click="dialogVisible = false" />
          <Button type="button" :label="editingPlanId ? 'Save Changes' : 'Create Plan'" @click="savePlan" />
        </div>
      </div>
    </Dialog>
  </section>
</template>
