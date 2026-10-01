<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import PageHeader from '../components/common/PageHeader.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import PersonalTrainingPlanDialog from '../components/members/PersonalTrainingPlanDialog.vue';
import { useGymStore } from '../stores/gymStore';
import { formatCurrency } from '../utils/formatters';

const gymStore = useGymStore();
const toast = useToast();
const confirm = useConfirm();
const dialogVisible = ref(false);
const editingPlan = ref(null);

function openPlan(plan = null) {
  editingPlan.value = plan;
  dialogVisible.value = true;
}

async function savePlan(payload) {
  try {
    if (editingPlan.value) await gymStore.updatePtPlan(editingPlan.value.id, payload);
    else await gymStore.createPtPlan(payload);
    dialogVisible.value = false;
    toast.add({
      severity: 'success',
      summary: editingPlan.value ? 'PT plan updated' : 'PT plan created',
      detail: 'Personal Training pricing is ready for member registration.',
      life: 2800
    });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'PT plan not saved', detail: error.message, life: 4000 });
  }
}

function togglePlan(plan) {
  const activating = plan.status !== 'ACTIVE';
  confirm.require({
    header: activating ? 'Activate PT Plan' : 'Deactivate PT Plan',
    message: `${activating ? 'Activate' : 'Deactivate'} ${plan.name}? Historical subscriptions will remain unchanged.`,
    accept: async () => {
      try {
        await gymStore.togglePtPlanActive(plan.id);
        toast.add({
          severity: 'success',
          summary: activating ? 'PT plan activated' : 'PT plan deactivated',
          life: 2400
        });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'PT plan not updated', detail: error.message, life: 4000 });
      }
    }
  });
}
</script>

<template>
  <section class="stack-16">
    <PageHeader title="PT Plans" subtitle="Create and maintain Personal Training plans and pricing">
      <template #actions>
        <Button label="Create PT Plan" icon="pi pi-plus" @click="openPlan()" />
      </template>
    </PageHeader>

    <div class="panel-card stack-16">
      <div class="panel-card__header">
        <div>
          <p class="panel-card__eyebrow">Personal Training</p>
          <h3 class="panel-card__title">PT Plans and Pricing</h3>
        </div>
      </div>

      <div v-if="gymStore.personalTrainingPlans.length" class="app-table-wrap">
        <table class="app-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in gymStore.personalTrainingPlans" :key="plan.id">
              <td>{{ plan.name }}</td>
              <td>{{ plan.duration }} {{ plan.durationUnit }}</td>
              <td>{{ formatCurrency(plan.price) }}</td>
              <td>{{ plan.description || '--' }}</td>
              <td><StatusBadge :status="plan.status" /></td>
              <td class="table-actions">
                <Button icon="pi pi-pencil" text aria-label="Edit PT plan" title="Edit PT plan" @click="openPlan(plan)" />
                <Button
                  :icon="plan.status === 'ACTIVE' ? 'pi pi-ban' : 'pi pi-check-circle'"
                  text
                  :aria-label="plan.status === 'ACTIVE' ? 'Deactivate PT plan' : 'Activate PT plan'"
                  :title="plan.status === 'ACTIVE' ? 'Deactivate PT plan' : 'Activate PT plan'"
                  @click="togglePlan(plan)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="pt-plans-empty">
        <i class="pi pi-list" aria-hidden="true" />
        <h3>No PT plans configured</h3>
        <p>Add a duration-based plan to offer Personal Training during member registration.</p>
        <Button label="Create PT Plan" icon="pi pi-plus" @click="openPlan()" />
      </div>
    </div>

    <PersonalTrainingPlanDialog v-model:visible="dialogVisible" :plan="editingPlan" @save="savePlan" />
  </section>
</template>

<style scoped>
.pt-plans-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 44px 20px;
  text-align: center;
  color: var(--text-muted);
}

.pt-plans-empty > i {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 50%;
  background: var(--bg-card-soft);
  color: var(--primary);
  font-size: 1.25rem;
}

.pt-plans-empty h3,
.pt-plans-empty p {
  margin: 0;
}
</style>
