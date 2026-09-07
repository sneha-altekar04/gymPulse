<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

import MemberAvatar from '../components/common/MemberAvatar.vue';
import PageHeader from '../components/common/PageHeader.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { GENDER_OPTIONS } from '../constants/domain';
import { useGymStore } from '../stores/gymStore';
import { formatCurrency, formatDate } from '../utils/formatters';

const gymStore = useGymStore();
const router = useRouter();
const toast = useToast();

const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const selectedTrainer = ref(null);
const editingTrainerId = ref('');

const form = reactive({
  fullName: '',
  mobile: '',
  email: '',
  gender: 'Male',
  specialization: '',
  joiningDate: '',
  status: 'ACTIVE'
});

const errors = reactive({});

const trainersWithAssignments = computed(() => {
  return gymStore.trainers.map((trainer) => {
    const assignedMembers = gymStore.membersDetailed.filter((member) => member.trainerId === trainer.id);
    const personalTrainingMembers = gymStore.personalTrainingSubscriptionsDetailed.filter((subscription) => subscription.trainerId === trainer.id);
    const activePtMembers = personalTrainingMembers.filter((subscription) => subscription.status === 'ACTIVE');
    const expiredPtMembers = personalTrainingMembers.filter((subscription) => subscription.status === 'EXPIRED');
    const ptRevenue = gymStore.paymentsDetailed.filter((payment) => personalTrainingMembers.some((subscription) => subscription.id === payment.personalTrainingSubscriptionId)).reduce((sum, payment) => sum + Number(payment.personalTrainingAmount || 0), 0);

    return {
      ...trainer,
      assignedMembers,
      personalTrainingMembers,
      activePtMembers,
      expiredPtMembers,
      ptRevenue,
      upcomingPtExpiries: activePtMembers.filter((subscription) => subscription.daysRemaining >= 0 && subscription.daysRemaining <= 30).length
    };
  });
});

function openCreate() {
  editingTrainerId.value = '';
  Object.assign(form, {
    fullName: '',
    mobile: '',
    email: '',
    gender: 'Male',
    specialization: '',
    joiningDate: '',
    status: 'ACTIVE'
  });
  formDialogVisible.value = true;
}

function openEdit(trainer) {
  editingTrainerId.value = trainer.id;
  Object.assign(form, {
    fullName: trainer.fullName,
    mobile: trainer.mobile,
    email: trainer.email,
    gender: trainer.gender,
    specialization: trainer.specialization,
    joiningDate: trainer.joiningDate,
    status: trainer.status
  });
  formDialogVisible.value = true;
}

function openDetails(trainer) {
  selectedTrainer.value = trainer;
  detailDialogVisible.value = true;
}

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key]);

  if (!form.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }

  if (!/^\d{10}$/.test(form.mobile)) {
    errors.mobile = 'Enter a valid 10-digit mobile number.';
  }

  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.specialization.trim()) {
    errors.specialization = 'Specialization is required.';
  }

  if (!form.joiningDate) {
    errors.joiningDate = 'Joining date is required.';
  }

  return Object.keys(errors).length === 0;
}

function saveTrainer() {
  if (!validate()) {
    return;
  }

  if (editingTrainerId.value) {
    gymStore.updateTrainer(editingTrainerId.value, form);
    toast.add({ severity: 'success', summary: 'Trainer updated', life: 2400 });
  } else {
    gymStore.createTrainer(form);
    toast.add({ severity: 'success', summary: 'Trainer added', life: 2400 });
  }

  formDialogVisible.value = false;
}

function toggleStatus(trainer) {
  gymStore.toggleTrainerStatus(trainer.id);
}
</script>

<template>
  <section class="stack-16">
    <PageHeader title="Trainers" subtitle="Manage trainers and member assignments">
      <template #actions>
        <Button label="Add Trainer" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="panel-card">
      <div class="app-table-wrap">
        <table class="app-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Specialization</th>
              <th>Assigned Members</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trainer in trainersWithAssignments" :key="trainer.id">
              <td><MemberAvatar :name="trainer.fullName" /></td>
              <td>{{ trainer.fullName }}</td>
              <td>{{ trainer.mobile }}</td>
              <td>{{ trainer.specialization }}</td>
              <td>{{ trainer.assignedMembers.length }}</td>
              <td><StatusBadge :status="trainer.status" /></td>
              <td class="table-actions">
                <Button icon="pi pi-chart-line" text aria-label="View trainer activity report" title="View trainer activity report" @click="router.push({ path: '/reports', query: { report: 'TRAINER_MEMBER_ACTIVITY', trainerId: trainer.id } })" />
                <Button icon="pi pi-eye" text aria-label="View trainer details" title="View trainer details" @click="openDetails(trainer)" />
                <Button icon="pi pi-pencil" text aria-label="Edit trainer" title="Edit trainer" @click="openEdit(trainer)" />
                <Button
                  :icon="trainer.status === 'ACTIVE' ? 'pi pi-eye-slash' : 'pi pi-check'"
                  text
                  :aria-label="trainer.status === 'ACTIVE' ? 'Deactivate trainer' : 'Activate trainer'"
                  :title="trainer.status === 'ACTIVE' ? 'Deactivate trainer' : 'Activate trainer'"
                  @click="toggleStatus(trainer)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Dialog
      :visible="formDialogVisible"
      modal
      :header="editingTrainerId ? 'Edit Trainer' : 'Add Trainer'"
      :style="{ width: 'min(680px, 95vw)' }"
      @update:visible="formDialogVisible = $event"
    >
      <div class="stack-16">
        <div class="app-form-grid app-form-grid--two">
          <label class="app-field">
            <span>Photo</span>
            <InputText placeholder="Photo URL (optional for mock)" />
          </label>

          <label class="app-field">
            <span>Full Name</span>
            <InputText v-model="form.fullName" :invalid="!!errors.fullName" />
            <small v-if="errors.fullName" class="app-error">{{ errors.fullName }}</small>
          </label>

          <label class="app-field">
            <span>Mobile</span>
            <InputText v-model="form.mobile" maxlength="10" :invalid="!!errors.mobile" />
            <small v-if="errors.mobile" class="app-error">{{ errors.mobile }}</small>
          </label>

          <label class="app-field">
            <span>Email</span>
            <InputText v-model="form.email" :invalid="!!errors.email" />
            <small v-if="errors.email" class="app-error">{{ errors.email }}</small>
          </label>

          <label class="app-field">
            <span>Gender</span>
            <Dropdown v-model="form.gender" :options="GENDER_OPTIONS" />
          </label>

          <label class="app-field">
            <span>Specialization</span>
            <InputText v-model="form.specialization" :invalid="!!errors.specialization" />
            <small v-if="errors.specialization" class="app-error">{{ errors.specialization }}</small>
          </label>

          <label class="app-field">
            <span>Joining Date</span>
            <InputText v-model="form.joiningDate" placeholder="YYYY-MM-DD" :invalid="!!errors.joiningDate" />
            <small v-if="errors.joiningDate" class="app-error">{{ errors.joiningDate }}</small>
          </label>

          <label class="app-field">
            <span>Status</span>
            <Dropdown
              v-model="form.status"
              :options="[
                { label: 'ACTIVE', value: 'ACTIVE' },
                { label: 'INACTIVE', value: 'INACTIVE' }
              ]"
              option-label="label"
              option-value="value"
            />
          </label>
        </div>

        <div class="form-actions">
          <Button type="button" label="Cancel" severity="secondary" outlined @click="formDialogVisible = false" />
          <Button type="button" :label="editingTrainerId ? 'Save Changes' : 'Save Trainer'" @click="saveTrainer" />
        </div>
      </div>
    </Dialog>

    <Dialog
      :visible="detailDialogVisible"
      modal
      header="Trainer Details"
      :style="{ width: 'min(760px, 95vw)' }"
      @update:visible="detailDialogVisible = $event"
    >
      <div v-if="selectedTrainer" class="stack-16">
        <div class="member-profile-top__identity">
          <MemberAvatar :name="selectedTrainer.fullName" size="lg" />
          <div>
            <h3>{{ selectedTrainer.fullName }}</h3>
            <p>{{ selectedTrainer.mobile }} | {{ selectedTrainer.email }}</p>
            <StatusBadge :status="selectedTrainer.status" />
          </div>
        </div>

        <div class="overview-grid overview-grid--two">
          <div class="panel-card">
            <h4>Profile</h4>
            <p>Specialization: {{ selectedTrainer.specialization }}</p>
            <p>Joining Date: {{ formatDate(selectedTrainer.joiningDate) }}</p>
            <p>Gender: {{ selectedTrainer.gender }}</p>
          </div>
          <div class="panel-card">
            <h4>Assigned Members</h4>
            <div v-if="selectedTrainer.assignedMembers.length" class="assigned-list">
              <p v-for="member in selectedTrainer.assignedMembers" :key="member.id">
                {{ member.fullName }} - {{ member.membershipPlanName }} - {{ member.membershipStatus }}
              </p>
            </div>
            <p v-else>No assigned members.</p>
          </div>
        </div>
        <div class="module-summary-row">
          <article class="module-summary-card module-summary-card--violet"><p class="module-summary-card__label">PT Members</p><p class="module-summary-card__value">{{ selectedTrainer.personalTrainingMembers.length }}</p></article>
          <article class="module-summary-card module-summary-card--teal"><p class="module-summary-card__label">Active PT Members</p><p class="module-summary-card__value">{{ selectedTrainer.activePtMembers.length }}</p></article>
          <article class="module-summary-card module-summary-card--coral"><p class="module-summary-card__label">Expired PT Members</p><p class="module-summary-card__value">{{ selectedTrainer.expiredPtMembers.length }}</p></article>
          <article class="module-summary-card module-summary-card--amber"><p class="module-summary-card__label">Upcoming PT Expiries</p><p class="module-summary-card__value">{{ selectedTrainer.upcomingPtExpiries }}</p></article>
          <article class="module-summary-card module-summary-card--coral"><p class="module-summary-card__label">PT Revenue</p><p class="module-summary-card__value">{{ formatCurrency(selectedTrainer.ptRevenue) }}</p></article>
        </div>
        <div v-if="selectedTrainer.personalTrainingMembers.length" class="app-table-wrap"><table class="app-table"><thead><tr><th>Member</th><th>PT Plan</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Amount</th></tr></thead><tbody><tr v-for="subscription in selectedTrainer.personalTrainingMembers" :key="subscription.id"><td>{{ gymStore.getMemberById(subscription.memberId)?.fullName || 'Unknown Member' }}</td><td>{{ subscription.planName }}</td><td>{{ formatDate(subscription.startDate) }}</td><td>{{ formatDate(subscription.endDate) }}</td><td><StatusBadge :status="subscription.status" /></td><td>{{ formatCurrency(subscription.amount) }}</td></tr></tbody></table></div>
      </div>
    </Dialog>
  </section>
</template>