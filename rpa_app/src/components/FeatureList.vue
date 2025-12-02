<template>
  <section class="page">
    <div class="feature-list">
      <div
        v-for="feature in features"
        :key="feature.id"
        class="feature-item"
        @click="$emit('select', feature.id)"
      >
        <div class="feature-icon">{{ feature.icon }}</div>
        <div class="feature-content">
          <h3 class="feature-title">{{ feature.title }}</h3>
        </div>
        <div class="feature-arrow">→</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Feature } from "../types";

defineProps<{
  features: Feature[];
}>();

defineEmits<{
  select: [featureId: string];
}>();
</script>

<style scoped>
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.feature-item:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
}

.feature-content {
  flex: 1;
}

.feature-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.feature-icon {
  font-size: 32px;
}

.feature-arrow {
  font-size: 20px;
  color: #9ca3af;
}
</style>

