<template>
	<div class="row">
		<div class="col-md-3" id="sidebar-container">
			<Sidebar />
		</div>

		<div class="col-md-9">
			<!-- Show this if user is not connected -->
			<div class="row" v-if="!isConnected">
				<div class="col-md-12 mb-3">
					<div class="container text-center">
						<h3>
							<i class="bi bi-exclamation-triangle"></i> Not connected
							<i class="bi bi-exclamation-triangle"></i>
						</h3>
						<p class="text-break">Please connect with your wallet to see your profile data.</p>
					</div>
				</div>
			</div>

			<!-- Address and balance -->
			<div class="row" v-if="isConnected">
				<div class="col-md-6 mb-3">
					<div class="container text-center">
						<h3>Address</h3>
						<p class="text-break">{{ getUserAddress }}</p>
					</div>
				</div>

				<div class="col-md-6 mb-3">
					<div class="container text-center">
						<h3>Balance</h3>
						<p class="text-break">{{ getUserBalance }} {{ this.getPaymentTokenName }}</p>
					</div>
				</div>
			</div>

			<div class="row">
				<div class="col-md-12">
					<div class="container">
						<h3>Domains</h3>

						<table class="table table-hover mt-4 mb-4">
							<tbody>
								<tr v-for="domainName in getUserAllDomainNames" :key="domainName">
									<MyDomain :domain="domainName" />
								</tr>
							</tbody>
						</table>

						<p v-if="getUserSelectedNameData">
							<small
								><em>
									Don't see your domain here?
									<span class="span-link" data-bs-toggle="modal" data-bs-target="#addDomainModal">
										Add it manually</span
									>.
								</em></small
							>
						</p>
						<p v-else>
							No domain? No worries,
							<router-link to="/">buy yourself one here!</router-link>
						</p>
					</div>
				</div>
			</div>

			<Referral />
		</div>
	</div>

	<!-- Add Domain Modal -->
	<div
		class="modal fade"
		id="addDomainModal"
		tabindex="-1"
		aria-labelledby="addDomainModalLabel"
		aria-hidden="true"
		modal-dialog-centered
	>
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="addDomainModalLabel">Add your existing domain</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<div class="mb-3">
						<label for="recipient-name" class="col-form-label">Enter your existing domain:</label>
						<input
							type="text"
							placeholder="Enter domain"
							class="form-control border-2"
							id="recipient-name"
							v-model="existingDomain"
						/>
						<small><em>No transaction will be made, this is a free query.</em></small>
					</div>
				</div>
				<div class="modal-footer">
					<button
						type="button"
						@click="addExistingDomain"
						class="btn btn-secondary"
						:disabled="domainNotValid"
					>
						Add domain
					</button>

					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { mapGetters, mapMutations } from 'vuex'
import { ethers } from 'ethers'
import { useEthers } from '../pinia-stores/ethers'
import { useToast, TYPE } from 'vue-toastification'
import MyDomain from '../components/MyDomain.vue'
import Sidebar from '../components/Sidebar.vue'
import Referral from '../components/Referral.vue'
import tldAbi from '../abi/PunkTLD.json'
import useChainHelpers from '../hooks/useChainHelpers'
import { storeToRefs } from 'pinia'

export default {
	name: 'Profile',

	data() {
		return {
			existingDomain: null,
			loading: false,
		}
	},

	components: {
		MyDomain,
		Referral,
		Sidebar,
	},

	computed: {
		...mapGetters('tld', ['getTldAddress', 'getTldName']),
		...mapGetters('user', [
			'getUserAddress',
			'getPaymentTokenName',
			'getUserSelectedNameData',
			'getUserAllDomainNames',
			'getPaymentTokenAddress',
			'getPaymentTokenAllowance',
			'getUserBalance',
			'getPaymentTokenContract',
		]),

		customData() {
			if (this.getUserSelectedNameData) {
				try {
					return JSON.parse(this.getUserSelectedNameData.data)
				} catch {
					return null
				}
			}

			return null
		},

		domainNotValid() {
			if (this.existingDomain === '') {
				return true
			} else if (this.existingDomain === null) {
				return true
			} else if (this.existingDomain.split('.').length != 2) {
				// only 1 zero allowed (meaning there are two words after split)
				return true
			} else if (this.existingDomain.includes(' ')) {
				return true
			} else if (this.existingDomain.includes('%')) {
				return true
			} else if (this.existingDomain.includes('&')) {
				return true
			} else if (this.existingDomain.includes('?')) {
				return true
			} else if (this.existingDomain.includes('#')) {
				return true
			} else if (!this.existingDomain.includes(this.getTldName)) {
				return true
			}
		},
	},

	methods: {
		...mapMutations('user', ['addDomainManually']),

		async addExistingDomain() {
			const existingDomainLower = this.existingDomain.toLowerCase()
			const existingDomainParts = existingDomainLower.split('.')
			const intfc = new ethers.utils.Interface(tldAbi)
			const contract = new ethers.Contract(this.getTldAddress, intfc, this.signer)
			const checkDomainHolder = await contract.getDomainHolder(existingDomainParts[0])
			if (String(checkDomainHolder).toLowerCase() === String(this.address).toLowerCase()) {
				this.addDomainManually(existingDomainLower)
				this.toast('Domain successfully added.', { type: TYPE.SUCCESS })
			} else {
				this.toast('This domain is not owned by your currently connected address.', { type: TYPE.ERROR })
			}
		},
	},

	setup() {
		const { address, isConnected, signer } = useEthers()
		const toast = useToast()
		const { getFallbackProvider } = useChainHelpers()

		return { address, getFallbackProvider, isConnected, signer, toast }
	},
}
</script>

<style scoped>
.clipboard {
	cursor: pointer;
}

.table {
	--bs-table-bg: transparent;
	color: #fff;
	border-color: #fff;
}

.table:hover {
	--bs-table-bg: transparent;
	/*--bs-table-hover-bg: #1D1E2C;*/
	--bs-table-hover-bg: transparent;
	--bs-table-hover-color: none;
}
</style>
