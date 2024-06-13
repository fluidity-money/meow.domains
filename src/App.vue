<template>
	<Navbar />

	<div class="main-container background-main">
		<router-view></router-view>

		<Footer />
		<VueDappModal dark auto-connect />
	</div>
</template>

<script lang="ts">
import { ethers } from 'ethers'
import { BrowserWalletConnector, RdnsEnum, useVueDapp } from '@vue-dapp/core'
import { VueDappModal } from '@vue-dapp/modal'
import '@vue-dapp/modal/dist/style.css'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import tldsJson from './abi/tlds.json'
import tldAbi from './abi/PunkTLD.json'
import useChainHelpers from './hooks/useChainHelpers'
import { useEthers } from './pinia-stores/ethers'
import { useStore } from 'vuex'

export default {
	components: {
		Navbar,
		Footer,
		VueDappModal,
	},

	mounted() {
		this.fetchReferrer()
		this.setTldContract()
		this.fetchMinterContractData()
		this.checkIfAdmin()

		// reset localstorage
		const v2 = localStorage.getItem('punkv1')

		if (!v2) {
			localStorage.clear()
			localStorage.setItem('connected', 'null')
			localStorage.setItem('punkv1', 'true')
		}
	},

	computed: {
		...mapGetters('user', ['getUserSelectedName']),
	},

	methods: {
		...mapActions('user', ['checkIfAdmin', 'fetchUserDomainNames', 'fetchCanUserBuy']),
		...mapActions('tld', ['fetchMinterContractData']),

		...mapMutations('user', ['setUserData']),
		...mapMutations('network', ['setNetworkData']),
		...mapMutations('tld', ['setTldContract']),

		async connectMetaMask() {
			await this.connectWith('BrowserWallet', {
				target: 'rdns',
				rdns: RdnsEnum.metamask,
			})
		},

		async fetchReferrer() {
			// check if any referral is present: ?ref=...
			const urlParams = new URLSearchParams(window.location.search)
			const referral = urlParams.get('ref')

			// check if domain name or address in the ref field
			if (referral && referral.split('.').length === 2) {
				// likely a domain name
				// split referral into two (domain name and TLD)
				const domArr = referral.split('.')

				for (let netId in tldsJson) {
					// iterate through different chains
					if (tldsJson[netId]['.' + domArr[1]]) {
						// find the correct TLD
						// get fallback provider based on network ID
						const fProvider = this.getFallbackProvider(Number(netId))
						// create TLD contract (only new ABIs)
						const intfc = new ethers.utils.Interface(tldAbi)
						const refContract = new ethers.Contract(tldsJson[netId]['.' + domArr[1]], intfc, fProvider)
						// fetch domain holder
						const refDomainHolder = await refContract.getDomainHolder(domArr[0])

						if (refDomainHolder !== ethers.constants.AddressZero) {
							localStorage.setItem('referral', refDomainHolder) // store referral address in local storafe
						}
						break
					}
				}
			} else if (referral && ethers.utils.isAddress(referral)) {
				// valid address
				// the last found referral is considered
				localStorage.setItem('referral', referral) // store referral address in local storafe
			}
		},
	},

	setup() {
		const { addConnectors, chainId, connectTo, watchWalletChanged, watchDisconnect } = useVueDapp()
		addConnectors([new BrowserWalletConnector()])

		const { setWallet, resetWallet, fetchBalance } = useEthers()

		const store = useStore()

		watchWalletChanged(async wallet => {
			setWallet(wallet.provider)
			await fetchBalance()
			store.commit('user/setUserData')
			store.dispatch('user/fetchUserDomainNames', true)
			store.dispatch('user/checkIfAdmin')

			if (wallet.chainId >= 1) {
				store.commit('network/setNetworkData')
			}
		})

		watchDisconnect(() => {
			resetWallet()
		})

		const { getFallbackProvider } = useChainHelpers()

		return {
			chainId,
			connectTo,
			getFallbackProvider,
		}
	},
}
</script>

<style scoped>
.main-container {
	padding: 20px;
	max-width: 100%;
	margin-left: auto;
	margin-right: auto;
}
</style>
