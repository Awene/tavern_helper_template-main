import { ref } from 'vue';

export const workshopVisible = ref(false);

export function openWorkshop(): void {
  workshopVisible.value = true;
}

export function closeWorkshop(): void {
  workshopVisible.value = false;
}
