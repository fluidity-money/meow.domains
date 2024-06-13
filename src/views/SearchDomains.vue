<template>
	<div class="row">
		<div class="col-md-3" id="sidebar-container">
			<Sidebar />
		</div>

		<div class="col-md-9">
			<div class="row">
				<div class="col-md-12 mb-3">
					<div class="container text-center">
						<h3>Find an existing domain</h3>

						<div class="row mt-5">
							<div class="col-md-6 offset-md-3">
								<input
									v-model="query"
									class="form-control text-center border-2 border-light"
									placeholder="Enter a domain name"
									v-on:keyup.enter="findDomain"
								/>
							</div>
						</div>

						<button class="btn btn-primary mt-3 mb-5" @click="findDomain" :disabled="waiting || notValid">
							<span
								v-if="waiting"
								class="spinner-border spinner-border-sm"
								role="status"
								aria-hidden="true"
							></span>
							Search
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { ethers } from 'ethers'
import { mapGetters } from 'vuex'
import { useToast, TYPE } from 'vue-toastification'

import tldsJson from '../abi/tlds.json'
import tldAbi from '../abi/PunkTLD.json'
import Sidebar from '../components/Sidebar.vue'
import WaitingToast from '../components/toasts/WaitingToast.vue'
import useChainHelpers from '../hooks/useChainHelpers'

export default {
	name: 'SearchDomains',

	components: {
		Sidebar,
	},

	data() {
		return {
			query: null,
			waiting: false,
		}
	},

	computed: {
		domainLowerCase() {
			return this.query.toLowerCase()
		},

		notValid() {
			if (!this.query) {
				return true
			} else if (!this.query.includes('.')) {
				return true
			} else if (this.query.includes(' ')) {
				return true
			} else if (this.query.includes('%')) {
				return true
			} else if (this.query.includes('&')) {
				return true
			} else if (this.query.includes('?')) {
				return true
			} else if (this.query.includes('#')) {
				return true
			} else if (this.query.includes('/')) {
				return true
			}

			return false
		},
	},

	methods: {
		async findDomain() {
			this.waiting = true
			const intfc = new ethers.utils.Interface(tldAbi)

			// check if domain name/address is valid
			if (this.domainLowerCase && this.domainLowerCase.split('.').length === 2) {
				// likely a domain name
				// split into two (domain name and TLD)
				const domArr = this.domainLowerCase.split('.')

				for (let netId in tldsJson) {
					// iterate through different chains
					if (tldsJson[netId]['.' + domArr[1]]) {
						// find the correct TLD
						// get fallback provider based on network ID
						const fProvider = this.getFallbackProvider(Number(netId))
						// create TLD contract
						const tldContractRead = new ethers.Contract(tldsJson[netId]['.' + domArr[1]], intfc, fProvider)
						// fetch domain holder
						const domainHolder = await tldContractRead.getDomainHolder(domArr[0])

						if (domainHolder !== ethers.constants.AddressZero) {
							// if domain exists, redirect to the Domain Details page
							this.$router.push({
								name: 'DomainDetails',
								params: {
									domainChain: netId,
									tld: domArr[1],
									domainName: domArr[0],
								},
							})
							return
						} else {
							// if not exists (holder is 0x0), show a toast
							this.toast('This domain name has not been registered yet.', {
								type: TYPE.INFO,
							})
							this.waiting = false
							return
						}
						break
					}
				}

				this.toast(
					'Top-level domain .' + domArr[1] + ' does not exist (if this is a mistake, contact us on Discord).',
					{ type: TYPE.ERROR },
				)
				this.waiting = false
				return
			} else {
				this.toast('This is not a valid domain.', { type: TYPE.ERROR })
				this.waiting = false
				return
			}
		},
	},

	setup() {
		const toast = useToast()
		const { getFallbackProvider } = useChainHelpers()

		return { getFallbackProvider, toast }
	},
}
</script>

<style scoped></style>
