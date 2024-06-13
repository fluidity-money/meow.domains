<template>
	<div class="row">
		<div class="col-md-3" id="sidebar-container">
			<Sidebar />
		</div>

		<div class="col-md-9">
			<SendTokensComponent />
		</div>
	</div>
</template>

<script>
import SendTokensComponent from '../components/SendTokensComponent.vue'
import Sidebar from '../components/Sidebar.vue'

export default {
	name: 'ProfileSendTokens',

	components: {
		SendTokensComponent,
		Sidebar,
	},
}
</script>
