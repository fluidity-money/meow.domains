<template>
	<div>
		<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
		<span class="mx-2">{{ text }}</span>
	</div>
</template>

<script>
export default {
	name: 'WaitingToast',
	props: ['text'],
}
</script>
