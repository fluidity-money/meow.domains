<template>
	<div class="mb-3 row domain-data mt-4" v-if="customData" :key="dataKey" v-for="(dataValue, dataKey) in customData">
		<div class="col-sm-3 punk-title">
			{{ dataKey.charAt(0).toUpperCase() + dataKey.slice(1) }}
		</div>

		<div class="col-sm-9 punk-text text-break">
			<span v-if="dataKey == 'imgAddress' && dataValue.startsWith('http')"
				><a target="_blank" :href="dataValue">{{ shortUrl(dataValue) }}</a></span
			>
			<span v-else-if="dataKey == 'url'"
				><a target="_blank" :href="dataValue">{{ dataValue }}</a></span
			>
			<span v-else-if="dataKey == 'twitter'"
				><a target="_blank" :href="getTwitterUrl(dataValue)">{{ dataValue }}</a></span
			>
			<span v-else>{{ dataValue }}</span>
		</div>
	</div>

	<button
		v-if="isOwner && isCorrectChainForDomain"
		class="btn btn-primary btn-lg mx-3 mt-3"
		data-bs-toggle="modal"
		data-bs-target="#editDataModal"
	>
		Edit data
	</button>

	<!-- Edit Other Data Modal -->
	<div
		class="modal fade text-start"
		id="editDataModal"
		tabindex="-1"
		aria-labelledby="editDataModalLabel"
		aria-hidden="true"
	>
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="editDataModalLabel">Edit other data</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<p>You can add custom data to this domain.</p>

					<p>Example: twitter -> @myhandle</p>

					<div class="input-group mb-3 mt-4" v-if="fields" v-for="(item, index) in fields">
						<input
							type="text"
							:key="'dataKey' + index"
							class="form-control"
							v-model="item.dataKey"
							placeholder="Enter key (like twitter)"
						/>

						<span class="input-group-text"><i class="bi bi-arrow-right"></i></span>

						<input
							type="text"
							class="form-control"
							:key="'dataValue' + index"
							v-model="item.dataValue"
							:placeholder="item.valuePlaceholder ? item.valuePlaceholder : 'Enter value'"
						/>

						<span class="input-group-text" @click="removeField(index)"><i class="bi bi-x-circle"></i></span>
					</div>

					<button class="btn btn-secondary btn-sm" @click="addField">Add new field</button>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" @click="editData" :disabled="btnInactive">
						Submit
					</button>
					<button id="closeCustomDataModal" type="button" class="btn btn-secondary" data-bs-dismiss="modal">
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { ethers } from 'ethers'
import { mapActions, mapGetters } from 'vuex'
import { useToast, TYPE } from 'vue-toastification'
import WaitingToast from '../toasts/WaitingToast.vue'
import { useEthers } from '../../pinia-stores/ethers'
import { storeToRefs } from 'pinia'

export default {
	name: 'EditOtherData',
	emits: ['fetchData'],
	props: ['domainData', 'tld', 'domainName', 'isCorrectChainForDomain'],

	data() {
		return {
			btnInactive: false, // make the submit button inactive so that the user does not click on it multiple times while waiting for MetaMask to show up
			fields: [],
			tldContract: null,
		}
	},

	computed: {
		...mapGetters('punk', ['getTldAbi']),
		...mapGetters('network', ['getBlockExplorerBaseUrl']),
		...mapGetters('tld', ['getTldAddress']),

		customData() {
			if (this.domainData) {
				try {
					return JSON.parse(this.domainData.data)
				} catch {
					return null
				}
			}
			return null
		},

		isOwner() {
			if (this.domainData) {
				return String(this.address).toLowerCase() === String(this.domainData.holder).toLowerCase()
			}
		},
	},

	methods: {
		...mapActions('user', ['fetchSelectedNameData']),

		addField() {
			this.fields.push({ dataKey: '', dataValue: '' })
		},

		removeField(index) {
			this.fields.splice(index, 1)
		},

		shortUrl(u) {
			if (typeof u === 'string') {
				if (u.length > 42) {
					let uend = u.slice(u.length - 15)
					let ustart = u.substr(0, 32)
					return ustart + '...' + uend
				}
			}

			return u
		},

		async editData() {
			this.btnInactive = true

			if (!this.tldContract) {
				this.setContract()
			}

			const finalData = {}

			for (let item of this.fields) {
				if (item.dataKey && item.dataValue) {
					finalData[item.dataKey] = item.dataValue
				}
			}

			if (this.tldContract) {
				try {
					const tx = await this.tldContract.editData(this.domainName, JSON.stringify(finalData))

					document.getElementById('closeCustomDataModal').click()

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
						this.toast("You have successfully updated your domain's custom data!", {
							type: TYPE.SUCCESS,
							onClick: () =>
								window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
						})
						this.fetchSelectedNameData()
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

		getTwitterUrl(entry) {
			if (typeof entry === 'string') {
				if (entry.startsWith('http')) {
					return entry
				} else if (entry.startsWith('www')) {
					return 'https://' + entry
				} else if (entry.startsWith('twitter.com')) {
					return 'https://' + entry
				} else if (entry.startsWith('@')) {
					return 'https://twitter.com/' + entry
				} else {
					return 'https://twitter.com/' + entry
				}
			}
		},

		setContract() {
			if (this.address) {
				// construct contract
				const intfc = new ethers.utils.Interface(this.getTldAbi)
				this.tldContract = new ethers.Contract(this.getTldAddress, intfc, this.signer)
			}
		},
	},

	setup() {
		const { address, signer } = useEthers()
		const toast = useToast()

		return { address, signer, toast }
	},

	watch: {
		domainData() {
			if (this.domainData && this.domainData.data) {
				const cstmData = JSON.parse(this.domainData.data)

				for (const [key, value] of Object.entries(cstmData)) {
					if (this.fields.findIndex(x => x.dataKey == key) === -1) {
						this.fields.push({ dataKey: key, dataValue: value })
					}
				}
			}

			if (this.fields.findIndex(x => x.dataKey == 'imgAddress') === -1) {
				this.fields.push({
					dataKey: 'imgAddress',
					dataValue: '',
					valuePlaceholder: 'HTTP, or 0x address if NFT',
				})
			}

			if (this.fields.findIndex(x => x.dataKey == 'imgTokenId') === -1) {
				this.fields.push({
					dataKey: 'imgTokenId',
					dataValue: '',
					valuePlaceholder: 'Only needed if img is NFT',
				})
			}

			if (this.fields.findIndex(x => x.dataKey == 'url') === -1) {
				this.fields.push({
					dataKey: 'url',
					dataValue: '',
					valuePlaceholder: 'Add any URL to redirect domain to',
				})
			}

			if (this.fields.findIndex(x => x.dataKey == 'twitter') === -1) {
				this.fields.push({
					dataKey: 'twitter',
					dataValue: '',
					valuePlaceholder: 'Enter your Twitter handle',
				})
			}

			if (this.isOwner && this.isCorrectChainForDomain) {
				this.setContract()
			}
		},
	},
}
</script>

<style scoped>
.form-control-plaintext {
	color: #dbdfea;
}

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
