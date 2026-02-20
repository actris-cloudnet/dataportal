<template>
  <Contacts
    :apiPath="`sites/${site.id}`"
    permissionKey="canManageSites"
    emptyMessage="No contacts registered for this site."
  />
</template>

<script lang="ts" setup>
import Contacts from "@/components/ContactsTable.vue";

defineProps<{ site: { id: string } }>();
</script>
