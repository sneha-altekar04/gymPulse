<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import MemberForm from '../components/members/MemberForm.vue';
import PageHeader from '../components/common/PageHeader.vue';
import { useGymStore } from '../stores/gymStore';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const gymStore = useGymStore();

const saving = ref(false);

const isEditMode = computed(() => Boolean(route.params.id));
const member = computed(() => {
  if (!isEditMode.value) {
    return null;
  }

  return gymStore.getMemberById(route.params.id);
});

const initialModel = computed(() => {
  if (!member.value) {
    return null;
  }

  return {
    fullName: member.value.fullName,
    mobile: member.value.mobile,
    email: member.value.email,
    gender: member.value.gender,
    dateOfBirth: member.value.dateOfBirth,
    address: member.value.address,
    emergencyContactName: member.value.emergencyContactName,
    emergencyContactNumber: member.value.emergencyContactNumber,
    joiningDate: member.value.joiningDate,
    trainerId: member.value.trainerId,
    deviceUserId: member.value.deviceUserId
  };
});

async function onSubmit(payload) {
  saving.value = true;
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (isEditMode.value && member.value) {
    gymStore.updateMember(member.value.id, payload);
    toast.add({
      severity: 'success',
      summary: 'Member updated',
      detail: 'Member profile details were updated successfully.',
      life: 2600
    });
    saving.value = false;
    router.push(`/members/${member.value.id}`);
    return;
  }

  const memberId = gymStore.addMember(payload);
  toast.add({
    severity: 'success',
    summary: 'Member added',
    detail: 'New member has been registered successfully.',
    life: 2600
  });
  saving.value = false;
  router.push(`/members/${memberId}`);
}

function onCancel() {
  if (isEditMode.value && member.value) {
    router.push(`/members/${member.value.id}`);
    return;
  }

  router.push('/members');
}
</script>

<template>
  <section class="stack-16">
    <PageHeader
      :title="isEditMode ? 'Edit Member' : 'Add Member'"
      :subtitle="
        isEditMode ? 'Update personal and gym profile information' : 'Register a new member with plan and payment details'
      "
    />

    <div class="panel-card">
      <MemberForm
        :model-value="initialModel"
        :plans="gymStore.membershipPlans.filter((plan) => plan.active)"
        :trainers="gymStore.trainers"
        :mode="isEditMode ? 'edit' : 'create'"
        :saving="saving"
        @submit="onSubmit"
        @cancel="onCancel"
      />
    </div>
  </section>
</template>
