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
      <table v-if="sortedQueueData.length > 0">
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
        <tbody is="vue:transition-group" name="list" tag="tbody">
          <tr v-for="task in sortedQueueData" :key="task.id" :class="`status-${task.status}`">
            <td>{{ task.type }}</td>
            <td class="spinner-cell">
              <img :src="testPassIcon" alt="" v-if="task.status === 'done'" />
              <BaseSpinner size="small" v-else-if="task.status === 'running'" />
            </td>
            <td class="status">{{ task.status }}</td>
            <td>{{ task.siteId }}</td>
            <td>{{ task.measurementDate }}</td>
            <td>{{ task.productId }}</td>
            <td>{{ task.instrumentInfo?.name || task.model?.id }}</td>
            <td>
              {{
                task.status === "pending" ||
                task.status === "running" ||
                task.status === "done" ||
                task.status === "failed"
                  ? ""
                  : timeDifference(task.scheduledAt)
              }}
            </td>
          </tr>
        </tbody>
      </table>
      <CheckBox label="Show failed tasks" v-model="showFailed" />
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
import testPassIcon from "@/assets/icons/test-pass.svg";
import CheckBox from "@/components/CheckBox.vue";
import { loginStore } from "@/lib/auth";

type AugmentedTask = Omit<Task, "status"> & { status: Task["status"] | "pending" | "done" };
const statusOrder: Record<AugmentedTask["status"], number> = {
  done: 0,
  running: 1,
  pending: 2,
  created: 3,
  failed: 4,
  restart: 5,
};

const queueData = ref<Record<AugmentedTask["id"], AugmentedTask>>({});

const showFailed = ref(false);

let updateTimeout: NodeJS.Timeout | null = null;

async function updateQueueData() {
  try {
    const response = await axios.get<Task[]>(`${backendUrl}queue`, {
      auth: { username: loginStore.username, password: loginStore.password },
    });
    for (const id in queueData.value) {
      if (queueData.value[id].status === "done") {
        delete queueData.value[id];
      } else {
        queueData.value[id].status = "done";
      }
    }
    for (const newTask of response.data) {
      queueData.value[newTask.id] = newTask;
    }
  } catch (error) {
    console.error(error);
  }
  updateTimeout = setTimeout(updateQueueData, 5000);
}

onMounted(() => {
  updateQueueData();

  onUnmounted(() => {
    if (updateTimeout) clearTimeout(updateTimeout);
  });
});

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

const sortedQueueData = computed(() => {
  const queue = Object.values(queueData.value);
  const now = new Date();
  queue.forEach((task) => {
    if (task.status === "created" && new Date(task.scheduledAt) < now) {
      task.status = "pending";
    }
  });

  return queue
    .filter((task) => showFailed.value || task.status !== "failed")
    .sort((a, b) => {
      if (statusOrder[a.status] < statusOrder[b.status]) return -1;
      if (statusOrder[a.status] > statusOrder[b.status]) return 1;
      if (a.scheduledAt < b.scheduledAt) return -1;
      if (a.scheduledAt > b.scheduledAt) return 1;
      return 0;
    });
});

const totalTasks = computed(() => Object.values(queueData.value).length);
const runningTasks = computed(() => Object.values(queueData.value).filter((task) => task.status === "running").length);
const pendingTasks = computed(() => Object.values(queueData.value).filter((task) => task.status === "pending").length);
const failedTasks = computed(() => Object.values(queueData.value).filter((task) => task.status === "failed").length);
const createdTasks = computed(() => Object.values(queueData.value).filter((task) => task.status === "created").length);
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
  opacity: 1;
}

.list-enter-active {
  transition: all 500ms ease-out;
}

.list-leave-active {
  transition: all 500ms ease-in;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(100px);
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
  opacity: 0.75;
}

table {
  margin-bottom: 1rem;
  border-collapse: collapse;
}

.status {
  padding-left: 0;
}

.spinner-cell {
  margin: 0px;
  padding: 0px;
}

img {
  height: 14px;
  vertical-align: middle;
}
</style>
