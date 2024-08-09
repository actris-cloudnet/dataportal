<template>
  <div class="container">
    <LandingHeader title="Processing queue" />
    <main class="pagewidth">
      <div class="statistics">
        <p>Total Tasks: {{ totalTasks }}</p>
        <p>Running: {{ runningTasks }}</p>
        <p>Pending: {{ pendingTasks }}</p>
        <p>Created: {{ createdTasks }}</p>
        <p>Failed: {{ failedTasks }}</p>
      </div>
      <table v-if="totalTasks > 0">
        <thead>
          <tr>
            <th>Type</th>
            <th></th>
            <th class="status">Status</th>
            <th>Site</th>
            <th>Date</th>
            <th>Product</th>
            <th>Instrument / model</th>
            <th>Due in</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in sortedQueueData" :key="item.id" :class="getStatusClass(item.status)">
            <td>{{ item.type }}</td>
            <td class="spinner-cell">
              <template v-if="item.status === 'running'">
                <BaseSpinner size="small" />
              </template>
            </td>
            <td class="status">{{ item.status }}</td>
            <td>{{ item.siteId }}</td>
            <td>{{ item.measurementDate }}</td>
            <td>{{ item.productId }}</td>
            <td>{{ item.instrumentInfo?.name || item.model?.id }}</td>
            <td>
              {{
                item.status === "failed" || item.status === "running" || item.status === "pending"
                  ? ""
                  : timeDifference(item.scheduledAt)
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  </div>
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
import { computed, ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import BaseSpinner from "@/components/BaseSpinner.vue";
import type { Task } from "@shared/entity/Task";

const queueData = ref<Task[]>([]);

async function fetchQueueData() {
  try {
    const response = await axios.get(`${backendUrl}queue`, { withCredentials: true });
    queueData.value = response.data;
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  fetchQueueData();
  const interval = setInterval(fetchQueueData, 5000);

  onUnmounted(() => {
    clearInterval(interval);
  });
});

function getStatusClass(status: string) {
  switch (status) {
    case "created":
      return "status-created";
    case "running":
      return "status-running";
    case "failed":
      return "status-failed";
    case "pending":
      return "status-pending";
    default:
      return "";
  }
}

function timeDifference(scheduledAt: string): string {
  const now = new Date();
  const diffMs = Math.abs(now.getTime() - new Date(scheduledAt).getTime());
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} d ${diffHours % 24} h ${diffMins % 60} min`;
  } else if (diffHours > 0) {
    return `${diffHours} h ${diffMins % 60} min`;
  } else {
    return `${diffMins} min`;
  }
}

const sortedQueueData = computed<Task[]>(() => {
  const now = new Date();
  queueData.value.forEach((element: Task) => {
    if (element.status === "created" && new Date(element.scheduledAt) < now) {
      element.status = "pending";
    }
  });

  const statusOrder: { [key: string]: number } = {
    running: 1,
    pending: 2,
    created: 3,
    failed: 4,
    restart: 5,
  };

  if (!Array.isArray(queueData.value)) {
    return [];
  }

  return queueData.value.slice().sort((a: Task, b: Task) => {
    if (statusOrder[a.status] < statusOrder[b.status]) return -1;
    if (statusOrder[a.status] > statusOrder[b.status]) return 1;
    if (a.scheduledAt < b.scheduledAt) return -1;
    if (a.scheduledAt > b.scheduledAt) return 1;
    return 0;
  });
});

const totalTasks = computed(() => queueData.value.length);
const runningTasks = computed(() => queueData.value.filter((item) => item.status === "running").length);
const pendingTasks = computed(() => queueData.value.filter((item) => item.status === "pending").length);
const failedTasks = computed(() => queueData.value.filter((item) => item.status === "failed").length);
const createdTasks = computed(() => queueData.value.filter((item) => item.status === "created").length);
</script>

<style scoped lang="scss">
@import "@/sass/variables.scss";

.statistics {
  margin-bottom: 20px;
}

td {
  padding-right: 20px;
  padding-left: 20px;
}
tr {
  border-bottom: 1px solid lightblue;
  margin-left: 10px;
}
th {
  border-bottom: 1px solid lightblue;
  font-weight: bold;
  padding-right: 10px;
  padding-left: 20px;
  padding-bottom: 5px;
  vertical-align: middle;
}

.status-pending {
  background-color: #e7f5e7;
}

.status-running {
  background-color: #8bc34a;
}

.status-failed {
  background-color: #f8d7da;
}

.status-created {
  background-color: lightgray;
}

table {
  margin-bottom: 100px;
  border-collapse: collapse;
}

.status {
  padding-left: 0;
}

.spinner-cell {
  margin: 0px;
  padding: 0px;
}
</style>
