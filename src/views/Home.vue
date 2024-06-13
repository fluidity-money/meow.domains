<template>
	<div class="container text-center">
		<img class="img-fluid main-img" src="/assets/logo.svg" />

		<div class="text-align-header mt-5 mb-2">
			<h1>Mint your {{ getTldName }} domain!</h1>
			<p>
				And use it as username on the
				<a href="https://www.superposition.so/" target="_blank"> Superposition L3 Chain</a>.
			</p>
		</div>

		<div class="d-flex justify-content-center domain-input-container mb-3 mt-5">
			<div class="input-group domain-input input-group-lg input-sizing">
				<input
					v-model="chosenDomainName"
					placeholder="enter desired name"
					type="text"
					class="form-control text-end border-2 border-end-0 border-light"
					aria-label="Text input with dropdown button"
				/>

				<span class="input-group-text tld-addon border-2 border-light">
					<span
						v-if="loading"
						class="spinner-border spinner-border-sm mx-1"
						role="status"
						aria-hidden="true"
					></span>
					<span>{{ getTldName }}</span>
				</span>
			</div>
		</div>

		<p class="error">
			<small v-if="buyNotValid(chosenDomainName).invalid">
				<em>{{ buyNotValid(chosenDomainName).message }}</em>
			</small>
		</p>

		<div class="text-align-header">
			<p class="mt-5 price-text">
				Domain price: {{ getFormattedPrice(getPrice) }}
				{{ getPaymentTokenName }}
			</p>
		</div>

		<!-- Minter contract paused -->
		<button
			v-if="isConnected && getMinterPaused && !getMinterLoadingData"
			class="btn btn-primary btn-lg mt-3 buy-button"
			:disabled="true"
		>
			<span v-if="getMinterPaused">Buying paused</span>
		</button>

		<!-- Minter contract loading data -->
		<button
			v-if="isConnected && isNetworkSupported && getMinterLoadingData"
			class="btn btn-primary btn-lg mt-3 buy-button"
			:disabled="true"
		>
			<span class="spinner-border spinner-border-sm mx-1" role="status" aria-hidden="true"></span>
			<span>Loading data</span>
		</button>

		<!-- Not eligible -->
		<button
			v-if="isConnected && isNetworkSupported && !getMinterPaused && !getCanUserBuy && !getMinterLoadingData"
			class="btn btn-primary btn-lg mt-3 buy-button"
			:disabled="waiting || buyNotValid(chosenDomainName).invalid || !hasUserEnoughTokens"
		>
			<span>Not eligible</span>
		</button>

		<!-- Too low ETH balance -->
		<button
			v-if="
				isConnected &&
				isNetworkSupported &&
				!getMinterPaused &&
				!hasUserEnoughTokens &&
				getCanUserBuy &&
				!getMinterLoadingData
			"
			class="btn btn-primary btn-lg mt-3 buy-button"
			:disabled="waiting || buyNotValid(chosenDomainName).invalid || !hasUserEnoughTokens"
		>
			<span>Your {{ getPaymentTokenName }} balance is too low</span>
		</button>

		<!-- Buy domain -->
		<button
			v-if="
				isConnected &&
				isNetworkSupported &&
				getCanUserBuy &&
				!getMinterPaused &&
				hasUserEnoughTokens &&
				!getMinterLoadingData
			"
			class="btn btn-primary btn-lg mt-3 buy-button"
			@click="buyDomain"
			:disabled="waiting || buyNotValid(chosenDomainName).invalid || !hasUserEnoughTokens"
		>
			<span v-if="waiting" class="spinner-border spinner-border-sm mx-1" role="status" aria-hidden="true"></span>
			<span>Buy domain</span>
		</button>

		<!-- Connect Wallet -->
		<button v-if="!isConnected" class="btn btn-primary btn-lg mt-3 btn-Disconnected" @click="open">
			Connect wallet
		</button>

		<div v-if="isConnected && !isNetworkSupported" class="mt-4">
			<button class="btn btn-primary btn-lg btn-Disconnected" @click="changeNetwork(this.getTldChainName)">
				Switch to {{ getTldChainName }}
			</button>
		</div>

		<div class="row mt-5">
			<div class="col-md-6 offset-md-3 table-container">
				<table class="table table-borderless table-ppl">
					<thead class="table-light">
						<tr>
							<th scope="col">Name length</th>
							<th scope="col">Price</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>1 character</td>
							<td>
								{{ getFormattedPrice(getMinterTldPrice1) }}
								{{ getPaymentTokenName }}
							</td>
						</tr>
						<tr>
							<td>2 characters</td>
							<td>
								{{ getFormattedPrice(getMinterTldPrice2) }}
								{{ getPaymentTokenName }}
							</td>
						</tr>
						<tr>
							<td>3 characters</td>
							<td>
								{{ getFormattedPrice(getMinterTldPrice3) }}
								{{ getPaymentTokenName }}
							</td>
						</tr>
						<tr>
							<td>4 characters</td>
							<td>
								{{ getFormattedPrice(getMinterTldPrice4) }}
								{{ getPaymentTokenName }}
							</td>
						</tr>
						<tr>
							<td>5+ characters</td>
							<td>
								{{ getFormattedPrice(getMinterTldPrice5) }}
								{{ getPaymentTokenName }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<Referral v-if="isConnected" />
</template>

<script>
import { ethers } from 'ethers'
import { useEthers } from '../pinia-stores/ethers'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { useToast, TYPE } from 'vue-toastification'
import WaitingToast from '../components/toasts/WaitingToast.vue'
import Referral from '../components/Referral.vue'
import useDomainHelpers from '../hooks/useDomainHelpers'
import useChainHelpers from '../hooks/useChainHelpers'
import MinterAbi from '../abi/Minter.json'
import { useVueDappModal } from '@vue-dapp/modal'

export default {
	name: 'Home',

	data() {
		return {
			chosenDomainName: null,
			chosenAllowance: null,
			loading: false, // loading data
			waiting: false, // waiting for TX to complete
			minterContract: null,
		}
	},

	components: {
		Referral,
	},

	computed: {
		...mapGetters('user', [
			'getPaymentTokenAddress',
			'getPaymentTokenName',
			'getPaymentTokenAllowance',
			'getUserBalance',
			'getCanUserBuy',
			'getDiscountEligible',
		]),
		...mapGetters('network', ['getBlockExplorerBaseUrl']),
		...mapGetters('tld', [
			'getTldChainId',
			'getTldChainName',
			'getMinterAddress',
			'getTldContract',
			'getMinterLoadingData',
			'getMinterTldPrice1',
			'getMinterTldPrice2',
			'getMinterTldPrice3',
			'getMinterTldPrice4',
			'getMinterTldPrice5',
			'getMinterPaused',
			'getMinterDiscountPercentage',
			'getTldName',
		]),

		getPrice() {
			if (this.chosenDomainName) {
				if (this.chosenDomainName.match(/./gu).length === 1) {
					return this.getMinterTldPrice1
				} else if (this.chosenDomainName.match(/./gu).length === 2) {
					return this.getMinterTldPrice2
				} else if (this.chosenDomainName.match(/./gu).length === 3) {
					return this.getMinterTldPrice3
				} else if (this.chosenDomainName.match(/./gu).length === 4) {
					return this.getMinterTldPrice4
				}
			}

			return this.getMinterTldPrice5
		},

		domainLowerCase() {
			return this.chosenDomainName.toLowerCase()
		},

		hasUserEnoughTokens() {
			if (this.address && Number(this.getUserBalance) > 0) {
				if (Number(this.getUserBalance) >= Number(this.getPrice)) {
					return true
				}
			}

			return false
		},

		isNetworkSupported() {
			if (this.isConnected) {
				if (this.chainId === this.getTldChainId) {
					return true
				}
			}

			return false
		},
	},

	methods: {
		...mapActions('user', ['fetchCanUserBuy', 'getPaymentTokenDecimals']),
		...mapMutations('user', ['addDomainManually', 'setPaymentTokenAllowance']),

		async buyDomain() {
			this.waiting = true
			const fullDomainName = this.domainLowerCase + this.getTldName

			// check if domain already minted
			const existingHolder = await this.getTldContract.getDomainHolder(this.domainLowerCase)

			if (existingHolder !== ethers.constants.AddressZero) {
				this.toast('Sorry, but this domain name is already taken...', {
					type: TYPE.ERROR,
				})
				this.waiting = false
				return
			}

			// wrapper contract (with signer)
			const wrapperIntfc = new ethers.utils.Interface(MinterAbi)
			const minterContractSigner = new ethers.Contract(this.getMinterAddress, wrapperIntfc, this.signer)

			try {
				let referral = localStorage.getItem('referral')

				if (!referral || !ethers.utils.isAddress(referral)) {
					referral = ethers.constants.AddressZero
				}

				const tx = await minterContractSigner.mint(this.domainLowerCase, this.address, referral, {
					value: ethers.utils.parseEther(String(this.getPrice)),
				})

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
					this.toast('You have successfully bought the domain!', {
						type: TYPE.SUCCESS,
						onClick: () => window.open(this.getBlockExplorerBaseUrl + '/tx/' + tx.hash, '_blank').focus(),
					})
					this.addDomainManually(fullDomainName)
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

		changeNetwork(networkName) {
			const networkData = this.switchNetwork(networkName)

			window.ethereum.request({
				method: networkData.method,
				params: networkData.params,
			})
		},

		getFormattedPrice(price) {
			// if price is less than 0.001, show 6 decimals etc.
			if (price < 0.001) {
				return Number(price).toFixed(4)
			} else if (price < 0.01) {
				return Number(price).toFixed(3)
			} else if (price < 0.1) {
				return Number(price).toFixed(2)
			} else if (price < 0) {
				return Number(price).toFixed(1)
			} else {
				return Math.round(price)
			}
		},
	},

	setup() {
		const { open } = useVueDappModal()
		const { address, chainId, isConnected, signer } = useEthers()
		const toast = useToast()
		const { buyNotValid } = useDomainHelpers()
		const { switchNetwork } = useChainHelpers()

		return {
			address,
			buyNotValid,
			chainId,
			isConnected,
			open,
			signer,
			switchNetwork,
			toast,
		}
	},
}
</script>

<style scoped>
.and {
	font-size: 1.7em;
	vertical-align: bottom;
	padding-left: 0.2em;
	padding-right: 0.1em;
}

.buy-button {
	margin-bottom: 20px;
}

.container {
	padding-top: 80px;
	padding-bottom: 50px;
}

.domain-input {
	width: 50%;
}

.domain-input > input {
	color: #0d0f1a;
}

.domain-input > input::placeholder {
	color: #0d0f1a;
	opacity: 0.7;
}

.domain-input-container {
	margin-top: 40px;
}

.error {
	color: #dbdfea;
}

.main-img {
	width: 6em;
}

th:first-of-type {
	border-top-left-radius: 10px;
	border-collapse: separate;
}
th:last-of-type {
	border-top-right-radius: 10px;
}
tr:last-of-type td:first-of-type {
	border-bottom-left-radius: 10px;
}
tr:last-of-type td:last-of-type {
	border-bottom-right-radius: 10px;
}

.table-light {
	color: #0d0f1a;
}

.table-ppl {
	border: 2px solid white;
	border-radius: 10px !important;
	border-collapse: separate;
	color: white;
}

.tld-addon {
	background-color: white;
	color: #0d0f1a;
}

@media only screen and (max-width: 767px) {
	.domain-input {
		width: 100%;
	}
}
</style>
