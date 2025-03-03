<template>
  <div class="container">
    <LandingHeader title="Processing queue">
      <template #actions>
        <BaseButton
          type="danger"
          v-if="!isLoading && $route.query.batch"
          @click="cancelBatch"
          :disabled="isCancelled || totalTasks == 0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M 10.806641 2 C 10.289641 2 9.7956875 2.2043125 9.4296875 2.5703125 L 9 3 L 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 15 3 L 14.570312 2.5703125 C 14.205312 2.2043125 13.710359 2 13.193359 2 L 10.806641 2 z M 4.3652344 7 L 5.8925781 20.263672 C 6.0245781 21.253672 6.877 22 7.875 22 L 16.123047 22 C 17.121047 22 17.974422 21.254859 18.107422 20.255859 L 19.634766 7 L 4.3652344 7 z"
            />
          </svg>
          Cancel
        </BaseButton>
      </template>
    </LandingHeader>
    <main class="pagewidth">
      <BaseSpinner v-if="isLoading" />
      <template v-else>
        <table class="statistics">
          <tbody>
            <tr v-if="$route.query.batch">
              <th>Batch:</th>
              <td>{{ $route.query.batch }}</td>
            </tr>
            <tr>
              <th>Total tasks:</th>
              <td>{{ totalTasks }}</td>
            </tr>
          </tbody>
        </table>
        <CheckBox label="Show failed tasks" v-model="showFailed" />
        <table class="tasks" v-if="queueData.length > 0">
          <thead>
            <tr>
              <th>Type</th>
              <th></th>
              <th class="status">Status</th>
              <th>Site</th>
              <th>Date</th>
              <th>Product</th>
              <th>Instrument / model</th>
              <th v-if="!showFailed">Due in</th>
            </tr>
          </thead>
          <tbody is="vue:transition-group" name="list" tag="tbody">
            <tr v-for="task in queueData" :key="task.id" :class="`status-${task.status}`">
              <td>{{ task.type }}</td>
              <td class="spinner-cell">
                <img :src="testPassIcon" alt="" v-if="task.status === 'done'" />
                <BaseSpinner size="small" v-else-if="task.status === 'running' || task.status === 'restart'" />
              </td>
              <td class="status">{{ task.status }}</td>
              <td>{{ task.siteId }}</td>
              <td>{{ task.measurementDate }}</td>
              <td>
                <router-link v-if="task.status === 'done'" :to="linkToSearch(task)">{{ task.productId }}</router-link>
                <span v-else>{{ task.productId }}</span>
              </td>
              <td>
                <router-link v-if="task.instrumentInfo?.name" :to="linkToRaw(task)">{{
                  task.instrumentInfo.name
                }}</router-link>
                <span v-else-if="task.model?.id">{{ task.model.id }}</span>
              </td>
              <td>
                {{ task.status === "created" ? timeDifference(task.scheduledAt) : "" }}
              </td>
              <td v-if="showFailed" class="retry-button">
                <BaseButton type="danger" size="small" style="display: block" @click="retryTask(task)">
                  Retry
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </main>
  </div>
</template>

<script lang="ts" setup>
import LandingHeader from "@/components/LandingHeader.vue";
import { ref, onMounted, onUnmounted, watch } from "vue";
import axios from "axios";
import { backendUrl } from "@/lib";
import BaseSpinner from "@/components/BaseSpinner.vue";
import BaseButton from "@/components/BaseButton.vue";
import type { Task } from "@shared/entity/Task";
import testPassIcon from "@/assets/icons/test-pass.svg";
import CheckBox from "@/components/CheckBox.vue";
import { loginStore } from "@/lib/auth";
import { useRoute } from "vue-router";

type AugmentedTask = Omit<Task, "status"> & { status: Task["status"] | "pending" };

const route = useRoute();
const queueData = ref<AugmentedTask[]>([]);
const showFailed = ref(false);
const isLoading = ref(true);
const isCancelled = ref(false);
const totalTasks = ref(0);

let updateTimeout: NodeJS.Timeout | null = null;
let lastUpdate = new Date();

interface TaskResponse {
  tasks: Task[];
  totalTasks: number;
}

async function updateQueueData() {
  try {
    if (showFailed.value) {
      const failedRes = await axios.get<TaskResponse>(`${backendUrl}queue`, {
        params: { batch: route.query.batch, status: ["failed"], limit: 1000 },
        auth: { username: loginStore.username, password: loginStore.password },
      });
      totalTasks.value = failedRes.data.totalTasks;
      queueData.value = failedRes.data.tasks;
    } else {
      const [doneRes, otherRes] = await Promise.all([
        axios.get<TaskResponse>(`${backendUrl}queue`, {
          params: { batch: route.query.batch, status: ["done"], doneAfter: lastUpdate.toISOString() },
          auth: { username: loginStore.username, password: loginStore.password },
        }),
        axios.get<TaskResponse>(`${backendUrl}queue`, {
          params: { batch: route.query.batch, status: ["created", "running", "restart"], limit: 100 },
          auth: { username: loginStore.username, password: loginStore.password },
        }),
      ]);
      totalTasks.value = otherRes.data.totalTasks;
      const now = new Date();
      queueData.value = doneRes.data.tasks
        .concat(otherRes.data.tasks)
        .map((task) =>
          task.status === "created" && new Date(task.scheduledAt) < now ? { ...task, status: "pending" } : task,
        );
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
  updateTimeout = setTimeout(updateQueueData, 5000);
  lastUpdate = new Date();
}

interface TaskPayload {
  type: string;
  siteId: string;
  measurementDate: string;
  productId: string;
  instrumentInfoUuid?: string;
  modelId?: string;
  options: object;
}

async function retryTask(task: AugmentedTask) {
  const newTask: TaskPayload = {
    type: task.type,
    siteId: task.siteId,
    productId: task.productId,
    measurementDate: task.measurementDate,
    options: task.options,
  };

  if (task.instrumentInfo) {
    newTask.instrumentInfoUuid = task.instrumentInfo.uuid;
  } else if (task.model) {
    newTask.modelId = task.model.id;
  }

  try {
    await axios.post(`${backendUrl}queue/publish`, newTask, {
      auth: { username: loginStore.username, password: loginStore.password },
    });
    if (updateTimeout) clearTimeout(updateTimeout);
    await updateQueueData();
  } catch (err) {
    alert(`Failed to retry task: ${err}`);
    console.error(err);
  }
}

async function cancelBatch() {
  if (!confirm(`Cancel batch ${route.query.batch}?`)) return;
  try {
    isCancelled.value = true;
    await axios.delete(`${backendUrl}queue/batch/${route.query.batch}`, {
      params: { batch: route.query.batch },
      auth: { username: loginStore.username, password: loginStore.password },
    });
    if (updateTimeout) clearTimeout(updateTimeout);
    await updateQueueData();
  } catch (err) {
    alert(`Failed to cancel batch: ${err}`);
    console.error(err);
  }
}

onMounted(async () => {
  await updateQueueData();
});

watch(
  () => showFailed.value,
  async () => {
    if (updateTimeout) clearTimeout(updateTimeout);
    isLoading.value = true;
    await updateQueueData();
  },
);

onUnmounted(() => {
  if (updateTimeout) clearTimeout(updateTimeout);
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

function linkToSearch(task: AugmentedTask) {
  const query: Record<string, string> = {
    site: task.siteId,
    product: task.productId,
    dateFrom: task.measurementDate,
    dateTo: task.measurementDate,
  };
  if (task.instrumentInfo?.pid) {
    query.instrumentPid = task.instrumentInfo.pid;
  }
  return {
    name: "Search",
    params: { mode: "data" },
    query: query,
  };
}

function linkToRaw(task: AugmentedTask) {
  return {
    name: "Raw Files",
    params: { uuid: task.instrumentInfo.uuid },
    query: { date: task.measurementDate },
  };
}
</script>

<style scoped lang="scss">
@use "@/sass/variables.scss";

.statistics {
  margin-bottom: 20px;

  th {
    font-weight: 500;
    padding-right: 10px;
  }
}

.tasks {
  tr {
    border-bottom: 1px solid lightblue;
    margin-left: 10px;
    opacity: 1;

    &:has(button:hover) {
      background-color: variables.$gray1;
    }
  }

  th {
    border-bottom: 1px solid lightblue;
    font-weight: 500;
    padding-right: 10px;
    padding-left: 20px;
    padding-bottom: 5px;
    vertical-align: middle;
  }

  td {
    padding-right: 20px;
    padding-left: 20px;
  }

  .retry-button {
    vertical-align: middle;
  }
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

.status-pending {
  background-color: #e7f5e7;
}

.status-running,
.status-restart {
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
