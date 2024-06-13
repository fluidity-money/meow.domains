<template>
	<div class="mb-3 row domain-data mt-4" v-if="domainData">
		<div class="col-sm-3 punk-title">Custom PFP</div>

		<div class="col-sm-9 punk-text">
			<span>{{ customPfp }}</span>

			<button
				v-if="isOwner"
				class="btn btn-primary btn-sm mx-3"
				data-bs-toggle="modal"
				data-bs-target="#editPfpModal"
			>
				Edit
			</button>
		</div>
	</div>

	<!-- Edit PFP Modal -->
	<div
		class="modal fade text-start"
		id="editPfpModal"
		tabindex="-1"
		aria-labelledby="editPfpModalLabel"
		aria-hidden="true"
	>
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="editPfpModalLabel">Edit PFP</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<p>
						Enter the address and token ID of an NFT that you own and want to designate as the main PFP of
						the
						{{ domainName }}.{{ tld }} domain.
					</p>

					<div class="mb-3" v-if="domainData">
						<label class="form-label">Enter NFT address:</label>
						<input type="text" class="form-control" placeholder="0x..." v-model="inputPfpAddress" />
					</div>

					<div class="mb-3" v-if="domainData">
						<label class="form-label">Enter NFT token ID:</label>
						<input type="text" class="form-control" v-model="inputPfpId" />
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" @click="editPfp" :disabled="btnInactive">
						Edit PFP data
					</button>
					<button id="closePfpModal" type="button" class="btn btn-secondary" data-bs-dismiss="modal">
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
import { shortenAddress } from '@vue-dapp/core'
import { useToast, TYPE } from 'vue-toastification'
import WaitingToast from '../toasts/WaitingToast.vue'
import { storeToRefs } from 'pinia'

export default {
	name: 'EditPfp',
	emits: ['fetchData'],
	props: ['domainData', 'tld', 'domainName'],

	data() {
		return {
			inputPfpAddress: null,
			inputPfpId: null,
			tldContract: null,
			btnInactive: false, // make the submit button inactive so that the user does not click on it multiple times while waiting for MetaMask to show up
		}
	},

	computed: {
		...mapGetters('punk', ['getTldAbi']),
		...mapGetters('tld', ['getTldAddress']),
		...mapGetters('network', ['getBlockExplorerBaseUrl']),

		customPfp() {
			if (this.domainData.pfpAddress != ethers.constants.AddressZero) {
				return (
					this.shortenAddress(this.domainData.pfpAddress) + ' (token ID: ' + this.domainData.pfpTokenId + ')'
				)
			}

			return 'Custom PFP not set yet.'
		},

		isOwner() {
			return String(this.address).toLowerCase() === String(this.domainData.holder).toLowerCase()
		},

		pfpAddress() {
			if (this.domainData.pfpAddress != ethers.constants.AddressZero) {
				return this.domainData.pfpAddress
			}

			return null
		},
	},

	methods: {
		async editPfp() {
			this.btnInactive = true

			// first check if domain holder really owns this NFT
			const enteredPfpAddress = this.inputPfpAddress
			const enteredPfpId = this.inputPfpId

			const pfpInterface = new ethers.utils.Interface([
				'function ownerOf(uint256 tokenId) public view returns (address)',
			])

			const pfpContract = new ethers.Contract(enteredPfpAddress, pfpInterface, this.signer)

			let nftOwner

			try {
				nftOwner = await pfpContract.ownerOf(enteredPfpId)
			} catch (e) {
				this.btnInactive = false
				console.log(e)
				this.toast(e.message, { type: TYPE.ERROR })
				this.inputPfpAddress = this.domainData.pfpAddress
				this.inputPfpId = this.domainData.pfpTokenId
			}

			if (nftOwner && String(this.address).toLowerCase() != String(nftOwner).toLowerCase()) {
				// if holder is not the owner, return an error toast
				this.toast('It looks like your current address is not this NFT owner.', { type: TYPE.ERROR })
				this.btnInactive = false
				this.inputPfpAddress = this.domainData.pfpAddress
				this.inputPfpId = this.domainData.pfpTokenId
			} else if (nftOwner && String(this.address).toLowerCase() === String(nftOwner).toLowerCase()) {
				// update the NFT address and token ID for this domain
				if (!this.tldContract) {
					this.setContract()
				}

				if (this.tldContract) {
					try {
						const tx = await this.tldContract.editPfp(this.domainName, enteredPfpAddress, enteredPfpId)

						document.getElementById('closePfpModal').click()

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
							this.btnInactive = false
							this.toast.dismiss(toastWait)
							this.toast('You have successfully updated your PFP data!', {
								type: TYPE.SUCCESS,
								onClick: () =>
									window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
							})
							this.$emit('fetchData')
						} else {
							this.btnInactive = false
							this.toast.dismiss(toastWait)
							this.toast('Transaction has failed.', {
								type: TYPE.ERROR,
								onClick: () =>
									window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
							})
							console.log(receipt)
							this.inputPfpAddress = this.domainData.pfpAddress
							this.inputPfpId = this.domainData.pfpTokenId
						}
					} catch (e) {
						this.btnInactive = false
						console.log(e)
						this.toast(e.message, { type: TYPE.ERROR })
						this.inputPfpAddress = this.domainData.pfpAddress
						this.inputPfpId = this.domainData.pfpTokenId
					}
				}
			}
		},

		setContract() {
			// construct contract
			const intfc = new ethers.utils.Interface(this.getTldAbi)
			this.tldContract = new ethers.Contract(this.getTldAddress, intfc, this.signer)
		},
	},

	setup() {
		const { address, signer } = useEthers()
		const toast = useToast()

		return { address, shortenAddress, signer, toast }
	},

	watch: {
		domainData() {
			if (this.domainData.pfpAddress != ethers.constants.AddressZero) {
				this.inputPfpAddress = this.domainData.pfpAddress
				this.inputPfpId = this.domainData.pfpTokenId
			}
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
