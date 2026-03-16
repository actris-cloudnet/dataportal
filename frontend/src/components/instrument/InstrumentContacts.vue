<template>
  <Contacts
    :apiPath="`instrument-pids/${instrumentInfo.uuid}`"
    permissionKey="canManageContacts"
    emptyMessage="No contacts registered for this instrument"
  />
</template>

<script lang="ts" setup>
import Contacts from "@/components/ContactsTable.vue";

defineProps<{ instrumentInfo: { uuid: string } }>();
</script>
