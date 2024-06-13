<template>
	<td>
		<span>{{ domain }}</span>
	</td>
	<td>
		<span
			class="text-click"
			@click="
				this.$router.push({
					name: 'DomainDetails',
					params: {
						domainChain: getChainId,
						tld: domain.split('.')[1],
						domainName: domain.split('.')[0],
					},
				})
			"
		>
			Edit domain data
		</span>
	</td>
	<td>
		<span
			class="text-click"
			@click="
				this.$router.push({
					name: 'TransferDomain',
					params: {
						tld: domain.split('.')[1],
						domainName: domain.split('.')[0],
					},
				})
			"
		>
			Transfer domain
		</span>
	</td>
	<td>
		<span v-if="getUserSelectedName === domain"> <i class="bi bi-check2-circle"></i> Default </span>

		<span v-else class="text-click" data-bs-toggle="modal" :data-bs-target="'#defaultNameModal' + getDomainName">
			Set as default name
		</span>
	</td>

	<!-- Set Default Name Modal -->
	<div
		class="modal fade text-start"
		:id="'defaultNameModal' + getDomainName"
		tabindex="-1"
		:aria-labelledby="'defaultNameModalLabel' + getDomainName"
		aria-hidden="true"
	>
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" :id="'defaultNameModalLabel' + getDomainName">
						Set {{ domain }} as default domain
					</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<p>
						Do you really want to set <strong>{{ domain }}</strong> as your default domain name?
					</p>

					<p>(This action will require an on-chain transaction.)</p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" @click="setAsDefaultName" :disabled="waiting">
						<span
							v-if="waiting"
							class="spinner-border spinner-border-sm mx-1"
							role="status"
							aria-hidden="true"
						></span>
						Set as default
					</button>
					<button
						:id="'closeDefaultDomainModal' + getDomainName"
						type="button"
						class="btn btn-secondary"
						data-bs-dismiss="modal"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { ethers } from 'ethers'
import { useEthers } from '../pinia-stores/ethers'
import { useToast, TYPE } from 'vue-toastification'
import WaitingToast from './toasts/WaitingToast.vue'
import { storeToRefs } from 'pinia'

export default {
	name: 'MyDomain',
	props: ['domain'],

	computed: {
		...mapGetters('punk', ['getTldAbi']),
		...mapGetters('network', ['getChainId', 'getBlockExplorerBaseUrl']),
		...mapGetters('user', ['getUserSelectedName']),
		...mapGetters('tld', ['getTldAddress']),

		getDomainName() {
			if (this.domain) {
				return this.domain.split('.')[0]
			} else {
				return ''
			}
		},
	},

	data() {
		return {
			waiting: false,
		}
	},

	methods: {
		...mapActions('user', ['fetchSelectedNameData']),

		...mapMutations('user', ['setSelectedName']),

		async setAsDefaultName() {
			this.waiting = true

			try {
				const intfc = new ethers.utils.Interface(this.getTldAbi)
				const tldContract = new ethers.Contract(this.getTldAddress, intfc, this.signer)

				const tx = await tldContract.editDefaultDomain(this.getDomainName)

				const toastWait = this.toast(
					{
						component: WaitingToast,
						props: {
							text: 'Please wait for your transaction to confirm. Click on this notification to see transaction in the block explorer.',
						},
					},
					{
						type: TYPE.INFO,
						onClick: () => window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
					},
				)

				const receipt = await tx.wait()

				if (receipt.status === 1) {
					this.toast.dismiss(toastWait)

					this.toast('You have successfully set ' + this.domain + ' as your default domain!', {
						type: TYPE.SUCCESS,
						onClick: () => window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
					})

					this.waiting = false
					document.getElementById('closeDefaultDomainModal' + this.getDomainName).click()

					this.setSelectedName(this.domain)
					this.fetchSelectedNameData()
				} else {
					this.toast.dismiss(toastWait)
					this.toast('Transaction has failed.', {
						type: TYPE.ERROR,
						onClick: () => window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
					})
					console.log(receipt)
					this.waiting = false
					document.getElementById('closeDefaultDomainModal' + this.getDomainName).click()
				}
			} catch (e) {
				this.waiting = false
				console.log(e)
				this.toast(e.message, { type: TYPE.ERROR })
				document.getElementById('closeDefaultDomainModal' + this.getDomainName).click()
			}
		},
	},

	setup() {
		const { address, signer } = useEthers()
		const toast = useToast()

		return { address, signer, toast }
	},
}
</script>

<style scoped>
.text-click:hover {
	color: white;
	text-decoration: underline;
	cursor: pointer;
}
</style>
