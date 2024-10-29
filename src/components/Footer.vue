<template>
	<div class="container-fluid text-center mt-3">
		<router-link v-if="isConnected && isNetworkSupported" to="/profile">Profile</router-link>

		<span v-if="isConnected && isNetworkSupported"> | </span>

		<router-link v-if="isConnected && isNetworkSupported" to="/send-tokens">Send Tokens</router-link>
		<span v-if="isConnected && isNetworkSupported"> | </span>

		<router-link v-if="isUserMinterAdmin || isUserRoyaltyFeeUpdater || isUserTldAdmin" to="/admin"
			>Admin</router-link
		>
		<span v-if="isUserMinterAdmin || isUserRoyaltyFeeUpdater || isUserTldAdmin"> | </span>

		<a target="_blank" href="https://punk.domains">Powered by Punk Domains</a> |
		<a target="_blank" href="https://www.superposition.so/">Built for Superposition</a> |
		<span class="footer-link" @click="deleteLocalStorage">Delete cookies</span>
	</div>

	<div class="container-fluid text-center">
		<a class="icons" href="https://docs.superposition.so/native-dapps/meow-domains" target="_blank"><i class="bi bi-journal-text"></i></a>

		<a class="icons" target="_blank" href="https://github.com/fluidity-money/meow.domains/"
			><i class="bi bi-github"></i
		></a>

		<!--
		<a class="icons" target="_blank" href=""><i class="bi bi-discord"></i></a>
		-->

		<a class="icons" target="_blank" href="https://x.com/superpositionso"><i class="bi bi-twitter"></i></a>
	</div>
</template>

<script>
import { useVueDapp } from '@vue-dapp/core'
import { mapGetters } from 'vuex'
import { useToast, TYPE } from 'vue-toastification'

export default {
	name: 'Footer',

	computed: {
		...mapGetters('network', ['isNetworkSupported']),
		...mapGetters('user', ['isUserMinterAdmin', 'isUserTldAdmin', 'isUserRoyaltyFeeUpdater']),
	},

	methods: {
		deleteLocalStorage() {
			localStorage.clear()
			this.toast('Cookies deleted!', {type: TYPE.SUCCESS}) // people don't know what localStorage is, so we say cookies
		},
	},

	setup() {
		const { isConnected } = useVueDapp()
		const toast = useToast()
		return { isConnected, toast }
	},
}
</script>

<style scoped>
a {
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}

.container-fluid {
	/*background-color: #24263A;*/
	background-color: transparent;
	padding: 20px 0px;
	border-radius: 10px;
}

.icons {
	margin-left: 15px;
	margin-right: 15px;
	font-size: 2em;
}

.polygon {
	vertical-align: text-bottom;
	width: 40px;
}

.polygon svg circle {
	fill: #dbdfea;
}

.polygon:hover svg circle {
	fill: white;
}
</style>
