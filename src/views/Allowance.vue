<template>
	<div class="row">
		<div class="col-md-3" id="sidebar-container">
			<Sidebar />
		</div>

		<div class="col-md-9">
			<div class="row">
				<div class="col-md-12 mb-3">
					<div class="container text-center">
						<h3>Manage {{ getPaymentTokenName }} allowance</h3>

						<p class="mt-4">
							On this page you can manage your
							{{ getPaymentTokenName }} allowance for the domain minting contract. Example: if you want to
							mint 5 domains and would like to avoid sending an approval transaction each time, set
							allowance to 5x the domain price. But if you instead want to remove the allowance
							completely, set it to 0.
						</p>

						<p>
							Current allowance: {{ getPaymentTokenAllowance }}
							{{ getPaymentTokenName }}
						</p>

						<div class="row mt-5">
							<div class="col-md-6 offset-md-3">
								<input
									v-model="newAllowance"
									class="form-control text-center"
									:placeholder="'Enter new allowance amount in ' + this.getPaymentTokenName"
								/>
							</div>
						</div>

						<button class="btn btn-primary mt-3 mb-5" @click="approveToken" :disabled="waiting || notValid">
							<span
								v-if="waiting"
								class="spinner-border spinner-border-sm"
								role="status"
								aria-hidden="true"
							></span>
							Confirm new allowance
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { ethers } from 'ethers'
import { mapGetters, mapMutations } from 'vuex'
import { useToast, TYPE } from 'vue-toastification'
import { useEthers } from '../pinia-stores/ethers'

import tldsJson from '../abi/tlds.json'
import tldAbi from '../abi/PunkTLD.json'
import erc20Abi from '../abi/Erc20.json'
import Sidebar from '../components/Sidebar.vue'
import WaitingToast from '../components/toasts/WaitingToast.vue'
import useChainHelpers from '../hooks/useChainHelpers'
import { storeToRefs } from 'pinia'

export default {
	name: 'Allowance',

	components: {
		Sidebar,
	},

	data() {
		return {
			newAllowance: null,
			waiting: false,
		}
	},

	computed: {
		...mapGetters('user', [
			'getPaymentTokenAddress',
			'getPaymentTokenName',
			'getPaymentTokenAllowance',
			'getPaymentTokenBalance',
			'getPaymentTokenDecimals',
		]),
		...mapGetters('network', ['getBlockExplorerBaseUrl']),
		...mapGetters('tld', ['getMinterAddress']),

		notValid() {
			if (!this.newAllowance) {
				return true
			} else if (isNaN(this.newAllowance)) {
				return true
			} else if (Number(this.newAllowance) < 0) {
				return true
			} else if (this.newAllowance.includes(' ')) {
				return true
			}

			return false
		},
	},

	methods: {
		...mapMutations('user', ['setPaymentTokenAllowance']),

		async approveToken() {
			this.waiting = true

			// token contract
			const tokenIntfc = new ethers.utils.Interface(erc20Abi)
			const tokenContractSigner = new ethers.Contract(this.getPaymentTokenAddress, tokenIntfc, this.signer)

			const newAllowanceToken = this.newAllowance

			try {
				const tx = await tokenContractSigner.approve(
					this.getMinterAddress, // spender (wrapper contract)
					ethers.utils.parseUnits(newAllowanceToken, this.getPaymentTokenDecimals), // amount
				)

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
					this.toast(
						'You have successfully set the allowance to ' +
							newAllowanceToken +
							' ' +
							this.getPaymentTokenName +
							'!',
						{
							type: TYPE.SUCCESS,
							onClick: () =>
								window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
						},
					)
					this.setPaymentTokenAllowance(newAllowanceToken)
					this.waiting = false
				} else {
					this.toast.dismiss(toastWait)
					this.toast('Transaction has failed.', {
						type: TYPE.ERROR,
						onClick: () => window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
					})
					console.log(receipt)
					this.waiting = false
				}
			} catch (e) {
				console.log(e)
				this.waiting = false
				this.toast(e.message, { type: TYPE.ERROR })
			}

			this.waiting = false
		},
	},

	setup() {
		const { signer } = useEthers()
		const toast = useToast()

		const { getFallbackProvider } = useChainHelpers()

		return { getFallbackProvider, signer, toast }
	},
}
</script>

<style scoped></style>
