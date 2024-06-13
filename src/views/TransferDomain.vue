<template>
	<div class="row">
		<div class="col-md-3" id="sidebar-container">
			<Sidebar />
		</div>

		<div class="col-md-9">
			<div class="row">
				<div class="col-md-12">
					<div class="container text-center">
						<h3>Transfer domain</h3>

						<div class="row mt-5">
							<div class="col-md-6 offset-md-3">
								<input :value="domainName + '.' + tld" class="form-control text-center" readonly />
							</div>
						</div>

						<div class="row mt-3">
							<div class="col-md-6 offset-md-3">
								<input
									v-model="recipient"
									class="form-control text-center"
									placeholder="Enter recipient's address or domain"
								/>
							</div>
						</div>

						<button class="btn btn-primary mt-3 mb-5" @click="transfer" :disabled="waiting">
							<span
								v-if="waiting"
								class="spinner-border spinner-border-sm"
								role="status"
								aria-hidden="true"
							></span>
							Transfer
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ethers } from 'ethers'
import { mapActions, mapGetters } from 'vuex'
import { useEthers } from '../pinia-stores/ethers'
import { useToast, TYPE } from 'vue-toastification'
import tldsJson from '../abi/tlds.json'
import tldAbi from '../abi/PunkTLD.json'
import Sidebar from '../components/Sidebar.vue'
import WaitingToast from '../components/toasts/WaitingToast.vue'
import useChainHelpers from '../hooks/useChainHelpers'
import { storeToRefs } from 'pinia'

export default {
	name: 'TransferDomain',
	props: ['tld', 'domainName'],
	components: {
		Sidebar,
	},

	data() {
		return {
			recipient: null,
			recipientDomain: null,
			selectedDomain: this.domainName + '.' + this.tld,
			waiting: false,
		}
	},

	computed: {
		...mapGetters('network', ['getBlockExplorerBaseUrl']),
		...mapGetters('user', ['getUserSelectedName']),
	},

	methods: {
		...mapActions('user', ['removeDomainFromUserDomains']),

		async transfer() {
			this.waiting = true
			const intfc = new ethers.utils.Interface(tldAbi)

			// check if domain name/address is valid
			if (this.recipient && this.recipient.split('.').length === 2) {
				// likely a domain name
				// split into two (domain name and TLD)
				const domArr = this.recipient.split('.')

				for (let netId in tldsJson) {
					// iterate through different chains
					if (tldsJson[netId]['.' + domArr[1]]) {
						// find the correct TLD
						// get fallback provider based on network ID
						const fProvider = this.getFallbackProvider(Number(netId))
						// create TLD contract
						const tldContractRead = new ethers.Contract(tldsJson[netId]['.' + domArr[1]], intfc, fProvider)
						// fetch domain holder
						const recDomainHolder = await tldContractRead.getDomainHolder(domArr[0])

						if (recDomainHolder !== ethers.constants.AddressZero) {
							this.recipientDomain = this.recipient
							this.recipient = recDomainHolder
						} else {
							this.toast("The recipient's domain name " + this.recipient + ' does not exist.', {
								type: TYPE.ERROR,
							})
							this.waiting = false
						}
						break
					}
				}

				if (!ethers.utils.isAddress(this.recipient)) {
					this.toast(
						'Top-level domain .' +
							domArr[1] +
							' does not exist (if this is a mistake, contact us on Discord).',
						{ type: TYPE.ERROR },
					)
					this.waiting = false
				}
			} else if (this.recipient) {
				// valid address
				if (!ethers.utils.isAddress(this.recipient)) {
					// valid address
					this.toast('This is not a valid recipient address.', {
						type: TYPE.ERROR,
					})
					this.waiting = false
				}
			} else {
				this.toast('This is not a valid recipient address or domain name.', {
					type: TYPE.ERROR,
				})
				this.waiting = false
			}

			if (this.recipient && ethers.utils.isAddress(this.recipient)) {
				// create contract
				const tldContractWrite = new ethers.Contract(tldsJson[this.chainId]['.' + this.tld], intfc, this.signer)

				// get domain token ID
				const domainData = await tldContractWrite.domains(this.domainName)

				try {
					const tx = await tldContractWrite.transferFrom(
						this.address,
						this.recipient,
						domainData.tokenId.toNumber(),
					)

					if (tx) {
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
							this.toast('You have successfully transferred the domain!', {
								type: TYPE.SUCCESS,
								onClick: () =>
									window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
							})
							this.removeDomainFromUserDomains(this.domainName + '.' + this.tld)
							this.waiting = false
						} else {
							this.toast.dismiss(toastWait)
							this.toast('Transaction has failed.', {
								type: TYPE.ERROR,
								onClick: () =>
									window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
							})
							console.log(receipt)
							this.waiting = false
						}
					}
				} catch (e) {
					console.log(e)
					this.waiting = false
					this.toast(e.message, { type: TYPE.ERROR })
				}
			}
		},
	},

	setup() {
		const { address, chainId, signer } = useEthers()
		const toast = useToast()
		const { getFallbackProvider } = useChainHelpers()

		return { address, chainId, getFallbackProvider, signer, toast }
	},
}
</script>

<style scoped></style>
