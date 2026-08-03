<template>
  <div class="seed-container">
    <Card class="seed-card">
      <template #header>
        <div class="seed-header">
          <h2>Database Seeding</h2>
          <p>Populate Firestore with mock data</p>
        </div>
      </template>

      <template #content>
        <div class="seed-content">
          <div v-if="!seedingComplete" class="seed-form">
            <div class="form-group">
              <label>Gym ID</label>
              <InputText 
                v-model="gymId" 
                placeholder="e.g., demo-gym-001"
                :disabled="isSeeding"
              />
            </div>

            <Button 
              @click="seedDatabase"
              :loading="isSeeding"
              :disabled="!gymId || isSeeding"
              class="seed-button"
            >
              <i v-if="!isSeeding" class="pi pi-check"></i>
              {{ isSeeding ? 'Seeding...' : 'Seed Collections' }}
            </Button>
          </div>

          <div v-else class="seed-success">
            <div class="success-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h3>Seeding Complete! ✅</h3>
            <p>{{ docCount }} documents added</p>
            <div class="collections-list">
              <div class="collection-item">
                <i class="pi pi-check"></i>
                <span>Trainers (3)</span>
              </div>
              <div class="collection-item">
                <i class="pi pi-check"></i>
                <span>Members (5)</span>
              </div>
              <div class="collection-item">
                <i class="pi pi-check"></i>
                <span>Memberships (5)</span>
              </div>
              <div class="collection-item">
                <i class="pi pi-check"></i>
                <span>Attendance (5)</span>
              </div>
              <div class="collection-item">
                <i class="pi pi-check"></i>
                <span>Payments (5)</span>
              </div>
            </div>
            <Button 
              @click="resetSeeding"
              severity="secondary"
              class="reset-button"
            >
              <i class="pi pi-refresh"></i>
              Seed Again
            </Button>
          </div>

          <div v-if="error" class="error-message">
            <i class="pi pi-exclamation-triangle"></i>
            <p>{{ error }}</p>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { seedDatabase as seedData } from '../../firebase/seedDatabase';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const gymId = ref('demo-gym-001');
const isSeeding = ref(false);
const seedingComplete = ref(false);
const docCount = ref(0);
const error = ref('');

const seedDatabase = async () => {
  if (!gymId.value.trim()) {
    error.value = 'Please enter a Gym ID';
    return;
  }

  isSeeding.value = true;
  error.value = '';

  try {
    const result = await seedData('gympulse-afcb1', gymId.value);
    docCount.value = result.documentsAdded;
    seedingComplete.value = true;
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Database seeded with ${result.documentsAdded} documents`,
      life: 3000
    });
  } catch (err) {
    error.value = `Seeding failed: ${err.message}`;
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.value,
      life: 5000
    });
  } finally {
    isSeeding.value = false;
  }
};

const resetSeeding = () => {
  seedingComplete.value = false;
  docCount.value = 0;
  error.value = '';
};
</script>

<style scoped>
.seed-container {
  max-width: 500px;
  margin: 2rem auto;
}

.seed-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.seed-header {
  text-align: center;
  padding: 1.5rem;
}

.seed-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.seed-header p {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.seed-content {
  padding: 2rem;
}

.seed-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #4169e1;
  box-shadow: 0 0 0 2px rgba(65, 105, 225, 0.1);
}

.form-group :deep(.p-inputtext) {
  padding: 0.75rem;
  border-radius: 4px;
  width: 100%;
}

.seed-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
}

.seed-success {
  text-align: center;
}

.success-icon {
  font-size: 3rem;
  color: #4caf50;
  margin-bottom: 1rem;
}

.seed-success h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  color: #333;
}

.seed-success p {
  margin: 0 0 1.5rem 0;
  color: #666;
}

.collections-list {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 1rem;
  margin: 1.5rem 0;
  text-align: left;
}

.collection-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: #333;
}

.collection-item i {
  color: #4caf50;
  font-size: 0.9rem;
}

.reset-button {
  margin-top: 1rem;
}

.error-message {
  background: #ffebee;
  border-left: 4px solid #f44336;
  padding: 1rem;
  border-radius: 4px;
  color: #c62828;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.error-message i {
  font-size: 1.2rem;
}

.error-message p {
  margin: 0;
}
</style>
