<template>
	<div class="mb-3 row domain-data mt-4" v-if="domainData">
		<div class="col-sm-3 punk-title">URL</div>

		<div class="col-sm-9 punk-text">
			<span>{{ urlData }}</span>

			<button
				v-if="isOwner"
				class="btn btn-primary btn-sm mx-3"
				data-bs-toggle="modal"
				data-bs-target="#editUrlModal"
			>
				Edit
			</button>
		</div>
	</div>

	<!-- Edit URL Modal -->
	<div class="modal fade" id="editUrlModal" tabindex="-1" aria-labelledby="editUrlModalLabel" aria-hidden="true">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="editUrlModalLabel">Edit URL</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<!-- <p>
            Anyone who's using the Punk browser extension will get redirected to this URL if they enter 
            {{domainName}}.{{tld}} in the browser URL bar.
          </p> -->

					<div class="mb-3" v-if="domainData">
						<input type="text" class="form-control" placeholder="Enter URL" v-model="inputUrl" />
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" @click="editUrl" :disabled="btnInactive">
						Edit URL
					</button>
					<button id="closeUrlModal" type="button" class="btn btn-secondary" data-bs-dismiss="modal">
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ethers } from 'ethers'
import { mapGetters } from 'vuex'
import { useEthers } from '../../pinia-stores/ethers'
import { useToast, TYPE } from 'vue-toastification'
import WaitingToast from '../toasts/WaitingToast.vue'
import { storeToRefs } from 'pinia'

export default {
	name: 'EditUrl',
	emits: ['fetchData'],
	props: ['domainData', 'tld', 'domainName'],

	data() {
		return {
			inputUrl: null,
			tldContract: null,
			btnInactive: false, // make the submit button inactive so that the user does not click on it multiple times while waiting for MetaMask to show up
		}
	},

	computed: {
		...mapGetters('punk', ['getTldAbi']),
		...mapGetters('tld', ['getTldAddress']),
		...mapGetters('network', ['getBlockExplorerBaseUrl']),

		isOwner() {
			return String(this.address).toLowerCase() === String(this.domainData.holder).toLowerCase()
		},

		urlData() {
			if (this.domainData.url) {
				return this.domainData.url
			}

			return 'Redirect URL not set yet.'
		},
	},

	methods: {
		async editUrl() {
			this.btnInactive = true

			if (!this.tldContract) {
				this.setContract()
			}

			if (this.tldContract) {
				try {
					const tx = await this.tldContract.editUrl(this.domainName, this.inputUrl)

					document.getElementById('closeUrlModal').click()

					const toastWait = this.toast(
						{
							component: WaitingToast,
							props: {
								text: 'Please wait for your transaction to confirm. Click on this notification to see transaction in the block explorer.',
							},
						},
						{
							type: TYPE.INFO,
							onClick: () =>
								window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
						},
					)

					const receipt = await tx.wait()

					if (receipt.status === 1) {
						this.toast.dismiss(toastWait)
						this.toast('You have successfully updated the URL!', {
							type: TYPE.SUCCESS,
							onClick: () =>
								window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
						})
						this.$emit('fetchData')
						this.btnInactive = false
					} else {
						this.toast.dismiss(toastWait)
						this.toast('Transaction has failed.', {
							type: TYPE.ERROR,
							onClick: () =>
								window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
						})
						console.log(receipt)
						this.btnInactive = false
						this.inputUrl = this.domainData.url
					}
				} catch (e) {
					this.btnInactive = false
					console.log(e)
					this.toast(e.message, { type: TYPE.ERROR })
					this.inputUrl = this.domainData.url
				}
			}
		},

		setContract() {
			const intfc = new ethers.utils.Interface(this.getTldAbi)
			this.tldContract = new ethers.Contract(this.getTldAddress, intfc, this.signer)
		},
	},

	setup() {
		const { address, signer } = useEthers()
		const toast = useToast()

		return { address, signer, toast }
	},

	watch: {
		domainData() {
			this.inputUrl = this.domainData.url
		},
	},
}
</script>

<style scoped>
.punk-text {
	text-align: left;
}

@media only screen and (max-width: 767px) {
	.punk-text {
		text-align: center;
	}

	.punk-title {
		font-size: 1.1em;
		margin-bottom: 5px;
		font-weight: bold;
	}
}
</style>
